import InfoResults from './result-types/InfoResult';
import PingResults from './result-types/PingResult';
import HttpResults from './result-types/HttpResult';
import DnsResults from './result-types/DnsResult';
import TcpResults from './result-types/TcpResult';
import '../styles/Results.css';
import AgentMetrics from './AgentMetrics';
import JobLogs from './JobLogs';

const Results = ({ taskId, status, progress, results, url, checkType, agentMetrics, jobLogs }) => {
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

  return (
    <div className="results">
      <div className={`task-header ${status === 'completed' ? 'hidden' : ''}`}>
        <div className="task-info-left">
          <div className="task-meta">
            <span className={`status ${status}`}>
              {getStatusLabel(status)}
            </span>
          </div>
        </div>
      </div>

      <div className="check-results">
        {renderResults()}
      </div>

      {status === 'completed' && agentMetrics && agentMetrics.length > 0 && (
        <AgentMetrics metrics={agentMetrics} />
      )}

      {jobLogs && jobLogs.length > 0 && (
        <JobLogs logs={jobLogs} />
      )}
    </div>
  );
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'pending':
      return 'Ожидает запуска';
    case 'running':
      return 'Выполняется...';
    case 'completed':
      return 'Завершено';
    case 'failed':
      return 'Ошибка';
    case 'timeout':
      return 'Тайм-аут';
    default:
      return status || '';
  }
};

export default Results;
