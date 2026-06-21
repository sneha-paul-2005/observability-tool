const express = require('express');
const router = express.Router();
const { getDashboardOverview } = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/overview', authenticate, getDashboardOverview);

module.exports = router;