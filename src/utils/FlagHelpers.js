export const getCountryFlag = (countryCode) => {
  if (!countryCode || typeof countryCode !== 'string') {
    return '[??]';
  }
  
  const code = countryCode.toUpperCase();
  
  if (code.length !== 2 || !/^[A-Z]{2}$/.test(code)) {
    return '[??]';
  }
  
  return `[${code}]`;
};

