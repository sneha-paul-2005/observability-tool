const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'observability-tool',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
  retry: {
    initialRetryTime: 300,
    retries: 5
  }
});

module.exports = kafka;