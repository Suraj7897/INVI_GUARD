const mongoose = require("mongoose");

const sensorDataSchema = new mongoose.Schema({
  bpm: {
    type: Number,
    required: true,
  },
  ax: {
    type: Number,
    required: true,
  },
  ay: {
    type: Number,
    required: true,
  },
  az: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  temp:{
    type:Number,
    required:true,
  },
  helmet:{
    type:Boolean,
    required:true,
  },
});

// Create the model from the schema
const SensorData = mongoose.model("SensorData", sensorDataSchema);

module.exports = SensorData;
