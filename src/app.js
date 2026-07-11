const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const logRoutes = require('./routes/log.routes');
const metricsRoutes = require('./routes/metrics.routes');
const monitorRoutes = require('./routes/monitor.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const searchRoutes = require('./routes/search.routes');
const aiRoutes = require('./routes/ai.routes');
const incidentRoutes = require('./routes/incident.routes');
const metricsMiddleware = require('./middleware/metrics.middleware');
const { register } = require('./services/prometheus.service');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(metricsMiddleware);

// Swagger Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Prometheus metrics endpoint (scraped by Prometheus, not JSON)
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Routes
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/monitor', monitorRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/incidents', incidentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;