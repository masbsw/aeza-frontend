import InfoResults from './result-types/InfoResult';
import PingResults from './result-types/PingResult';
import HttpResults from './result-types/HttpResult';
import DnsResults from './result-types/DnsResult';
import TcpResults from './result-types/TcpResult';
import '../styles/Results.css';

const Results = ({ taskId, status, progress, results, url, checkType }) => {
  // if (!taskId) return null;

  const renderResults = () => {
    if (!results) return null;

    const commonProps = { url: url || '' };

    switch (checkType) {
      case 'ping':
        return <PingResults ping={results.ping} {...commonProps} />;
      case 'http':
        return <HttpResults http={results.http} {...commonProps} />;
      case 'dns':
        return <DnsResults dns={results.dns} {...commonProps} />;
      case 'tcp':
        return <TcpResults tcp={results.tcp} {...commonProps} />;
      case 'info':
        return <InfoResults info={results.info} {...commonProps} />;
      default:
        return null;
    }
  };

  const getCheckTypeName = (type) => {
    const names = {
      ping: 'Ping',
      http: 'HTTP(S)',
      dns: 'DNS Lookup', 
      traceroute: 'Traceroute',
      tcp: 'TCP Port',
      info: 'Location Info'
    };
    return names[type] || type;
  };

  return (
    <div className="results">
      <div className={`task-header ${status === 'completed' ? 'hidden' : ''}`}>
        <div className="task-info-left">
          <div className="task-meta">
            <span className={`status ${status}`}>
              {status === 'running' ? 'Выполняется...' : 
               status === 'completed' ? 'Завершено'  : 'Ошибка'}
            </span>
          </div>
        </div>
      </div>

      <div className="check-results">
        {renderResults()}
      </div>
    </div>
  );
};

export default Results;