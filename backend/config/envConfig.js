require('dotenv').config();

module.exports = {
  // Server
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // MongoDB
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawlx',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'change_this_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Admin defaults
  DEFAULT_ADMIN_EMAIL: process.env.DEFAULT_ADMIN_EMAIL || 'admin@crawlx.io',
  DEFAULT_ADMIN_PASSWORD: process.env.DEFAULT_ADMIN_PASSWORD || 'admin',
  DEFAULT_ADMIN_NAME: process.env.DEFAULT_ADMIN_NAME || 'Admin User',

  // Redis
  REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
  REDIS_PORT: parseInt(process.env.REDIS_PORT) || 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
  REDIS_URL: process.env.REDIS_URL || null,

  // Elasticsearch Removed (Using MongoDB BM25 Search instead)

  // Kafka Removed (Using Redis Pub/Sub instead)

  // CORS
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://distributed-web-crawler-one.vercel.app',

  // Crawler settings
  MAX_PAGES_PER_DOMAIN: parseInt(process.env.MAX_PAGES_PER_DOMAIN) || 100,
  CRAWL_DELAY_MS: parseInt(process.env.CRAWL_DELAY_MS) || 1000,
  MAX_WORKERS: parseInt(process.env.MAX_WORKERS) || 5,
  FETCH_TIMEOUT_MS: parseInt(process.env.FETCH_TIMEOUT_MS) || 10000,

  // External APIs
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || null,
  NEWS_API_KEY: process.env.NEWS_API_KEY || null
};