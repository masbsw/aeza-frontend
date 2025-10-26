import React, { useState, useEffect, useRef, useCallback } from 'react';
import CheckForm from './components/CheckForm';
import Results from './components/Results';
import { apiService } from './services/apiService';
import './styles/App.css';

const POLLING_INTERVAL = 2000;

function App() {
  const [currentTask, setCurrentTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');
  const [urlSubmitted, setUrlSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [agentMetrics, setAgentMetrics] = useState([]);
  const [backendReady, setBackendReady] = useState(false);

  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    console.log('DEBUG Current Task:', currentTask);
    if (currentTask?.results) {
      console.log('DEBUG Results data:', currentTask.results);
      console.log('DEBUG Check type:', currentTask.checkType);
    }
  }, [currentTask]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const refreshAgentMetrics = useCallback(async () => {
    try {
      const metrics = await apiService.getAgentMetrics();
      setAgentMetrics(metrics);
    } catch (metricsError) {
      console.error('Failed to load agent metrics:', metricsError);
      setAgentMetrics(getMockAgentMetrics());
    }
  }, []);

  const handleStatusUpdate = useCallback((statusPayload) => {
    if (!statusPayload) {
      return;
    }

    const statusValue = statusPayload.status || statusPayload.state;
    const resultPayload = statusPayload.result || statusPayload.data?.result || statusPayload.data;

    setCurrentTask((prev) => {
      if (!prev) {
        return prev;
      }

      const update = { ...prev };

      if (statusValue) {
        update.status = statusValue.toString().toLowerCase();
        update.progress = getProgressFromStatus(statusValue);
      }

      if (resultPayload) {
        update.results = resultPayload;
      }

      if (statusValue && ['COMPLETED', 'FAILED'].includes(statusValue)) {
        update.progress = 100;
        update.completedAt = new Date().toLocaleTimeString();
      }

      return update;
    });

    if (statusValue && ['COMPLETED', 'FAILED'].includes(statusValue)) {
      stopPolling();
      if (statusValue === 'COMPLETED') {
        refreshAgentMetrics();
      }
    }
  }, [refreshAgentMetrics, stopPolling]);

  const startStatusPolling = useCallback((jobId) => {
    const poll = async () => {
      try {
        const status = await apiService.getTaskStatus(jobId);
        handleStatusUpdate(status);
      } catch (pollError) {
        console.error('Failed to poll job status:', pollError);
      }
    };

    stopPolling();
    poll();
    pollingIntervalRef.current = setInterval(poll, POLLING_INTERVAL);
  }, [handleStatusUpdate, stopPolling]);

  useEffect(() => {
    const initializeBackend = async () => {
      console.log('Checking backend connection...');

      try {
        const metrics = await apiService.getAgentMetrics();
        setAgentMetrics(metrics);
        setBackendReady(true);
        console.log('Backend is fully operational');
      } catch (initError) {
        console.error('Failed to connect to backend:', initError);
        setAgentMetrics(getMockAgentMetrics());
      }
    };

    initializeBackend();

    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const handleCheckStart = async (checkType) => {
    console.log('Starting check:', checkType);
    setLoading(true);
    setError('');

    try {
      if (backendReady) {
        await startBackendCheck(checkType);
      } else {
        await startMockCheck(checkType);
      }
    } catch (checkError) {
      console.error('Error in check:', checkError);
      await startMockCheck(checkType);
    } finally {
      setLoading(false);
    }
  };

  const startBackendCheck = async (checkType) => {
    try {
      stopPolling();

      const checkTypes = mapCheckTypeToBackend(checkType);
      const task = await apiService.submitCheck(targetUrl, checkTypes);

      console.log('Backend task created:', task);

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
      startStatusPolling(task.jobId);
    } catch (error) {
      console.error('Backend check failed:', error);
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

  const getProgressFromStatus = (status) => {
    const normalizedStatus = status ? status.toString().toUpperCase() : '';
    const progressMap = {
      'PENDING': 30,
      'IN_PROGRESS': 60,
      'COMPLETED': 100,
      'FAILED': 100
    };

    return progressMap[normalizedStatus] || 40;
  };

  const handleUrlSubmit = async (url) => {
    setLoading(true);
    setError('');
    try {
      setTargetUrl(url);
      setUrlSubmitted(true);
      setCurrentTask(null);
    } catch (urlError) {
      setError('Ошибка при обработке URL: ' + urlError.message);
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
    stopPolling();
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