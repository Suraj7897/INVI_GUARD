// controllers/sensorController.js

const SensorData = require("../models/sensordata-model");

// Fetch all sensor data
const sensordata = async (req, res) => {
  try {
    const sensorData = await SensorData.find();
    res.status(200).json(sensorData);
  } catch (error) {
    console.error("Error fetching sensor data:", error);
    res.status(500).json({ message: "Error fetching sensor data" });
  }
};

// Add more controller functions as needed, e.g., for posting data, etc.

module.exports = sensordata;
