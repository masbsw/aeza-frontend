import React, { useState, useEffect, useRef, useCallback } from 'react';
import CheckForm from './components/CheckForm';
import Results from './components/Results';
import { apiService } from './services/apiService';
import { webSocketService } from './services/websocketService';
import { CONFIG } from './constants/config';
import './styles/App.css';

const parseEnvBoolean = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim().toLowerCase();

  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) {
    return false;
  }

  return null;
};

function App() {
  const [currentTask, setCurrentTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');
  const [urlSubmitted, setUrlSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [agentMetrics, setAgentMetrics] = useState([]);
  const [backendAvailable, setBackendAvailable] = useState(false);
  
  const currentTaskRef = useRef();
  const jobIdRef = useRef();

  useEffect(() => {
    console.log('DEBUG Current Task:', currentTask);
    if (currentTask?.results) {
      console.log('DEBUG Results data:', currentTask.results);
      console.log('DEBUG Check type:', currentTask.checkType);
    }
  }, [currentTask]);

  useEffect(() => {
    currentTaskRef.current = currentTask;
  }, [currentTask]);

  useEffect(() => {
    const checkBackendConnection = async () => {
      console.log('Checking backend connection...');

      const mockPreference = parseEnvBoolean(process.env.REACT_APP_USE_MOCK);
      const connectWebSocket = () => {
        if (webSocketService.isConnected()) {
          return;
        }

        webSocketService.connectStomp(
          () => console.log('WebSocket connected'),
          (error) => console.warn('WebSocket connection warning:', error)
        );
      };

      if (mockPreference === true) {
        setBackendAvailable(false);
        console.info('Mock mode forced via REACT_APP_USE_MOCK=TRUE. Using mock data.');
        return;
      }

      try {
        await apiService.getAgentMetrics();

        setBackendAvailable(true);
        console.log('Backend is fully operational');
        connectWebSocket();
      } catch (error) {
        if (mockPreference === false) {
          setBackendAvailable(true);
          console.warn(
            'Backend check failed, but REACT_APP_USE_MOCK=FALSE forces backend usage:',
            error.message
          );
          connectWebSocket();
          return;
        }

        setBackendAvailable(false);
        console.warn('Backend not available, using mock data:', error.message);
      }
    };

    checkBackendConnection();
  }, []);

  const loadAgentMetrics = async () => {
    try {
      const metrics = await apiService.getAgentMetrics();
      setAgentMetrics(metrics);
    } catch (error) {
      console.log('Using mock agent metrics');
      setAgentMetrics(getMockAgentMetrics());
    }
  };

  const handleCheckStart = async (checkType) => {
    console.log('Starting check:', checkType);
    setLoading(true);
    setError('');

    try {
      if (backendAvailable) {
        console.log('Using real backend');
        await startBackendCheck(checkType);
      } else {
        console.log('Using mock data');
        await startMockCheck(checkType);
      }
    } catch (error) {
      console.error('Error in check:', error);
      await startMockCheck(checkType);
    } finally {
      setLoading(false);
    }
  };

  const startBackendCheck = async (checkType) => {
    try {
      const checkTypes = mapCheckTypeToBackend(checkType);
      const task = await apiService.submitCheck(targetUrl, checkTypes);
      
      console.log('Backend task created:', task);
      jobIdRef.current = task.jobId;

      const loadingTask = {
        taskId: task.jobId,
        url: targetUrl,
        checkType: checkType,
        status: 'running',
        progress: 20,
        results: null,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setCurrentTask(loadingTask);

      if (webSocketService.isConnected()) {
        webSocketService.subscribeToJob(task.jobId, handleWebSocketMessage);
      }

    } catch (error) {
      console.error('Backend check failed, falling back to mock:', error);
      throw error;
    }
  };

  const startMockCheck = async (checkType) => {
    console.log('Using mock data for:', checkType);
    
    const loadingTask = {
      taskId: `mock-${Date.now()}`,
      url: targetUrl,
      checkType: checkType,
      status: 'running',
      progress: 50,
      results: null,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setCurrentTask(loadingTask);

    setTimeout(() => {
      const completedTask = {
        ...loadingTask,
        status: 'completed',
        progress: 100,
        results: getMockResults(checkType, targetUrl)
      };
      setCurrentTask(completedTask);
      setAgentMetrics(getMockAgentMetrics());
    }, 1500);
  };

  const mapCheckTypeToBackend = (checkType) => {
    const typeMap = {
      'info': ['HTTP', 'DNS_LOOKUP'],
      'ping': ['PING'],
      'http': ['HTTP'],
      'dns': ['DNS_LOOKUP'],
      'tcp': ['TCP']
    };
    
    return typeMap[checkType] || ['HTTP'];
  };

  const handleWebSocketMessage = useCallback((payload) => {
    console.log('WebSocket message received:', payload);
    
    setCurrentTask(prev => {
      if (!prev) return prev;

      const update = { ...prev };
      
      switch (payload.type) {
        case 'JOB_CREATED':
          update.status = 'pending';
          update.progress = 30;
          break;
          
        case 'JOB_UPDATED':
          update.status = payload.status.toLowerCase();
          update.progress = getProgressFromStatus(payload.status);
          break;
          
        case 'JOB_COMPLETED':
          update.status = 'completed';
          update.progress = 100;
          update.results = payload.data?.result || payload.data;
          update.completedAt = new Date().toLocaleTimeString();
          break;
          
        default:
          break;
      }
      
      return update;
    });

    if (payload.type === 'JOB_COMPLETED' || payload.status === 'FAILED') {
      setTimeout(() => {
        if (jobIdRef.current) {
          webSocketService.unsubscribeFromJob(jobIdRef.current);
          jobIdRef.current = null;
        }
      }, 3000);
    }
  }, []);

  const getProgressFromStatus = (status) => {
    const progressMap = {
      'PENDING': 30,
      'IN_PROGRESS': 60,
      'COMPLETED': 100,
      'FAILED': 100
    };
    
    return progressMap[status] || 40;
  };

  const handleUrlSubmit = async (url) => {
    setLoading(true);
    setError('');
    try {
      setTargetUrl(url);
      setUrlSubmitted(true);
      setCurrentTask(null);
    } catch (error) {
      setError('Ошибка при обработке URL: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setUrlSubmitted(false);
    setTargetUrl('');
    setCurrentTask(null);
    setError('');
    setAgentMetrics([]);
    
    if (jobIdRef.current) {
      webSocketService.unsubscribeFromJob(jobIdRef.current);
      jobIdRef.current = null;
    }
  };

  return (
    <div className="app">
      <div className="container">
        {error && <div className="error-message">{error}</div>}
        
        <main className="app-main">
          <CheckForm 
            onSubmit={handleUrlSubmit}
            onCheckStart={handleCheckStart}
            onReset={handleReset}
            loading={loading}
            urlSubmitted={urlSubmitted}
            targetUrl={targetUrl}
            currentTask={currentTask}
          />
          
          {currentTask && (
            <Results 
              {...currentTask} 
              agentMetrics={agentMetrics}
            />
          )}
        </main>
      </div>
    </div>
  );
}

const getMockResults = (checkType, targetUrl) => {
  const hostname = targetUrl.replace(/^https?:\/\//, '').split('/')[0];
  
  const mockData = {
    info: {
      ip: '93.184.216.34',
      hostname: hostname,
      country: 'United States',
      countryCode: 'US',
      region: 'Massachusetts',
      city: 'Boston',
      postalCode: '02101',
      latitude: 42.3584,
      longitude: -71.0598,
      timezone: 'America/New_York',
      localTime: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }),
      asn: 'AS15133',
      isp: 'Google LLC',
      organization: 'Google Cloud',
      currency: 'USD',
      languages: 'en',
      continent: 'North America',
      sources: [
        {
          name: 'IPGeolocation.io',
          date: new Date().toLocaleDateString('en-GB'),
          ipRange: '93.184.216.0-93.184.216.255 CIDR',
          city: 'Boston',
          postalCode: '02101',
          accuracy: 'High'
        }
      ]
    },
    ping: {
      target: hostname,
      packetsTransmitted: 4,
      packetsReceived: 4,
      packetLoss: 0,
      min: 12.5,
      avg: 15.2,
      max: 18.7,
      stddev: 2.1
    },
    http: {
      url: targetUrl,
      statusCode: 200,
      statusMessage: 'OK',
      responseTime: 245,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'server': 'nginx',
        'x-powered-by': 'Express'
      },
      ssl: {
        valid: true,
        expires: '2024-12-31T23:59:59.000Z'
      }
    },
    dns: {
      hostname: hostname,
      records: {
        A: ['93.184.216.34'],
        AAAA: ['2606:2800:220:1:248:1893:25c8:1946'],
        NS: ['ns1.example.com', 'ns2.example.com'],
        MX: ['10 mail.example.com']
      },
      queryTime: 45
    },
    tcp: {
      host: hostname,
      port: 80,
      status: 'open',
      responseTime: 12.3,
      service: 'http'
    }
  };

  return { [checkType]: mockData[checkType] || mockData.info };
};

const getMockAgentMetrics = () => {
  return [
    {
      id: 'agent-1',
      name: 'US East Agent',
      status: 'online',
      location: 'New York, US',
      checksCompleted: 1245,
      avgResponseTime: 45.2
    },
    {
      id: 'agent-2', 
      name: 'EU Central Agent',
      status: 'online',
      location: 'Frankfurt, DE',
      checksCompleted: 987,
      avgResponseTime: 32.1
    }
  ];
};

export default App;