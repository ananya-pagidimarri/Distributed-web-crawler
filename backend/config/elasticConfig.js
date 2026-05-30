const { Client } = require('@elastic/elasticsearch');

const elasticClient = new Client({
  node: process.env.ELASTIC_NODE,
});

console.log('Elasticsearch Connected');

module.exports = elasticClient;