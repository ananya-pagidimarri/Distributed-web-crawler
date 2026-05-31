import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';

export default function useSocketToasts() {
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL || '', {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('Connected to Crawler Socket.IO server:', socket.id);
    });

    socket.on('crawler.event', (payload) => {
      const { event, data } = payload;
      
      switch (event) {
        case 'url.queued':
          // High-frequency event: completely disabled for UI performance.
          // toast(`Queued [${data.priority}]: ${data.url}`, { ... });
          break;
        case 'page.crawled':
          // High-frequency event: completely disabled for UI performance.
          // toast(`Crawled: ${data.url}`, { ... });
          break;
        case 'crawl.failed':
          toast(`Failed: ${data.url}`, { icon: '❌', style: { background: '#7f1d1d', color: '#fca5a5', border: '1px solid #991b1b' } });
          break;
        default:
          if (payload.type && payload.message) {
            if (payload.type === 'success') toast.success(payload.message);
            else if (payload.type === 'error') toast.error(payload.message);
            else if (payload.type === 'warn') toast(payload.message, { icon: '⚠️', style: { background: '#332e18', color: '#fbbf24', border: '1px solid #78350f' } });
            else toast(payload.message, { icon: 'ℹ️', style: { background: '#1e3a8a', color: '#bfdbfe', border: '1px solid #1e40af' } });
          }
          break;
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);
}
