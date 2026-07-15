const prisma = require('../config/prisma');
const Service = require('../models/service.model');

// Thresholds — tune these as needed
const THRESHOLDS = {
  ERROR_RATE_PERCENT: 25,      // alert if error rate > 25%
  SLOW_RESPONSE_MS: 2000,      // alert if avg response time > 2000ms
  DOWNTIME_MINUTES: 5          // alert if lastChecked is older than 5 minutes AND status is 'down'
};

const CHECK_WINDOW_MINUTES = 15;

async function createAlertIfNotExists({ type, severity, message, service, metricValue, threshold }) {
  // Avoid duplicate spam: skip if an ACTIVE alert of this type+service already exists
  const existing = await prisma.alert.findFirst({
    where: { type, service: service || null, status: 'ACTIVE' }
  });
  if (existing) return null;

  return prisma.alert.create({
    data: { type, severity, message, service, metricValue, threshold, status: 'ACTIVE' }
  });
}

async function checkHighErrorRate() {
  const since = new Date(Date.now() - CHECK_WINDOW_MINUTES * 60 * 1000);
  const alertsCreated = [];

  // Group by service to catch per-service error spikes
  const services = await prisma.apiMetric.groupBy({
    by: ['service'],
    where: { timestamp: { gte: since }, service: { not: null } }
  });

  for (const { service } of services) {
    const total = await prisma.apiMetric.count({
      where: { service, timestamp: { gte: since } }
    });
    const errors = await prisma.apiMetric.count({
      where: { service, timestamp: { gte: since }, statusCode: { gte: 400 } }
    });

    if (total === 0) continue;
    const errorRate = (errors / total) * 100;

    if (errorRate > THRESHOLDS.ERROR_RATE_PERCENT) {
      const alert = await createAlertIfNotExists({
        type: 'HIGH_ERROR_RATE',
        severity: errorRate > 50 ? 'CRITICAL' : 'HIGH',
        message: `Service "${service}" has a ${errorRate.toFixed(1)}% error rate over the last ${CHECK_WINDOW_MINUTES} minutes (${errors}/${total} requests failed).`,
        service,
        metricValue: errorRate,
        threshold: THRESHOLDS.ERROR_RATE_PERCENT
      });
      if (alert) alertsCreated.push(alert);
    }
  }

  return alertsCreated;
}

async function checkSlowApis() {
  const since = new Date(Date.now() - CHECK_WINDOW_MINUTES * 60 * 1000);
  const alertsCreated = [];

  const services = await prisma.apiMetric.groupBy({
    by: ['service'],
    where: { timestamp: { gte: since }, service: { not: null } }
  });

  for (const { service } of services) {
    const avgResult = await prisma.apiMetric.aggregate({
      where: { service, timestamp: { gte: since } },
      _avg: { responseTime: true }
    });
    const avgResponseTime = avgResult._avg.responseTime;

    if (avgResponseTime && avgResponseTime > THRESHOLDS.SLOW_RESPONSE_MS) {
      const alert = await createAlertIfNotExists({
        type: 'SLOW_API',
        severity: avgResponseTime > THRESHOLDS.SLOW_RESPONSE_MS * 2 ? 'CRITICAL' : 'HIGH',
        message: `Service "${service}" has an average response time of ${Math.round(avgResponseTime)}ms over the last ${CHECK_WINDOW_MINUTES} minutes, exceeding the ${THRESHOLDS.SLOW_RESPONSE_MS}ms threshold.`,
        service,
        metricValue: avgResponseTime,
        threshold: THRESHOLDS.SLOW_RESPONSE_MS
      });
      if (alert) alertsCreated.push(alert);
    }
  }

  return alertsCreated;
}

async function checkServiceDowntime() {
  const alertsCreated = [];
  const services = await Service.find();
  const cutoff = new Date(Date.now() - THRESHOLDS.DOWNTIME_MINUTES * 60 * 1000);

  for (const svc of services) {
    const isStale = !svc.lastChecked || svc.lastChecked < cutoff;
    const isDown = svc.status === 'down';

    if (isDown || isStale) {
      const alert = await createAlertIfNotExists({
        type: 'SERVICE_DOWNTIME',
        severity: 'CRITICAL',
        message: isDown
          ? `Service "${svc.name}" is reporting status DOWN (last checked: ${svc.lastChecked}).`
          : `Service "${svc.name}" has not been checked in over ${THRESHOLDS.DOWNTIME_MINUTES} minutes — health check may be failing (last checked: ${svc.lastChecked}).`,
        service: svc.name,
        metricValue: null,
        threshold: THRESHOLDS.DOWNTIME_MINUTES
      });
      if (alert) alertsCreated.push(alert);
    }
  }

  return alertsCreated;
}

async function autoResolveAlerts() {
  // Auto-resolve HIGH_ERROR_RATE and SLOW_API alerts if the condition is no longer true
  const activeAlerts = await prisma.alert.findMany({
    where: { status: 'ACTIVE', type: { in: ['HIGH_ERROR_RATE', 'SLOW_API'] } }
  });

  const since = new Date(Date.now() - CHECK_WINDOW_MINUTES * 60 * 1000);

  for (const alert of activeAlerts) {
    if (!alert.service) continue;

    if (alert.type === 'HIGH_ERROR_RATE') {
      const total = await prisma.apiMetric.count({ where: { service: alert.service, timestamp: { gte: since } } });
      const errors = await prisma.apiMetric.count({ where: { service: alert.service, timestamp: { gte: since }, statusCode: { gte: 400 } } });
      const errorRate = total > 0 ? (errors / total) * 100 : 0;
      if (errorRate <= THRESHOLDS.ERROR_RATE_PERCENT) {
        await prisma.alert.update({ where: { id: alert.id }, data: { status: 'RESOLVED', resolvedAt: new Date() } });
      }
    }

    if (alert.type === 'SLOW_API') {
      const avgResult = await prisma.apiMetric.aggregate({ where: { service: alert.service, timestamp: { gte: since } }, _avg: { responseTime: true } });
      const avg = avgResult._avg.responseTime || 0;
      if (avg <= THRESHOLDS.SLOW_RESPONSE_MS) {
        await prisma.alert.update({ where: { id: alert.id }, data: { status: 'RESOLVED', resolvedAt: new Date() } });
      }
    }
  }
}

async function runAlertChecks() {
  await autoResolveAlerts();

  const [errorAlerts, slowAlerts, downtimeAlerts] = await Promise.all([
    checkHighErrorRate(),
    checkSlowApis(),
    checkServiceDowntime()
  ]);

  const allAlerts = [...errorAlerts, ...slowAlerts, ...downtimeAlerts];
  return allAlerts;
}

module.exports = { runAlertChecks };