import { CONFIG } from '../constants/config';
import { mockWebSocketService } from './mockWebSocketService';

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
      // УТОЧНИТЬ WebSocket URL
      const wsUrl = `${CONFIG.WS_URL}/${jobId}`;
      console.log('🚀 Connecting to real WebSocket:', wsUrl);
      this.socket = new WebSocket(wsUrl);
      
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
}}

export const websocketService = new WebSocketService();