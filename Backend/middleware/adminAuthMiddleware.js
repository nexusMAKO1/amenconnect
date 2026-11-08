// middleware/adminAuthMiddleware.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const adminAuthMiddleware = (req, res, next) => {
  const token = req.cookies.adminToken;
  if (!token) {
    return res.status(401).json({ message: 'No admin token provided.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role === 'kiosk-admin') {
      const currentMaintenance = process.env.KIOSK_MAINTENANCE_PASSWORD;
      const currentFp = currentMaintenance ? crypto.createHash('sha256').update(currentMaintenance).digest('hex').slice(0, 16) : null;
      if (!decoded.keyFingerprint || decoded.keyFingerprint !== currentFp) {
        return res.status(401).json({ message: 'Credentials rotated. Session invalidated.' });
      }
    } else if (decoded.role !== 'admin' && decoded.role !== 'superadmin') {
      return res.status(403).json({ message: 'Not authorized as admin.' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

module.exports = adminAuthMiddleware;
