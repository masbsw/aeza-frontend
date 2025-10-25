import React from "react";
import "../../styles/result-types/DnsResult.css";
import { getCountryFlag } from "../../utils/FlagHelpers";
import { getDomainFromUrl } from "../../utils/validation";

const DnsResults = ({ dns, url }) => {
  if (!dns || !dns.locations || dns.locations.length === 0) return null;

  const domain = getDomainFromUrl(url);

  return (
    <div className="dns-results result-card">
      <div className="result-header">
        <h4>DNS "{domain}"</h4>
      </div>

      <div className="dns-table-container">
        <table className="dns-table">
          <thead>
            <tr>
              <th>Location</th>
              <th>Result</th>
              <th>TTL</th>
            </tr>
          </thead>
          <tbody>
            {dns.locations.map((result, index) => (
              <tr key={index} className="dns-row">
                <td className="location-cell">
                  <span className="country-code">
                    {getCountryFlag(result.country)}
                  </span>
                  {result.location}
                </td>
                <td className="result-cell">{result.records}</td>
                <td className="ttl-cell">{result.ttl}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DnsResults;