const ADMIN_USERNAME = process.env.REACT_APP_ADMIN_USERNAME || '';
const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD || '';

let hasWarnedAboutMissingCredentials = false;

const encodeToBase64 = (value) => {
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    return window.btoa(value);
  }

  if (typeof btoa === 'function') {
    return btoa(value);
  }

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'utf-8').toString('base64');
  }

  throw new Error('Base64 encoding is not supported in this environment.');
};

const ensureCredentials = () => {
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    if (!hasWarnedAboutMissingCredentials && typeof console !== 'undefined') {
      console.warn('[auth] Admin credentials are missing. Set REACT_APP_ADMIN_USERNAME and REACT_APP_ADMIN_PASSWORD.');
      hasWarnedAboutMissingCredentials = true;
    }
    return null;
  }

  return { username: ADMIN_USERNAME, password: ADMIN_PASSWORD };
};

export const getAdminAuthorizationHeader = () => {
  const credentials = ensureCredentials();
  if (!credentials) {
    return undefined;
  }

  const token = encodeToBase64(`${credentials.username}:${credentials.password}`);
  return `Basic ${token}`;
};

export const withBasicAuth = (headers = {}) => {
  const authorization = getAdminAuthorizationHeader();
  if (!authorization) {
    return { ...headers };
  }

  return {
    ...headers,
    Authorization: authorization
  };
};

export const withWebSocketCredentials = (url) => {
  const credentials = ensureCredentials();
  if (!credentials) {
    return url;
  }

  try {
    const wsUrl = new URL(url);
    wsUrl.username = credentials.username;
    wsUrl.password = credentials.password;
    return wsUrl.toString();
  } catch (error) {
    if (typeof console !== 'undefined') {
      console.warn('[auth] Failed to attach credentials to WebSocket URL:', error);
    }
    return url;
  }
};


// test

export const debugAuth = () => {
  const credentials = ensureCredentials();
  const authHeader = getAdminAuthorizationHeader();
  
  console.log('Auth Debug:', {
    hasCredentials: !!credentials,
    username: credentials?.username || 'missing',
    authHeader: authHeader ? '***present***' : 'missing',
    env: {
      BACKEND_READY: process.env.REACT_APP_BACKEND_READY,
      USE_MOCK: process.env.REACT_APP_USE_MOCK,
      API_URL: process.env.REACT_APP_API_URL,
      ADMIN_USERNAME: process.env.REACT_APP_ADMIN_USERNAME ? '***set***' : 'missing'
    }
  });
  
  return { credentials, authHeader };
};
