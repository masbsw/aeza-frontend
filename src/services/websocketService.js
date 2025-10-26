import { CONFIG } from '../constants/config';
import { mockWebSocketService } from './mockWebSocketService';
import { withWebSocketCredentials, getAdminAuthorizationHeader } from '../utils/auth';
import SimpleStompClient from './stompClient';

const noop = () => {};

const DEFAULT_HANDLERS = {
  onCreated: noop,
  onUpdated: noop,
  onCompleted: noop,
  onLog: noop,
  onUnknown: noop,
  onError: noop,
  onRawMessage: noop,
  onRawClose: noop,
  onRawError: noop
};

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.currentSubscription = null;
    this.currentJobId = null;
    this.rawSocket = null;
    this.connectPromise = null;
  }

  async subscribeToJob(jobId, handlers = {}, options = {}) {
    const mergedHandlers = { ...DEFAULT_HANDLERS, ...handlers };

    if (CONFIG.USE_MOCK) {
      return mockWebSocketService.subscribeToJob(jobId, mergedHandlers, options);
    }

    try {
      await this.ensureStompConnection();
    } catch (error) {
      console.error('[websocket] Failed to connect to STOMP broker', error);
      mergedHandlers.onError(error);
      throw error;
    }

    this.teardownSubscription();

    this.currentJobId = jobId;
    this.currentSubscription = this.stompClient.subscribe(
      `/topic/jobs/${jobId}`,
      (frame) => {
        const payload = this.safeParse(frame.body);
        if (!payload) {
          return;
        }
        this.dispatchJobEvent(payload, mergedHandlers);
      }
    );

    this.openRawSocket(jobId, mergedHandlers, options);

    return {
      unsubscribe: () => {
        this.unsubscribe(jobId);
      }
    };
  }

  unsubscribe(jobId) {
    if (this.currentJobId !== jobId) {
      return;
    }

    this.teardownSubscription();
    this.closeRawSocket();
  }

  teardownSubscription() {
    if (this.currentSubscription) {
      try {
        this.currentSubscription();
      } catch (error) {
        console.warn('[websocket] Error during unsubscribe', error);
      }
      this.currentSubscription = null;
    }
    this.currentJobId = null;
  }

  async ensureStompConnection() {
    if (this.stompClient?.isConnected) {
      return;
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    const url = this.buildStompUrl();
    const authorization = getAdminAuthorizationHeader();
    const connectHeaders = authorization ? { Authorization: authorization } : {};

    this.stompClient = new SimpleStompClient({
      url,
      connectHeaders,
      debug: CONFIG.DEBUG_WS || false
    });

    this.connectPromise = this.stompClient.connect({
      onError: (errorFrame) => {
        console.error('[websocket] STOMP error frame received', errorFrame);
      },
      onClose: () => {
        this.connectPromise = null;
      }
    });

    try {
      await this.connectPromise;
    } finally {
      this.connectPromise = null;
    }
  }

  dispatchJobEvent(payload, handlers) {
    switch (payload.type) {
      case 'JOB_CREATED':
        handlers.onCreated(payload);
        break;
      case 'JOB_UPDATED':
        handlers.onUpdated(payload);
        break;
      case 'JOB_COMPLETED':
        handlers.onCompleted(payload);
        break;
      case 'JOB_LOG':
        handlers.onLog(payload);
        break;
      default:
        handlers.onUnknown(payload);
    }
  }

  openRawSocket(jobId, handlers, options) {
    this.closeRawSocket();

    const rawUrl = this.buildRawSocketUrl(jobId, options?.rawSocketUrl);
    if (!rawUrl) {
      return;
    }

    try {
      const authorizedUrl = withWebSocketCredentials(rawUrl);
      this.rawSocket = new WebSocket(authorizedUrl);

      this.rawSocket.onmessage = (event) => {
        const payload = this.safeParse(event.data);
        if (payload) {
          handlers.onRawMessage(payload);
        }
      };

      this.rawSocket.onerror = (event) => {
        handlers.onRawError(event);
      };

      this.rawSocket.onclose = (event) => {
        handlers.onRawClose(event);
      };
    } catch (error) {
      console.error('[websocket] Failed to open raw socket', error);
      handlers.onRawError(error);
    }
  }

  closeRawSocket() {
    if (this.rawSocket) {
      try {
        this.rawSocket.close();
      } catch (error) {
        console.warn('[websocket] Error closing raw socket', error);
      }
      this.rawSocket = null;
    }
  }

  buildStompUrl() {
    const base = CONFIG.WS_URL || '';
    if (!base) {
      throw new Error('WS_URL is not configured');
    }

    let normalized = this.normalizeToWsProtocol(base);

    if (!normalized.endsWith('/websocket')) {
      normalized = normalized.replace(/\/?$/, '/websocket');
    }

    return withWebSocketCredentials(normalized);
  }

  normalizeToWsProtocol(url) {
    let normalized = url.trim();

    if (normalized.startsWith('http://')) {
      normalized = 'ws://' + normalized.slice('http://'.length);
    } else if (normalized.startsWith('https://')) {
      normalized = 'wss://' + normalized.slice('https://'.length);
    }

    if (!normalized.startsWith('ws://') && !normalized.startsWith('wss://')) {
      normalized = `ws://${normalized.replace(/^\//, '')}`;
    }

    return normalized;
  }

  buildRawSocketUrl(jobId, overrideUrl) {
    if (overrideUrl) {
      return overrideUrl;
    }

    if (!CONFIG.API_URL) {
      return null;
    }

    try {
      const apiUrl = new URL(CONFIG.API_URL);
      const protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
      const basePath = apiUrl.pathname.replace(/\/$/, '');
      const socketPath = `${basePath}/checks/socket/${jobId}`.replace('//', '/');
      return `${protocol}//${apiUrl.host}${socketPath.startsWith('/') ? '' : '/'}${socketPath}`;
    } catch (error) {
      console.warn('[websocket] Failed to parse API_URL, falling back to WS_URL', error);
      if (CONFIG.WS_URL) {
        try {
          const fallbackUrl = new URL(this.normalizeToWsProtocol(CONFIG.WS_URL));
          return `${fallbackUrl.protocol}//${fallbackUrl.host}/api/checks/socket/${jobId}`;
        } catch (fallbackError) {
          console.warn('[websocket] Failed to derive fallback raw socket URL', fallbackError);
        }
      }
    }

    return null;
  }

  safeParse(data) {
    if (!data) {
      return null;
    }

    try {
      return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (error) {
      console.warn('[websocket] Failed to parse JSON message', error, data);
      return null;
    }
  }

  disconnect() {
    this.teardownSubscription();
    this.closeRawSocket();
    if (this.stompClient) {
      this.stompClient.disconnect();
      this.stompClient = null;
    }
  }
}

export const websocketService = new WebSocketService();
