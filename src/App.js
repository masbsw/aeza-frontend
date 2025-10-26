import React, { useState, useEffect, useRef } from 'react';
import CheckForm from './components/CheckForm';
import Results from './components/Results';
import { apiService } from './services/apiService';
import { CONFIG } from './constants/config';
import './styles/App.css';
import AuthTester from './components/AuthTester';

function App() {
  const [currentTask, setCurrentTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');
  const [urlSubmitted, setUrlSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [agentMetrics, setAgentMetrics] = useState([]);
  
  const currentTaskRef = useRef();

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
      
      console.log('Task created:', task);
      
      setCurrentTask({
        taskId: task.taskId,
        url: targetUrl,
        checkType: checkType,
        status: 'running',
        progress: 50,
        results: null,
        timestamp: new Date().toLocaleTimeString()
      });

      setTimeout(async () => {
        try {
          const status = await apiService.getTaskStatus(task.taskId, checkType);
          
          setCurrentTask(prev => ({
            ...prev,
            status: 'completed',
            progress: 100,
            results: status.results
          }));

          const metrics = await apiService.getAgentMetrics();
          setAgentMetrics(metrics);
          
        } catch (error) {
          console.error('Error:', error);
        }
      }, 2000);

    } catch (error) {
      console.error('Error starting check:', error);
      setError('Ошибка при запуске проверки');
    }
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
    
    setTimeout(() => {
      const completedTask = {
        ...loadingTask,
        status: 'completed',
        progress: 100,
        results: { 
          info: getExtendedMockInfoData(targetUrl)
        }
      };
      setCurrentTask(completedTask);
      loadAgentMetrics();
    }, 2000);
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