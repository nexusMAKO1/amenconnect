//controllers/kioskController.js
const Kiosk = require("../models/Kiosk")
const Admin = require("../models/Admin")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const logger = require('../config/logger');
const admin = require("../config/firebaseAdmin");
const axios = require('axios');

// GET all kiosks
exports.getKiosks = async (req, res) => {
  try {
    const kiosks = await Kiosk.find()
    res.json(kiosks)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET kiosk by ID
exports.getKioskById = async (req, res) => {
  try {
    const kiosk = await Kiosk.findById(req.params.id)
    if (!kiosk) return res.status(404).json({ message: "Kiosk not found" })
    res.json(kiosk)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// CREATE a new kiosk
exports.createKiosk = async (req, res) => {
  try {
    // Check if a kiosk with the same SN already exists
    const existingKiosk = await Kiosk.findOne({ SN: req.body.SN });
    if (existingKiosk) {
      return res.status(400).json({ error: "A kiosk with this serial number already exists." });
    }

    const newKiosk = new Kiosk(req.body);
    const savedKiosk = await newKiosk.save();
    res.status(201).json(savedKiosk);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// UPDATE an existing kiosk
exports.updateKiosk = async (req, res) => {
  try {
    const updatedKiosk = await Kiosk.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!updatedKiosk) return res.status(404).json({ message: "Kiosk not found" })
    res.json(updatedKiosk)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

// DELETE a kiosk
exports.deleteKiosk = async (req, res) => {
  try {
    const deletedKiosk = await Kiosk.findByIdAndDelete(req.params.id)
    if (!deletedKiosk) return res.status(404).json({ message: "Kiosk not found" })
    res.json({ message: "Kiosk deleted" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Shutdown a kiosk
exports.shutdownTotem = async (req, res) => {
  const { totemId } = req.body;
  if (!totemId) {
    return res.status(400).json({ error: "Totem ID is required for shutdown." });
  }

  try {
    // Find the kiosk using the provided totemId (stored in the "tote" field)
    const kiosk = await Kiosk.findOne({ tote: totemId });
    if (!kiosk) {
      return res.status(404).json({ error: "Kiosk not found." });
    }

    // Check if the kiosk is already offline
    if (kiosk.status !== "online") {
      return res.status(400).json({ error: "Kiosk is already offline." });
    }

    // Create a reference to the shutdown command in Firebase using the kiosk's serial number.
    const shutdownRef = admin.database().ref(`shutdown_commands/${kiosk.SN}`);

    // Write the shutdown command.
    await shutdownRef.set({
      command: "shutdown",
      timestamp: Date.now()
    });

    // Update kiosk status to offline and reset temperature.
    kiosk.status = "offline";
    kiosk.temperature = 0;
    await kiosk.save();

    res.json({ message: `Shutdown command sent to Totem ${totemId}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Get pending kiosks (enabled = false)
exports.getPendingKiosks = async (req, res) => {
  try {
    const pendingKiosks = await Kiosk.find({ enabled: false }).sort({ createdAt: -1 })
    res.json(pendingKiosks)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Approve a kiosk
exports.approveKiosk = async (req, res) => {
  const { kioskId } = req.body;

  if (!kioskId) {
    logger.warn('Approve kiosk failed: kioskId not provided');
    return res.status(400).json({ error: "Kiosk ID is required for approval." });
  }

  try {
    const kiosk = await Kiosk.findById(kioskId);
    if (!kiosk) {
      logger.warn('Approve kiosk failed: kiosk not found', { kioskId });
      return res.status(404).json({ error: "Kiosk not found." });
    }

    // Mark the kiosk as approved
    kiosk.enabled = true;
    if (!kiosk.tote) {
      const count = await Kiosk.countDocuments({ tote: { $regex: /^TM/ } });
      kiosk.tote = `TM${count + 1}`;
    }

    await kiosk.save();
    logger.info('Kiosk approved successfully', { kioskId: kiosk._id, tote: kiosk.tote });

    // Notify the kiosk about the approval if using Socket.IO
    const socketHandler = req.app.locals.socketHandler;
    if (socketHandler) {
      socketHandler.notifyKioskApproval(
        kiosk.SN,
        "approved",
        "Votre configuration a été approuvée. Vous pouvez maintenant utiliser le kiosk."
      );
    }

    res.json({ message: "Kiosk approved successfully." });
  } catch (error) {
    logger.error('Approve kiosk error', { error: error.message, kioskId });
    res.status(500).json({ error: error.message });
  }
};


// RESTART a kiosk
exports.restartTotem = async (req, res) => {
  const { totemId } = req.body;
  if (!totemId) {
    return res.status(400).json({ error: "Totem ID is required for restart." });
  }

  try {
    // Find the kiosk using the provided totemId (stored in the "tote" field)
    const kiosk = await Kiosk.findOne({ tote: totemId });
    if (!kiosk) {
      return res.status(404).json({ error: "Kiosk not found." });
    }

    // Ensure the kiosk is online (optional check)
    if (kiosk.status !== "online") {
      return res.status(400).json({ error: "Kiosk is not online." });
    }

    // Create a reference to the restart command in Firebase using the kiosk's serial number.
    const restartRef = admin.database().ref(`restart_commands/${kiosk.SN}`);

    // Write the restart command with a timestamp.
    await restartRef.set({
      command: "restart",
      timestamp: Date.now()
    });

    // Optionally update kiosk status to "restarting".
    kiosk.status = "restarting";
    await kiosk.save();

    res.json({ message: `Restart command sent to Totem ${totemId}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Reject a kiosk
exports.rejectKiosk = async (req, res) => {
  const { kioskId } = req.body;

  if (!kioskId) {
    logger.warn('Reject kiosk failed: kioskId not provided');
    return res.status(400).json({ error: "Kiosk ID is required for rejection." });
  }

  try {
    const kiosk = await Kiosk.findById(kioskId);
    if (!kiosk) {
      logger.warn('Reject kiosk failed: kiosk not found', { kioskId });
      return res.status(404).json({ error: "Kiosk not found." });
    }

    // Get the Socket.IO handler from app locals
    const socketHandler = req.app.locals.socketHandler;
    if (socketHandler) {
      socketHandler.notifyKioskApproval(
        kiosk.SN,
        "rejected",
        "Votre configuration a été rejetée. Veuillez contacter l'administrateur pour plus d'informations."
      );
    }

    // Delete the rejected kiosk
    await Kiosk.findByIdAndDelete(kioskId);
    logger.info('Kiosk rejected successfully', { kioskId: kiosk._id });

    res.json({ message: "Kiosk rejected and removed." });
  } catch (error) {
    logger.error('Reject kiosk error', { error: error.message, kioskId });
    res.status(500).json({ error: error.message });
  }
};

exports.runDiagnostic = async (req, res) => {
  try {
    const { totemId } = req.body;
    if (!totemId) {
      return res.status(400).json({ error: "Totem ID is required for diagnostic." });
    }
    // Change query to use SN instead of tote
    const kiosk = await Kiosk.findOne({ SN: totemId });
    if (!kiosk) {
      return res.status(404).json({ error: "Kiosk not found." });
    }
    
    // Create a reference to the diagnostic command in Firebase using the kiosk's serial number.
    const diagnosticRef = admin.database().ref(`diagnostic_commands/${kiosk.SN}`);
    await diagnosticRef.set({
      command: "diagnostic",
      timestamp: Date.now()
    });
    
    // Update kiosk status to indicate a pending diagnostic
    kiosk.status = "diagnostic_pending";
    await kiosk.save();
    
    res.json({ message: `Diagnostic command sent to Totem ${totemId}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * SEC-002: Server-side kiosk administrator verification.
 * Verifies credentials against Admin accounts in MongoDB or server-side KIOSK_MAINTENANCE_PASSWORD.
 */
exports.verifyKioskAdmin = async (req, res) => {
  try {
    const { password, email } = req.body;
    if (!password || typeof password !== "string") {
      return res.status(400).json({ success: false, message: "Mot de passe administrateur requis." });
    }

    const clientIp = req.ip || req.connection.remoteAddress;

    // 1. Check against active MongoDB Admin accounts
    if (email) {
      const adminUser = await Admin.findOne({ email });
      if (adminUser) {
        const isMatch = await bcrypt.compare(password, adminUser.password);
        if (isMatch) {
          logger.info("Kiosk admin verified via Admin account", { email, role: adminUser.role, ip: clientIp });
          const token = jwt.sign(
            { id: adminUser._id, role: adminUser.role, email: adminUser.email },
            process.env.JWT_SECRET || "fallback_secret",
            { expiresIn: "2h" }
          );
          res.cookie("adminToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7200000,
          });
          return res.json({ success: true, message: "Accès administrateur autorisé.", redirect: "/setup" });
        }
      }
    }

    // 2. Check all active Admin accounts if email was not supplied
    const admins = await Admin.find({ role: { $in: ["admin", "superadmin"] } });
    for (const adminUser of admins) {
      const isMatch = await bcrypt.compare(password, adminUser.password);
      if (isMatch) {
        logger.info("Kiosk admin verified via Admin account password", { email: adminUser.email, ip: clientIp });
        const token = jwt.sign(
          { id: adminUser._id, role: adminUser.role, email: adminUser.email },
          process.env.JWT_SECRET || "fallback_secret",
          { expiresIn: "2h" }
        );
        res.cookie("adminToken", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7200000,
        });
        return res.json({ success: true, message: "Accès administrateur autorisé.", redirect: "/setup" });
      }
    }

    // 3. Check against server-side KIOSK_MAINTENANCE_PASSWORD using timing-safe comparison
    const maintenancePassword = process.env.KIOSK_MAINTENANCE_PASSWORD;
    let isMaintenanceMatch = false;
    if (maintenancePassword && typeof password === "string") {
      const passBuf = Buffer.from(password, "utf8");
      const maintBuf = Buffer.from(maintenancePassword, "utf8");
      if (passBuf.length === maintBuf.length) {
        isMaintenanceMatch = crypto.timingSafeEqual(passBuf, maintBuf);
      }
    }

    if (isMaintenanceMatch) {
      const keyFingerprint = crypto.createHash("sha256").update(maintenancePassword).digest("hex").slice(0, 16);
      logger.info("Kiosk admin verified via server maintenance key", { ip: clientIp });
      const token = jwt.sign(
        { id: "kiosk-maintenance-admin", role: "kiosk-admin", keyFingerprint },
        process.env.JWT_SECRET || "fallback_secret",
        { expiresIn: "2h" }
      );
      res.cookie("adminToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7200000,
      });
      return res.json({ success: true, message: "Accès maintenance autorisé.", redirect: "/setup" });
    }

    logger.warn("Failed kiosk admin access attempt", { ip: clientIp });
    return res.status(401).json({ success: false, message: "Identifiants administrateur non valides." });
  } catch (error) {
    logger.error("Error verifying kiosk admin", { error: error.message });
    return res.status(500).json({ success: false, message: "Erreur serveur lors de la vérification." });
  }
};

/**
 * Validate active kiosk administrator session and ensure token has not been invalidated by credential rotation.
 */
exports.checkKioskAdminSession = async (req, res) => {
  try {
    const adminToken = req.cookies?.adminToken;
    if (!adminToken) {
      return res.status(401).json({ authenticated: false, message: "No admin token provided." });
    }

    const decoded = jwt.verify(adminToken, process.env.JWT_SECRET || "fallback_secret");

    // Invalidate if maintenance credential rotated
    if (decoded.role === "kiosk-admin") {
      const currentMaintenance = process.env.KIOSK_MAINTENANCE_PASSWORD;
      if (!currentMaintenance) {
        res.clearCookie("adminToken");
        return res.status(401).json({ authenticated: false, message: "Maintenance authentication disabled." });
      }
      const currentFp = crypto.createHash("sha256").update(currentMaintenance).digest("hex").slice(0, 16);
      if (!decoded.keyFingerprint || decoded.keyFingerprint !== currentFp) {
        res.clearCookie("adminToken");
        return res.status(401).json({ authenticated: false, message: "Credentials rotated. Session invalidated." });
      }
    }

    return res.json({ authenticated: true, role: decoded.role, id: decoded.id });
  } catch (err) {
    res.clearCookie("adminToken");
    return res.status(401).json({ authenticated: false, message: "Invalid or expired admin session." });
  }
};







