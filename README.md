# CrawlX - Distributed Web Crawler & Search Engine
---

# 🌐 Overview

CrawlX is a scalable distributed web crawler and search engine platform designed to crawl websites, extract content, discover links, build searchable indexes, and monitor crawling operations in real time.

The system uses MongoDB as a centralized distributed queue, allowing multiple crawler instances running on different machines to work together simultaneously without requiring Kafka, RabbitMQ, or Redis.

---

# 🚀 Features

## Distributed Crawling

* Multiple crawler nodes
* Shared MongoDB queue
* Parallel URL processing
* Horizontal scaling

## Real-Time Monitoring

* Live telemetry dashboard
* CPU monitoring
* Memory monitoring
* Crawl speed tracking
* Active worker tracking

## Ethical Crawling

* robots.txt compliance
* Crawl delay handling
* Domain restrictions
* Safe crawling policies

## Search Engine

* Indexed page storage
* Keyword search
* Metadata search
* Fast retrieval

## Performance Optimization

* Bloom Filter deduplication
* URL normalization
* Incremental crawling
* Distributed processing

## Recovery System

* Auto resume after restart
* Queue persistence
* Self-healing crawler

---

# 🛠 Technology Stack

## Frontend

* React.js
* Vite
* Tailwind CSS
* Recharts
* Socket.IO Client
* Lucide React

## Backend

* Node.js
* Express.js
* Socket.IO
* JWT Authentication
* Puppeteer

## Database

* MongoDB Atlas
* Mongoose ODM

## Crawling Engine

* Puppeteer
* Puppeteer Core
* Sparticuz Chromium

---

# 📁 Project Structure

```text
CrawlX/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── crawler/
│   ├── socket/
│   ├── utils/
│   ├── server.js
│   └── package.json
│
├── crawler-frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── screenshots/
├── docs/
├── README.md
└── LICENSE
```

---

# 🏗 System Architecture

```text
React Dashboard
       │
       ▼
Socket.IO
       │
       ▼
Express Server
       │
 ┌─────┼─────┐
 │     │     │
 ▼     ▼     ▼
Auth Search Crawler
 APIs APIs Engine
       │
       ▼
MongoDB Atlas
       │
       ▼
Shared URL Queue
       │
 ┌─────┴─────┐
 ▼           ▼
Worker 1   Worker 2
```

---

# 🔐 Authentication Flow

```text
User Login
     │
     ▼
Validate Credentials
     │
     ▼
Compare Password
     │
     ▼
Generate JWT
     │
     ▼
Return Token
```

---

# 🌎 Distributed Crawling Workflow

```text
Seed URL Added
      │
      ▼
MongoDB Queue
      │
      ▼
Worker Picks URL
      │
      ▼
robots.txt Check
      │
      ▼
Launch Browser
      │
      ▼
Extract Data
      │
      ▼
Discover Links
      │
      ▼
Normalize URLs
      │
      ▼
Bloom Filter Check
      │
      ▼
Store New URLs
      │
      ▼
Store Indexed Page
```

---

# 🕷 Crawler Engine Flow

## Step 1: URL Injection

Administrator submits:

```text
https://example.com
```

Stored inside UrlQueue collection.

---

## Step 2: URL Assignment

Worker requests pending URL.

```text
Queue
  │
  ▼
Worker
```

---

## Step 3: robots.txt Validation

Checks:

* Allowed paths
* Disallowed paths
* Crawl delays

Example:

```text
https://example.com/robots.txt
```

---

## Step 4: Browser Initialization

### Development

```javascript
Puppeteer
```

### Production

```javascript
Puppeteer-Core
@sparticuz/chromium
```

---

## Step 5: Content Extraction

Extracts:

* Page Title
* Meta Description
* Headings
* Main Content
* Internal Links

---

## Step 6: Link Discovery

```html
<a href="/about">About</a>
<a href="/contact">Contact</a>
```

Links are queued for future crawling.

---

## Step 7: URL Normalization

Converts:

```text
https://site.com/?utm_source=google
```

To:

```text
https://site.com
```

Removes:

* utm_source
* utm_campaign
* fbclid

---

## Step 8: Deduplication

Uses Bloom Filter.

```text
URL
 │
 ▼
Bloom Filter
 │
 ├─ Exists → Ignore
 │
 └─ New → Insert
```

---

## Step 9: Index Storage

Stores:

```json
{
  "url": "",
  "title": "",
  "description": "",
  "content": "",
  "links": []
}
```

---

# 📊 Real-Time Dashboard

Dashboard displays:

## Crawl Metrics

* Pages Crawled
* Queue Size
* Crawl Rate
* Success Rate

## System Metrics

* CPU Usage
* RAM Usage
* Worker Status

## Search Analytics

* Indexed Pages
* Search Queries
* Search Results

---

# 🗄 Database Design

## Users

```javascript
{
 email,
 password,
 role
}
```

---

## UrlQueue

```javascript
{
 url,
 status,
 priority,
 assignedWorker
}
```

---

## IndexedPages

```javascript
{
 url,
 title,
 description,
 content,
 links
}
```

---

## WorkerStats

```javascript
{
 workerId,
 cpu,
 memory,
 pagesCrawled
}
```

---

# 🔍 Search Engine Workflow

```text
User Search
      │
      ▼
Search API
      │
      ▼
MongoDB Index
      │
      ▼
Matched Pages
      │
      ▼
Results Returned
```

Searches:

* Titles
* Descriptions
* Keywords
* Content

---

# 🔄 Auto Recovery System

```text
Server Restart
      │
      ▼
Load Queue State
      │
      ▼
Resume Crawling
```

No crawl progress is lost.

---

# 📈 Performance Optimizations

## Bloom Filter

* O(1) URL lookup
* Memory efficient
* Millions of URLs

## URL Canonicalization

Removes duplicate tracking URLs.

## Shared Mongo Queue

Eliminates Kafka dependency.

## Headless Chromium

Optimized cloud execution.

---

# ☁️ Deployment

## Backend Deployment (Render)

Build Command:

```bash
npm install
```

Start Command:

```bash
npm start
```

Environment Variables:

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
NODE_ENV=production
```

---

## Frontend Deployment (Vercel)

Environment Variables:

```env
VITE_API_URL=https://your-backend.onrender.com
```

Deploy directly from GitHub.

---

# 💻 Local Development Setup

## Clone Repository

```bash
git clone https://github.com/ananya-pagidimarri/Distributed-web-crawler.git

cd Distributed-web-crawler
```

---

# Backend Setup

```bash
cd backend

npm install
```

Create .env

```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_uri
JWT_SECRET=super_secret_key
DEFAULT_ADMIN_EMAIL=admin@crawlx.io
DEFAULT_ADMIN_PASSWORD=admin
```

Run Backend

```bash
npm run dev
```

---

# Frontend Setup

```bash
cd crawler-frontend

npm install
```

Create .env

```env
VITE_API_URL=http://localhost:5000
```

Run Frontend

```bash
npm run dev
```

---

# 🔑 Default Credentials

```text
Email:
admin@crawlx.io

Password:
admin
```

---
# 🛡 Security Features

- JWT Authentication
- Password Hashing using bcrypt
- Protected Admin Routes
- Input Validation
- Environment Variable Protection

---

# 🔌 API Endpoints

## Authentication

POST /api/auth/login
POST /api/auth/register

## Search

GET /api/search?q=keyword

## Crawl

POST /api/crawl/start
POST /api/crawl/stop
POST /api/crawl/add-url

## Dashboard

GET /api/dashboard/stats

---

# 🌟 Why CrawlX?

Unlike traditional crawlers that require:
- Kafka
- RabbitMQ
- Redis Streams

CrawlX uses MongoDB as a distributed queue, reducing infrastructure cost and simplifying deployment while still supporting horizontal scaling.

---

