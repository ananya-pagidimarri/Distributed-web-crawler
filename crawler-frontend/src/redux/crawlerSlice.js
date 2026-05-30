import { createSlice } from '@reduxjs/toolkit';

const initialSearchIndex = [];

const initialState = {
  globalStatus: 'crawling', // 'crawling', 'paused', 'idle'
  socketConnected: 'simulating', // 'connected', 'disconnected', 'simulating'
  stats: {
    pagesCrawled: 0,
    pagesIndexed: 0,
    queueSize: 0,
    activeWorkers: 0,
    crawlRate: 0,
    failedCount: 0,
    cpuUsage: 0,
    memoryUsage: 0,
    averageLatency: 0
  },
  workers: [],
  frontierQueue: [],
  failedUrls: [],
  logs: [],
  searchIndex: initialSearchIndex,
  searchQuery: '',
  searchFilters: {
    domain: '',
    type: 'All', // 'All', 'HTML', 'PDF', 'Text'
    sortBy: 'score' // 'score', 'date', 'size'
  }
};

const crawlerSlice = createSlice({
  name: 'crawler',
  initialState,
  reducers: {
    updateStats: (state, action) => {
      state.stats = { ...state.stats, ...action.payload };
    },
    updateWorkers: (state, action) => {
      state.workers = action.payload;
    },
    updateFrontier: (state, action) => {
      state.frontierQueue = action.payload;
    },
    addLog: (state, action) => {
      state.logs.push(action.payload);
      if (state.logs.length > 200) {
        state.logs.shift(); // Keep last 200 logs
      }
    },
    clearLogs: (state) => {
      state.logs = [];
    },
    setGlobalStatus: (state, action) => {
      state.globalStatus = action.payload;
      if (action.payload === 'paused' || action.payload === 'idle') {
        state.stats.crawlRate = 0;
        state.workers = state.workers.map(w => ({
          ...w,
          status: 'idle',
          cpu: 0,
          rate: 0
        }));
      } else {
        state.workers = state.workers.map(w => ({
          ...w,
          status: 'running',
          cpu: w.cpu || 0,
          rate: w.rate || 0
        }));
      }
    },
    submitSeedUrl: (state, action) => {
      const { url, priority, depth } = action.payload;
      // Add to frontier
      state.frontierQueue.unshift({
        url,
        priority: priority || 'High',
        depth: depth || 1,
        addedAt: new Date().toISOString()
      });
      state.stats.queueSize += 1;
      
      // Add log
      state.logs.push({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `[URL Frontier] Seeded new URL: ${url} (Priority: ${priority || 'High'})`,
        workerId: 'Frontier'
      });
    },
    updateSearchFilters: (state, action) => {
      state.searchFilters = { ...state.searchFilters, ...action.payload };
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    addToSearchIndex: (state, action) => {
      state.searchIndex.unshift(action.payload);
      state.stats.pagesIndexed += 1;
    },
    setSocketStatus: (state, action) => {
      state.socketConnected = action.payload;
    },
    pauseWorkerNode: (state, action) => {
      const workerId = action.payload;
      const worker = state.workers.find(w => w.id === workerId);
      if (worker) {
        worker.status = 'idle';
        worker.cpu = 0;
        worker.rate = 0;
        // Log it
        state.logs.push({
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          level: 'warn',
          message: `[Orchestrator] Worker Node [${worker.name}] has been manually paused.`,
          workerId: 'System'
        });
      }
    },
    restartWorkerNode: (state, action) => {
      const workerId = action.payload;
      const worker = state.workers.find(w => w.id === workerId);
      if (worker) {
        worker.status = 'running';
        worker.cpu = worker.cpu || 0;
        worker.rate = worker.rate || 0;
        // Log it
        state.logs.push({
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          level: 'success',
          message: `[Orchestrator] Restarting Worker Node [${worker.name}]... Reloading parsing structures.`,
          workerId: 'System'
        });
      }
    },
    terminateWorkerNode: (state, action) => {
      const workerId = action.payload;
      const worker = state.workers.find(w => w.id === workerId);
      if (worker) {
        worker.status = 'offline';
        worker.cpu = 0;
        worker.rate = 0;
        // Log it
        state.logs.push({
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          level: 'error',
          message: `[Orchestrator] Worker Node [${worker.name}] has been TERMINATED. Resource handles released.`,
          workerId: 'System'
        });
      }
    },
    flushQueue: (state) => {
      const size = state.frontierQueue.length;
      state.frontierQueue = [];
      state.stats.queueSize = 0;
      state.logs.push({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        level: 'warn',
        message: `[URL Frontier] Flushed outstanding queue. Deleted ${size} scheduled seeds.`,
        workerId: 'System'
      });
    },
    requeueFailed: (state) => {
      const count = state.failedUrls.length;
      state.failedUrls.forEach(item => {
        state.frontierQueue.push({
          url: item.url,
          priority: 'High',
          depth: 1,
          addedAt: new Date().toISOString()
        });
      });
      state.stats.queueSize += count;
      state.failedUrls = [];
      state.logs.push({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        level: 'success',
        message: `[URL Frontier] Re-queued ${count} failed URLs into retry frontier with priority weight.`,
        workerId: 'System'
      });
    }
  }
});

export const {
  updateStats,
  updateWorkers,
  updateFrontier,
  addLog,
  clearLogs,
  setGlobalStatus,
  submitSeedUrl,
  updateSearchFilters,
  setSearchQuery,
  addToSearchIndex,
  setSocketStatus,
  pauseWorkerNode,
  restartWorkerNode,
  terminateWorkerNode,
  flushQueue,
  requeueFailed
} = crawlerSlice.actions;

export default crawlerSlice.reducer;