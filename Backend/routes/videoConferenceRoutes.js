const express = require("express");
const router = express.Router();
const videoConferenceController = require("../controllers/videoConferenceController");

// Route pour créer une nouvelle demande de vidéoconférence
router.post("/", videoConferenceController.createVideoConferenceRequest);


router.get("/", videoConferenceController.getVideoConferenceRequests);
module.exports = router;
