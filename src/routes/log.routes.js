const express = require('express');
const router = express.Router();
const { createLog, createBulkLogs, getLogs, getErrorLogs, getLogStats } = require('../controllers/log.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/', authenticate, createLog);
router.post('/bulk', authenticate, createBulkLogs);
router.get('/', authenticate, getLogs);
router.get('/errors', authenticate, getErrorLogs);
router.get('/stats', authenticate, getLogStats);

module.exports = router;