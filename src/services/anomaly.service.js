const prisma = require('../config/prisma');

const THRESHOLDS = {
  TRAFFIC_SPIKE_MULTIPLIER: 3,
  ERROR_RATE_WARNING:       10,
  ERROR_RATE_CRITICAL:      25,
  RESPONSE_TIME_SLOW:       2000,
  RESPONSE_TIME_CRITICAL:   5000,
  MIN_SAMPLES:              5,
  AUTH_FAILURE_THRESHOLD:   50,
};

const SEVERITY = {
  LOW:      'low',
  MEDIUM:   'medium',
  HIGH:     'high',
  CRITICAL: 'critical',
};

async function detectTrafficSpike(service) {
  const now         = new Date();
  const fiveMinAgo  = new Date(now - 5  * 60 * 1000);
  const sixtyMinAgo = new Date(now - 60 * 60 * 1000);

  const currentCount = await prisma.apiMetric.count({
    where: { service, timestamp: { gte: fiveMinAgo } },
  });

  const baselineCount = await prisma.apiMetric.count({
    where: { service, timestamp: { gte: sixtyMinAgo, lt: fiveMinAgo } },
  });

  const baselinePerWindow = baselineCount / 12;
  if (baselinePerWindow < THRESHOLDS.MIN_SAMPLES) return null;

  const ratio = currentCount / baselinePerWindow;

  if (ratio >= THRESHOLDS.TRAFFIC_SPIKE_MULTIPLIER) {
    return {
      type:     'traffic_spike',
      service,
      severity: ratio >= THRESHOLDS.TRAFFIC_SPIKE_MULTIPLIER * 2
        ? SEVERITY.CRITICAL : SEVERITY.HIGH,
      details: {
        currentRequests:  currentCount,
        baselineRequests: Math.round(baselinePerWindow),
        multiplier:       parseFloat(ratio.toFixed(2)),
      },
      message: `Traffic spike on "${service}": ${currentCount} requests in last 5 min vs baseline of ${Math.round(baselinePerWindow)} (${ratio.toFixed(1)}×).`,
    };
  }

  return null;
}

async function detectErrorRateAnomaly(service, windowMinutes = 15) {
  const since = new Date(Date.now() - windowMinutes * 60 * 1000);

  const [total, errors] = await Promise.all([
    prisma.apiMetric.count({ where: { service, timestamp: { gte: since } } }),
    prisma.apiMetric.count({ where: { service, timestamp: { gte: since }, statusCode: { gte: 400 } } }),
  ]);

  if (total < THRESHOLDS.MIN_SAMPLES) return null;

  const errorRate = (errors / total) * 100;

  if (errorRate >= THRESHOLDS.ERROR_RATE_WARNING) {
    return {
      type:     'error_rate_increase',
      service,
      severity: errorRate >= THRESHOLDS.ERROR_RATE_CRITICAL
        ? SEVERITY.CRITICAL : SEVERITY.MEDIUM,
      details: {
        totalRequests: total,
        errorCount:    errors,
        errorRate:     parseFloat(errorRate.toFixed(2)),
        windowMinutes,
      },
      message: `High error rate on "${service}": ${errorRate.toFixed(1)}% of requests failed in last ${windowMinutes} min.`,
    };
  }

  return null;
}

async function detectResponseTimeDegradation(service, windowMinutes = 15) {
  const since = new Date(Date.now() - windowMinutes * 60 * 1000);

  const metrics = await prisma.apiMetric.findMany({
    where:  { service, timestamp: { gte: since } },
    select: { responseTime: true },
  });

  if (metrics.length < THRESHOLDS.MIN_SAMPLES) return null;

  const times = metrics.map(m => m.responseTime).filter(Boolean);
  if (!times.length) return null;

  const avg = times.reduce((a, b) => a + b, 0) / times.length;

  if (avg >= THRESHOLDS.RESPONSE_TIME_SLOW) {
    return {
      type:     'response_time_degradation',
      service,
      severity: avg >= THRESHOLDS.RESPONSE_TIME_CRITICAL
        ? SEVERITY.CRITICAL : SEVERITY.MEDIUM,
      details: {
        avgResponseTime: parseFloat(avg.toFixed(2)),
        sampleCount:     times.length,
        windowMinutes,
      },
      message: `Response time degradation on "${service}": avg ${avg.toFixed(0)}ms over last ${windowMinutes} min.`,
    };
  }

  return null;
}

async function detectUnusualAuthActivity(windowMinutes = 10) {
  const since = new Date(Date.now() - windowMinutes * 60 * 1000);

  const authFailures = await prisma.apiMetric.count({
    where: { timestamp: { gte: since }, statusCode: 401 },
  });

  if (authFailures >= THRESHOLDS.AUTH_FAILURE_THRESHOLD) {
    return {
      type:     'unusual_auth_activity',
      service:  'auth',
      severity: SEVERITY.HIGH,
      details: {
        failureCount:  authFailures,
        windowMinutes,
      },
      message: `Unusual auth activity: ${authFailures} failed attempts in last ${windowMinutes} min.`,
    };
  }

  return null;
}

async function persistAnomaliesAsIncidents(anomalies) {
  for (const a of anomalies) {
    try {
      await prisma.incident.create({
        data: {
          title:       `[Auto] ${a.type.replace(/_/g, ' ').toUpperCase()} — ${a.service}`,
          description: a.message,
          severity:    a.severity.toUpperCase(),
          status:      'OPEN',
          service:     a.service,
        },
      });
    } catch (err) {
      console.error('Failed to persist incident:', err.message);
    }
  }
}

async function runAnomalyDetection() {
  const recentServices = await prisma.apiMetric.findMany({
    where:    { timestamp: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
    select:   { service: true },
    distinct: ['service'],
  });

  const services  = recentServices.map(r => r.service).filter(Boolean);
  const anomalies = [];

  await Promise.all(
    services.map(async (service) => {
      const [spike, errorRate, responseTime] = await Promise.all([
        detectTrafficSpike(service),
        detectErrorRateAnomaly(service),
        detectResponseTimeDegradation(service),
      ]);

      if (spike)        anomalies.push(spike);
      if (errorRate)    anomalies.push(errorRate);
      if (responseTime) anomalies.push(responseTime);
    })
  );

  const authAnomaly = await detectUnusualAuthActivity();
  if (authAnomaly) anomalies.push(authAnomaly);

  if (anomalies.length) {
    await persistAnomaliesAsIncidents(anomalies);
  }

  return anomalies;
}

module.exports = {
  detectTrafficSpike,
  detectErrorRateAnomaly,
  detectResponseTimeDegradation,
  detectUnusualAuthActivity,
  runAnomalyDetection,
  THRESHOLDS,
  SEVERITY,
};