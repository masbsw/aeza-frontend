import React from 'react';
import '../styles/AgentMetrics.css';

const AgentMetrics = ({ agentMetrics = [] }) => {
  if (!agentMetrics || agentMetrics.length === 0) {
    return (
      <div className="agent-metrics">
        <div className="metrics-header">
          <h4>Agent Metrics</h4>
        </div>
        <div className="no-metrics">
          No agent metrics available
        </div>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'online':
        return '🟢';
      case 'offline':
        return '🔴';
      case 'warning':
        return '🟡';
      default:
        return '⚪';
    }
  };

  const formatNumber = (num) => {
    if (typeof num !== 'number') return '0';
    return num.toLocaleString();
  };

  const formatResponseTime = (time) => {
    if (typeof time !== 'number') return 'N/A';
    return `${time.toFixed(1)} ms`;
  };

  return (
    <div className="agent-metrics">
      <div className="metrics-header">
        <h4>Agent Metrics</h4>
        <span className="agents-count">{agentMetrics.length} agents</span>
      </div>

      <div className="metrics-grid">
        {agentMetrics.map((agent, index) => (
          <div key={agent.id || index} className="metric-card">
            <div className="agent-header">
              <span className="agent-status">
                {getStatusIcon(agent.status)}
              </span>
              <span className="agent-name">
                {agent.name || `Agent ${index + 1}`}
              </span>
            </div>

            <div className="agent-details">
              <div className="detail-row">
                <span className="detail-label">Location:</span>
                <span className="detail-value">
                  {agent.location || 'Unknown'}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className="detail-value">
                  {agent.status || 'unknown'}
                </span>
              </div>

              {agent.checksCompleted !== undefined && (
                <div className="detail-row">
                  <span className="detail-label">Checks:</span>
                  <span className="detail-value">
                    {formatNumber(agent.checksCompleted)}
                  </span>
                </div>
              )}

              {agent.avgResponseTime !== undefined && (
                <div className="detail-row">
                  <span className="detail-label">Avg Response:</span>
                  <span className="detail-value">
                    {formatResponseTime(agent.avgResponseTime)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentMetrics;