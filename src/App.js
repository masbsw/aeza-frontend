import React, { useState, useEffect } from 'react';
import CheckForm from './components/CheckForm';
import Results from './components/Results';
import { mockApi } from './api/mockApi';
import './styles/App.css';

function App() {
  const [currentTask, setCurrentTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');
  const [urlSubmitted, setUrlSubmitted] = useState(false);
  const [error, setError] = useState('');

  const submitUrlToBackend = async (url) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      target: url,
      message: 'URL accepted, ready for checks'
    };
  };

  const startCheck = async (checkType) => {
    setLoading(true);
    setError('');
    try {
      const response = await mockApi.submitCheck(targetUrl, checkType);
      const newTask = {
        taskId: response.taskId,
        url: targetUrl,
        checkType: checkType,
        status: 'running',
        progress: 0,
        results: null,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setCurrentTask(newTask);
    } catch (error) {
      console.error('Error starting check:', error);
      setError(`Ошибка при запуске проверки ${checkType}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUrlSubmit = async (url) => {
    setLoading(true);
    setError('');
    try {
      await submitUrlToBackend(url);
      setTargetUrl(url);
      setUrlSubmitted(true);
      setCurrentTask(null);
    } catch (error) {
      console.error('Error submitting URL:', error);
      setError('Ошибка при отправке URL: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setUrlSubmitted(false);
    setTargetUrl('');
    setCurrentTask(null);
    setError('');
  };

  useEffect(() => {
    if (currentTask && currentTask.status === 'running') {
      const interval = setInterval(async () => {
        try {
          const status = await mockApi.getTaskStatus(currentTask.taskId, currentTask.checkType);
          const updatedTask = { ...currentTask, ...status };
          
          setCurrentTask(updatedTask);
          
          if (status.status !== 'running') {
            clearInterval(interval);
          }
        } catch (error) {
          console.error('Error fetching task status:', error);
          setError('Ошибка при получении статуса проверки');
          clearInterval(interval);
        }
      }, 1500);

      return () => clearInterval(interval);
    }
  }, [currentTask]);

  return (
    <div className="app">
      <div className="container">
        {error && (
          <div className="error-message">
             {error}
          </div>
        )}

        <main className="app-main">
          <CheckForm 
            onSubmit={handleUrlSubmit}
            onCheckStart={startCheck}
            onReset={handleReset}
            loading={loading}
            urlSubmitted={urlSubmitted}
            targetUrl={targetUrl}
            currentTask={currentTask}
          />
          
          {currentTask && <Results {...currentTask} />}
        </main>
      </div>
    </div>
  );
}

export default App;