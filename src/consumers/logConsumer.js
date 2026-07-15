const kafka = require('../config/kafka');
const { indexLog } = require('../services/elasticsearch.service');

const consumer = kafka.consumer({ groupId: 'log-processing-group' });

async function startLogConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'logs-stream', fromBeginning: true });

  console.log('✅ Kafka consumer subscribed to logs-stream');

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const logData = JSON.parse(message.value.toString());
        console.log(`📥 Consumed log from Kafka: [${logData.level}] ${logData.message}`);

        await indexLog(logData);
        console.log(`✅ Indexed to Elasticsearch: ${logData.logId}`);
      } catch (err) {
        console.error('❌ Error processing Kafka message:', err.message);
      }
    }
  });
}

module.exports = { startLogConsumer };