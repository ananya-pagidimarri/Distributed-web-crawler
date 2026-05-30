import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL || '', {
  autoConnect: true,
  reconnection: true,
  transports: ['websocket', 'polling'],
});

export const connectCrawlerSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
};

export const emitCrawlerAction = (event, payload) => {
  if (socket && socket.connected) {
    socket.emit(event, payload);
  }
};

export default socket;