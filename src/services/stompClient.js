class SimpleStompClient {
  constructor({ url, connectHeaders = {}, debug = false }) {
    this.url = url;
    this.connectHeaders = connectHeaders;
    this.debug = debug;
    this.socket = null;
    this.isConnected = false;
    this.subscriptions = new Map();
    this.subscriptionId = 0;
    this.messageBuffer = '';
    this.connectPromise = null;
    this.disconnectRequested = false;
    this.handshakeCompleted = false;
    this.eventHandlers = {
      connect: null,
      error: null,
      close: null
    };
  }

  log(...args) {
    if (this.debug && typeof console !== 'undefined') {
      console.log('[stomp]', ...args);
    }
  }

  error(...args) {
    if (typeof console !== 'undefined') {
      console.error('[stomp]', ...args);
    }
  }

  connect({ onConnect, onError, onClose } = {}) {
    if (this.connectPromise) {
      return this.connectPromise;
    }

    if (this.isConnected) {
      return Promise.resolve();
    }

    this.eventHandlers.connect = onConnect || null;
    this.eventHandlers.error = onError || null;
    this.eventHandlers.close = onClose || null;

    this.disconnectRequested = false;

    this.connectPromise = new Promise((resolve, reject) => {
      try {
        this.log('Opening WebSocket connection to', this.url);
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
          this.log('WebSocket connected, sending CONNECT frame');
          this.sendFrame('CONNECT', {
            'accept-version': '1.1,1.2',
            'heart-beat': '10000,10000',
            ...this.connectHeaders
          });
        };

        this.socket.onmessage = (event) => {
          this.handleRawMessage(event.data, resolve, reject);
        };

        this.socket.onerror = (event) => {
          this.error('WebSocket error', event);
          if (!this.isConnected) {
            reject(event);
          }
          if (this.eventHandlers.error) {
            this.eventHandlers.error(event);
          }
        };

        this.socket.onclose = (event) => {
          this.log('WebSocket closed', event.code, event.reason);
          this.isConnected = false;
          this.connectPromise = null;
          if (!this.disconnectRequested && !this.isConnected && !this.handshakeCompleted) {
            reject(event);
          }
          if (this.eventHandlers.close) {
            this.eventHandlers.close(event);
          }
        };
      } catch (error) {
        this.connectPromise = null;
        reject(error);
      }
    });

    return this.connectPromise;
  }

  handleRawMessage(payload, resolveConnect, rejectConnect) {
    if (typeof payload !== 'string') {
      return;
    }

    this.messageBuffer += payload;

    let frameDelimiterIndex;
    while ((frameDelimiterIndex = this.messageBuffer.indexOf('\0')) !== -1) {
      const rawFrame = this.messageBuffer.slice(0, frameDelimiterIndex);
      this.messageBuffer = this.messageBuffer.slice(frameDelimiterIndex + 1);

      if (rawFrame === '\n' || rawFrame.trim() === '') {
        continue;
      }

      const frame = this.parseFrame(rawFrame);
      this.log('Received frame', frame.command, frame.headers);

      switch (frame.command) {
        case 'CONNECTED':
          this.isConnected = true;
          this.handshakeCompleted = true;
          this.connectPromise = null;
          if (resolveConnect) {
            resolveConnect();
          }
          if (this.eventHandlers.connect) {
            this.eventHandlers.connect(frame);
          }
          break;
        case 'MESSAGE':
          this.handleMessageFrame(frame);
          break;
        case 'RECEIPT':
          break;
        case 'ERROR':
          this.error('STOMP ERROR frame', frame.headers, frame.body);
          if (rejectConnect) {
            rejectConnect(frame);
          }
          if (this.eventHandlers.error) {
            this.eventHandlers.error(frame);
          }
          break;
        default:
          this.log('Unhandled STOMP frame', frame);
      }
    }
  }

  parseFrame(rawFrame) {
    const lines = rawFrame.split('\n');
    const command = lines.shift().trim();
    const headers = {};
    let bodyStartIndex = lines.indexOf('');

    if (bodyStartIndex === -1) {
      bodyStartIndex = lines.length;
    }

    for (let i = 0; i < bodyStartIndex; i++) {
      const line = lines[i];
      const separatorIndex = line.indexOf(':');
      if (separatorIndex > 0) {
        const key = line.slice(0, separatorIndex).trim();
        const value = line.slice(separatorIndex + 1).trim();
        headers[key] = value;
      }
    }

    const bodyLines = lines.slice(bodyStartIndex + 1);
    const body = bodyLines.join('\n');

    return { command, headers, body };
  }

  handleMessageFrame(frame) {
    const subscriptionId = frame.headers.subscription;
    const callback = this.subscriptions.get(subscriptionId);

    if (callback) {
      try {
        callback(frame);
      } catch (error) {
        this.error('Error in subscription handler', error);
      }
    }
  }

  sendFrame(command, headers = {}, body = '') {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.log('Attempted to send frame while socket not open', command);
      return;
    }

    const headerLines = Object.entries(headers)
      .map(([key, value]) => `${key}:${value}`)
      .join('\n');

    const frame = [command, headerLines, '', body].join('\n') + '\0';
    this.log('Sending frame', command, headers);
    this.socket.send(frame);
  }

  subscribe(destination, callback, headers = {}) {
    const id = `sub-${++this.subscriptionId}`;
    this.subscriptions.set(id, callback);

    this.sendFrame('SUBSCRIBE', {
      id,
      destination,
      ack: 'auto',
      ...headers
    });

    return () => {
      this.unsubscribe(id);
    };
  }

  unsubscribe(id) {
    if (!this.subscriptions.has(id)) {
      return;
    }

    this.sendFrame('UNSUBSCRIBE', { id });
    this.subscriptions.delete(id);
  }

  disconnect() {
    this.disconnectRequested = true;
    this.handshakeCompleted = false;

    if (this.isConnected) {
      this.sendFrame('DISCONNECT');
    }

    if (this.socket) {
      try {
        this.socket.close();
      } catch (error) {
        this.error('Error closing WebSocket', error);
      }
    }

    this.subscriptions.clear();
    this.isConnected = false;
    this.connectPromise = null;
  }
}

export default SimpleStompClient;
