export const extractIPFromUrl = async (url) => {
  try {
    const cleanUrl = url.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
    
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipRegex.test(cleanUrl)) {
      return cleanUrl;
    }
    
    console.log(`Resolving domain: ${cleanUrl}`);
    
    try {
      const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(cleanUrl)}&type=A`, {
        headers: {
          'Accept': 'application/dns-json'
        }
      });
      
      const dnsData = await response.json();
      
      if (dnsData.Answer && dnsData.Answer.length > 0) {
        const ip = dnsData.Answer.find(answer => answer.type === 1)?.data;
        if (ip) {
          console.log(`Resolved ${cleanUrl} to IP: ${ip}`);
          return ip;
        }
      }
    } catch (dnsError) {
      console.log('Cloudflare DNS failed, trying Google DNS...');
    }
    
    const fallbackResponse = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(cleanUrl)}&type=A`);
    const fallbackData = await fallbackResponse.json();
    
    if (fallbackData.Answer && fallbackData.Answer.length > 0) {
      const ip = fallbackData.Answer[0].data;
      console.log(`Resolved via Google DNS: ${ip}`);
      return ip;
    }
    
    throw new Error('Could not resolve domain to IP');
    
  } catch (error) {
    console.error('Error extracting IP:', error);
    return '8.8.8.8';
  }
};