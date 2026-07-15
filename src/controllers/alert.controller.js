const prisma = require('../config/prisma');
const { runAlertChecks } = require('../services/alerting.service');

// POST /api/alerts/check
async function triggerAlertCheckHandler(req, res) {
  try {
    const alerts = await runAlertChecks();
    res.json({
      success: true,
      alertsTriggered: alerts.length,
      alerts,
      checkedAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/alerts
async function getAlertsHandler(req, res) {
  try {
    const { status, type, page = 1, size = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(size);

    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(size)
      }),
      prisma.alert.count({ where })
    ]);

    res.json({
      success: true,
      total,
      page: Number(page),
      results: alerts
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/alerts/:id
async function getAlertByIdHandler(req, res) {
  try {
    const alert = await prisma.alert.findUnique({ where: { id: req.params.id } });
    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }
    res.json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// PATCH /api/alerts/:id
async function updateAlertHandler(req, res) {
  try {
    const { status } = req.body;
    if (!status || !['ACTIVE', 'RESOLVED'].includes(status)) {
      return res.status(400).json({ success: false, error: 'status must be ACTIVE or RESOLVED' });
    }

    const data = { status };
    if (status === 'RESOLVED') data.resolvedAt = new Date();

    const alert = await prisma.alert.update({
      where: { id: req.params.id },
      data
    });

    res.json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  triggerAlertCheckHandler,
  getAlertsHandler,
  getAlertByIdHandler,
  updateAlertHandler
};