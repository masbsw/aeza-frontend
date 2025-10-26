import React from 'react';
import '../../styles/result-types/HttpResult.css';

const HttpResults = ({ http, url }) => {
  if (!http) return null;

  console.log('HttpResults data:', http); // Для отладки

  // Преобразуем данные в массив для единообразной обработки
  let httpData = [];
  
  if (Array.isArray(http)) {
    httpData = http;
  } else if (typeof http === 'object') {
    // Если это объект, создаем массив с одним элементом
    httpData = [http];
  }

  if (httpData.length === 0) {
    return (
      <div className="http-results result-card">
        <div className="result-header">
          <h4>HTTP Check: {url}</h4>
        </div>
        <div className="no-data">No HTTP data available</div>
      </div>
    );
  }

  return (
    <div className="http-results result-card">
      <div className="result-header">
        <h4>HTTP Check: {url}</h4>
      </div>

      {httpData.map((result, index) => (
        <div key={index} className="http-section">
          <div className="http-table-container">
            <table className="http-table">
              <tbody>
                <HttpRow label="URL" value={result.url} />
                <HttpRow label="Status Code" value={result.statusCode} />
                <HttpRow label="Status Message" value={result.statusMessage} />
                <HttpRow label="Response Time" value={result.responseTime ? `${result.responseTime} ms` : null} />
                
                {result.headers && typeof result.headers === 'object' && (
                  <HttpRow 
                    label="Headers" 
                    value={
                      <div className="headers-list">
                        {Object.entries(result.headers).map(([key, value]) => (
                          <div key={key} className="header-item">
                            <strong>{key}:</strong> {value}
                          </div>
                        ))}
                      </div>
                    }
                  />
                )}
                
                {result.ssl && (
                  <>
                    <HttpRow label="SSL Valid" value={result.ssl.valid ? 'Yes' : 'No'} />
                    <HttpRow label="SSL Expires" value={result.ssl.expires} />
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

const HttpRow = ({ label, value }) => (
  value !== null && value !== undefined && value !== '' ? (
    <tr>
      <td className="http-label">{label}</td>
      <td className="http-value">{value}</td>
    </tr>
  ) : null
);

export default HttpResults;