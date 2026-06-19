const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const prisma = require('../config/prisma');

// Overall health check
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Observability Tool API'
  });
});

// MongoDB health check
router.get('/mongodb', async (req, res) => {
  try {
    const state = mongoose.connection.readyState;
    if (state === 1) {
      res.json({ status: 'ok', database: 'MongoDB', message: 'Connected' });
    } else {
      res.status(503).json({ status: 'error', database: 'MongoDB', message: 'Disconnected' });
    }
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'MongoDB', message: error.message });
  }
});

// PostgreSQL health check
router.get('/postgres', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'PostgreSQL', message: 'Connected' });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'PostgreSQL', message: error.message });
  }
});

// All systems health check
router.get('/all', async (req, res) => {
  const health = {
    timestamp: new Date().toISOString(),
    services: {}
  };

  // Check MongoDB
  health.services.mongodb = mongoose.connection.readyState === 1
    ? { status: 'ok', message: 'Connected' }
    : { status: 'error', message: 'Disconnected' };

  // Check PostgreSQL
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.services.postgres = { status: 'ok', message: 'Connected' };
  } catch (error) {
    health.services.postgres = { status: 'error', message: error.message };
  }

  const allHealthy = Object.values(health.services).every(s => s.status === 'ok');
  health.status = allHealthy ? 'ok' : 'degraded';

  res.status(allHealthy ? 200 : 503).json(health);
});

module.exports = router;