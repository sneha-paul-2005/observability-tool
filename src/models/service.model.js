const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  url: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['up', 'down', 'unknown'],
    default: 'unknown'
  },
  lastChecked: {
    type: Date
  },
  lastResponseTime: {
    type: Number
  },
  lastStatusCode: {
    type: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Service', serviceSchema);