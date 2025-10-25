import '../../styles/result-types/HttpResult.css';
import { getCountryFlag } from '../../utils/FlagHelpers';

const HttpResults = ({ http, url }) => {
  if (!http || http.length === 0) return null;

  const displayUrl = url || 'unknown';

  return (
    <div className="http-results result-card">
      <div className="result-header">
        <h4>Check website "{displayUrl}"</h4>
      </div>
      
      <div className="http-table-container">
        <table className="http-table">
          <thead>
            <tr>
              <th>Location</th>
              <th>Result</th>
              <th>Time</th>
              <th>Code</th>
              <th>IP address</th>
            </tr>
          </thead>
          <tbody>
            {http.map((result, index) => (
              <tr key={index} className="http-row">
                <td className="location-cell">
                  <span className="country-code">
                    {getCountryFlag(result.country)}
                  </span>
                  {result.location}
                </td>
                <td className="result-cell">
                  <span className="result-badge ok">OK</span>
                </td>
                <td className="time-cell">
                  {result.time}
                </td>
                <td className="code-cell">
                  {result.status} ({getStatusText(result.status)})
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

const getStatusText = (status) => {
  const statusMap = {
    200: 'OK',
    301: 'Moved Permanently', 
    302: 'Found',
    304: 'Not Modified',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable'
  };
  return statusMap[status] || 'Unknown';
};

export default HttpResults;