import React from 'react';
import '../../styles/result-types/PingResult.css';
import { getCountryFlag } from '../../utils/FlagHelpers';
import { getDomainFromUrl } from '../../utils/validation';

const PingResults = ({ ping, url }) => {
  if (!ping || !Array.isArray(ping) || ping.length === 0) return null;

  const domain = getDomainFromUrl(url);

  const safePingData = ping.map(result => {
    const roundTrip = result.roundTrip || { min: '0.0 ms', avg: '0.0 ms', max: '0.0 ms' };
    const packets = result.packets || { transmitted: 4, received: 4 };
    
    return {
      location: result.location || 'Unknown',
      country: result.country || '',
      ip: result.ip || '158.160.46.143',
      packets: {
        transmitted: packets.transmitted || 4,
        received: packets.received || 4,
        loss: packets.loss || '0%'
      },
      roundTrip: {
        min: roundTrip.min || '0.0 ms',
        avg: roundTrip.avg || '0.0 ms',
        max: roundTrip.max || '0.0 ms'
      }
    };
  });

  return (
    <div className="ping-results result-card">
      <div className="result-header">
        <h4>Ping server "{domain}"</h4>
      </div>
      
      <div className="ping-table-container">
        <table className="ping-table">
          <thead>
            <tr>
              <th>Location</th>
              <th>Result</th>
              <th>rtt min / avg / max</th>
              <th>IP address</th>
            </tr>
          </thead>
          <tbody>
            {safePingData.map((result, index) => (
              <tr key={index} className="ping-row">
                <td className="location-cell">
                  <span className="country-code">
                    {getCountryFlag(result.country)}
                  </span>
                  {result.location}
                </td>
                <td className="result-cell">
                  <span className="result-badge success">
                    {result.packets.received} / {result.packets.transmitted}
                  </span>
                </td>
                <td className="rtt-cell">
                  {result.roundTrip.min} / {result.roundTrip.avg} / {result.roundTrip.max}
                </td>
                <td className="ip-cell">
                  {result.ip}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PingResults;