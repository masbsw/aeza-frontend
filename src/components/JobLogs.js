import '../styles/JobLogs.css';

const formatTimestamp = (value) => {
  if (!value) {
    return '';
  }

  try {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString();
    }
  } catch (error) {
    // ignore
  }

  return value;
};

const JobLogs = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return null;
  }

  return (
    <div className="job-logs result-card">
      <div className="result-header">
        <h4>Логи агентов</h4>
      </div>
      <div className="job-logs-list">
        {logs.map((log, index) => (
          <div className="job-log-entry" key={index}>
            <div className="job-log-meta">
              <span className="job-log-agent">{log.agentId || log.agent_id || 'agent'}</span>
              {log.timestamp && (
                <span className="job-log-timestamp">{formatTimestamp(log.timestamp)}</span>
              )}
            </div>
            <div className="job-log-body">
              {log.message || log.status || JSON.stringify(log)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobLogs;
