const LOG_LEVELS = {
  CRITICAL: 'critical',
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

const ERROR_CATEGORIES = {
  DATABASE:   'database',
  NETWORK:    'network',
  AUTH:       'auth',
  TIMEOUT:    'timeout',
  VALIDATION: 'validation',
  RATE_LIMIT: 'rate_limit',
  SERVER:     'server',
  NOT_FOUND:  'not_found',
  UNKNOWN:    'unknown',
};

const ERROR_PATTERNS = [
  { category: ERROR_CATEGORIES.DATABASE,   regex: /mongo|postgres|sql|prisma|db|database|query/i },
  { category: ERROR_CATEGORIES.NETWORK,    regex: /econnrefused|enotfound|network|socket|etimedout/i },
  { category: ERROR_CATEGORIES.AUTH,       regex: /unauthorized|forbidden|jwt|token|auth|403|401/i },
  { category: ERROR_CATEGORIES.TIMEOUT,    regex: /timeout|timed out|504|408/i },
  { category: ERROR_CATEGORIES.VALIDATION, regex: /validation|invalid|required|bad request|400/i },
  { category: ERROR_CATEGORIES.RATE_LIMIT, regex: /rate limit|too many requests|429/i },
  { category: ERROR_CATEGORIES.NOT_FOUND,  regex: /not found|404/i },
  { category: ERROR_CATEGORIES.SERVER,     regex: /internal server|500|502|503/i },
];

function classifyLogLevel(log) {
  const raw = (log.level || '').toLowerCase();
  if (Object.values(LOG_LEVELS).includes(raw)) return raw;

  const status = log.statusCode || log.status_code;
  if (status) {
    if (status >= 500) return LOG_LEVELS.ERROR;
    if (status >= 400) return LOG_LEVELS.WARN;
    if (status >= 200 && status < 300) return LOG_LEVELS.INFO;
  }

  const msg = (log.message || '').toLowerCase();
  if (/critical|fatal|panic/.test(msg))        return LOG_LEVELS.CRITICAL;
  if (/error|exception|fail|crash/.test(msg))  return LOG_LEVELS.ERROR;
  if (/warn|timeout|slow/.test(msg))           return LOG_LEVELS.WARN;
  if (/debug|trace|verbose/.test(msg))         return LOG_LEVELS.DEBUG;

  return LOG_LEVELS.INFO;
}

function categorizeError(log) {
  if (!['error', 'critical', 'warn'].includes(classifyLogLevel(log))) return null;

  const searchText = [
    log.message || '',
    log.error   || '',
    String(log.statusCode || ''),
  ].join(' ');

  for (const { category, regex } of ERROR_PATTERNS) {
    if (regex.test(searchText)) return category;
  }

  return ERROR_CATEGORIES.UNKNOWN;
}

function parseLog(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Log must be a non-null object');
  }

  const level         = classifyLogLevel(raw);
  const errorCategory = categorizeError({ ...raw, level });

  return {
    service:      raw.service      || 'unknown',
    environment:  raw.environment  || 'production',
    level,
    message:      raw.message      || '',
    error:        raw.error        || null,
    endpoint:     raw.endpoint     || raw.path || null,
    method:       raw.method       ? raw.method.toUpperCase() : null,
    statusCode:   raw.statusCode   || null,
    responseTime: raw.responseTime || null,
    errorCategory,
    timestamp:    raw.timestamp    ? new Date(raw.timestamp) : new Date(),
    processedAt:  new Date(),
    metadata:     raw.metadata     || {},
  };
}

function processBulkLogs(rawLogs) {
  if (!Array.isArray(rawLogs)) throw new Error('Input must be an array');

  const processed = [];
  const failed    = [];

  for (let i = 0; i < rawLogs.length; i++) {
    try {
      processed.push(parseLog(rawLogs[i]));
    } catch (err) {
      failed.push({ index: i, raw: rawLogs[i], error: err.message });
    }
  }

  return { processed, failed, total: rawLogs.length };
}

module.exports = {
  parseLog,
  processBulkLogs,
  classifyLogLevel,
  categorizeError,
  LOG_LEVELS,
  ERROR_CATEGORIES,
};