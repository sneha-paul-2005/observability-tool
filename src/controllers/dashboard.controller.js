const prisma = require('../config/prisma');
const Log = require('../models/log.model');
const Service = require('../models/service.model');

const getDashboardOverview = async (req, res) => {
  try {
    // Logs summary (MongoDB)
    const totalLogs = await Log.countDocuments();
    const totalErrorLogs = await Log.countDocuments({ level: 'error' });
    const recentLogs = await Log.find().sort({ timestamp: -1 }).limit(5);

    // Metrics summary (PostgreSQL)
    const totalRequests = await prisma.apiMetric.count();
    const errorRequests = await prisma.apiMetric.count({
      where: { statusCode: { gte: 400 } }
    });
    const errorRate = totalRequests > 0
      ? ((errorRequests / totalRequests) * 100).toFixed(2)
      : 0;

    const avgResponseTimeResult = await prisma.apiMetric.aggregate({
      _avg: { responseTime: true }
    });
    const avgResponseTime = avgResponseTimeResult._avg.responseTime
      ? Math.round(avgResponseTimeResult._avg.responseTime)
      : 0;

    // Services summary (MongoDB)
    const services = await Service.find();
    const servicesUp = services.filter(s => s.status === 'up').length;
    const servicesDown = services.filter(s => s.status === 'down').length;

    res.json({
      logs: {
        total: totalLogs,
        errors: totalErrorLogs,
        recent: recentLogs
      },
      metrics: {
        totalRequests,
        errorRequests,
        errorRate: `${errorRate}%`,
        avgResponseTime: `${avgResponseTime}ms`
      },
      services: {
        total: services.length,
        up: servicesUp,
        down: servicesDown,
        list: services
      },
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getDashboardOverview };