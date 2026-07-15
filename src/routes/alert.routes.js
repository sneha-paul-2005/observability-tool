const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const {
  triggerAlertCheckHandler,
  getAlertsHandler,
  getAlertByIdHandler,
  updateAlertHandler
} = require('../controllers/alert.controller');

/**
 * @swagger
 * tags:
 *   name: Alerts
 *   description: Threshold-based alerting for error rates, downtime, and slow APIs
 */

/**
 * @swagger
 * /api/alerts/check:
 *   post:
 *     summary: Manually trigger alert threshold checks
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alert check results
 */
router.post('/check', authenticate, triggerAlertCheckHandler);

/**
 * @swagger
 * /api/alerts:
 *   get:
 *     summary: Get list of alerts
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, RESOLVED]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [HIGH_ERROR_RATE, SERVICE_DOWNTIME, SLOW_API, INFRASTRUCTURE_FAILURE]
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
 *         description: List of alerts
 */
router.get('/', authenticate, getAlertsHandler);

/**
 * @swagger
 * /api/alerts/{id}:
 *   get:
 *     summary: Get a single alert by ID
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alert details
 *       404:
 *         description: Alert not found
 */
router.get('/:id', authenticate, getAlertByIdHandler);

/**
 * @swagger
 * /api/alerts/{id}:
 *   patch:
 *     summary: Update an alert's status (e.g. mark as resolved)
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, RESOLVED]
 *     responses:
 *       200:
 *         description: Updated alert
 */
router.patch('/:id', authenticate, updateAlertHandler);

module.exports = router;