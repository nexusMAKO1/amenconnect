//routes/kioskRoutes.js
const express = require("express")
const router = express.Router()
const kioskController = require("../controllers/kioskController")
const adminpassport = require('../config/adminPassport');
// Custom endpoints
router.post("/verify-admin", kioskController.verifyKioskAdmin);
router.get("/session", kioskController.checkKioskAdminSession);
router.post("/shutdown", adminpassport.authenticate('admin-jwt', { session: false }), kioskController.shutdownTotem);
router.get("/pending", kioskController.getPendingKiosks)
router.post("/approve", kioskController.approveKiosk)
router.post("/reject", kioskController.rejectKiosk)
// Diagnostic endpoint to fetch system diagnostics via the Flask app
router.post("/diagnostic", adminpassport.authenticate('admin-jwt', { session: false }), kioskController.runDiagnostic);
router.post('/restart', kioskController.restartTotem);
// CRUD endpoints
router.get("/", kioskController.getKiosks)
router.get("/:id", kioskController.getKioskById)
router.post("/", kioskController.createKiosk)
router.put("/:id", kioskController.updateKiosk)
router.delete("/:id", kioskController.deleteKiosk)

module.exports = router

