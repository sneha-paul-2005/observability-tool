const {
  parseLog,
  processBulkLogs,
  classifyLogLevel,
  categorizeError,
  LOG_LEVELS,
  ERROR_CATEGORIES,
} = require('../src/services/logProcessor.service');

describe('classifyLogLevel', () => {
  it('returns explicit level when valid', () => {
    expect(classifyLogLevel({ level: 'error' })).toBe('error');
    expect(classifyLogLevel({ level: 'WARN' })).toBe('warn');
    expect(classifyLogLevel({ level: 'INFO' })).toBe('info');
  });

  it('infers level from HTTP status code', () => {
    expect(classifyLogLevel({ statusCode: 500 })).toBe('error');
    expect(classifyLogLevel({ statusCode: 404 })).toBe('warn');
    expect(classifyLogLevel({ statusCode: 200 })).toBe('info');
  });

  it('infers level from message keywords', () => {
    expect(classifyLogLevel({ message: 'Critical failure' })).toBe('critical');
    expect(classifyLogLevel({ message: 'Exception thrown' })).toBe('error');
    expect(classifyLogLevel({ message: 'Slow query warning' })).toBe('warn');
  });

  it('defaults to info when nothing matches', () => {
    expect(classifyLogLevel({ message: 'User logged in' })).toBe('info');
    expect(classifyLogLevel({})).toBe('info');
  });
});

describe('categorizeError', () => {
  it('returns null for non-error logs', () => {
    expect(categorizeError({ level: 'info', message: 'All good' })).toBeNull();
  });

  it('categorizes database errors', () => {
    expect(categorizeError({ level: 'error', message: 'Prisma query failed' }))
      .toBe(ERROR_CATEGORIES.DATABASE);
  });

  it('categorizes auth errors', () => {
    expect(categorizeError({ level: 'warn', message: 'JWT token expired', statusCode: 401 }))
      .toBe(ERROR_CATEGORIES.AUTH);
  });

  it('categorizes timeout errors', () => {
    expect(categorizeError({ level: 'error', message: 'Gateway timeout', statusCode: 504 }))
      .toBe(ERROR_CATEGORIES.TIMEOUT);
  });

  it('returns unknown for unrecognised errors', () => {
    expect(categorizeError({ level: 'error', message: 'Something weird happened' }))
      .toBe(ERROR_CATEGORIES.UNKNOWN);
  });
});

describe('parseLog', () => {
  it('normalizes a well-formed log', () => {
    const parsed = parseLog({
      service:      'api-gateway',
      level:        'error',
      message:      'Database connection failed',
      statusCode:   500,
      responseTime: 3200,
      endpoint:     '/api/users',
      method:       'get',
    });

    expect(parsed.service).toBe('api-gateway');
    expect(parsed.level).toBe('error');
    expect(parsed.method).toBe('GET');
    expect(parsed.errorCategory).toBe(ERROR_CATEGORIES.DATABASE);
    expect(parsed.processedAt).toBeInstanceOf(Date);
  });

  it('fills defaults for a minimal log', () => {
    const parsed = parseLog({ message: 'hello' });
    expect(parsed.service).toBe('unknown');
    expect(parsed.level).toBe('info');
    expect(parsed.errorCategory).toBeNull();
  });

  it('throws on non-object input', () => {
    expect(() => parseLog(null)).toThrow();
    expect(() => parseLog('string')).toThrow();
  });
});

describe('processBulkLogs', () => {
  it('processes valid logs and reports failures', () => {
    const { processed, failed, total } = processBulkLogs([
      { service: 'svc-a', level: 'info',  message: 'ok' },
      { service: 'svc-b', level: 'error', message: 'fail', statusCode: 500 },
      null,
    ]);

    expect(total).toBe(3);
    expect(processed).toHaveLength(2);
    expect(failed).toHaveLength(1);
  });

  it('throws on non-array input', () => {
    expect(() => processBulkLogs('not an array')).toThrow();
  });
});