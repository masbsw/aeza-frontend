import { CONFIG } from '../constants/config';
import { mockWebSocketService } from './mockWebSocketService';
import { withWebSocketCredentials } from '../utils/auth';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.subscriptions = new Map();
  }

  async connect(jobId, checkType, targetUrl) {
    console.log('🌐 WebSocket connection attempt...');
    
    if (CONFIG.USE_MOCK) {
      console.log('🔧 Using mock WebSocket');
      return mockWebSocketService.connect(jobId, checkType, targetUrl);
    } else {
      console.log('🚀 Connecting to real WebSocket:', CONFIG.WS_URL);
      return this.connectToRealBackend(jobId);
    }
  }

  async connectToRealBackend(jobId) {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = this.buildSocketUrl(jobId);
        console.log('🚀 Connecting to real WebSocket:', wsUrl);
        const authorizedUrl = withWebSocketCredentials(wsUrl);
        this.socket = new WebSocket(authorizedUrl);
        
        this.socket.onopen = () => {
          console.log('WebSocket connected to real backend');
          this.isConnected = true;
          resolve();
        };
        
        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Real WebSocket message:', data);
            this.handleRealMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
        
        this.socket.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          this.isConnected = false;
        };
        
      } catch (error) {
        console.error('WebSocket connection failed:', error);
        reject(error);
      }
    });
  }

  buildSocketUrl(jobId) {
    const baseUrl = CONFIG.WS_URL.endsWith('/') ? CONFIG.WS_URL.slice(0, -1) : CONFIG.WS_URL;
    return `${baseUrl}/${jobId}`;
  }
}

export const websocketService = new WebSocketService();
