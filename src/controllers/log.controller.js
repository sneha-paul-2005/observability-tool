const Log = require('../models/log.model');

// Ingest a single log
const createLog = async (req, res) => {
  try {
    const { level, message, service, endpoint, method, statusCode, responseTime, userId, metadata } = req.body;

    const log = await Log.create({
      level,
      message,
      service,
      endpoint,
      method,
      statusCode,
      responseTime,
      userId,
      metadata
    });

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

    const createdLogs = await Log.insertMany(logs);
    res.status(201).json({ message: `${createdLogs.length} logs created`, count: createdLogs.length });
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
        page: parseInt(page),
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
          _id: '$level',
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