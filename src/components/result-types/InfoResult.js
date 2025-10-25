import '../../styles/result-types/InfoResult.css';
import IPLocationMap from '../IpLocationMap';

const InfoResults = ({ info, url }) => {
  if (!info || !info.sources || info.sources.length === 0) return null;

  const displayUrl = url || 'unknown';

  return (
    <div className="info-results result-card">
      <div className="result-header">
        <h4>IP and website location: "{displayUrl}"</h4>
      </div>

      {info.sources.map((source, sourceIndex) => (
        <InfoSection 
          key={sourceIndex} 
          source={source} 
          data={info} 
          isFirst={sourceIndex === 0}
        />
      ))}
    </div>
  );
};

const InfoSection = ({ source, data, isFirst }) => {
  const hasCoordinates = source.latitude && source.longitude;
  
  const getSourceData = (sourceName) => {
    const sources = {
      'DB-IP': {
        ipRange: '158.160.0.0-158.160.255.255 CIDR',
        city: 'Moscow (Tsentralnyy administrativnyy okrug)',
        postalCode: ''
      },
      'IPGeolocation.io': {
        ipRange: '158.160.46.0-158.160.46.255 CIDR',
        city: 'Moscow',
        postalCode: '125009'
      },
      'IPAPI': {
        ipRange: '158.160.32.0-158.160.63.255 CIDR',
        city: 'Moscow City',
        postalCode: '101000'
      },
      'MaxMind': {
        ipRange: '158.160.0.0/17',
        city: 'Moscow Central',
        postalCode: '123001'
      },
      'IP2Location': {
        ipRange: '158.160.0.0-158.160.255.255 CIDR',
        city: 'Moscow',
        postalCode: '101990'
      }
    };

    return sources[sourceName] || sources['DB-IP'];
  };

  const sourceData = getSourceData(source.name);

  return (
    <div className="info-section">

      <IPLocationMap 
        latitude={source.latitude}
        longitude={source.longitude}
        city={sourceData.city}
        country={data.country}
        ip={data.ip}
      />

      <div className="info-table-container">
        <table className="info-table">
          <tbody>
            <InfoRow label="IP address" value={data.ip} />
            <InfoRow label="Host name" value={data.hostname} />
            <InfoRow label="IP range" value={sourceData.ipRange} />
            <InfoRow label="ASN" value={data.asn} />
            <InfoRow label="ISP / Org" value={data.isp} />
            <InfoRow label="Country" value={data.country} />
            <InfoRow label="Region" value={data.region} />
            <InfoRow label="City" value={sourceData.city} />
            <InfoRow label="Time zone" value={data.timezone} />
            <InfoRow label="Local time" value={data.localTime} />
            <InfoRow label="Postal Code" value={sourceData.postalCode} />
            
            {source.latitude && source.longitude && (
              <InfoRow 
                label="Coordinates" 
                value={`${source.latitude}, ${source.longitude}`} 
              />
            )}
            {source.currency && (
              <InfoRow label="Currency" value={source.currency} />
            )}
            {source.languages && (
              <InfoRow label="Languages" value={source.languages} />
            )}
            {source.organization && (
              <InfoRow label="Organization" value={source.organization} />
            )}
            {source.accuracy && (
              <InfoRow label="Accuracy" value={source.accuracy} />
            )}
          </tbody>
        </table>
      </div>
      <div className="source-footer">Powered by {source.name}</div>
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <tr>
    <td className="info-label">{label}</td>
    <td className="info-value">{value || ''}</td>
  </tr>
);

export default InfoResults;