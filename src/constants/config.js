export const CONFIG = {
  API: {
    BASE_URL: process.env.REACT_APP_API_URL || 'http://138.124.14.169:8080',
  },
  CHECK_TYPES: {
    HTTP: 'HTTP',
    PING: 'PING',
    TCP: 'TCP',
    TRACEROUTE: 'TRACEROUTE',
    DNS_LOOKUP: 'DNS_LOOKUP'
  }
};

export const API_ENDPOINTS = {
  CHECKS: {
    CREATE: '/api/checks',
    STATUS: '/api/checks/:jobId',
  },
  METRICS: {
    AGENTS: '/api/metrics/agents'
  }
};