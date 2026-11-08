// controllers/videoConferenceController.js
const VideoConferenceRequest = require("../models/VideoConferenceRequest");
const AdminNotification = require("../models/AdminNotification");
const jwt = require("jsonwebtoken");
const logger = require("../config/logger");

/**
 * SEC-003: Generate dynamic, scoped conference token.
 * Validates session cookies, grants moderator privileges ONLY to authenticated admins,
 * and signs short-lived (15 min) room-scoped tokens server-side.
 */
exports.generateConferenceToken = async (req, res) => {
  try {
    const rawRoomId = req.query.roomId || req.body?.roomId || "amen-conference";
    // Sanitize room ID to avoid path traversal or injection
    const roomId = rawRoomId.replace(/[^a-zA-Z0-9_-]/g, "");

    let isModerator = false;
    let userName = "Participant";
    let userEmail = "guest@amenbank.com.tn";

    // 1. Verify if user is an authenticated Admin
    const adminToken = req.cookies?.adminToken;
    if (adminToken) {
      try {
        const decodedAdmin = jwt.verify(adminToken, process.env.JWT_SECRET || "fallback_secret");
        if (decodedAdmin) {
          isModerator = true;
          userName = decodedAdmin.name || "Conseiller Bancaire (Admin)";
          userEmail = decodedAdmin.email || "admin@amenbank.com.tn";
        }
      } catch (e) {
        // Token invalid or expired
      }
    }

    // 2. If not admin, check client user token
    if (!isModerator && req.cookies?.token) {
      try {
        const decodedUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET || "fallback_secret");
        if (decodedUser) {
          userName = decodedUser.nom ? `${decodedUser.prenom} ${decodedUser.nom}` : "Client Amen Bank";
          userEmail = decodedUser.email || "client@amenbank.com.tn";
        }
      } catch (e) {
        // Token invalid or expired
      }
    }

    // 3. If JaaS credentials are provided in server environment, sign short-lived RS256 token
    const jaasAppId = process.env.JAAS_APP_ID;
    const jaasKeyId = process.env.JAAS_KEY_ID;
    const jaasPrivateKey = process.env.JAAS_PRIVATE_KEY;

    if (jaasAppId && jaasPrivateKey) {
      try {
        const token = jwt.sign(
          {
            aud: "jitsi",
            iss: "chat",
            sub: jaasAppId,
            room: roomId,
            context: {
              features: {
                livestreaming: isModerator,
                recording: isModerator,
                transcription: isModerator,
                "outbound-call": false,
              },
              user: {
                moderator: isModerator,
                name: userName,
                email: userEmail,
              },
            },
          },
          jaasPrivateKey,
          {
            algorithm: "RS256",
            header: jaasKeyId ? { kid: jaasKeyId } : undefined,
            expiresIn: "15m",
          }
        );

        return res.json({
          provider: "jaas",
          domain: "8x8.vc",
          tenant: jaasAppId,
          roomId,
          token,
          displayName: userName,
          email: userEmail,
          isModerator,
        });
      } catch (signErr) {
        logger.error("Error signing JaaS JWT", { error: signErr.message });
      }
    }

    // 4. Default / Fallback: standard Jitsi configuration without hardcoded secret
    return res.json({
      provider: "jitsi",
      domain: process.env.JITSI_DOMAIN || "meet.jit.si",
      tenant: null,
      roomId,
      token: null,
      displayName: userName,
      email: userEmail,
      isModerator,
    });
  } catch (error) {
    logger.error("Error generating conference token", { error: error.message });
    return res.status(500).json({ message: "Erreur lors de la configuration de la conférence" });
  }
};

/**
 * Update the status of a video conference (only 'active' or 'completed').
 */
exports.updateVideoConferenceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, roomId } = req.body;

    // Validate status
    if (!["active", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updatedConference = await VideoConferenceRequest.findByIdAndUpdate(
      id,
      { status, roomId },
      { new: true }
    );

    if (!updatedConference) {
      return res.status(404).json({ message: "Request not found" });
    }

    return res.status(200).json({
      message: "Status updated successfully",
      conference: updatedConference,
    });
  } catch (error) {
    console.error("Error updating conference status:", error);
    return next(error);
  }
};

/**
 * Delete a video conference request by ID.
 */
exports.deleteVideoConferenceRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await VideoConferenceRequest.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Request not found" });
    }

    return res.status(200).json({ message: "Video conference request deleted successfully" });
  } catch (error) {
    console.error("Error deleting conference request:", error);
    return next(error);
  }
};

/**
 * Retrieve all video conference requests, sorted by creation time desc.
 */
exports.getVideoConferenceRequests = async (req, res, next) => {
  try {
    const requests = await VideoConferenceRequest.find().sort({ createdAt: -1 });
    return res.status(200).json({
      message: "Video conference requests retrieved successfully.",
      requests,
    });
  } catch (error) {
    console.error("Error fetching conference requests:", error);
    return next(error);
  }
};

/**
 * Create a new video conference request and notify admins.
 */
exports.createVideoConferenceRequest = async (req, res, next) => {
  try {
    const { name, email, subject, phone, roomId } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !phone || !roomId) {
      return res.status(400).json({ message: "Tous les champs sont requis, y compris roomId." });
    }

    // Save the request
    const newRequest = new VideoConferenceRequest({ name, email, subject, phone, roomId });
    const savedRequest = await newRequest.save();

    // Create admin notification
    const notificationTitle = "Nouvelle demande de vidéoconférence";
    const notificationMessage = `Nouvelle demande de vidéoconférence de ${name} (Sujet: ${subject}).`;
    const adminNotification = new AdminNotification({
      title: notificationTitle,
      message: notificationMessage,
      requestId: savedRequest._id,
    });
    const savedNotification = await adminNotification.save();

    // Emit over socket.io, if available
    const io = req.app.locals.io;
    if (io && typeof io.emit === 'function') {
      io.emit("new_notification", {
        id: savedNotification._id,
        title: savedNotification.title,
        message: savedNotification.message,
        time: savedNotification.createdAt,
        read: savedNotification.read,
        requestId: savedNotification.requestId,
      });
    }

    return res.status(201).json({
      message: "Demande de vidéoconférence créée avec succès.",
      request: savedRequest,
    });
  } catch (error) {
    console.error("Error creating conference request:", error);
    return next(error);
  }
};
