const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID,
  brokers: [process.env.KAFKA_BROKER],
});

const producer = kafka.producer();
const consumer = kafka.consumer({
  groupId: process.env.KAFKA_GROUP_ID,
});

producer.connect()
  .then(() => console.log('Kafka producer connected'))
  .catch((err) => console.log('Kafka producer error:', err));

consumer.connect()
  .then(() => console.log('Kafka consumer connected'))
  .catch((err) => console.log('Kafka consumer error:', err));

console.log('Kafka Connected');

module.exports = { producer, consumer };