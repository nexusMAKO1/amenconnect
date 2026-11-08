// controllers/authController.js
const User = require("../models/User");
const Compte = require("../models/Compte");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const {
  generateAccountNumber,
  buildCompleteRIB,
  generateRIB,
  generateIBAN,
  DOMICILIATION,
} = require("../config/helper");
const Session = require("../models/Session");
const crypto = require("crypto");
const UAParser = require('ua-parser-js');

// If your Node version is older than 18, you might need to import node-fetch:
// const fetch = require("node-fetch");

// Async helper function to fetch IP info
const getIPInfo = async () => {
  try {
    const response = await fetch("http://localhost:3000/api/ip/info");
    if (!response.ok) {
      console.error("Failed to fetch IP info");
      return null;
    }
    const data = await response.json();
    return data.clientIP; // Adjust according to your API's JSON structure
  } catch (err) {
    console.error("Error fetching IP info:", err);
    return null;
  }
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

// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate OTP email HTML
const generateOTPEmailHTML = (otp) => {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Code de Vérification OTP</title>
      <style>
        body { font-family: 'Arial', sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; color: #1E1E1E; }
        .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); }
        .logo { text-align: center; margin-bottom: 30px; }
        .logo img { width: 150px; height: auto; }
        .header { text-align: center; font-size: 28px; font-weight: bold; color: #121660; margin-bottom: 30px; }
        .otp-container { background-color: #f8f9fa; border-radius: 12px; padding: 30px; margin-bottom: 30px; }
        .otp { font-size: 48px; color: #47CE65; text-align: center; letter-spacing: 8px; font-weight: bold; }
        .message { text-align: center; font-size: 18px; color: #1E1E1E; margin-bottom: 30px; line-height: 1.6; }
        .footer { text-align: center; font-size: 14px; color: #47B3CE; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(71, 179, 206, 0.3); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <img src="https://www.amenbank.com.tn/img/logo.jpg" alt="AmenBank">
        </div>
        <div class="header">
          Vérifiez Votre Connexion
        </div>
        <div class="otp-container">
          <div class="otp">
            ${otp}
          </div>
        </div>
        <div class="message">
          <p>Utilisez le code à usage unique (OTP) ci-dessus pour vérifier votre connexion.</p>
          <p>Ce code expirera dans <strong>10 minutes</strong>.</p>
        </div>
        <div class="footer">
          <p>Si vous n'avez pas demandé ce code, veuillez ignorer cet e-mail ou contacter immédiatement notre équipe d'assistance.</p>
          <p>&copy; 2025 AmenBank. Tous droits réservés.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Function to send OTP email
const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: `"Amen Connect" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your OTP Code",
    html: generateOTPEmailHTML(otp),
  };

  return transporter.sendMail(mailOptions);
};

// Available compte types with default values
const compteTypes = {
  "Compte courant": {
    avecChéquier: true,
    avecCarteBancaire: true,
    modalitésRetrait: "2000",
    conditionsGel: "Aucune restriction"
  },
  "Compte épargne": {
    avecChéquier: false,
    avecCarteBancaire: false,
    modalitésRetrait: "5000",
    conditionsGel: "Fonds bloqués pour 1 an"
  }
};

// **Register New User and Create Accounts**
exports.register = async (req, res) => {
  const { cin, nom, prenom, email, telephone, employeur, adresseEmployeur, password, comptes = ["Compte courant", "Compte épargne"] } = req.body;

  try {
    // Check if the user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists with this email." });
    }

    // Create and save the new user
    user = new User({ cin, nom, prenom, email, telephone, employeur, adresseEmployeur, password });
    await user.save();

    const compteDocuments = comptes.map(type => {
      const accountNumber = generateAccountNumber(); // 13-digit Tunisian account number
      const completeRIB = buildCompleteRIB(accountNumber); // 20-digit Tunisian RIB
      const iban = (generateIBAN || generateRIB)(completeRIB); // 24-character Tunisian IBAN
      return {
        userId: user._id,
        numéroCompte: accountNumber,
        solde: 0.0,
        type,
        RIB: completeRIB,
        IBAN: iban,
        domiciliation: DOMICILIATION,
        ...compteTypes[type],
        historique: []
      };
    });

    await Compte.insertMany(compteDocuments);

    res.status(201).json({ message: "User registered and comptes created successfully." });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

exports.addCompte = async (req, res) => {
  const { userId, type } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!compteTypes[type]) {
      return res.status(400).json({ message: "Invalid compte type." });
    }

    const existingCompte = await Compte.findOne({ userId, type });
    if (existingCompte) {
      return res.status(400).json({ message: "User already has this type of compte." });
    }

    const accountNumber = generateAccountNumber();
    const completeRIB = buildCompleteRIB(accountNumber);
    const iban = (generateIBAN || generateRIB)(completeRIB);

    const newCompte = new Compte({
      userId,
      numéroCompte: accountNumber,
      solde: 0.0,
      type,
      RIB: completeRIB,
      IBAN: iban,
      domiciliation: DOMICILIATION,
      ...compteTypes[type],
      historique: []
    });

    await newCompte.save();
    res.status(201).json({ message: "Compte added successfully.", compte: newCompte });
  } catch (err) {
    console.error("Add Compte error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

exports.login = async (req, res) => {
  res.status(200).json({ message: "Login route" });
};

// OTP Verification endpoint

exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }

    if (!user.otp || !user.otp.expires || new Date() > user.otp.expires) {
      return res.status(400).json({ message: "OTP has expired." });
    }

    const isOTPMatch = await bcrypt.compare(otp, user.otp.hash);
    if (!isOTPMatch) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    // Clear OTP data from the user document
    user.otp = { hash: null, expires: null };
    await user.save();

    // Fetch the client's IP info asynchronously
    const clientIP = (await getIPInfo()) || "unknown";

    // Parse the user-agent string using ua-parser-js
    const parser = new UAParser(req.headers["user-agent"]);
    const result = parser.getResult();

    // Extract browser and OS information with fallbacks
    const browserName = result.browser.name || "Unknown Browser";
    const browserVersion = result.browser.version || "Unknown Version";
    const osName = result.os.name || "Unknown OS";
    const osVersion = result.os.version || "Unknown OS Version";

    // Construct a device summary string
    const deviceSummary = `${browserName} ${browserVersion} on ${osName} ${osVersion}`;

    // Create a new session record with the parsed device information
    const sessionId = crypto.randomBytes(16).toString("hex");
    const newSession = new Session({
      userId: user._id,
      sessionId,
      device: deviceSummary,
      ipAddress: clientIP || "UNKNOWN",
    });
    await newSession.save();

    // Generate a JWT token valid for 1 hour
    const token = jwt.sign(
      { id: user._id, email: user.email, sessionId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set the token as an HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
    });

    res.json({ message: "OTP verified successfully!" });
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(500).json({ message: "Server error." });
  }
};


// Resend OTP endpoint
exports.resendOTP = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }
    const otpPlain = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const otpHashed = await bcrypt.hash(otpPlain, 10);

    user.otp = { hash: otpHashed, expires: otpExpires };
    await user.save();

    try {
      await sendOTPEmail(user.email, otpPlain);
    } catch (emailError) {
      console.error("Error sending OTP email:", emailError);
      return res.status(500).json({ message: "Error sending OTP email. Please try again later." });
    }

    res.json({ message: "New OTP sent successfully to your email!" });
  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// controllers/authController.js
exports.logout = async (req, res) => {
  try {
    // Extract the token from cookies
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "No token provided." });
    }
    
    // Decode the token to retrieve the sessionId
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Delete the session using the sessionId from the token payload
    const deleteResult = await Session.deleteOne({ sessionId: decoded.sessionId });
    
    // Clear the token cookie from the client
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    
    res.json({ message: "Logged out successfully." });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ message: "Server error." });
  }
};


const Carte = require("../models/Cartes");

// Export OTP helper functions if needed elsewhere
exports.generateOTP = generateOTP;
exports.sendOTPEmail = sendOTPEmail;
