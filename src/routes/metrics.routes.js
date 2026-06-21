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

/**
 * @swagger
 * /api/metrics:
 *   post:
 *     summary: Record a new API metric
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Metric recorded
 *   get:
 *     summary: Get metrics with optional filters
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of metrics
 */
router.post('/', authenticate, createMetric);
router.get('/', authenticate, getMetrics);

/**
 * @swagger
 * /api/metrics/response-time:
 *   get:
 *     summary: Get average response time per endpoint
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Response time stats
 */
router.get('/response-time', authenticate, getResponseTimeStats);

/**
 * @swagger
 * /api/metrics/error-rate:
 *   get:
 *     summary: Get overall error rate
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Error rate percentage
 */
router.get('/error-rate', authenticate, getErrorRate);

/**
 * @swagger
 * /api/metrics/throughput:
 *   get:
 *     summary: Get requests per minute over the last hour
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Throughput data
 */
router.get('/throughput', authenticate, getThroughput);

module.exports = router;