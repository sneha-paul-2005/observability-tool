const { httpRequestsTotal, httpRequestDuration, activeRequests } = require('../services/prometheus.service');

const metricsMiddleware = (req, res, next) => {
  const start = process.hrtime();
  activeRequests.inc();

  res.on('finish', () => {
    // Compute route AFTER routing has happened, so req.route is populated
    const route = req.route ? req.baseUrl + req.route.path : req.path;

    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode
    });

    httpRequestDuration.observe({
      method: req.method,
      route,
      status_code: res.statusCode
    }, durationInSeconds);

    activeRequests.dec();
  });

  next();
};

module.exports = metricsMiddleware;