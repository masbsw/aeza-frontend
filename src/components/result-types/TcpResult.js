import React from 'react';
import '../../styles/result-types/TcpResult.css';

const TcpResults = ({ tcp, url }) => {
  if (!tcp) return null;

  // Если tcp - объект, а не массив
  const tcpData = Array.isArray(tcp) ? tcp : [tcp];

  return (
    <div className="tcp-results result-card">
      <div className="result-header">
        <h4>TCP Port Check: {url}</h4>
      </div>

      {tcpData.map((result, index) => (
        <div key={index} className="tcp-section">
          <div className="tcp-table-container">
            <table className="tcp-table">
              <tbody>
                <TcpRow label="Host" value={result.host} />
                <TcpRow label="Port" value={result.port} />
                <TcpRow label="Status" value={result.status} />
                <TcpRow label="Response Time" value={result.responseTime ? `${result.responseTime} ms` : null} />
                <TcpRow label="Service" value={result.service} />
                
                {result.error && (
                  <TcpRow label="Error" value={result.error} />
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

const TcpRow = ({ label, value }) => (
  value !== null && value !== undefined ? (
    <tr>
      <td className="tcp-label">{label}</td>
      <td className="tcp-value">{value}</td>
    </tr>
  ) : null
);

export default TcpResults;