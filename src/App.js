// App.js
import React, { useState, useEffect, useRef } from 'react';
import CheckForm from './components/CheckForm';
import Results from './components/Results';
import { websocketService } from './services/websocketService';
import { apiService } from './services/apiService';
import { CONFIG } from './constants/config';
import './styles/App.css';



import { adaptFromCheckHost } from './adapters/CheckHostAdapter';

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

const handleWebSocketUpdate = (update) => {
  console.log('Received update:', update);
  
  const currentTask = currentTaskRef.current;
  if (!currentTask) return;

  if (update.type === 'agent_metrics') {
    setAgentMetrics(update.metrics || []);
    return;
  }

  let adaptedResults = null;
  if (update.result) {
    console.log('Adapting results for:', currentTask.checkType);
    adaptedResults = adaptFromCheckHost(update.result, currentTask.checkType, currentTask.url);
    console.log('Adapted results:', adaptedResults);
  } else if (update.partialResult) {
    console.log('Adapting partial results for:', currentTask.checkType);
    adaptedResults = adaptFromCheckHost(update.partialResult, currentTask.checkType, currentTask.url);
    console.log('Adapted partial results:', adaptedResults);
  }



  setCurrentTask(prev => {
    if (!prev || prev.taskId !== update.jobId) return prev;

    return {
      ...prev,
      status: update.status || prev.status,
      progress: update.progress || prev.progress,
      results: adaptedResults || prev.results
    };
  });

  if (update.status === 'completed') {
    console.log('Task completed, loading metrics...');
    setTimeout(() => {
      loadAgentMetrics();
      websocketService.disconnect(update.jobId);
    }, 1000);
  }
};

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

    await websocketService.connect(task.taskId, checkType, targetUrl);
    websocketService.subscribe(task.taskId, handleWebSocketUpdate);
    console.log('Mock WebSocket connected');

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
          info: {
            ip: '158.160.46.143',
            hostname: targetUrl.replace(/^https?:\/\//, ''),
            country: 'Russia',
            region: 'Moscow',
            timezone: 'Europe/Moscow',
          }
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
  if (currentTask) {
    console.log('Resetting, disconnecting from:', currentTask.taskId);
    websocketService.disconnect(currentTask.taskId);
  }
  setUrlSubmitted(false);
  setTargetUrl('');
  setCurrentTask(null);
  setError('');
  setAgentMetrics([]);
};


  useEffect(() => {
    return () => {
      if (currentTask) {
        websocketService.disconnect(currentTask.taskId);
      }
    };
  }, [currentTask]);

  

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