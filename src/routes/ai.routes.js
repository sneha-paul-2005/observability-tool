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

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI-powered log analysis and anomaly detection
 */

/**
 * @swagger
 * /api/ai/analyze:
 *   post:
 *     summary: Analyze logs for a service using Gemini AI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [service]
 *             properties:
 *               service:
 *                 type: string
 *                 example: payment-service
 *     responses:
 *       200:
 *         description: AI analysis result
 *       404:
 *         description: No logs found for service
 */
router.post('/analyze', authenticate, analyzeLogsHandler);

/**
 * @swagger
 * /api/ai/explain-error:
 *   post:
 *     summary: Get a plain-English explanation of an error
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 example: Cannot read property 'id' of undefined
 *               stack:
 *                 type: string
 *               service:
 *                 type: string
 *               endpoint:
 *                 type: string
 *               method:
 *                 type: string
 *               statusCode:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Error explanation
 */
router.post('/explain-error', authenticate, explainErrorHandler);

/**
 * @swagger
 * /api/ai/recommendations:
 *   get:
 *     summary: Get AI-generated performance and security recommendations
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recommendations based on last 24 hours of data
 */
router.get('/recommendations', authenticate, recommendationsHandler);

/**
 * @swagger
 * /api/ai/anomalies/detect:
 *   post:
 *     summary: Manually trigger anomaly detection
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Anomalies detected and saved as incidents
 */
router.post('/anomalies/detect', authenticate, detectAnomaliesHandler);

/**
 * @swagger
 * /api/ai/anomalies:
 *   get:
 *     summary: Get list of auto-detected anomalies
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of anomalies
 */
router.get('/anomalies', authenticate, getAnomaliesHandler);

module.exports = router;