import React, { useState, useEffect, useRef } from 'react';
import CheckForm from './components/CheckForm';
import Results from './components/Results';
import { apiService } from './services/apiService';
import './styles/App.css';
import { ipGeolocationService } from './services/ipGeolocationService';
import { extractIPFromUrl } from './utils/ipUtils';
import { websocketService } from './services/websocketService';
import { adaptJobResults } from './services/resultAdapter';

function App() {

  const [currentTask, setCurrentTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');
  const [urlSubmitted, setUrlSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [agentMetrics, setAgentMetrics] = useState([]);
  const [jobLogs, setJobLogs] = useState([]);

  const jobSubscriptionRef = useRef(null);

  useEffect(() => {
    console.log('DEBUG Current Task:', currentTask);
    if (currentTask?.results) {
      console.log('DEBUG Results data:', currentTask.results);
      console.log('DEBUG Check type:', currentTask.checkType);
    }
  }, [currentTask]);

  useEffect(() => {
    return () => {
      if (jobSubscriptionRef.current) {
        jobSubscriptionRef.current.unsubscribe();
        jobSubscriptionRef.current = null;
      }
      websocketService.disconnect();
    };
  }, []);

  const loadAgentMetrics = async () => {
    try {
      const metrics = await apiService.getAgentMetrics();
      setAgentMetrics(metrics);
    } catch (error) {
      console.error('Error loading agent metrics:', error);
    }
  };

  const handleCheckStart = async (checkType) => {
    console.log('Starting check:', checkType);
    setLoading(true);
    setError('');

    try {
      if (checkType === 'info') {
        await startInfoCheck(checkType);
      } else {
        await startNetworkCheck(checkType);
      }
    } catch (error) {
      console.error('Error starting check:', error);
      setError(`Ошибка при запуске проверки: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const startNetworkCheck = async (checkType) => {
    try {
      const task = await apiService.submitCheck(targetUrl, checkType);
      const jobId = task.jobId || task.taskId;

      if (!jobId) {
        throw new Error('Сервер не вернул идентификатор задания');
      }

      console.log('Task created:', task);

      if (jobSubscriptionRef.current) {
        jobSubscriptionRef.current.unsubscribe();
        jobSubscriptionRef.current = null;
      }

      setJobLogs([]);

      setCurrentTask({
        taskId: jobId,
        jobId: jobId,
        url: targetUrl,
        checkType: checkType,
        status: 'pending',
        progress: 0,
        results: null,
        timestamp: new Date().toLocaleTimeString()
      });

      const subscription = await websocketService.subscribeToJob(
        jobId,
        {
          onCreated: handleJobCreated,
          onUpdated: (payload) => handleJobUpdated(payload, checkType),
          onCompleted: (payload) => handleJobCompleted(payload, checkType),
          onLog: handleJobLog,
          onError: handleJobError,
          onRawMessage: handleRawMessage,
          onRawClose: handleRawClose
        },
        {
          checkType,
          targetUrl
        }
      );

      jobSubscriptionRef.current = subscription;

    } catch (error) {
      console.error('Error starting check:', error);
      setError('Ошибка при запуске проверки');
    }
  };

const formatRealInfoData = (realData, targetUrl) => {
  return {
    ...realData,
    hostname: targetUrl.replace(/^https?:\/\//, ''),
    sources: [
      {
        name: 'IPGeolocation.io',
        date: realData.date || new Date().toLocaleDateString('en-GB'),
        ipRange: realData.ipRange || 'Unknown',
        city: realData.city || 'Unknown',
        postalCode: realData.postalCode || '',
        accuracy: 'High',
        latitude: realData.latitude,
        longitude: realData.longitude,
        currency: realData.currency,
        languages: realData.languages,
        organization: realData.organization
      }
    ]
  };
};

const startInfoCheck = async (checkType) => {
  const loadingTask = {
    taskId: `info-loading-${Date.now()}`,
    url: targetUrl,
    checkType: 'info',
    status: 'running',
    progress: 50,
    results: null,
    timestamp: new Date().toLocaleTimeString()
  };
  
  setCurrentTask(loadingTask);
  
  try {
    const ip = await extractIPFromUrl(targetUrl);
    
    const realData = await ipGeolocationService.fetchFromIPGeolocation(ip);
    
    const completedTask = {
      ...loadingTask,
      status: 'completed',
      progress: 100,
      results: { 
        info: formatRealInfoData(realData, targetUrl)
      }
    };
    setCurrentTask(completedTask);
    
  } catch (error) {
    console.error('Real geolocation failed, using mock:', error);
    const completedTask = {
      ...loadingTask,
      status: 'completed', 
      progress: 100,
      results: { 
        info: getExtendedMockInfoData(targetUrl)
      }
    };
    setCurrentTask(completedTask);
  }
  
  loadAgentMetrics();
};

  const handleUrlSubmit = async (url) => {
    setLoading(true);
    setError('');
    try {
      setTargetUrl(url);
      setUrlSubmitted(true);
      setCurrentTask(null);
      setJobLogs([]);
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
    setJobLogs([]);
    if (jobSubscriptionRef.current) {
      jobSubscriptionRef.current.unsubscribe();
      jobSubscriptionRef.current = null;
    }
    websocketService.disconnect();
  };

  const handleJobCreated = (payload) => {
    updateTaskStatus(payload, 'pending');
  };

  const handleJobUpdated = (payload, checkType) => {
    const status = payload.status || payload.data?.status || 'IN_PROGRESS';
    const mappedStatus = mapJobStatus(status);
    const progress = typeof payload.data?.progress === 'number'
      ? Math.min(100, payload.data.progress)
      : undefined;

    setCurrentTask((prev) => {
      if (!prev) {
        return prev;
      }

      const nextResults = payload.data?.partialResult
        ? adaptJobResults({
            siteCheckResponse: {
              target: prev.url,
              results: payload.data.partialResult
            }
          }, checkType, prev.url)
        : prev.results;

      return {
        ...prev,
        status: mappedStatus || prev.status,
        progress: progress !== undefined ? progress : prev.progress,
        results: nextResults || prev.results
      };
    });
  };

  const handleJobCompleted = (payload, checkType) => {
    const finalResults = adaptJobResults(payload, checkType, targetUrl);

    setCurrentTask((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        status: 'completed',
        progress: 100,
        results: finalResults || prev.results
      };
    });

    loadAgentMetrics();
  };

  const handleJobLog = (payload) => {
    if (!payload?.data) {
      return;
    }

    setJobLogs((prev) => [...prev, payload.data]);
  };

  const handleJobError = (errorEvent) => {
    console.error('WebSocket error', errorEvent);
    setError('Ошибка WebSocket соединения. Проверьте подключение и учетные данные.');
  };

  const handleRawMessage = (message) => {
    if (!message) {
      return;
    }
    console.log('Raw update', message);
  };

  const handleRawClose = (event) => {
    console.log('Raw socket closed', event.code, event.reason);
  };

  const updateTaskStatus = (payload, defaultStatus) => {
    const status = payload?.status || defaultStatus;
    const mappedStatus = mapJobStatus(status);

    setCurrentTask((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        status: mappedStatus || prev.status
      };
    });
  };

  const mapJobStatus = (status) => {
    if (!status) {
      return undefined;
    }

    const normalized = status.toString().toUpperCase();
    switch (normalized) {
      case 'PENDING':
        return 'pending';
      case 'IN_PROGRESS':
        return 'running';
      case 'COMPLETED':
        return 'completed';
      case 'FAILED':
      case 'ERROR':
        return 'failed';
      case 'TIMEOUT':
        return 'timeout';
      default:
        return status.toString().toLowerCase();
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
              jobLogs={jobLogs}
              agentMetrics={agentMetrics}
            />
          )}
        </main>
      </div>
    </div>
  );
}

const getExtendedMockInfoData = (targetUrl) => {
  return {
    ip: '158.160.46.143',
    hostname: targetUrl.replace(/^https?:\/\//, ''),
    country: 'Russia',
    countryCode: 'RU',
    region: 'Moscow',
    city: 'Moscow',
    postalCode: '101000',
    latitude: 55.7558,
    longitude: 37.6173,
    timezone: 'Europe/Moscow',
    localTime: new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }),
    asn: 'AS200350',
    isp: 'Yandex Cloud LLC',
    organization: 'Yandex.Cloud',
    currency: 'RUB',
    languages: 'ru, en',
    continent: 'Europe',
    sources: [
      {
        name: 'IPGeolocation.io',
        date: new Date().toLocaleDateString('en-GB'),
        ipRange: '158.160.0.0-158.160.255.255 CIDR',
        city: 'Moscow',
        postalCode: '101000',
        accuracy: 'High'
      }
    ]
  };
};

export default App;