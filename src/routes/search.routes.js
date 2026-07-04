const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { searchLogsHandler } = require('../controllers/search.controller');

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Elasticsearch-powered log search
 */

/**
 * @swagger
 * /api/search/logs:
 *   get:
 *     summary: Search logs with filters
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Full-text search query
 *       - in: query
 *         name: service
 *         schema:
 *           type: string
 *         description: Filter by service name
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [debug, info, warn, error, critical]
 *         description: Filter by log level
 *       - in: query
 *         name: errorCategory
 *         schema:
 *           type: string
 *           enum: [database, network, auth, timeout, validation, rate_limit, server, not_found, unknown]
 *       - in: query
 *         name: statusCode
 *         schema:
 *           type: integer
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date filter
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date filter
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
 *         description: Search results
 *       401:
 *         description: Unauthorized
 */
router.get('/logs', authenticate, searchLogsHandler);

module.exports = router;