import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { getAdminAuthorizationHeader } from '../utils/auth';

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.socket = null;
    this.subscriptions = new Map();
  }

  connectStomp(onConnect, onError) {
    const baseUrl = process.env.REACT_APP_WS_URL || 'http://localhost:8080';
    const socketUrl = `${baseUrl.replace(/\/$/, '')}/ws`;
    const authHeader = getAdminAuthorizationHeader();

    const sockJsOptions = this.buildSockJsOptions(authHeader);

    this.socket = new SockJS(socketUrl, null, sockJsOptions);

    this.stompClient = new Client({
      webSocketFactory: () => this.socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      connectHeaders: this.getWebSocketAuthHeaders(authHeader),
      
      onConnect: (frame) => {
        console.log('STOMP Connected:', frame);
        onConnect && onConnect(frame);
      },
      
      onStompError: (frame) => {
        console.error('STOMP Error:', frame);
        onError && onError(frame);
      },
      
      onWebSocketError: (error) => {
        console.error('WebSocket Error:', error);
        onError && onError(error);
      },
      
      onDisconnect: () => {
        console.log('STOMP Disconnected');
      }
    });

    this.stompClient.activate();
  }

  getWebSocketAuthHeaders(authHeader = getAdminAuthorizationHeader()) {
    if (!authHeader) {
      console.warn('No admin authorization header available for WebSocket');
      return {};
    }

    return {
      Authorization: authHeader
    };
  }

  buildSockJsOptions(authHeader) {
    if (!authHeader) {
      return undefined;
    }

    const headers = { Authorization: authHeader };

    return {
      headers,
      transportOptions: {
        'xhr-streaming': { headers },
        'xhr-polling': { headers },
        'xdr-streaming': { headers },
        'xdr-polling': { headers },
        // eventsource transport is used when available in the browser
        eventsource: { headers }
      }
    };
  }

  subscribeToJob(jobId, callback) {
    if (!this.stompClient || !this.stompClient.connected) {
      console.error('STOMP client not connected');
      return null;
    }

    const subscription = this.stompClient.subscribe(
      `/topic/jobs/${jobId}`,
      (message) => {
        try {
          const payload = JSON.parse(message.body);
          console.log('WebSocket message:', payload);
          callback(payload);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      }
    );

    this.subscriptions.set(jobId, subscription);
    return subscription;
  }

  unsubscribeFromJob(jobId) {
    const subscription = this.subscriptions.get(jobId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(jobId);
    }
  }

  disconnect() {
    this.subscriptions.forEach((subscription, jobId) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();

    if (this.stompClient) {
      this.stompClient.deactivate();
    }
  }

  isConnected() {
    return this.stompClient && this.stompClient.connected;
  }
}

export const webSocketService = new WebSocketService();