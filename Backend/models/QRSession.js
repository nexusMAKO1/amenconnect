// models/QRSession.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const QRSessionSchema = new Schema({
  sessionId: { type: String, required: true, unique: true },
  status: { type: String, enum: ["pending", "authenticated", "consumed", "expired"], default: "pending" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  consumedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now, index: { expires: "60s" } }
});

module.exports = mongoose.model("QRSession", QRSessionSchema);
