const express = require('express');
const router = express.Router();
const { getDashboardOverview } = require('../controllers/dashboard.controller');
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

module.exports = router;