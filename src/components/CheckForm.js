import React, { useState } from 'react';
import '../styles/CheckForm.css';
import { isValidUrl, normalizeInput, getInputType, extractPort, extractHost } from '../utils/validation';
import { apiService } from '../services/apiService';

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
  const [localLoading, setLocalLoading] = useState(false);

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

  const handleCheckTypeClick = async (checkType) => {
    console.log('Check type clicked:', checkType);
    
    try {
      setLocalLoading(true);
      
      onCheckStart(checkType);
      
    } catch (error) {
      console.error('Error starting check:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleResetClick = () => {
    setUrl('');
    setValidationError('');
    onReset();
  };

  const isLoading = loading || localLoading;

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
              disabled={isLoading || urlSubmitted}
              className={`url-input ${validationError ? 'error' : ''}`}
            />
            {!urlSubmitted ? (
              <button 
                type="submit"
                disabled={isLoading || !url.trim()}
                className="submit-btn"
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Отправка...
                  </>
                ) : 'Отправить'}
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleResetClick}
                className="reset-btn"
                disabled={isLoading}
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
                  disabled={
                    isLoading ||
                    (currentTask && ['running', 'pending'].includes(currentTask.status))
                  }
                  className="check-button"
                  data-type={button.type}
                >
                  <span className="button-text">{button.label}</span>
                  <div className="button-border"></div>
                </button>
              ))}
            </div>

            
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckForm;