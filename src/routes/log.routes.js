const express = require('express');
const router = express.Router();
const { createLog, createBulkLogs, getLogs, getErrorLogs, getLogStats } = require('../controllers/log.controller');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/logs:
 *   post:
 *     summary: Create a new log entry
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               level:
 *                 type: string
 *                 enum: [info, warn, error, debug]
 *               message:
 *                 type: string
 *               service:
 *                 type: string
 *               endpoint:
 *                 type: string
 *               method:
 *                 type: string
 *               statusCode:
 *                 type: integer
 *               responseTime:
 *                 type: number
 *     responses:
 *       201:
 *         description: Log created successfully
 *   get:
 *     summary: Get logs with optional filters
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *       - in: query
 *         name: service
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of logs with pagination
 */
router.post('/', authenticate, createLog);
router.get('/', authenticate, getLogs);

/**
 * @swagger
 * /api/logs/bulk:
 *   post:
 *     summary: Create multiple log entries at once
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Bulk logs created
 */
router.post('/bulk', authenticate, createBulkLogs);

/**
 * @swagger
 * /api/logs/errors:
 *   get:
 *     summary: Get error level logs only
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of error logs
 */
router.get('/errors', authenticate, getErrorLogs);

/**
 * @swagger
 * /api/logs/stats:
 *   get:
 *     summary: Get log statistics grouped by level
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Log statistics
 */
router.get('/stats', authenticate, getLogStats);

module.exports = router;