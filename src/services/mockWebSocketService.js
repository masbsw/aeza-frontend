import { adaptFromCheckHost } from '../adapters/CheckHostAdapter';

class MockWebSocketService {
  constructor() {
    this.socket = null;
    this.subscriptions = new Map();
    this.intervals = new Map();
  }

  connect(jobId, checkType, targetUrl) {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.socket = { 
          readyState: 1,
          close: () => this.disconnect(jobId)
        };
        
        this.startMockUpdates(jobId, checkType, targetUrl);
        resolve();
      }, 500);
    });
  }

  subscribe(jobId, callback) {
    this.subscriptions.set(jobId, callback);
  }

  startMockUpdates(jobId, checkType, targetUrl) {
    let progress = 0;
    
    const interval = setInterval(() => {
      progress += Math.random() * 25;
      
      if (progress >= 100) {
        progress = 100;
        this.sendFinalResult(jobId, checkType, targetUrl);
        clearInterval(interval);
        this.intervals.delete(jobId);
      } else {
        this.sendProgressUpdate(jobId, progress, checkType);
      }
    }, 1000);

    this.intervals.set(jobId, interval);
  }

  sendProgressUpdate(jobId, progress, checkType) {
    const callback = this.subscriptions.get(jobId);
    if (callback) {
      callback({
        jobId,
        status: 'running',
        progress: Math.min(progress, 100),
        executedAt: new Date().toISOString(),
        partialResult: this.generatePartialResult(checkType, progress)
      });
    }
  }

sendFinalResult(jobId, checkType, targetUrl) {
  const callback = this.subscriptions.get(jobId);
  if (callback) {
    const finalData = {
      jobId,
      status: 'completed',
      progress: 100,
      executedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      totalDurationMillis: Math.random() * 2000 + 1000,
      result: this.generateFinalResult(checkType, targetUrl) 
    };
    
    console.log('📤 Mock WebSocket sending final result:', finalData);
    callback(finalData);
    
    setTimeout(() => {
      this.sendAgentMetrics(jobId);
    }, 500);
  }
}
  sendAgentMetrics(jobId) {
    const callback = this.subscriptions.get(jobId);
    if (callback) {
      callback({
        jobId,
        type: 'agent_metrics',
        metrics: this.generateAgentMetrics()
      });
    }
  }

  generatePartialResult(checkType, progress) {
    const baseData = {
      "de1.node.check-host.net": this.generateNodePartialData(checkType, progress),
      "us1.node.check-host.net": this.generateNodePartialData(checkType, progress * 0.8)
    };
    
    return baseData;
  }

  generateNodePartialData(checkType, progress) {
    switch(checkType) {
      case 'ping':
        return [
          [
            progress > 25 ? ["OK", 0.045, "142.250.185.206"] : ["...", null, null],
            progress > 50 ? ["OK", 0.042] : ["...", null],
            progress > 75 ? ["OK", 0.048] : ["...", null],
            ["...", null]
          ]
        ];
      case 'http':
        return [
          progress > 50 ? [1, 0.136, "OK", "200", "142.250.185.206"] : [0, null, "...", null, null]
        ];
      default:
        return [[]];
    }
  }

  generateFinalResult(checkType, targetUrl) {
    const rawData = this.generateRawCheckHostData(checkType);
    
    return this.adaptToUiFormat(rawData, checkType, targetUrl);
  }

  generateRawCheckHostData(checkType) {
    const nodes = {
      "de1.node.check-host.net": this.generateNodeData(checkType, 'de'),
      "us1.node.check-host.net": this.generateNodeData(checkType, 'us'),
      "ru1.node.check-host.net": this.generateNodeData(checkType, 'ru'),
      "jp1.node.check-host.net": this.generateNodeData(checkType, 'jp')
    };

    return nodes;
  }

  generateNodeData(checkType, country) {
    const baseIP = this.getRandomIP(country);
    
    switch(checkType) {
      case 'ping':
        return [
          [
            ["OK", 0.045, baseIP],
            ["OK", 0.042],
            ["OK", 0.048],
            ["OK", 0.043]
          ]
        ];
      case 'http':
        return [
          [1, 0.136, "OK", "200", baseIP]
        ];
      case 'tcp':
        return [
          { "address": baseIP, "time": 0.044 }
        ];
      case 'dns':
        return [
          { "A": [baseIP], "AAAA": [], "TTL": 381 }
        ];
      default:
        return [[]];
    }
  }

  getRandomIP(country) {
    const ips = {
      'de': '142.250.185.206',
      'us': '104.16.249.249',
      'ru': '158.160.46.143',
      'jp': '133.242.238.185'
    };
    return ips[country] || '8.8.8.8';
  }

  adaptToUiFormat(rawData, checkType, targetUrl) {
    return adaptFromCheckHost(rawData, checkType, targetUrl);
  }

  generateAgentMetrics() {
    const agents = ['de1-agent', 'us1-agent', 'ru1-agent', 'jp1-agent'];
    const metrics = [];
    
    agents.forEach(agent => {
      metrics.push(
        {
          agentName: agent,
          metricType: 'AGENT_AVAILABILITY',
          value: Math.random() * 20 + 80, 
          timestamp: new Date().toISOString()
        },
        {
          agentName: agent,
          metricType: 'REQUEST_COUNT',
          value: Math.floor(Math.random() * 1000) + 500,
          timestamp: new Date().toISOString()
        },
        {
          agentName: agent,
          metricType: 'RESPONSE_DELAY',
          value: Math.random() * 50 + 10, 
          timestamp: new Date().toISOString()
        }
      );
    });
    
    return metrics;
  }

  disconnect(jobId) {
    const interval = this.intervals.get(jobId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(jobId);
    }
    this.subscriptions.delete(jobId);
  }
}

export const mockWebSocketService = new MockWebSocketService();