const express = require("express");
const  saveSensorData  = require("../controllers/sensordata-save");
const authMiddleware = require("../middleware/auth-middleware");


const router = express.Router();

// Route to handle saving sensor data
router.post("/sensorsave", saveSensorData);

module.exports = router;
