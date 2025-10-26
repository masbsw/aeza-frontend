import { CONFIG } from '../constants/config';
import { withBasicAuth } from '../utils/auth';
import { adaptJobResults } from './resultAdapter';
import { extractHost, extractPort } from '../validation';

const CHECK_TYPE_MAP = {
  http: 'HTTP',
  ping: 'PING',
  dns: 'DNS_LOOKUP',
  tcp: 'TCP',
  traceroute: 'TRACEROUTE'
};

const DEFAULT_TCP_PORT = 80;

class ApiService {
  constructor() {
    this.baseURL = CONFIG.API_URL;
    this.isBackendReady = CONFIG.BACKEND_READY;
  }

  async submitCheck(target, checkType) {
    console.log(`Submitting ${checkType} check for ${target}`);

    if (CONFIG.USE_MOCK) {
      console.log('Using mock data (backend not ready)');
      const mockApi = await import('../api/mockApi');
      return mockApi.default.submitCheck(target, checkType);
    } else {
      try {
        const requestBody = this.buildSiteCheckRequest(target, checkType);

        const response = await fetch(`${this.baseURL}/checks`, {
          method: 'POST',
          headers: withBasicAuth({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }),
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('backend response:', data);

        return {
          taskId: data.jobId || data.id || data.taskId,
          jobId: data.jobId || data.id || data.taskId,
          target: requestBody.target || target,
          status: (data.status || 'IN_PROGRESS').toLowerCase(),
          checkType: checkType
        };

      } catch (error) {
        console.error(' Backend error, using mock data:', error);
        const mockApi = await import('../api/mockApi');
        return mockApi.default.submitCheck(target, checkType);
      }
    }
  }

  async getTaskStatus(taskId, checkType) {
    if (CONFIG.USE_MOCK) {
      const mockApi = await import('../api/mockApi');
      return mockApi.default.getTaskStatus(taskId, checkType);
    } else {
      try {
        const response = await fetch(`${this.baseURL}/checks/${taskId}`, {
          headers: withBasicAuth({
            'Accept': 'application/json'
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Real task status:', data);

        const derivedTarget = data.target || data?.siteCheck?.target || data?.siteCheckResponse?.target;

        return {
          status: (data.status || data.jobStatus || 'COMPLETED').toLowerCase(),
          progress: this.deriveProgress(data),
          results: adaptJobResults(data, checkType, derivedTarget)
        };

      } catch (error) {
        console.error('Backend error, using mock data:', error);
        const mockApi = await import('../api/mockApi');
        return mockApi.default.getTaskStatus(taskId, checkType);
      }
    }
  }

  async getAgentMetrics() {
    if (CONFIG.USE_MOCK) {
      const mockApi = await import('../api/mockApi');
      return mockApi.default.getAgentMetrics();
    } else {
      try {
        // РЕАЛЬНЫЕ МЕТРИКИ - уточнить endpoint
        const response = await fetch(`${this.baseURL}/agent/123`, {
          headers: withBasicAuth({
            'Accept': 'application/json'
          })
        }); 
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Real agent metrics:', data);
        
        return this.adaptRealMetrics(data);
        
      } catch (error) {
        console.error('Backend metrics error, using mock:', error);
        const mockApi = await import('../api/mockApi');
        return mockApi.default.getAgentMetrics();
      }
    }
  }

  adaptRealMetrics(backendMetrics) {
    if (backendMetrics.agentName) {
      return [
        {
          agentName: backendMetrics.agentName,
          metricType: 'AGENT_AVAILABILITY',
          value: (backendMetrics.averageAvailability * 100) || 95, 
          timestamp: new Date().toISOString()
        },
        {
          agentName: backendMetrics.agentName, 
          metricType: 'RESPONSE_DELAY',
          value: backendMetrics.averageLatency || 45.5,
          timestamp: new Date().toISOString()
        },
        {
          agentName: backendMetrics.agentName,
          metricType: 'REQUEST_COUNT', 
          value: backendMetrics.totalRequestCount || 1,
          timestamp: new Date().toISOString()
        }
      ];
    }
    
    if (Array.isArray(backendMetrics)) {
      return backendMetrics.flatMap(agent => [
        {
          agentName: agent.agentName,
          metricType: 'AGENT_AVAILABILITY',
          value: (agent.averageAvailability * 100) || 95,
          timestamp: new Date().toISOString()
        },
        {
          agentName: agent.agentName,
          metricType: 'RESPONSE_DELAY', 
          value: agent.averageLatency || 45.5,
          timestamp: new Date().toISOString()
        },
        {
          agentName: agent.agentName,
          metricType: 'REQUEST_COUNT',
          value: agent.totalRequestCount || 1,
          timestamp: new Date().toISOString()
        }
      ]);
    }

    return [];
  }

  buildSiteCheckRequest(target, checkType) {
    const mappedType = this.mapCheckType(checkType);
    const host = extractHost(target) || target;
    const request = {
      target: host
    };

    if (mappedType) {
      request.checkTypes = [mappedType];
    }

    if (checkType === 'tcp') {
      const port = extractPort(target) || DEFAULT_TCP_PORT;
      request.tcpConfig = {
        port
      };
    } else if (checkType === 'http') {
      const port = extractPort(target);
      if (port) {
        request.httpConfig = { port };
      }
    }

    return request;
  }

  mapCheckType(checkType) {
    if (!checkType) {
      return null;
    }

    const normalized = checkType.toLowerCase();
    return CHECK_TYPE_MAP[normalized] || normalized.toUpperCase();
  }

  deriveProgress(jobResponse) {
    if (typeof jobResponse.progress === 'number') {
      return jobResponse.progress;
    }

    const status = jobResponse.status ? jobResponse.status.toString().toUpperCase() : null;

    if (status === 'COMPLETED' || status === 'FAILED' || status === 'TIMEOUT') {
      return 100;
    }

    if (jobResponse.data && typeof jobResponse.data.progress === 'number') {
      return jobResponse.data.progress;
    }

    return 0;
  }
}

export const apiService = new ApiService();
