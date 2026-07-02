const { Client } = require('@elastic/elasticsearch');

let esClient = null;

function getClient() {
  if (!esClient) {
    esClient = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    });
  }
  return esClient;
}

const LOGS_INDEX = 'observability-logs';

async function initializeIndex() {
  const client = getClient();
  try {
    const exists = await client.indices.exists({ index: LOGS_INDEX });
    if (!exists) {
      await client.indices.create({
        index: LOGS_INDEX,
        mappings: {
          properties: {
            service:       { type: 'keyword' },
            environment:   { type: 'keyword' },
            level:         { type: 'keyword' },
            message:       { type: 'text' },
            error:         { type: 'text' },
            endpoint:      { type: 'keyword' },
            method:        { type: 'keyword' },
            statusCode:    { type: 'integer' },
            responseTime:  { type: 'float' },
            errorCategory: { type: 'keyword' },
            timestamp:     { type: 'date' },
            processedAt:   { type: 'date' },
          },
        },
        settings: {
          number_of_shards:   1,
          number_of_replicas: 0,
        },
      });
      console.log("✅ Elasticsearch index created");
    } else {
      console.log("ℹ️  Elasticsearch index already exists");
    }
  } catch (err) {
    console.error('❌ Elasticsearch index error:', err.message);
    throw err;
  }
}

async function checkConnection() {
  try {
    await getClient().ping();
    return { connected: true };
  } catch (err) {
    return { connected: false, error: err.message };
  }
}

async function indexLog(processedLog) {
  const client = getClient();
  const response = await client.index({
    index: LOGS_INDEX,
    document: processedLog,
    refresh: 'wait_for',
  });
  return response._id;
}

async function bulkIndexLogs(processedLogs) {
  if (!processedLogs.length) return { indexed: 0, failed: 0 };

  const client = getClient();
  const operations = processedLogs.flatMap((doc) => [
    { index: { _index: LOGS_INDEX } },
    doc,
  ]);

  const response = await client.bulk({ refresh: true, operations });
  const failed = (response.items || []).filter((item) => item.index?.error).length;

  return {
    indexed: processedLogs.length - failed,
    failed,
  };
}

async function searchLogs(query, filters = {}, page = 1, size = 20) {
  const client = getClient();
  size = Math.min(size, 100);
  const from = (page - 1) * size;

  const must   = [];
  const filter = [];

  if (query && query.trim()) {
    must.push({
      multi_match: {
        query:  query.trim(),
        fields: ['message^2', 'error', 'endpoint'],
        fuzziness: 'AUTO',
      },
    });
  }

  if (filters.service)       filter.push({ term: { service: filters.service } });
  if (filters.level)         filter.push({ term: { level: filters.level } });
  if (filters.errorCategory) filter.push({ term: { errorCategory: filters.errorCategory } });
  if (filters.statusCode)    filter.push({ term: { statusCode: Number(filters.statusCode) } });

  if (filters.from || filters.to) {
    filter.push({
      range: {
        timestamp: {
          ...(filters.from ? { gte: filters.from } : {}),
          ...(filters.to   ? { lte: filters.to   } : {}),
        },
      },
    });
  }

  const response = await client.search({
    index: LOGS_INDEX,
    query: {
      bool: {
        must:   must.length   ? must   : [{ match_all: {} }],
        filter: filter.length ? filter : [],
      },
    },
    sort: [{ timestamp: { order: 'desc' } }],
    from,
    size,
    track_total_hits: true,
  });

  return {
    total:   response.hits.total.value,
    page,
    size,
    pages:   Math.ceil(response.hits.total.value / size),
    results: response.hits.hits.map((hit) => ({
      id: hit._id,
      ...hit._source,
    })),
  };
}

async function getRecentLogsForService(service, limit = 50) {
  const result = await searchLogs('', { service }, 1, limit);
  return result.results;
}

module.exports = {
  getClient,
  initializeIndex,
  checkConnection,
  indexLog,
  bulkIndexLogs,
  searchLogs,
  getRecentLogsForService,
  LOGS_INDEX,
};