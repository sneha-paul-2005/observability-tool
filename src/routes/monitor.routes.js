const express = require('express');
const router = express.Router();
const {
  registerService,
  getServices,
  checkServiceHealth,
  checkAllServices,
  deleteService
} = require('../controllers/monitor.controller');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/monitor/services:
 *   post:
 *     summary: Register a new service to monitor
 *     tags: [Monitor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               url:
 *                 type: string
 *     responses:
 *       201:
 *         description: Service registered
 *   get:
 *     summary: Get all monitored services
 *     tags: [Monitor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of services
 */
router.post('/services', authenticate, registerService);
router.get('/services', authenticate, getServices);

/**
 * @swagger
 * /api/monitor/services/{id}/check:
 *   get:
 *     summary: Check health of a single service
 *     tags: [Monitor]
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
 *         description: Service health status
 */
router.get('/services/:id/check', authenticate, checkServiceHealth);

/**
 * @swagger
 * /api/monitor/services/check-all:
 *   get:
 *     summary: Check health of all registered services
 *     tags: [Monitor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Health status of all services
 */
router.get('/services/check-all', authenticate, checkAllServices);

/**
 * @swagger
 * /api/monitor/services/{id}:
 *   delete:
 *     summary: Remove a service from monitoring
 *     tags: [Monitor]
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
 *         description: Service removed
 */
router.delete('/services/:id', authenticate, deleteService);

module.exports = router;