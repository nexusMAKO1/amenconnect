// routes/qrLogin.js
const express = require("express");
const router = express.Router();
const QRSession = require("../models/QRSession");
const jwt = require("jsonwebtoken");
const verifyToken = require("../middleware/auth");

// Create a new QR session (used by the kiosk)
router.post("/create", async (req, res) => {
  const { sessionId } = req.body;
  try {
    const session = await QRSession.findOneAndUpdate(
      { sessionId },
      { $setOnInsert: { sessionId, status: "pending", createdAt: new Date() } },
      { upsert: true, new: true }
    );
    return res.json({ message: "Session created", sessionId: session.sessionId });
  } catch (error) {
    console.error("Error creating session:", error);
    return res.status(500).json({ message: "Server error" });
  }
});


// POST endpoint: Authenticate a QR session using the authenticated mobile user
router.post("/", verifyToken, async (req, res) => {
  const { sessionId } = req.body;
  // req.user is set by the verifyToken middleware from the mobile's token
  const userId = req.user.id;
  try {
    const session = await QRSession.findOne({ sessionId });
    if (!session) return res.status(404).json({ message: "Session not found" });

    session.status = "authenticated";
    session.user = userId;
    await session.save();
    return res.json({ message: "Session authenticated" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET endpoint: Check the status of a QR session and atomically redeem token for kiosk
const Session = require("../models/Session");

router.get("/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  try {
    const existing = await QRSession.findOne({ sessionId });
    if (!existing) {
      return res.status(404).json({ message: "Session not found or expired." });
    }

    if (existing.status === "pending") {
      return res.json({ status: "pending", user: null });
    }

    if (existing.status === "consumed") {
      return res.status(409).json({
        status: "consumed",
        message: "QR session has already been redeemed.",
      });
    }

    if (existing.status === "authenticated" && existing.user) {
      // Atomic single-use redemption: exactly one concurrent request can transition from 'authenticated' to 'consumed'
      const redeemedSession = await QRSession.findOneAndUpdate(
        { sessionId, status: "authenticated" },
        { $set: { status: "consumed", consumedAt: new Date() } },
        { new: false }
      );

      if (!redeemedSession) {
        return res.status(409).json({
          status: "consumed",
          message: "QR session has already been redeemed by a concurrent request.",
        });
      }

      // Create or update the corresponding session in the Session collection
      await Session.findOneAndUpdate(
        { sessionId: redeemedSession.sessionId },
        { user: redeemedSession.user, status: "authenticated", updatedAt: new Date() },
        { upsert: true, new: true }
      );

      // Generate a new token for the kiosk
      const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https";
      const token = jwt.sign(
        { id: redeemedSession.user, sessionId: redeemedSession.sessionId },
        process.env.JWT_SECRET || "fallback_secret",
        { expiresIn: "1h" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: isSecure,
        sameSite: "lax",
      });

      return res.json({
        status: "authenticated",
        user: redeemedSession.user,
        token,
      });
    }

    return res.json({ status: existing.status, user: existing.user });
  } catch (error) {
    console.error("Error retrieving/redeeming QR session:", error);
    return res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
