# CrawlX - Distributed Web Crawler

CrawlX is a high-performance, distributed web crawler and indexing engine built with a real-time React dashboard. It is designed to autonomously navigate the web, extract data, and intelligently scale its workload across multiple computing nodes using a centralized MongoDB architecture.

## 🚀 Key Features

- **Distributed Architecture:** By connecting multiple worker nodes (e.g., your local laptop and a cloud server) to the same MongoDB database, the workload is automatically distributed. 
- **Real-Time Telemetry Dashboard:** A stunning, dark-mode React frontend that provides live WebSocket telemetry, displaying CPU saturation, memory usage, and real-time crawl speeds across all connected worker nodes.
- **Ethical Crawling Engine:** Built-in `robots.txt` compliance. The crawler politely checks and respects host rules and crawl delays before fetching pages, preventing IP bans.
- **Serverless Cloud Rendering:** Intelligently detects cloud environments (like Render) and seamlessly switches to the lightweight `@sparticuz/chromium` serverless browser, bypassing the need for heavy Linux graphical dependencies.
- **Bloom Filter Deduplication:** Utilizes an extreme-performance RAM-based Bloom Filter to deduplicate millions of URLs in milliseconds without taxing the database.
- **Auto-Resume & Self-Healing:** The crawler engine automatically wakes from sleep when new seed URLs are injected and seamlessly resumes operations after a server reboot.

## 🛠️ Technology Stack

- **Frontend:** React, TailwindCSS, Recharts, Lucide Icons, Vite
- **Backend:** Node.js, Express.js, Socket.io
- **Database:** MongoDB (Mongoose)
- **Scraping Engine:** Puppeteer (Local) & Puppeteer-Core + Sparticuz Chromium (Production Cloud)
- **Data Structures:** Bloom Filters, BFS (Breadth-First Search) Queue

## ⚙️ System Architecture

CrawlX utilizes a **Monolithic Super-Server** design to save on cloud costs (eliminating the need for expensive message brokers like Kafka). 
- **`server.js`** acts as both the API Gateway for the React frontend and the Master Orchestrator for the crawler engine.
- You can spin up as many instances of `server.js` as you want across different computers. Because they all read and write to the same `UrlQueue` collection in MongoDB, they instantly form a distributed hive-mind and process the queue in parallel.

## 💻 Local Development Setup

### 1. Prerequisites
- Node.js (v18+)
- A MongoDB Atlas Cluster (or local MongoDB)

### 2. Clone the Repository
```bash
git clone https://github.com/ananya-pagidimarri/Distributed-web-crawler.git
cd Distributed-web-crawler
```

### 3. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/crawlx
JWT_SECRET=super_secret_key
DEFAULT_ADMIN_EMAIL=admin@crawlx.io
DEFAULT_ADMIN_PASSWORD=admin
```
Start the backend server:
```bash
npm run dev
```

### 4. Frontend Setup
```bash
cd ../crawler-frontend
npm install
```
Create a `.env` file in the `crawler-frontend` directory:
```env
VITE_API_URL=http://localhost:5000
```
Start the React dashboard:
```bash
npm run dev
```

## ☁️ Cloud Deployment

### Backend (Render)
1. Create a new **Web Service** on Render and connect your repository.
2. Set the Root Directory to `backend`.
3. Set the Build Command to: `npm install`
4. Set the Start Command to: `npm start`
5. **Crucial:** Add your `MONGO_URI` and `JWT_SECRET` in the Render Environment Variables tab. Render automatically injects `RENDER=true`, which tells the crawler to use the Serverless Chromium engine!

### Frontend (Vercel)
1. Import your repository into Vercel.
2. Set the Root Directory to `crawler-frontend`.
3. Vercel will automatically detect Vite and configure the build settings.
4. Add the `VITE_API_URL` environment variable pointing to your deployed Render backend URL (e.g., `https://your-backend.onrender.com`).
5. Click **Deploy**.

## 🛡️ Accessing the Dashboard

Once the frontend is running, navigate to the login page.
- **Default Email:** `admin@crawlx.io`
- **Default Password:** `admin`

*(You can change these in your `.env` file).*

## 📝 License
This project is open-source and available under the MIT License.