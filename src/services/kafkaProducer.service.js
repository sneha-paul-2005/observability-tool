const kafka = require('../config/kafka');

const producer = kafka.producer();
let isConnected = false;

async function connectProducer() {
  if (!isConnected) {
    await producer.connect();
    isConnected = true;
    console.log('✅ Kafka producer connected');
  }
}

async function publishLog(logData) {
  try {
    await connectProducer();
    await producer.send({
      topic: 'logs-stream',
      messages: [
        { value: JSON.stringify(logData) }
      ]
    });
    return true;
  } catch (err) {
    console.error('Kafka publish error:', err.message);
    return false;
  }
}

module.exports = { connectProducer, publishLog };