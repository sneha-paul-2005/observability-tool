const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const {
  analyzeLogsHandler,
  explainErrorHandler,
  recommendationsHandler,
  detectAnomaliesHandler,
  getAnomaliesHandler,
} = require('../controllers/ai.controller');

// POST /api/ai/analyze
router.post('/analyze', authenticate, analyzeLogsHandler);

// POST /api/ai/explain-error
router.post('/explain-error', authenticate, explainErrorHandler);

// GET /api/ai/recommendations
router.get('/recommendations', authenticate, recommendationsHandler);

// POST /api/ai/anomalies/detect
router.post('/anomalies/detect', authenticate, detectAnomaliesHandler);

// GET /api/ai/anomalies
router.get('/anomalies', authenticate, getAnomaliesHandler);

module.exports = router;