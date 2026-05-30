const { Client } = require('@elastic/elasticsearch');

const client = new Client({
  node: 'http://localhost:9200',
  tls: { rejectUnauthorized: false }
});

const INDEX_NAME = 'pages';

const mockUrls = [
  'https://space.com/starship-lands-on-mars',
  'https://blog.google/gemini-2-announcement',
  'https://stackoverflow.blog/rust-most-popular',
  'https://github.blog/copilot-writes-80-percent',
  'https://python.org/gil-removal'
];

async function deleteMocks() {
  console.log('Deleting fake mock URLs from Elasticsearch...');
  for (const url of mockUrls) {
    try {
      await client.delete({
        index: INDEX_NAME,
        id: url
      });
      console.log(`Deleted: ${url}`);
    } catch (err) {
      if (err.meta && err.meta.statusCode === 404) {
        console.log(`Already deleted: ${url}`);
      } else {
        console.error(`Failed to delete ${url}:`, err.message);
      }
    }
  }
  await client.indices.refresh({ index: INDEX_NAME });
  console.log('Done cleaning up mock data.');
}

deleteMocks();
