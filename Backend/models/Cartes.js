//models/cartes.js
const mongoose = require("mongoose");

const carteSchema = new mongoose.Schema({
    CardNumber: { type: String, required: true },
    ExpiryDate: { type: String, default: "" },
    CardHolder: { type: String, required: true },
    CreatedAt: { type: String, default: "" },
    UpdatedAt: { type: String, default: "" },
    comptesId: { type: mongoose.Schema.Types.ObjectId, ref: "Compte", required: true },
    TypeCarte: {type: String, default:""},
  }, { collection: "carte" }); // 👈 Force Mongoose to use "carte"
  
  module.exports = mongoose.model("Carte", carteSchema);
  