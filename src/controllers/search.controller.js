const { searchLogs } = require('../services/elasticsearch.service');

// GET /api/search/logs
const searchLogsHandler = async (req, res) => {
  try {
    const {
      q, service, level, errorCategory,
      statusCode, from, to,
      page = 1, size = 20,
    } = req.query;

    const filters = {};
    if (service)       filters.service       = service;
    if (level)         filters.level         = level.toLowerCase();
    if (errorCategory) filters.errorCategory = errorCategory;
    if (statusCode)    filters.statusCode    = Number(statusCode);
    if (from)          filters.from          = from;
    if (to)            filters.to            = to;

    const results = await searchLogs(
      q || '',
      filters,
      Number(page),
      Number(size)
    );

    res.json({ success: true, ...results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { searchLogsHandler };