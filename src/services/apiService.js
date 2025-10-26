// services/apiService.js
import { CONFIG } from '../constants/config';
import { adaptFromCheckHost } from '../adapters/CheckHostAdapter';
import { withBasicAuth } from '../utils/auth';

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
        const response = await fetch(`${this.baseURL}/checks`, {
          method: 'POST',
          headers: withBasicAuth({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }),
          body: JSON.stringify({
            target: target,
            checkType: checkType
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('backend response:', data);
        
        return {
          taskId: data.jobId || data.id || data.taskId,
          target: data.target,
          status: data.status?.toLowerCase() || 'running',
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
        
        return {
          status: data.status?.toLowerCase() || 'completed',
          progress: data.progress || 100,
          results: data.result ? adaptFromCheckHost(data.result, checkType, data.target) : null
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
}

export const apiService = new ApiService();
