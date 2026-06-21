const express = require('express');
const router = express.Router();
const {
  registerService,
  getServices,
  checkServiceHealth,
  checkAllServices,
  deleteService
} = require('../controllers/monitor.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/services', authenticate, registerService);
router.get('/services', authenticate, getServices);
router.get('/services/:id/check', authenticate, checkServiceHealth);
router.get('/services/check-all', authenticate, checkAllServices);
router.delete('/services/:id', authenticate, deleteService);

module.exports = router;