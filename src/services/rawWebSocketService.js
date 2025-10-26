import { withWebSocketCredentials } from '../utils/auth';

class RawWebSocketService {
  constructor() {
    this.sockets = new Map();
  }

  connectRawWebSocket(jobId, callbacks) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.REACT_APP_API_URL?.replace(/^https?:\/\//, '') || 'localhost:8080';
    
    let wsUrl = `${protocol}//${host}/api/checks/socket/${jobId}`;
    wsUrl = withWebSocketCredentials(wsUrl);

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log(`Raw WebSocket connected for job ${jobId}`);
      callbacks.onOpen && callbacks.onOpen();
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        
        if (payload.error && (payload.error.includes('auth') || payload.error.includes('401'))) {
          callbacks.onError && callbacks.onError(new Error('WebSocket authentication failed'));
          socket.close();
          return;
        }
        
        console.log('Raw WebSocket message:', payload);
        callbacks.onMessage && callbacks.onMessage(payload);
      } catch (error) {
        console.error('Error parsing raw WebSocket message:', error);
        callbacks.onMessage && callbacks.onMessage(event.data);
      }
    };

    socket.onclose = (event) => {
      console.log(`Raw WebSocket closed for job ${jobId}:`, event);
      this.sockets.delete(jobId);
      
      if (event.code === 1008) {
        callbacks.onError && callbacks.onError(new Error('Authentication failed on WebSocket'));
      } else {
        callbacks.onClose && callbacks.onClose(event);
      }
    };

    socket.onerror = (error) => {
      console.error(`Raw WebSocket error for job ${jobId}:`, error);
      callbacks.onError && callbacks.onError(error);
    };

    this.sockets.set(jobId, socket);
    return socket;
  }

  disconnectRawWebSocket(jobId) {
    const socket = this.sockets.get(jobId);
    if (socket) {
      socket.close();
      this.sockets.delete(jobId);
    }
  }

  disconnectAll() {
    this.sockets.forEach((socket, jobId) => {
      socket.close();
    });
    this.sockets.clear();
  }
}

export const rawWebSocketService = new RawWebSocketService();