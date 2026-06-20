const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  level: {
    type: String,
    enum: ['info', 'warn', 'error', 'debug'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  service: {
    type: String,
    required: true
  },
  endpoint: {
    type: String
  },
  method: {
    type: String
  },
  statusCode: {
    type: Number
  },
  responseTime: {
    type: Number
  },
  userId: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for fast querying
logSchema.index({ service: 1, timestamp: -1 });
logSchema.index({ level: 1, timestamp: -1 });

module.exports = mongoose.model('Log', logSchema);