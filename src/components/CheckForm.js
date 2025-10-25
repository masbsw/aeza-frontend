import React, { useState } from 'react';
import '../styles/CheckForm.css';
import { isValidUrl, normalizeInput, getInputType, extractPort, extractHost } from '../utils/validation';

const CheckForm = ({ 
  onSubmit, 
  onCheckStart, 
  onReset, 
  loading, 
  urlSubmitted, 
  targetUrl,
  currentTask 
}) => {
  const [url, setUrl] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleUrlChange = (e) => {
    const value = e.target.value;
    setUrl(value);
    
    if (validationError) {
      setValidationError('');
    }
  };

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setValidationError('Пожалуйста, введите URL или IP-адрес');
      return;
    }

    if (!isValidUrl(url)) {
      setValidationError('Введите корректный URL, IP-адрес или доменное имя');
      return;
    }

    const normalizedUrl = normalizeInput(url);
    
    const inputType = getInputType(normalizedUrl);
    const host = extractHost(normalizedUrl);
    const port = extractPort(normalizedUrl);
    
    console.log('Input type:', inputType);
    console.log('Host:', host);
    console.log('Port:', port);
    console.log('Normalized URL:', normalizedUrl);
    
    onSubmit(normalizedUrl);
  };

  const handleCheckTypeClick = (checkType) => {
    onCheckStart(checkType);
  };

  const handleResetClick = () => {
    setUrl('');
    setValidationError('');
    onReset();
  };

  const checkButtons = [
    { type: 'info', label: 'Info' },
    { type: 'ping', label: 'Ping'},
    { type: 'http', label: 'HTTP'},
    { type: 'dns', label: 'DNS' },
    { type: 'tcp', label: 'TCP Port'}
    
  ];



  return (
    <div className="check-form">
      <div className="form-header">
        <h2>Проверка доступности сайта</h2>
        <p>Введите URL, IP-адрес или доменное имя для проверки</p>
      </div>
      
      <div className="main-form">
        <form onSubmit={handleUrlSubmit} className="url-form">
          <div className="input-container">
            <input
              type="text"
              placeholder="example.com / 192.168.1.1 / 8.8.8.8:53"
              value={urlSubmitted ? targetUrl : url}
              onChange={handleUrlChange}
              disabled={loading || urlSubmitted}
              className={`url-input ${validationError ? 'error' : ''}`}
            />
            {!urlSubmitted ? (
              <button 
                type="submit"
                disabled={loading || !url.trim()}
                className="submit-btn"
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Отправка...
                  </>
                ) : 'Отправить'}

                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"></path>
                  </svg>
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleResetClick}
                className="reset-btn"
              >
                ✕ Сброс
              </button>
            )}
          </div>
          
          {validationError && (
            <div className="validation-error">
              {validationError}
            </div>
          )}
        </form>

        {urlSubmitted && (
          <div className="check-buttons">
            <div className="target-info">
              <p>Выберите тип проверки:</p>
            </div>
            
            <div className="buttons-grid">
              {checkButtons.map((button) => (
                <button
                  key={button.type}
                  type="button"
                  onClick={() => handleCheckTypeClick(button.type)}
                  disabled={loading || (currentTask && currentTask.status === 'running')}
                  className="check-button"
                  title={button.description}
                  data-type={button.type}
                >
                  <span className="button-icon">{button.label.split(' ')[0]}</span>
                  <span className="button-description">{button.description}</span>
                   <div className="button-border"></div>
                </button>
              ))}
            </div>

            {currentTask && currentTask.status === 'running' && (
              <div className="check-in-progress">
                <div className="progress-info">
                  <span className="spinner small"></span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckForm;