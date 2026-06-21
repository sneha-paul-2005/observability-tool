const express = require('express');
const router = express.Router();
const {
  createMetric,
  getMetrics,
  getResponseTimeStats,
  getErrorRate,
  getThroughput
} = require('../controllers/metrics.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/', authenticate, createMetric);
router.get('/', authenticate, getMetrics);
router.get('/response-time', authenticate, getResponseTimeStats);
router.get('/error-rate', authenticate, getErrorRate);
router.get('/throughput', authenticate, getThroughput);

module.exports = router;