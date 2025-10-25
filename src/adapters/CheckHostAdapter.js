export const adaptFromCheckHost = (checkHostData, checkType, targetUrl) => {
  if (!checkHostData) return null;

  const adapters = {
    ping: adaptPingData,
    http: adaptHttpData,
    dns: adaptDnsData,
    tcp: adaptTcpData,
    info: adaptInfoData
  };

  const adapter = adapters[checkType];
  return adapter ? adapter(checkHostData, targetUrl) : null;
};

const adaptHttpData = (checkHostData, targetUrl) => {
  const httpResults = [];

  Object.entries(checkHostData).forEach(([node, nodeData]) => {
    if (nodeData && nodeData[0]) {
      const [success, time, statusText, statusCode, ip] = nodeData[0];
      
      httpResults.push({
        location: getNodeLocation(node),
        country: getNodeCountry(node),
        time: `${time} s`,
        status: parseInt(statusCode) || 200,
        ip: ip,
        result: statusText
      });
    }
  });

  return { http: httpResults };
};

const adaptTcpData = (checkHostData, targetUrl) => {
  const tcpResults = [];

  Object.entries(checkHostData).forEach(([node, nodeData]) => {
    if (nodeData && nodeData[0]) {
      const { address, time } = nodeData[0];
      
      tcpResults.push({
        location: getNodeLocation(node),
        country: getNodeCountry(node),
        connectTime: `${time} s`,
        status: 'Connected',
        ip: address
      });
    }
  });

  return { tcp: tcpResults };
};

const adaptDnsData = (checkHostData, targetUrl) => {
  const dnsResults = [];

  Object.entries(checkHostData).forEach(([node, nodeData]) => {
    if (nodeData && nodeData[0]) {
      const { A, AAAA, TTL } = nodeData[0];
      const records = [...(A || []), ...(AAAA || [])].join(', ');
      
      dnsResults.push({
        location: getNodeLocation(node),
        country: getNodeCountry(node),
        records: records || 'No records',
        ttl: formatTTL(TTL)
      });
    }
  });

  return { 
    dns: {
      locations: dnsResults
    }
  };
};

const adaptPingData = (checkHostData, targetUrl) => {
  const pingResults = [];

  Object.entries(checkHostData).forEach(([node, pingsData]) => {
    if (pingsData && pingsData[0]) {
      const pings = pingsData[0];
      const ip = findIpInPings(pings);
      
      const { transmitted, received, loss } = calculatePacketStats(pings);
      const roundTrip = calculateRoundTripStats(pings);
      
      pingResults.push({
        location: getNodeLocation(node),
        country: getNodeCountry(node),
        ip: ip,
        packets: {
          transmitted,
          received, 
          loss: `${loss}%`
        },
        roundTrip: {
          min: `${roundTrip.min} ms`,
          avg: `${roundTrip.avg} ms`,
          max: `${roundTrip.max} ms`
        }
      });
    }
  });

  return { ping: pingResults };
};

const adaptInfoData = (checkHostData, targetUrl) => {
  // Для info мок-данные
  return null;
};


const findIpInPings = (pings) => {
  for (let ping of pings) {
    if (ping[2]) return ping[2];
  }
  return 'Unknown';
};

const calculatePacketStats = (pings) => {
  const transmitted = pings.length;
  const received = pings.filter(ping => ping[0] === 'OK').length;
  const loss = Math.round((1 - received / transmitted) * 100);
  return { transmitted, received, loss };
};

const calculateRoundTripStats = (pings) => {
  const successfulPings = pings
    .filter(ping => ping[0] === 'OK')
    .map(ping => ping[1] * 1000);
  
  if (successfulPings.length === 0) {
    return { min: 0, avg: 0, max: 0 };
  }
  
  return {
    min: Math.min(...successfulPings).toFixed(1),
    avg: (successfulPings.reduce((a, b) => a + b, 0) / successfulPings.length).toFixed(1),
    max: Math.max(...successfulPings).toFixed(1)
  };
};

const formatTTL = (ttl) => {
  if (ttl < 60) return `${ttl} sec`;
  if (ttl < 3600) return `${Math.floor(ttl / 60)} min ${ttl % 60} sec`;
  return `${Math.floor(ttl / 3600)}h ${Math.floor((ttl % 3600) / 60)}m`;
};


const getNodeLocation = (node) => {
  const countryCode = node.split('.')[0].substring(0, 2).toUpperCase();
  const serverNumber = node.split('.')[0].substring(2) || '1';
  
  const countryNames = {
    'AT': 'Austria', 'CA': 'Canada', 'CH': 'Czechia', 'CZ': 'Czechia',
    'DE': 'Germany', 'ES': 'Spain', 'FI': 'Finland', 'FR': 'France',
    'HU': 'Hungary', 'IL': 'Israel', 'IR': 'Iran', 'IT': 'Italy',
    'JP': 'Japan', 'KZ': 'Kazakhstan', 'LT': 'Lithuania', 'MD': 'Moldova',
    'NL': 'Netherlands', 'PL': 'Poland', 'PT': 'Portugal', 'RS': 'Serbia',
    'RU': 'Russia', 'SE': 'Sweden', 'SI': 'Slovenia', 'TR': 'Turkey',
    'UA': 'Ukraine', 'UK': 'United Kingdom', 'US': 'USA', 'VN': 'Vietnam',
    'BG': 'Bulgaria', 'BR': 'Brazil', 'HK': 'Hong Kong', 'IN': 'India',
    'SG': 'Singapore'
  };
  
  const country = countryNames[countryCode] || countryCode;
  return `${country} ${serverNumber}`;
};

const getNodeCountry = (node) => {
  return node.split('.')[0].substring(0, 2).toLowerCase();
};