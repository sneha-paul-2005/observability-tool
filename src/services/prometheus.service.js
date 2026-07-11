const client = require('prom-client');

// Create a Registry to hold all metrics
const register = new client.Registry();

// Collect default Node.js metrics (CPU, memory, event loop lag, etc.)
client.collectDefaultMetrics({ register });

// Custom metric: total HTTP requests, labeled by method, route, and status code
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// Custom metric: HTTP request duration in seconds, labeled the same way
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register]
});

// Custom metric: currently active requests (gauge, goes up/down)
const activeRequests = new client.Gauge({
  name: 'active_requests',
  help: 'Number of active HTTP requests',
  registers: [register]
});

module.exports = {
  register,
  httpRequestsTotal,
  httpRequestDuration,
  activeRequests
};