import { adaptFromCheckHost } from '../adapters/CheckHostAdapter';

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

class MockWebSocketService {
  constructor() {
    this.intervals = new Map();
    this.handlers = new Map();
  }

  async subscribeToJob(jobId, handlers = {}, { checkType = 'http', targetUrl = '' } = {}) {
    const mergedHandlers = { ...DEFAULT_HANDLERS, ...handlers };
    this.handlers.set(jobId, mergedHandlers);

    mergedHandlers.onCreated({
      type: 'JOB_CREATED',
      jobId,
      status: 'PENDING',
      timestamp: new Date().toISOString(),
      data: null
    });

    this.startMockUpdates(jobId, checkType, targetUrl);

    return {
      unsubscribe: () => this.disconnect(jobId)
    };
  }

  startMockUpdates(jobId, checkType, targetUrl) {
    let progress = 0;

    const interval = setInterval(() => {
      progress += Math.random() * 30;

      if (progress >= 100) {
        this.sendFinalResult(jobId, checkType, targetUrl);
        clearInterval(interval);
        this.intervals.delete(jobId);
      } else {
        this.sendProgressUpdate(jobId, progress, checkType, targetUrl);
      }
    }, 800);

    this.intervals.set(jobId, interval);
  }

  sendProgressUpdate(jobId, progress, checkType, targetUrl) {
    const handlers = this.handlers.get(jobId);
    if (!handlers) {
      return;
    }

    const partialRaw = this.generatePartialResult(checkType, progress);
    handlers.onRawMessage({
      type: checkType,
      data: partialRaw
    });

    handlers.onUpdated({
      type: 'JOB_UPDATED',
      jobId,
      status: 'IN_PROGRESS',
      timestamp: new Date().toISOString(),
      data: {
        progress: Math.min(progress, 99),
        partialResult: partialRaw,
        target: targetUrl
      }
    });
  }

  sendFinalResult(jobId, checkType, targetUrl) {
    const handlers = this.handlers.get(jobId);
    if (!handlers) {
      return;
    }

    const adaptedResult = this.generateFinalResult(checkType, targetUrl);

    handlers.onCompleted({
      type: 'JOB_COMPLETED',
      jobId,
      status: 'COMPLETED',
      timestamp: new Date().toISOString(),
      data: {
        jobId,
        status: 'COMPLETED',
        siteCheckResponse: {
          target: targetUrl,
          checkTypes: [checkType.toUpperCase()],
          results: adaptedResult
        }
      }
    });
  }

  generatePartialResult(checkType, progress) {
    const factor = Math.max(progress / 100, 0.3);
    switch (checkType) {
      case 'ping':
        return {
          agent: 'mock-agent-1',
          rtt: (40 * factor).toFixed(2)
        };
      case 'http':
        return {
          agent: 'mock-agent-1',
          status: 200,
          latency: (120 * factor).toFixed(0)
        };
      case 'dns':
        return {
          agent: 'mock-agent-1',
          records: ['158.160.46.143']
        };
      case 'tcp':
        return {
          agent: 'mock-agent-1',
          portOpen: true,
          latency: (70 * factor).toFixed(0)
        };
      default:
        return {
          message: 'Partial data',
          progress: Math.round(progress)
        };
    }
  }

  generateFinalResult(checkType, targetUrl) {
    const rawData = this.generateRawCheckHostData(checkType);
    return adaptFromCheckHost(rawData, checkType, targetUrl);
  }

  generateRawCheckHostData(checkType) {
    const nodes = {
      'de1.node.check-host.net': this.generateNodeData(checkType, 'de'),
      'us1.node.check-host.net': this.generateNodeData(checkType, 'us'),
      'ru1.node.check-host.net': this.generateNodeData(checkType, 'ru'),
      'jp1.node.check-host.net': this.generateNodeData(checkType, 'jp')
    };

    return nodes;
  }

  generateNodeData(checkType, country) {
    const baseIP = this.getRandomIP(country);

    switch (checkType) {
      case 'ping':
        return [
          [
            ['OK', 0.045, baseIP],
            ['OK', 0.042],
            ['OK', 0.048],
            ['OK', 0.043]
          ]
        ];
      case 'http':
        return [
          [1, 0.136, 'OK', '200', baseIP]
        ];
      case 'tcp':
        return [
          { address: baseIP, time: 0.044 }
        ];
      case 'dns':
        return [
          { A: [baseIP], AAAA: [], TTL: 381 }
        ];
      default:
        return [[]];
    }
  }

  getRandomIP(country) {
    const ips = {
      de: '142.250.185.206',
      us: '104.16.249.249',
      ru: '158.160.46.143',
      jp: '133.242.238.185'
    };
    return ips[country] || '8.8.8.8';
  }

  disconnect(jobId) {
    const interval = this.intervals.get(jobId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(jobId);
    }
    this.handlers.delete(jobId);
  }
}

export const mockWebSocketService = new MockWebSocketService();
