require('dotenv').config();
const app = require('./app');
const { connectMongoDB, connectPostgres } = require('./config/database');
const { checkConnection, initializeIndex } = require('./services/elasticsearch.service');

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

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
};

startServer();