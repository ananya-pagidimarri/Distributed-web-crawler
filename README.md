# CrawlX - Distributed Web Crawler & Search Engine

## 🌐 Overview

CrawlX is a scalable distributed web crawler and indexing platform designed to autonomously crawl websites, extract valuable information, index pages, and provide real-time monitoring through a modern React dashboard.

The system is built using a centralized MongoDB architecture that allows multiple crawler nodes running on different machines to collaborate and process URLs simultaneously.

Unlike traditional crawlers that require Kafka, RabbitMQ, or Redis queues, CrawlX uses MongoDB as a distributed task queue, making deployment simpler and more cost-effective.

---

# 🚀 Project Objectives

The primary goals of CrawlX are:

* Crawl websites automatically
* Extract metadata and page content
* Discover new URLs
* Build a searchable index
* Monitor crawler performance in real-time
* Scale horizontally across multiple servers
* Respect robots.txt rules
* Avoid duplicate crawling
* Recover automatically after crashes

---

# 🏗 System Architecture

## High-Level Architecture

```text
                    ┌─────────────────────┐
                    │    React Dashboard   │
                    └──────────┬──────────┘
                               │
                         Socket.IO
                               │
                               ▼
                 ┌─────────────────────────┐
                 │      Express Server      │
                 │      (server.js)         │
                 └──────────┬──────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
   Crawl Engine      Search Engine      Auth APIs
          │
          ▼
    MongoDB Atlas
          │
          ▼
   Shared Distributed
        URL Queue
          │
 ┌────────┼────────┐
 │                 │
 ▼                 ▼
Worker 1       Worker 2
(Local PC)   (Cloud Server)
```

---

# ⚙️ Core Components

## 1. Frontend Dashboard

The frontend is developed using React and Tailwind CSS.

### Responsibilities

* User Authentication
* Dashboard Analytics
* Real-Time Monitoring
* Search Interface
* URL Submission
* Queue Monitoring
* Worker Monitoring

### Technologies

* React.js
* Vite
* TailwindCSS
* Socket.io Client
* Recharts
* Lucide React Icons

---

## Dashboard Modules

### Login Page

Provides secure authentication using JWT tokens.

Features:

* Admin Login
* Token Storage
* Protected Routes
* Session Management

---

### Dashboard Page

Displays crawler statistics.

Metrics:

* Total Crawled Pages
* Active Workers
* Queue Size
* Crawl Speed
* Memory Usage
* CPU Utilization

---

### Search Page

Allows users to search indexed websites.

Search Features:

* Keyword Search
* Indexed Results
* URL Ranking
* Metadata Display

---

### URL Submission Page

Allows administrators to add seed URLs.

Workflow:

```text
Admin Adds URL
      │
      ▼
Backend API
      │
      ▼
MongoDB Queue
      │
      ▼
Crawler Picks URL
```

---

### Worker Monitoring

Displays:

* Worker ID
* Worker Status
* Pages Crawled
* CPU Usage
* RAM Usage
* Crawl Speed

---

# 🔧 Backend Architecture

The backend acts as:

1. API Server
2. Search Server
3. Master Orchestrator
4. Distributed Worker

All functionalities run inside a single Node.js application.

---

## Backend Technologies

* Node.js
* Express.js
* Socket.io
* Puppeteer
* Mongoose
* JWT Authentication

---

# 🔐 Authentication System

### Registration Flow

```text
User Registration
       │
       ▼
Validate Data
       │
       ▼
Hash Password
       │
       ▼
Store User
       │
       ▼
Return Success
```

---

### Login Flow

```text
Email + Password
        │
        ▼
Find User
        │
        ▼
Compare Password
        │
        ▼
Generate JWT
        │
        ▼
Send Token
```

---

# 🌎 Distributed Crawling System

The most powerful feature of CrawlX.

Multiple servers can run simultaneously.

Example:

```text
Laptop
   │
   ▼

MongoDB Queue

   ▲
   │

Cloud Server
```

Both workers:

* Pull URLs
* Crawl Pages
* Store Results
* Add New URLs

simultaneously.

---

# 🕷 Crawling Engine Workflow

## Step 1: Seed URL Injection

Example:

```text
https://example.com
```

Stored in MongoDB queue.

---

## Step 2: URL Fetching

Worker requests a URL from queue.

```text
Queue
  │
  ▼
Worker
```

---

## Step 3: robots.txt Validation

Before crawling:

```text
example.com/robots.txt
```

Crawler checks:

* Allowed paths
* Disallowed paths
* Crawl delays

---

## Step 4: Browser Launch

### Local Development

Uses:

```javascript
Puppeteer
```

### Production

Uses:

```javascript
Puppeteer-Core
+
Sparticuz Chromium
```

This reduces memory usage on cloud platforms.

---

## Step 5: Page Extraction

Crawler extracts:

* Title
* Description
* Keywords
* Headings
* Content
* Internal Links

---

## Step 6: Link Discovery

Example:

```html
<a href="/about">About</a>
<a href="/contact">Contact</a>
```

Discovered URLs are normalized and queued.

---

## Step 7: URL Normalization

Converts:

```text
https://site.com/?utm_source=facebook
```

to

```text
https://site.com
```

Removes:

* utm_source
* utm_campaign
* fbclid
* tracking parameters

---

## Step 8: Deduplication

Before insertion:

Bloom Filter checks URL.

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

Benefits:

* O(1) lookup
* Memory Efficient
* Millions of URLs

---

## Step 9: Store Indexed Data

Saved into MongoDB.

Stored Fields:

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

# 📊 Real-Time Telemetry

Uses Socket.IO.

Workers continuously emit:

```javascript
{
  cpuUsage,
  memoryUsage,
  crawlRate,
  pagesProcessed
}
```

Dashboard updates instantly without page refresh.

---

# 🗄 Database Collections

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
  content,
  metadata
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
User Searches
      │
      ▼
Search API
      │
      ▼
MongoDB Index
      │
      ▼
Matching Pages
      │
      ▼
Results Returned
```

Search considers:

* Page Title
* Meta Description
* Content Keywords

---

# 🔄 Auto Resume System

When server restarts:

```text
Server Crash
      │
      ▼
Restart
      │
      ▼
Load Queue State
      │
      ▼
Resume Crawling
```

No progress is lost.

---

# ☁️ Deployment Architecture

## Backend Deployment

Platform:

Render

Responsibilities:

* APIs
* Crawlers
* WebSockets

---

## Frontend Deployment

Platform:

Vercel

Responsibilities:

* Dashboard
* Search Interface
* Analytics

---

## Database

Platform:

MongoDB Atlas

Responsibilities:

* Queue Storage
* User Storage
* Search Index

---

# 🧠 Advanced Features

### Bloom Filter Deduplication

Prevents duplicate URLs.

---

### robots.txt Compliance

Ensures ethical crawling.

---

### Distributed Workers

Unlimited horizontal scaling.

---

### Live Monitoring

Real-time crawler insights.

---

### Automatic Recovery

Resumes after failures.

---

### Cloud Optimized

Works efficiently on Render.

---

# 📈 Performance Optimizations

* Bloom Filters
* URL Canonicalization
* Shared Mongo Queue
* Headless Chromium
* Incremental Crawling
* Memory Monitoring

---

### Screenshot Capture

Store webpage previews.

---


# 🛠 Local Setup

## Backend

```bash
cd backend
npm install
npm run dev
```

---

## Frontend

```bash
cd crawler-frontend
npm install
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


