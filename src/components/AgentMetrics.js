import "../styles/AgentMetrics.css"

const AgentMetrics = ({ metrics }) => {
  if (!metrics || metrics.length === 0) return null;

  const metricsByAgent = metrics.reduce((acc, metric) => {
    if (!acc[metric.agentName]) {
      acc[metric.agentName] = [];
    }
    acc[metric.agentName].push(metric);
    return acc;
  }, {});

  const getMetricIcon = (type) => {
    switch(type) {
      case 'AGENT_AVAILABILITY': return '';
      case 'REQUEST_COUNT': return '';
      case 'RESPONSE_DELAY': return '';
      default: return '';
    }
  };

  const formatValue = (metric) => {
    switch(metric.metricType) {
      case 'AGENT_AVAILABILITY':
        return `${metric.value.toFixed(1)}%`;
      case 'REQUEST_COUNT':
        return Math.floor(metric.value).toLocaleString();
      case 'RESPONSE_DELAY':
        return `${metric.value.toFixed(1)} ms`;
      default:
        return metric.value;
    }
  };

  return (
    <div className="agent-metrics">
      <div className="metrics-header">
        <h4>Agent Metrics</h4>
        <span className="realtime-badge">Real-time</span>
      </div>
      
      <div className="metrics-grid">
        {Object.entries(metricsByAgent).map(([agentName, agentMetrics]) => (
          <div key={agentName} className="agent-card">
            <div className="agent-header">
              <span className="agent-name">{agentName}</span>
              <span className="agent-status">Online</span>
            </div>
            
            <div className="agent-metrics-list">
              {agentMetrics.map((metric, index) => (
                <div key={index} className="metric-item">
                  <span className="metric-icon">
                    {getMetricIcon(metric.metricType)}
                  </span>
                  <span className="metric-label">
                    {metric.metricType.replace('_', ' ').toLowerCase()}
                  </span>
                  <span className="metric-value">
                    {formatValue(metric)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentMetrics;