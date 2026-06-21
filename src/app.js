const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const logRoutes = require('./routes/log.routes');
const metricsRoutes = require('./routes/metrics.routes');
const monitorRoutes = require('./routes/monitor.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/monitor', monitorRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;