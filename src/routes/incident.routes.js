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

// GET /api/incidents
router.get('/',              authenticate, listIncidents);

// GET /api/incidents/:id
router.get('/:id',           authenticate, getIncident);

// PATCH /api/incidents/:id
router.patch('/:id',         authenticate, updateIncident);

// GET /api/incidents/:id/summary
router.get('/:id/summary',   authenticate, getIncidentSummary);

// DELETE /api/incidents/:id
router.delete('/:id',        authenticate, deleteIncident);

module.exports = router;