const prisma = require('../config/prisma');

// Record a new metric (called whenever an API request happens)
const createMetric = async (req, res) => {
  try {
    const { endpoint, method, statusCode, responseTime, service, userId } = req.body;

    const metric = await prisma.apiMetric.create({
      data: {
        endpoint,
        method,
        statusCode,
        responseTime,
        service,
        userId
      }
    });

    res.status(201).json({ message: 'Metric recorded', metric });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all metrics with filters
const getMetrics = async (req, res) => {
  try {
    const { endpoint, service, limit = 50 } = req.query;

    const where = {};
    if (endpoint) where.endpoint = endpoint;
    if (service) where.service = service;

    const metrics = await prisma.apiMetric.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit)
    });

    res.json({ metrics, count: metrics.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get average response time per endpoint
const getResponseTimeStats = async (req, res) => {
  try {
    const stats = await prisma.apiMetric.groupBy({
      by: ['endpoint'],
      _avg: { responseTime: true },
      _count: { id: true }
    });

    const formatted = stats.map(s => ({
      endpoint: s.endpoint,
      avgResponseTime: Math.round(s._avg.responseTime),
      requestCount: s._count.id
    }));

    res.json({ stats: formatted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get error rate (percentage of requests with status >= 400)
const getErrorRate = async (req, res) => {
  try {
    const totalRequests = await prisma.apiMetric.count();
    const errorRequests = await prisma.apiMetric.count({
      where: { statusCode: { gte: 400 } }
    });

    const errorRate = totalRequests > 0
      ? ((errorRequests / totalRequests) * 100).toFixed(2)
      : 0;

    res.json({
      totalRequests,
      errorRequests,
      errorRate: `${errorRate}%`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get throughput (requests per minute, last hour)
const getThroughput = async (req, res) => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const requests = await prisma.apiMetric.findMany({
      where: { timestamp: { gte: oneHourAgo } },
      select: { timestamp: true }
    });

    const requestsPerMinute = (requests.length / 60).toFixed(2);

    res.json({
      totalRequestsLastHour: requests.length,
      requestsPerMinute
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createMetric, getMetrics, getResponseTimeStats, getErrorRate, getThroughput };