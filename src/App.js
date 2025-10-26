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
        setError('Не удалось подключиться к бэкенду: ' + initError.message);
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
      if (!backendReady) {
        throw new Error('Бэкенд не готов к выполнению проверок');
      }

      await startBackendCheck(checkType);
    } catch (checkError) {
      console.error('Error in check:', checkError);
      setError('Не удалось выполнить проверку: ' + checkError.message);
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

export default App;
