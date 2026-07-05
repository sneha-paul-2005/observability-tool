const express = require('express');
const router = express.Router();
const { getDashboardOverview, getDashboardHealth } = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/dashboard/overview:
 *   get:
 *     summary: Get combined dashboard overview (logs, metrics, services)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary data
 */
router.get('/overview', authenticate, getDashboardOverview);

/**
 * @swagger
 * /api/dashboard/health:
 *   get:
 *     summary: Get service health and uptime data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *           enum: [24h, 7d, 30d]
 *           default: 24h
 *         description: Time range for uptime calculation
 *     responses:
 *       200:
 *         description: Service health data with uptime percentages
 */
router.get('/health', authenticate, getDashboardHealth);

module.exports = router;