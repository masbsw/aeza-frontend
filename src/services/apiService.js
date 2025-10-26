import { API_ENDPOINTS } from '../constants/config';
import { withBasicAuth } from '../utils/auth';

class ApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://138.124.14.169:8080';
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    console.log(`🌐 API Request: ${url}`, options);
    
    const config = {
      headers: {
        ...withBasicAuth(),
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      console.log(`API Response: ${response.status}`, response);

      if (response.status === 401) {
        throw new Error('Authentication failed: Invalid admin credentials');
      }

      if (response.status === 403) {
        throw new Error('Access denied: ADMIN role required');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 API Response data:', data);
      return data;
    } catch (error) {
      console.error('❌ API Request failed:', error);
      throw error;
    }
  }

  async submitCheck(targetUrl, checkTypes = []) {
    const body = {
      target: targetUrl,
      checkTypes: checkTypes
    };

    return await this.request(API_ENDPOINTS.CHECKS.CREATE, {
      method: 'POST',
      body
    });
  }

  async getTaskStatus(jobId) {
    const endpoint = API_ENDPOINTS.CHECKS.STATUS.replace(':jobId', jobId);
    return await this.request(endpoint);
  }

  async getAgentMetrics() {
   return await this.request('/api/metrics/agents');
  }
}

export const apiService = new ApiService();