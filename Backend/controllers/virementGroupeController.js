//controllers/virementGroupeController.js
const Compte = require("../models/Compte");
const VirementGroupe = require("../models/VirementGroupe");
const mongoose = require("mongoose");

exports.createVirementGroupe = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { fromAccount, virements } = req.body;

    // Validate sender account exists
    const sender = await Compte.findById(fromAccount).session(session);
    if (!sender) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Compte source introuvable" });
    }

    // Validate each virement entry and calculate total amount
    let totalAmount = 0;
    for (const v of virements) {
      if (!v.beneficiary || !v.amount || v.amount <= 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "Données de virement invalide" });
      }
      totalAmount += v.amount;
    }

    // Check if sender has sufficient funds
    if (sender.solde < totalAmount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Fonds insuffisants dans le compte source" });
    }

    // Deduct total amount from sender's account and add a debit historique entry
    sender.solde -= totalAmount;
    const groupRef = `VG-${new mongoose.Types.ObjectId().toString().slice(-6)}`;
    sender.historique.push({
      _id: new mongoose.Types.ObjectId(),
      date: new Date(),
      amount: totalAmount,
      description: "Virement groupé - Débit",
      type: "debit",
      reference: groupRef,
    });
    await sender.save({ session });

    // Create the group virement record
    const groupeRecord = await VirementGroupe.create(
      [
        {
          fromAccount,
          virements: virements.map((v) => ({
            beneficiary: v.beneficiary, // now a string (the RIB)
            amount: v.amount,
            motif: v.motif,
          })),
        },
      ],
      { session }
    );

    // Commit the transaction so that the sender update is saved atomically
    await session.commitTransaction();
    session.endSession();

    // Process each individual transfer for receivers
    virements.forEach((v) => {
      (async () => {
        try {
          const receiver = await Compte.findOne({ RIB: v.beneficiary });
          if (receiver) {
            receiver.solde += v.amount;
            receiver.historique.push({
              _id: new mongoose.Types.ObjectId(),
              date: new Date(),
              amount: v.amount,
              description: "Virement groupé - Crédit",
              type: "credit",
              reference: groupRef,
            });
            await receiver.save();
          }
        } catch (err) {
          console.error("Erreur lors du traitement du virement pour le bénéficiaire:", err);
        }
      })();
    });

    return res.status(201).json({
      success: true,
      message: "Virements groupés effectués avec succès",
      data: groupeRecord[0],
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Erreur lors du traitement des virements groupés :", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};
