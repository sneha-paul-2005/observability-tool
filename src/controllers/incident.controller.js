const prisma = require('../config/prisma');
const { generateIncidentSummary } = require('../services/aiAnalysis.service');
const { getRecentLogsForService } = require('../services/elasticsearch.service');

// GET /api/incidents
async function listIncidents(req, res) {
  try {
    const { status, severity, service, page = 1, size = 20 } = req.query;

    const where = {};
    if (status)   where.status   = status.toUpperCase();
    if (severity) where.severity = severity.toUpperCase();
    if (service)  where.service  = service;

    const skip = (Number(page) - 1) * Number(size);
    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: Number(size) }),
      prisma.incident.count({ where }),
    ]);

    res.json({
      success: true,
      total,
      page:    Number(page),
      size:    Number(size),
      pages:   Math.ceil(total / Number(size)),
      results: incidents,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/incidents/:id
async function getIncident(req, res) {
  try {
    const incident = await prisma.incident.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!incident) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    res.json({ success: true, incident });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// PATCH /api/incidents/:id
async function updateIncident(req, res) {
  try {
    const { status, description } = req.body;
    const validStatuses = ['OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'];

    if (status && !validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error:   `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const updated = await prisma.incident.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(status      ? { status: status.toUpperCase() } : {}),
        ...(description ? { description }                  : {}),
      },
    });

    res.json({ success: true, incident: updated });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/incidents/:id/summary
async function getIncidentSummary(req, res) {
  try {
    const incident = await prisma.incident.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!incident) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    const relatedLogs = incident.service
      ? await getRecentLogsForService(incident.service, 30)
      : [];

    const summary = await generateIncidentSummary(incident, relatedLogs);

    res.json({
      success:      true,
      incident:     { id: incident.id, title: incident.title, severity: incident.severity },
      summary,
      logsAnalyzed: relatedLogs.length,
      generatedAt:  new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// DELETE /api/incidents/:id
async function deleteIncident(req, res) {
  try {
    await prisma.incident.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true, message: 'Incident deleted' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  listIncidents,
  getIncident,
  updateIncident,
  getIncidentSummary,
  deleteIncident,
};