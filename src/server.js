require('dotenv').config();
const app = require('./app');
const { connectMongoDB, connectPostgres } = require('./config/database');
const { checkConnection, initializeIndex } = require('./services/elasticsearch.service');
const { runAnomalyDetection } = require('./services/anomaly.service');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectMongoDB();
  await connectPostgres();

  // Elasticsearch
  const esStatus = await checkConnection();
  if (esStatus.connected) {
    await initializeIndex();
    console.log('✅ Elasticsearch connected');
  } else {
    console.warn('⚠️  Elasticsearch not available — search features disabled');
  }

  // Anomaly detection — runs every 5 minutes
  setInterval(async () => {
    try {
      const anomalies = await runAnomalyDetection();
      if (anomalies.length > 0) {
        console.log(`🚨 ${anomalies.length} anomaly(s) detected`);
      }
    } catch (err) {
      console.error('Anomaly detection error:', err.message);
    }
  }, 5 * 60 * 1000);

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
};

startServer();