const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { searchLogsHandler } = require('../controllers/search.controller');

// GET /api/search/logs
router.get('/logs', authenticate, searchLogsHandler);

module.exports = router;