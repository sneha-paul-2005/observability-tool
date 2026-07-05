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

const getBucketFormat = (range) => {
  // Hourly buckets for 24h, daily buckets for longer ranges
  return range === '24h' ? '%Y-%m-%dT%H:00:00' : '%Y-%m-%d';
};

const getDashboardErrorTrends = async (req, res) => {
  try {
    const range = req.query.range || '24h';
    const since = getRangeStartDate(range);
    const bucketFormat = getBucketFormat(range);

    // Time-bucketed error counts (chart-ready timeline)
    const timeline = await Log.aggregate([
      { $match: { level: 'error', timestamp: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: bucketFormat, date: '$timestamp' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, timestamp: '$_id', count: 1 } }
    ]);

    // Error counts broken down by service
    const byService = await Log.aggregate([
      { $match: { level: 'error', timestamp: { $gte: since } } },
      {
        $group: {
          _id: '$service',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $project: { _id: 0, service: '$_id', count: 1 } }
    ]);

    const totalErrors = byService.reduce((sum, s) => sum + s.count, 0);

    res.json({
      range,
      totalErrors,
      timeline,
      byService,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getDashboardPerformance = async (req, res) => {
  try {
    const range = req.query.range || '24h';
    const since = getRangeStartDate(range);

    // Overall response time stats (avg, p95, p99) via raw SQL — Prisma ORM can't do percentiles directly
    const statsResult = await prisma.$queryRaw`
      SELECT
        AVG("responseTime") as avg,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "responseTime") as p95,
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY "responseTime") as p99,
        COUNT(*) as total
      FROM api_metrics
      WHERE timestamp >= ${since}
    `;
    const stats = statsResult[0];

    const totalRequests = Number(stats.total);
    const rangeMinutes = (Date.now() - since.getTime()) / (1000 * 60);
    const throughput = rangeMinutes > 0
      ? (totalRequests / rangeMinutes).toFixed(2)
      : 0;

    // Per-endpoint breakdown
    const byEndpointRaw = await prisma.apiMetric.groupBy({
      by: ['endpoint', 'method'],
      where: { timestamp: { gte: since } },
      _count: { _all: true },
      _avg: { responseTime: true },
      orderBy: { _count: { endpoint: 'desc' } }
    });

    const byEndpoint = byEndpointRaw.map(e => ({
      endpoint: e.endpoint,
      method: e.method,
      requests: e._count._all,
      avgResponseTime: e._avg.responseTime ? Math.round(e._avg.responseTime) : 0
    }));

    res.json({
      range,
      totalRequests,
      avgResponseTime: stats.avg ? Math.round(Number(stats.avg)) : 0,
      p95ResponseTime: stats.p95 ? Math.round(Number(stats.p95)) : 0,
      p99ResponseTime: stats.p99 ? Math.round(Number(stats.p99)) : 0,
      throughput: `${throughput} req/min`,
      byEndpoint,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getDashboardIncidentStats = async (req, res) => {
  try {
    const range = req.query.range || '24h';
    const since = getRangeStartDate(range);

    const incidents = await prisma.incident.findMany({
      where: { createdAt: { gte: since } }
    });

    // Counts by status
    const byStatus = { OPEN: 0, INVESTIGATING: 0, RESOLVED: 0 };
    incidents.forEach(i => { byStatus[i.status] = (byStatus[i.status] || 0) + 1; });

    // Counts by severity
    const bySeverity = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    incidents.forEach(i => { bySeverity[i.severity] = (bySeverity[i.severity] || 0) + 1; });

    // Resolution time (only for resolved incidents)
    const resolved = incidents.filter(i => i.resolvedAt);
    const resolutionTimesMs = resolved.map(i => new Date(i.resolvedAt) - new Date(i.createdAt));
    const avgResolutionMs = resolutionTimesMs.length > 0
      ? resolutionTimesMs.reduce((a, b) => a + b, 0) / resolutionTimesMs.length
      : null;
    const avgResolutionHours = avgResolutionMs !== null
      ? (avgResolutionMs / (1000 * 60 * 60)).toFixed(2)
      : null;

    // Daily resolution trend (avg hours to resolve, bucketed by resolution date)
    const trendMap = {};
    resolved.forEach(i => {
      const day = new Date(i.resolvedAt).toISOString().split('T')[0];
      const hours = (new Date(i.resolvedAt) - new Date(i.createdAt)) / (1000 * 60 * 60);
      if (!trendMap[day]) trendMap[day] = [];
      trendMap[day].push(hours);
    });
    const resolutionTrend = Object.keys(trendMap).sort().map(day => ({
      date: day,
      avgResolutionHours: (trendMap[day].reduce((a, b) => a + b, 0) / trendMap[day].length).toFixed(2),
      count: trendMap[day].length
    }));

    res.json({
      range,
      totalIncidents: incidents.length,
      byStatus,
      bySeverity,
      avgResolutionTime: avgResolutionHours !== null ? `${avgResolutionHours}h` : 'N/A (no resolved incidents)',
      resolutionTrend,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
module.exports = { getDashboardOverview, getDashboardHealth, getDashboardErrorTrends, getDashboardPerformance, getDashboardIncidentStats };