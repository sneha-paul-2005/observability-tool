const { analyzeLogs, generateIncidentSummary, generateRecommendations, explainError } = require('../services/aiAnalysis.service');
const { runAnomalyDetection } = require('../services/anomaly.service');
const { getRecentLogsForService } = require('../services/elasticsearch.service');
const prisma = require('../config/prisma');
const { answerAssistantQuery } = require('../services/aiAnalysis.service');
const Log = require('../models/log.model');
const { getOrSetCache } = require('../services/cache.service');

// POST /api/ai/analyze
async function analyzeLogsHandler(req, res) {
  try {
    const { service } = req.body;
    if (!service) {
      return res.status(400).json({ success: false, error: 'service is required' });
    }

    const logs = await getRecentLogsForService(service, 50);
    if (!logs.length) {
      return res.status(404).json({ success: false, error: `No logs found for service "${service}"` });
    }

    const analysis = await analyzeLogs(logs, { service });

    res.json({
      success:      true,
      service,
      logsAnalyzed: logs.length,
      analysis,
      generatedAt:  new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// POST /api/ai/explain-error
async function explainErrorHandler(req, res) {
  try {
    const { message, stack, service, endpoint, method, statusCode } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: 'message is required' });
    }

    const explanation = await explainError(
      { message, stack },
      { service, endpoint, method, statusCode }
    );

    res.json({
      success:     true,
      explanation,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/ai/recommendations
// GET /api/ai/recommendations
async function recommendationsHandler(req, res) {
  try {
    const { data, fromCache } = await getOrSetCache('ai:recommendations', 300, async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const [totalRequests, errorRequests, avgResponseTime, openIncidents] = await Promise.all([
        prisma.apiMetric.count({ where: { timestamp: { gte: since } } }),
        prisma.apiMetric.count({ where: { timestamp: { gte: since }, statusCode: { gte: 400 } } }),
        prisma.apiMetric.aggregate({ where: { timestamp: { gte: since } }, _avg: { responseTime: true } }),
        prisma.incident.count({ where: { status: 'OPEN' } }),
      ]);

      const stats = {
        timeRange:       '24 hours',
        totalRequests,
        errorRequests,
        errorRate:       totalRequests > 0 ? ((errorRequests / totalRequests) * 100).toFixed(2) + '%' : '0%',
        avgResponseTime: Math.round(avgResponseTime._avg.responseTime || 0) + 'ms',
        openIncidents,
      };

      const recommendations = await generateRecommendations(stats);

      return {
        stats,
        recommendations,
        generatedAt: new Date().toISOString(),
      };
    });

    res.json({ success: true, ...data, cached: fromCache });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// POST /api/ai/anomalies/detect
async function detectAnomaliesHandler(req, res) {
  try {
    const anomalies = await runAnomalyDetection();
    res.json({
      success:        true,
      anomaliesFound: anomalies.length,
      anomalies,
      detectedAt:     new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/ai/anomalies
async function getAnomaliesHandler(req, res) {
  try {
    const { page = 1, size = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(size);

    const where = { title: { startsWith: '[Auto]' }, status: 'OPEN' };

    const [anomalies, total] = await Promise.all([
      prisma.incident.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: Number(size) }),
      prisma.incident.count({ where }),
    ]);

    res.json({ success: true, total, page: Number(page), results: anomalies });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// POST /api/ai/assistant/query
// POST /api/ai/assistant/query
async function assistantQueryHandler(req, res) {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ success: false, error: 'question is required' });
    }

    // Normalize the question for the cache key (lowercase, trimmed) so minor
    // formatting differences (extra spaces, capitalization) still hit the cache
    const cacheKey = `ai:assistant:${question.trim().toLowerCase()}`;

    const { data, fromCache } = await getOrSetCache(cacheKey, 120, async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const [errorLogs, incidents, totalRequests, errorRequests, avgResponseTimeResult] = await Promise.all([
        Log.find({ level: 'error', timestamp: { $gte: since } }).sort({ timestamp: -1 }).limit(20),
        prisma.incident.findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: 'desc' }, take: 10 }),
        prisma.apiMetric.count({ where: { timestamp: { gte: since } } }),
        prisma.apiMetric.count({ where: { timestamp: { gte: since }, statusCode: { gte: 400 } } }),
        prisma.apiMetric.aggregate({ where: { timestamp: { gte: since } }, _avg: { responseTime: true } }),
      ]);

      const performanceSummary = {
        totalRequests,
        errorRequests,
        errorRate: totalRequests > 0 ? ((errorRequests / totalRequests) * 100).toFixed(2) + '%' : '0%',
        avgResponseTime: Math.round(avgResponseTimeResult._avg.responseTime || 0) + 'ms',
      };

      const answer = await answerAssistantQuery(question, {
        errorLogs,
        incidents,
        performanceSummary,
      });

      return {
        question,
        answer,
        contextUsed: {
          errorLogsCount: errorLogs.length,
          incidentsCount: incidents.length,
          performanceSummary,
        },
        generatedAt: new Date().toISOString(),
      };
    });

    res.json({ success: true, ...data, cached: fromCache });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
module.exports = {
  analyzeLogsHandler,
  explainErrorHandler,
  recommendationsHandler,
  detectAnomaliesHandler,
  getAnomaliesHandler,
  assistantQueryHandler,
};