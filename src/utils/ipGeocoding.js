export const geocodeIP = async (ip) => {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await response.json();
    
    if (data.latitude && data.longitude) {
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city,
        country: data.country_name,
        region: data.region,
        success: true
      };
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await response.json();
    
    if (data.lat && data.lon) {
      return {
        latitude: data.lat,
        longitude: data.lon,
        city: data.city,
        country: data.country,
        region: data.regionName,
        success: true
      };
    }
  } catch (error) {
    console.error('Backup geocoding error:', error);
  }

  return { success: false };
};