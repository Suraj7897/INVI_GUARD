// models/sensorModel.js

const mongoose = require("mongoose");

const sensorSchema = new mongoose.Schema({
  sensor1: {
    type: Number,
    required: true,
  },
  sensor2: {
    type: Number,
    required: true,
  },
  sensor3: {
    type: Number,
    required: true,
  },
  sensor4: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Sensor = mongoose.model("Sensor", sensorSchema);

module.exports = Sensor;
