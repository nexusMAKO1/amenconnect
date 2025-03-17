// routes/kioskRoutes.js
const express = require("express");
const router = express.Router();
const kioskController = require("../controllers/kioskController");


// Custom endpoints
router.post("/shutdown", kioskController.shutdownKiosk);
router.get("/temperature", kioskController.getTemperature);

// CRUD endpoints
router.get("/", kioskController.getKiosks);
router.get("/:id", kioskController.getKioskById);
router.post("/", kioskController.createKiosk);
router.put("/:id", kioskController.updateKiosk);
router.delete("/:id", kioskController.deleteKiosk);

module.exports = router;
