const toBoolean = (value, defaultValue) => {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  return value.toString().toLowerCase() === 'true';
};

export const CONFIG = {
  BACKEND_READY: toBoolean(process.env.REACT_APP_BACKEND_READY, false),
  USE_MOCK: toBoolean(process.env.REACT_APP_USE_MOCK, true),
  DEBUG_WS: toBoolean(process.env.REACT_APP_DEBUG_WS, false),

  API_URL: process.env.REACT_APP_API_URL || 'http://138.124.14.169:8080/api',
  WS_URL: process.env.REACT_APP_WS_URL || 'ws://138.124.14.169:8080/ws',

  IPGEOLOCATION_API_KEY: process.env.REACT_APP_IPGEOLOCATION_API_KEY || 'd7e6234bdd2b4c9fadb21bb44c46ffa1'
};
