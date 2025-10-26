export class IpGeolocationService {
  constructor() {
    this.apiKey = process.env.REACT_APP_IPGEOLOCATION_API_KEY || 'd7e6234bdd2b4c9fadb21bb44c46ffa1';
    this.providers = {
      'IPGeolocation.io': this.fetchFromIpGeolocation.bind(this),
      'DB-IP': this.fetchFromDbIp.bind(this),
      'IPAPI': this.fetchFromIpApi.bind(this)
    };
  }

  async fetchInfoData(ip, providers = ['IPGeolocation.io', 'DB-IP']) {
    const results = [];
    
    for (const providerName of providers) {
      try {
        console.log(`Fetching from ${providerName} for IP: ${ip}`);
        const provider = this.providers[providerName];
        if (provider) {
          const data = await provider(ip);
          results.push({
            name: providerName,
            ...data
          });
          
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Error fetching from ${providerName}:`, error);
      }
    }
    
    return results;
  }

  async fetchFromIpGeolocation(ip) {
    if (!this.apiKey) {
      throw new Error('IPGeolocation API key not configured');
    }

    const response = await fetch(
      `https://api.ipgeolocation.io/ipgeo?apiKey=${this.apiKey}&ip=${ip}&fields=geo,time_zone,asn`
    );
    
    if (!response.ok) {
      throw new Error(`IPGeolocation API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      ip: data.ip,
      hostname: data.hostname || data.ip,
      country: data.country_name || 'Unknown',
      region: data.state_prov || 'Unknown',
      city: data.city || 'Unknown',
      timezone: data.time_zone?.name || 'Unknown',
      localTime: this.formatLocalTime(data.time_zone?.current_time),
      postalCode: data.zipcode || '',
      latitude: data.latitude,
      longitude: data.longitude,
      isp: data.isp || 'Unknown',
      organization: data.organization || 'Unknown',
      asn: data.asn || 'Unknown',
      date: new Date().toLocaleDateString('en-GB'),
      ipRange: this.generateIpRange(data.ip || ip) 
    };
  }

  async fetchFromDbIp(ip) {
    try {
      const response = await fetch(`https://api.db-ip.com/v2/free/${ip}`);
      
      if (!response.ok) {
        throw new Error(`DB-IP API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        ip: data.ipAddress,
        hostname: data.ipAddress,
        country: data.countryName || 'Unknown',
        region: data.stateProv || 'Unknown',
        city: data.city || 'Unknown',
        timezone: data.timeZone || 'Unknown',
        postalCode: data.zipCode || '',
        latitude: data.latitude,
        longitude: data.longitude,
        isp: data.organization || 'Unknown',
        date: new Date().toLocaleDateString('en-GB'),
        ipRange: this.generateIpRange(data.ipAddress || ip)
      };
    } catch (error) {
      console.error('DB-IP service error:', error);
      throw error;
    }
  }

  async fetchFromIpApi(ip) {
    try {
      const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,zip,lat,lon,timezone,isp,org,as,query`);
      
      if (!response.ok) {
        throw new Error(`IP-API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status !== 'success') {
        throw new Error(`IP-API error: ${data.message}`);
      }
      
      return {
        ip: data.query,
        hostname: data.query,
        country: data.country,
        region: data.regionName,
        city: data.city,
        timezone: data.timezone,
        postalCode: data.zip,
        latitude: data.lat,
        longitude: data.lon,
        isp: data.isp,
        organization: data.org,
        asn: data.as,
        date: new Date().toLocaleDateString('en-GB')
      };
    } catch (error) {
      console.error('IP-API service error:', error);
      throw error;
    }
  }

  generateIpRange(ip) {
    if (!ip) return 'Unknown';
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0-255 CIDR`;
    }
    return `${ip} CIDR`;
  }

  formatLocalTime(isoString) {
    if (!isoString) return 'Unknown';
    
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZoneName: 'short' 
      }) + ' ' + date.toLocaleDateString();
    } catch (error) {
      return 'Unknown';
    }
  }
}

export const ipGeolocationService = new IpGeolocationService();