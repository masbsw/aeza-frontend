import '../../styles/result-types/TcpResult.css';
import { getCountryFlag } from '../../utils/FlagHelpers';

const TcpResults = ({ tcp, url }) => {
  if (!tcp || tcp.length === 0) return null;

  const getPortFromUrl = (url) => {
    if (!url) return '443';
    try {
      const match = url.match(/:(\d+)/);
      return match ? match[1] : '443';
    } catch (error) {
      return '443';
    }
  };

  const port = getPortFromUrl(url);
  const displayTarget = url ? (url.includes(':') ? url : `${url}:${port}`) : 'unknown:443';

  return (
    <div className="tcp-results result-card">
      <div className="result-header">
        <h4>TCP connect "{displayTarget}"</h4>
      </div>
      
      <div className="tcp-table-container">
        <table className="tcp-table">
          <thead>
            <tr>
              <th>Location</th>
              <th>Result</th>
              <th>Time</th>
              <th>IP address</th>
            </tr>
          </thead>
          <tbody>
            {tcp.map((result, index) => (
              <tr key={index} className="tcp-row">
                <td className="location-cell">
                  <span className="country-code">
                    {getCountryFlag(result.country)}
                  </span>
                  {result.location}
                </td>
                <td className="result-cell">
                  <span className="result-badge connected">Connected</span>
                </td>
                <td className="time-cell">
                  {result.connectTime}
                </td>
                <td className="ip-cell">
                  {result.ip || '158.160.46.143'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TcpResults;