const SensorData = require("../models/sensordata-model");

// Controller to save sensor data
const saveSensorData = async (req, res) => {
  try {
    const { bpm, ax, ay, az,temp,helmet } = req.body;

    // Create a new sensor data entry
    const newSensorData = new SensorData({
      bpm,
      ax,
      ay,
      az,
      temp,
      helmet,
    });

    // Save the data to MongoDB
    await newSensorData.save();

    res.status(201).send("Sensor data saved successfully.");
  } catch (error) {
    console.error("Error saving sensor data:", error);
    res.status(500).send("Failed to save sensor data.");
  }
};

module.exports =  saveSensorData;
