import { adaptFromCheckHost } from '../adapters/CheckHostAdapter';

const RESULT_KEY_MAP = {
  ping: 'ping',
  http: 'http',
  dns: 'dns',
  tcp: 'tcp',
  traceroute: 'traceroute'
};

const CHECK_TYPE_ALIAS = {
  http: ['http', 'https', 'HTTP'],
  ping: ['ping', 'PING'],
  dns: ['dns', 'dns_lookup', 'DNS', 'DNS_LOOKUP'],
  tcp: ['tcp', 'TCP', 'tcp_connect', 'TCP_CONNECT'],
  traceroute: ['traceroute', 'TRACEROUTE']
};

export const adaptJobResults = (jobPayload, checkType, fallbackTarget) => {
  if (!jobPayload) {
    return null;
  }

  const siteCheckResponse = extractSiteCheckResponse(jobPayload);
  if (!siteCheckResponse) {
    return null;
  }

  const normalizedType = (checkType || '').toLowerCase();
  const extracted = extractResultForType(siteCheckResponse, normalizedType);

  if (!extracted) {
    return null;
  }

  const target = siteCheckResponse.target || fallbackTarget;
  return normalizeResultStructure(extracted, normalizedType, target);
};

const extractSiteCheckResponse = (payload) => {
  if (!payload) {
    return null;
  }

  if (payload.siteCheckResponse) {
    return payload.siteCheckResponse;
  }

  if (payload.data?.siteCheckResponse) {
    return payload.data.siteCheckResponse;
  }

  if (payload.data?.result?.siteCheckResponse) {
    return payload.data.result.siteCheckResponse;
  }

  if (payload.result?.siteCheckResponse) {
    return payload.result.siteCheckResponse;
  }

  return payload.result || payload.data || null;
};

const extractResultForType = (siteCheckResponse, normalizedType) => {
  if (!siteCheckResponse) {
    return null;
  }

  const resultsContainer = siteCheckResponse.results || siteCheckResponse.result || siteCheckResponse.checks;

  if (!resultsContainer) {
    return null;
  }

  if (Array.isArray(resultsContainer)) {
    const matchingCheck = resultsContainer.find((check) => {
      if (!check || !check.type) {
        return false;
      }
      const type = check.type.toString().toLowerCase();
      return type === normalizedType || isAliasMatch(normalizedType, type);
    });

    return matchingCheck?.result || matchingCheck?.data || null;
  }

  if (typeof resultsContainer === 'object') {
    const keys = Object.keys(resultsContainer);
    const matchingKey = keys.find((key) => {
      const lower = key.toLowerCase();
      return lower === normalizedType || isAliasMatch(normalizedType, lower);
    });

    if (matchingKey) {
      return resultsContainer[matchingKey];
    }

    return resultsContainer;
  }

  return null;
};

const isAliasMatch = (normalizedType, candidate) => {
  const aliases = CHECK_TYPE_ALIAS[normalizedType];
  if (!aliases) {
    return false;
  }
  return aliases.includes(candidate) || aliases.includes(candidate.toUpperCase());
};

const normalizeResultStructure = (result, normalizedType, target) => {
  if (!result) {
    return null;
  }

  if (typeof result === 'object' && !Array.isArray(result)) {
    if (result[normalizedType]) {
      return result;
    }

    if (Object.keys(result).some((key) => key.includes('.node.'))) {
      return adaptFromCheckHost(result, normalizedType, target);
    }
  }

  const resultKey = RESULT_KEY_MAP[normalizedType] || normalizedType;

  return {
    [resultKey]: result
  };
};
