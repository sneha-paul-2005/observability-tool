const Log = require('../models/log.model');
const { parseLog, processBulkLogs } = require('../services/logProcessor.service');
const { publishLog } = require('../services/kafkaProducer.service');

// Ingest a single log
const createLog = async (req, res) => {
  try {
    const processedLog = parseLog(req.body);

    // Save to MongoDB (synchronous — immediately queryable)
    const log = await Log.create({
      level:        processedLog.level,
      message:      processedLog.message,
      service:      processedLog.service,
      endpoint:     processedLog.endpoint,
      method:       processedLog.method,
      statusCode:   processedLog.statusCode,
      responseTime: processedLog.responseTime,
      metadata:     processedLog.metadata,
    });

    // Publish to Kafka for async Elasticsearch indexing (decoupled from request/response)
    const published = await publishLog({ ...processedLog, logId: log._id.toString() });
    if (!published) {
      console.warn('⚠️  Kafka publish failed — log saved to MongoDB but not queued for ES indexing');
    }

    res.status(201).json({ message: 'Log created successfully', log });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Ingest multiple logs at once
const createBulkLogs = async (req, res) => {
  try {
    const { logs } = req.body;
    if (!logs || !Array.isArray(logs)) {
      return res.status(400).json({ error: 'logs must be an array' });
    }

    const { processed, failed, total } = processBulkLogs(logs);

    // Save to MongoDB
    const createdLogs = await Log.insertMany(processed);

    // Publish each log to Kafka for async ES indexing
    await Promise.all(
      createdLogs.map((log, i) =>
        publishLog({ ...processed[i], logId: log._id.toString() })
      )
    );

    res.status(201).json({
      message: `${createdLogs.length} logs created`,
      count:   createdLogs.length,
      failed:  failed.length,
      total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get logs with filters
const getLogs = async (req, res) => {
  try {
    const { level, service, startDate, endDate, limit = 50, page = 1 } = req.query;

    const filter = {};
    if (level) filter.level = level;
    if (service) filter.service = service;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const logs = await Log.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Log.countDocuments(filter);

    res.json({
      logs,
      pagination: {
        total,
        page:  parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get error logs only
const getErrorLogs = async (req, res) => {
  try {
    const { service, limit = 50 } = req.query;
    const filter = { level: 'error' };
    if (service) filter.service = service;

    const logs = await Log.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({ logs, count: logs.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get log statistics
const getLogStats = async (req, res) => {
  try {
    const { service } = req.query;
    const filter = service ? { service } : {};

    const stats = await Log.aggregate([
      { $match: filter },
      {
        $group: {
          _id:   '$level',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await Log.countDocuments(filter);

    res.json({ stats, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createLog, createBulkLogs, getLogs, getErrorLogs, getLogStats };