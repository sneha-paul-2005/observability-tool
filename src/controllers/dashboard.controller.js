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

const getRangeStartDate = (range) => {
  const now = new Date();
  switch (range) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '24h':
    default:
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
};

const getDashboardHealth = async (req, res) => {
  try {
    const range = req.query.range || '24h';
    const since = getRangeStartDate(range);

    const services = await Service.find();

    const healthData = await Promise.all(services.map(async (svc) => {
      const totalRequests = await prisma.apiMetric.count({
        where: { service: svc.name, timestamp: { gte: since } }
      });
      const errorRequests = await prisma.apiMetric.count({
        where: { service: svc.name, timestamp: { gte: since }, statusCode: { gte: 400 } }
      });
      const uptime = totalRequests > 0
        ? (((totalRequests - errorRequests) / totalRequests) * 100).toFixed(2)
        : null;

      return {
        name: svc.name,
        currentStatus: svc.status,
        lastChecked: svc.lastChecked,
        lastResponseTime: svc.lastResponseTime,
        lastStatusCode: svc.lastStatusCode,
        uptime: uptime !== null ? `${uptime}%` : 'N/A (no requests in range)',
        totalRequests,
        errorRequests
      };
    }));

    res.json({
      range,
      summary: {
        totalServices: services.length,
        up: services.filter(s => s.status === 'up').length,
        down: services.filter(s => s.status === 'down').length
      },
      services: healthData,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getDashboardOverview, getDashboardHealth };