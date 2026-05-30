import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { connectCrawlerSocket } from '../services/socket';
import {
  addLog,
  setQueue,
  setSystemStats,
  setWorkers,
  setSocketStatus,
  setSimulating,
} from '../redux/crawlerSlice';

const domains = ['wikipedia.org', 'openai.com', 'docs.react.dev', 'example.com', 'news.ycombinator.com'];
const statuses = ['running', 'idle', 'robots_check', 'offline'];
const logLevels = ['info', 'success', 'warn', 'error'];

const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function createLog(worker, url, level, message) {
  return {
    timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
    level,
    workerId: worker.id,
    message: `[${worker.name}] ${message} ${url}`,
  };
}

function buildWorkerUpdates(workers) {
  return workers.map((worker) => {
    const status = statuses[random(0, statuses.length - 1)];
    const cpu = status === 'offline' ? 0 : random(12, 82);
    const memory = status === 'offline' ? 0 : random(20, 84);
    return {
      ...worker,
      status,
      cpu,
      memory,
      crawlRate: status === 'running' ? random(60, 170) : status === 'idle' ? random(0, 30) : 0,
      currentUrl: status === 'running' ? `https://${domains[random(0, domains.length - 1)]}/page/${random(100, 999)}` : status === 'robots_check' ? 'robots.txt evaluation' : status === 'offline' ? 'Offline' : 'Idle',
      processedCount: worker.processedCount + random(5, 35),
    };
  });
}

function useCrawler() {
  const dispatch = useDispatch();
  const simulationTimer = useRef(null);
  const connectedRef = useRef(false);

  useEffect(() => {
    const socket = connectCrawlerSocket();

    socket.on('connect', () => {
      connectedRef.current = true;
      dispatch(setSocketStatus({ socketConnected: true, simulating: false }));
    });

    socket.on('disconnect', () => {
      connectedRef.current = false;
      dispatch(setSocketStatus({ socketConnected: false }));
    });

    socket.on('stats_update', (payload) => {
      dispatch(setSystemStats(payload));
    });

    socket.on('worker_update', (payload) => {
      dispatch(setWorkers(payload));
    });

    socket.on('frontier_update', (payload) => {
      dispatch(setQueue(payload));
    });

    socket.on('log_message', (payload) => {
      dispatch(addLog(payload));
    });

    const fallback = window.setTimeout(() => {
      if (!connectedRef.current) {
        dispatch(setSocketStatus({ socketConnected: false }));
        startSimulation();
      }
    }, 1200);

    function startSimulation() {
      dispatch(setSocketStatus({ socketConnected: false }));
      dispatch(setSimulating(true));
      simulationTimer.current = window.setInterval(() => {
        const workers = buildWorkerUpdates([
          { id: 'worker-1', name: 'Crawler-Alpha', status: 'running', cpu: 36, memory: 61, crawlRate: 120, currentUrl: 'https://example.com/robots.txt', processedCount: 15420 },
          { id: 'worker-2', name: 'Crawler-Beta', status: 'idle', cpu: 18, memory: 33, crawlRate: 32, currentUrl: 'Waiting for new URL', processedCount: 14890 },
          { id: 'worker-3', name: 'Crawler-Gamma', status: 'robots_check', cpu: 58, memory: 70, crawlRate: 80, currentUrl: 'https://wikipedia.org/wiki/Search_engine_indexing', processedCount: 17620 },
          { id: 'worker-4', name: 'Crawler-Delta', status: 'offline', cpu: 0, memory: 0, crawlRate: 0, currentUrl: 'Offline', processedCount: 10822 },
        ]);

        const activeDelta = random(-60, 90);
        const queueState = {
          active: Math.max(1800, 5120 + activeDelta),
          pending: Math.max(900, 2100 + random(-40, 52)),
          failed: Math.max(98, 132 + random(-2, 5)),
          priority: Math.max(180, 220 + random(-10, 18)),
        };

        dispatch(setWorkers(workers));
        dispatch(setQueue(queueState));
        dispatch(setSystemStats({
          crawlRate: Math.max(260, 510 + random(-35, 45)),
          frontierSize: queueState.active,
          avgLatency: 180 + random(-16, 20),
          totalCrawled: 12450 + random(2, 28),
          indexedPages: 50230 + random(12, 88),
          failedUrls: queueState.failed,
          crawlerStatus: 'crawling',
        }));

        const worker = workers[random(0, workers.length - 1)];
        const nextUrl = `https://${domains[random(0, domains.length - 1)]}/page/${random(20, 990)}`;
        const level = logLevels[random(0, logLevels.length - 1)];
        const messages = [
          `Fetching ${nextUrl} (robots.txt ok)`,
          `Indexing ${nextUrl}`,
          `Retry scheduled for ${nextUrl}`,
          `Sitemap discovered at https://${domains[random(0, domains.length - 1)]}/sitemap.xml`,
        ];

        dispatch(addLog(createLog(worker, nextUrl, level, messages[random(0, messages.length - 1)])));
      }, 1400);
    }

    return () => {
      window.clearTimeout(fallback);
      if (simulationTimer.current) {
        window.clearInterval(simulationTimer.current);
      }
      socket.off();
    };
  }, [dispatch]);
}

export default useCrawler;