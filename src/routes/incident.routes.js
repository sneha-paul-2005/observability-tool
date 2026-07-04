const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const {
  listIncidents,
  getIncident,
  updateIncident,
  getIncidentSummary,
  deleteIncident,
} = require('../controllers/incident.controller');

/**
 * @swagger
 * tags:
 *   name: Incidents
 *   description: Incident management and AI-generated summaries
 */

/**
 * @swagger
 * /api/incidents:
 *   get:
 *     summary: List all incidents
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, INVESTIGATING, RESOLVED, CLOSED]
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *       - in: query
 *         name: service
 *         schema:
 *           type: string
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
 *         description: List of incidents
 */
router.get('/', authenticate, listIncidents);

/**
 * @swagger
 * /api/incidents/{id}:
 *   get:
 *     summary: Get a single incident
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Incident details
 *       404:
 *         description: Incident not found
 */
router.get('/:id', authenticate, getIncident);

/**
 * @swagger
 * /api/incidents/{id}:
 *   patch:
 *     summary: Update incident status or description
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [OPEN, INVESTIGATING, RESOLVED, CLOSED]
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated incident
 *       404:
 *         description: Incident not found
 */
router.patch('/:id', authenticate, updateIncident);

/**
 * @swagger
 * /api/incidents/{id}/summary:
 *   get:
 *     summary: Generate AI-powered incident summary
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: AI-generated incident summary
 *       404:
 *         description: Incident not found
 */
router.get('/:id/summary', authenticate, getIncidentSummary);

/**
 * @swagger
 * /api/incidents/{id}:
 *   delete:
 *     summary: Delete an incident
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Incident deleted
 *       404:
 *         description: Incident not found
 */
router.delete('/:id', authenticate, deleteIncident);

module.exports = router;