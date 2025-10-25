export const extractHost = (input) => {
  if (!input) return '';
  
  try {
    let host = input;
    
    host = host.replace(/^https?:\/\//, '');
    
    host = host.replace(/:\d+$/, '');
    
    host = host.split('/')[0];
    host = host.split('?')[0];
    
    return host || '';
  } catch (error) {
    console.error('Error extracting host:', error);
    return '';
  }
};

export const getDomainFromUrl = (url) => {
  try {
    if (!url || typeof url !== 'string') return 'unknown';
    
    const host = extractHost(url);
    return host || 'unknown';
  } catch (error) {
    console.error('Error getting domain from URL:', error);
    return 'unknown';
  }
};

export const isValidUrl = (input) => {
  if (!input || typeof input !== 'string') return false;
  
  const trimmed = input.trim();
  if (!trimmed) return false;

  const urlRegex = /^(https?:\/\/)?([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/;
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/;
  const ipWithPortRegex = /^(\d{1,3}\.){3}\d{1,3}:\d+$/;
  const domainWithPortRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}:\d+$/;

  return urlRegex.test(trimmed) || ipRegex.test(trimmed) || ipWithPortRegex.test(trimmed) || domainWithPortRegex.test(trimmed);
};

export const normalizeInput = (input) => {
  if (!input) return '';
  
  const trimmed = input.trim();
  
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  if (trimmed.match(/^(\d{1,3}\.){3}\d{1,3}:\d+$/)) {
    return trimmed;
  }
  
  if (trimmed.match(/^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}:\d+$/)) {
    return trimmed;
  }
  
  if (trimmed.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
    return `http://${trimmed}:80`;
  }
  
  if (trimmed.match(/^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/)) {
    return `http://${trimmed}`;
  }
  
  return trimmed;
};

export const getInputType = (input) => {
  if (!input) return 'invalid';
  
  if (input.match(/^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/)) {
    return 'ip';
  }
  
  if (input.match(/^https?:\/\//)) {
    return 'url';
  }
  
  if (input.match(/^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(:\d+)?$/)) {
    return 'domain';
  }
  
  return 'invalid';
};

export const extractPort = (input) => {
  if (!input) return null;
  
  const match = input.match(/:(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
};