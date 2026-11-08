// firebaseAdmin.js
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let serviceAccount = null;

// Look for credentials in multiple possible locations
const candidatePaths = [
  process.env.FIREBASE_CREDENTIALS_PATH,
  path.resolve(__dirname, '../../firebaseadminsdk.json'),
  path.resolve(__dirname, '../firebaseadminsdk.json'),
  path.resolve('/app/firebaseadminsdk.json'),
  path.resolve(process.cwd(), 'firebaseadminsdk.json'),
];

for (const candidate of candidatePaths) {
  if (candidate && fs.existsSync(candidate)) {
    try {
      serviceAccount = require(candidate);
      console.log(`Loaded Firebase credentials from ${candidate}`);
      break;
    } catch (err) {
      console.warn(`Failed reading Firebase credentials from ${candidate}:`, err.message);
    }
  }
}

if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    console.log('Loaded Firebase credentials from FIREBASE_SERVICE_ACCOUNT_JSON environment variable');
  } catch (err) {
    console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', err.message);
  }
}

if (serviceAccount && !admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL || "https://kiosk-b8f76-default-rtdb.firebaseio.com"
    });
    console.log("✅ Firebase Admin SDK initialized successfully");
  } catch (err) {
    console.warn("⚠️  Error initializing Firebase Admin SDK:", err.message);
  }
} else if (!admin.apps.length) {
  console.warn("⚠️  No Firebase credentials found. Running with simulated Firebase database interface.");
  // Provide safe fallback interface for kiosk commands so server doesn't crash
  const mockRef = (pathName) => ({
    set: async (val) => {
      console.log(`[Firebase Mock] Set at ${pathName}:`, val);
      return val;
    },
    remove: async () => {
      console.log(`[Firebase Mock] Removed at ${pathName}`);
      return null;
    },
  });

  admin.database = () => ({
    ref: (pathName) => mockRef(pathName),
  });
}

module.exports = admin;
