const express = require('express');
const router = express.Router();
const sensordata = require('../controllers/sensor-controller');
const authMiddleware = require("../middleware/auth-middleware");

// Register the route
router.get("/sensor", authMiddleware, sensordata);

module.exports = router;

