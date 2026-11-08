//controllers/accountCreationController.js
const DemandeCreationCompte = require('../models/DemandeCreationCompte');
const User = require("../models/User");
const Compte = require("../models/Compte");
const Carte = require("../models/Cartes");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { generateRIB, computeControlKey, DOMICILIATION, generateOTP } = require("../config/helper");

// Define fixed bank and agency codes (adjust these values as needed)
const BANK_CODE = "07";      // 2 digits
const AGENCY_CODE = "162";   // 3 digits

// Helper: generate a random password (adjust complexity as required)
const generateRandomPassword = () => {
  return crypto.randomBytes(6).toString('hex'); // generates a 12-character hex string
};

// Helper: generate a unique 13-digit account number
const generateAccountNumber = () => {
  let num = "";
  for (let i = 0; i < 13; i++) {
    num += Math.floor(Math.random() * 10).toString();
  }
  return num;
};

// Configure nodemailer transporter with support for local Mailpit / SMTP
const getTransporter = () => {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "1025", 10),
      secure: process.env.SMTP_SECURE === "true",
      ignoreTLS: true,
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      } : undefined,
    });
  }
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};
const transporter = getTransporter();

// Helper: generate the email HTML content in French
const generateAccountApprovedEmailHTML = (userEmail, generatedPassword) => {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue - Votre Compte est Approuvé</title>
  <style>
    body { font-family: 'Arial', sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; color: #333; }
    .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); }
    .logo { text-align: center; margin-bottom: 30px; }
    .logo img { width: 150px; height: auto; }
    .header { text-align: center; font-size: 28px; font-weight: bold; color: #121660; margin-bottom: 30px; }
    .welcome-message { text-align: center; font-size: 18px; color: #333; margin-bottom: 30px; line-height: 1.6; }
    .info-container { background-color: #f8f9fa; border-radius: 12px; padding: 30px; margin-bottom: 30px; }
    .info-label { font-size: 16px; color: #666; margin-bottom: 5px; }
    .info-value { font-size: 18px; color: #121660; font-weight: bold; margin-bottom: 20px; word-break: break-all; }
    .password-container { background-color: #edf7ed; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #47CE65; }
    .password-value { font-size: 24px; color: #47CE65; text-align: center; letter-spacing: 3px; font-weight: bold; font-family: monospace; }
    .notice { background-color: #fff8e6; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #ffb74d; }
    .notice-text { font-size: 16px; color: #e65100; }
    .button-container { text-align: center; margin: 30px 0; }
    .button { display: inline-block; background-color: #121660; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; }
    .footer { text-align: center; font-size: 14px; color: #47B3CE; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(71, 179, 206, 0.3); }
    .divider { height: 1px; background-color: #eee; margin: 25px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <img src="https://www.amenbank.com.tn/img/logo.jpg" alt="AmenBank">
    </div>
    <div class="header">
      Félicitations! Votre Compte est Approuvé
    </div>
    <div class="welcome-message">
      <p>Nous sommes ravis de vous informer que votre demande de compte a été approuvée. Bienvenue dans notre communauté!</p>
    </div>
    
    <div class="info-container">
      <div class="info-label">Votre identifiant de connexion:</div>
      <div class="info-value">${userEmail}</div>
      
      <div class="divider"></div>
      
      <div class="info-label">Votre mot de passe temporaire:</div>
      <div class="password-container">
        <div class="password-value">${generatedPassword}</div>
      </div>
    </div>
    
    <div class="notice">
      <div class="notice-text">
        <strong>Important:</strong> Pour des raisons de sécurité, vous devrez changer ce mot de passe lors de votre première connexion.
      </div>
    </div>
    
    <div class="button-container">
      <a href="https://localhost:8200" class="button">Se Connecter Maintenant</a>
    </div>
    
    <div class="welcome-message">
      <p>Si vous avez des questions ou besoin d'assistance, n'hésitez pas à contacter notre équipe de support.</p>
    </div>
    
    <div class="footer">
      <p>Ce message est automatique, merci de ne pas y répondre directement.</p>
      <p>&copy; 2025 AmenBank. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>`;
};

exports.createAccountCreation = async (req, res) => {
  try {
    const demandeData = req.body;
    const demande = new DemandeCreationCompte(demandeData);
    await demande.save();
    res.status(201).json({ 
      message: 'Demande de création de compte enregistrée avec succès',
      demande 
    });
  } catch (error) {
    console.error('Error creating demande:', error);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement de la demande' });
  }
};

exports.getAllDemandes = async (req, res) => {
  try {
    const demandes = await DemandeCreationCompte.find();
    res.status(200).json({ demandes });
  } catch (error) {
    console.error('Error retrieving demandes:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des demandes' });
  }
};

const currentDate = new Date().toLocaleDateString('fr-FR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

// New controller function to approve a demande
exports.approveAccountCreation = async (req, res) => {
  try {
    const { id } = req.params;

    // Find and update the demande to approved
    const demande = await DemandeCreationCompte.findByIdAndUpdate(
      id,
      { status: 'approved' },
      { new: true }
    );
    if (!demande) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    // Create a new user using data from the demande
    const generatedPassword = generateRandomPassword();
    const newUserData = {
      cin: demande.numeroCIN,
      nom: demande.nom,
      prenom: demande.prenom,
      email: demande.email,
      telephone: demande.numeroGSM,
      employeur: demande.fonction || "N/A",
      adresseEmployeur: demande.adresseDomicile,
      password: generatedPassword,
    };

    // Check if a user with the email already exists
    let existingUser = await User.findOne({ email: demande.email });
    if (existingUser) {
      return res.status(400).json({ error: 'Un utilisateur avec cet email existe déjà.' });
    }

    const newUser = new User(newUserData);
    await newUser.save();

    // Create the compte for the new user
    // 1. Generate a 13-digit account number.
    const accountNumber = generateAccountNumber();
    // 2. Build the RIB without the control key: BANK_CODE (2) + AGENCY_CODE (3) + accountNumber (13) = 18 digits.
    const ribWithoutControl = BANK_CODE + AGENCY_CODE + accountNumber;
    // 3. Compute the 2-digit control key.
    const controlKey = computeControlKey(ribWithoutControl);
    // 4. Combine to get the complete 20-digit RIB.
    const completeRIB = ribWithoutControl + controlKey;
    // 5. Generate the IBAN from the complete RIB.
    const iban = generateRIB(completeRIB);

    const compteData = {
      userId: newUser._id,
      numéroCompte: accountNumber,
      solde: 0.0,
      type: demande.typeCompte || "Compte courant",
      RIB: completeRIB,
      IBAN: iban,
      domiciliation: DOMICILIATION,
      historique: []
    };

    const newCompte = new Compte(compteData);
    await newCompte.save();

    newUser.compteIds.push(newCompte._id);
    await newUser.save();

    // Optionally create a credit card if indicated.
    let newCard;
    if (demande.wantCreditCard) {
      // Generate a 16-digit credit card number containing only digits.
      const cardNumber = Array.from({ length: 16 }, () => crypto.randomInt(0, 10)).join('');
      newCard = new Carte({
        CardNumber: cardNumber,
        CardHolder: `${newUser.prenom} ${newUser.nom}`,
        comptesId: newCompte._id,
        TypeCarte: demande.creditCardType,
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString(),
        ExpirationDate: new Date(new Date().setFullYear(new Date().getFullYear() + 3)).toISOString(),
      });
      await newCard.save();
      
      // Optionally add the card to the user's record
      newUser.carteIds.push(newCard._id);
      await newUser.save();
    }
    
    // Send an email to the new user with their credentials
    const mailOptions = {
      from: `"AmenConnect" <${process.env.EMAIL_USER}>`,
      to: newUser.email,
      subject: "Activation de votre compte AmenBank",
      html: generateAccountApprovedEmailHTML(newUser.email, generatedPassword),
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message: 'Demande approuvée. Utilisateur, compte et carte (si demandée) créés avec succès et email envoyé.',
      user: newUser,
      compte: newCompte,
      card: newCard || null,
    });
  } catch (error) {
    console.error('Error approving demande:', error);
    res.status(500).json({ error: 'Erreur lors de l\'approbation de la demande' });
  }
};

// New controller function to reject a demande
exports.rejectAccountCreation = async (req, res) => {
  try {
    const { id } = req.params;
    const demande = await DemandeCreationCompte.findByIdAndDelete(id);
    if (!demande) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }
    const userEmail = demande.email;
    if (!userEmail) {
      return res.status(400).json({ error: 'Adresse email introuvable dans la demande' });
    }
    const mailOptions = {
      from: `"AmenConnect" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'Information concernant votre demande de compte AmenConnect',
      text: 
`Bonjour ${userEmail},

Nous vous remercions de l'intérêt que vous portez à AmenConnect.

Suite à l'examen de votre demande de création de compte, nous sommes au regret de vous informer que celle-ci n'a pas pu être approuvée.

Si vous souhaitez obtenir plus d'informations concernant cette décision ou si vous pensez qu'une erreur s'est produite, n'hésitez pas à contacter notre équipe support à l'adresse support@amenconnect.com.

Nous vous prions de recevoir nos salutations distinguées,

L'équipe AmenConnect
www.amenconnect.com

Ce message est généré automatiquement, merci de ne pas y répondre directement.`,
      html: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Information concernant votre demande</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; color: #333333; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td style="padding: 20px 0; text-align: center; background-color: #ffffff;">
        <img src="https://amennet.com.tn/images/RefG/AmenbankLogo.png" alt="AmenConnect Logo" style="max-width: 200px; height: auto;">
      </td>
    </tr>
  </table>
  
  <table role="presentation" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <tr>
      <td style="padding: 30px 40px;">
        <table role="presentation" width="100%">
          <tr>
            <td>
              <p style="margin-top: 0; color: #666666; font-size: 14px;">${currentDate}</p>
              <h1 style="margin: 15px 0; color: #333333; font-size: 22px;">Information concernant votre demande</h1>
              
              <p style="margin: 20px 0; font-size: 16px; line-height: 1.5;">Bonjour ${userEmail},</p>
              
              <p style="margin: 20px 0; font-size: 16px; line-height: 1.5;">Nous vous remercions de l'intérêt que vous portez à AmenConnect.</p>
              
              <p style="margin: 20px 0; font-size: 16px; line-height: 1.5;">Suite à l'examen de votre demande de création de compte, nous sommes au regret de vous informer que celle-ci n'a pas pu être approuvée.</p>
              
              <p style="margin: 20px 0; font-size: 16px; line-height: 1.5;">Si vous souhaitez obtenir plus d'informations concernant cette décision ou si vous pensez qu'une erreur s'est produite, n'hésitez pas à contacter notre équipe support.</p>
              
              <div style="margin: 30px 0; padding: 20px; background-color: #f8f8f8; border-radius: 5px; text-align: center;">
                <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">Besoin d'assistance ?</p>
                <a href="mailto:support@amenconnect.com" style="color: #0066cc; text-decoration: none; font-weight: bold;">support@amenconnect.com</a>
              </div>
              
              <p style="margin: 20px 0; font-size: 16px; line-height: 1.5;">Nous vous prions de recevoir nos salutations distinguées,</p>
              
              <p style="margin: 5px 0; font-size: 16px; line-height: 1.5; font-weight: bold;">L'équipe AmenConnect</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td style="padding: 30px 0; text-align: center;">
        <p style="margin: 0; font-size: 14px; color: #666666;">© ${new Date().getFullYear()} AmenConnect. Tous droits réservés.</p>
        <p style="margin: 10px 0 0 0; font-size: 12px; color: #999999;">Ce message est généré automatiquement, merci de ne pas y répondre directement.</p>
        <p style="margin: 10px 0 0 0; font-size: 12px; color: #999999;">
          <a href="https://www.amenconnect.com" style="color: #0066cc; text-decoration: none;">www.amenconnect.com</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Demande supprimée et email envoyé avec succès' });
  } catch (error) {
    console.error('Error rejecting demande:', error);
    res.status(500).json({ error: 'Erreur lors du rejet de la demande' });
  }
};
