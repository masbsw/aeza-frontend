import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { geocodeIP } from '../utils/ipGeocoding';
import '../styles/IpLocationMap.css'

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const IPLocationMap = ({ latitude, longitude, city, country, ip }) => {
  const [coordinates, setCoordinates] = useState(null);
  const [locationInfo, setLocationInfo] = useState({ city, country });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (latitude && longitude) {
      setCoordinates({
        lat: parseFloat(latitude),
        lng: parseFloat(longitude)
      });
      return;
    }

    if (ip && !latitude && !longitude) {
      geocodeIPAddress();
    }
  }, [latitude, longitude, ip]);

  const geocodeIPAddress = async () => {
    if (!ip) return;

    setLoading(true);
    setError(null);

    try {
      const result = await geocodeIP(ip);
      
      if (result.success) {
        setCoordinates({
          lat: result.latitude,
          lng: result.longitude
        });
        setLocationInfo({
          city: result.city || city,
          country: result.country || country
        });
      } else {
        setError('Could not determine location from IP');
      }
    } catch (err) {
      setError('Geocoding failed');
      console.error('Geocoding error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="map-loading">
        <div className="loading-spinner"></div>
        <p>Determining location from IP...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="map-error">
        <p>{error}</p>
        <button 
          onClick={geocodeIPAddress}
          className="retry-button"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!coordinates) {
    return (
      <div className="map-placeholder">
        <div className="placeholder-content">
          <span className="placeholder-icon">🗺️</span>
          <p>Location map unavailable</p>
          <small>No coordinates data provided</small>
          {ip && (
            <button 
              onClick={geocodeIPAddress}
              className="geocode-button"
            >
              Find location by IP
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="ip-location-map">
      <MapContainer
        center={[coordinates.lat, coordinates.lng]}
        zoom={10}
        style={{ height: '300px', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[coordinates.lat, coordinates.lng]}>
          <Popup>
            <div className="map-popup">
              <strong>IP Location</strong><br/>
              IP: {ip}<br/>
              City: {locationInfo.city || 'Unknown'}<br/>
              Country: {locationInfo.country || 'Unknown'}<br/>
              Coordinates: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
              <div style={{ fontSize: '10px', color: '#666', marginTop: '5px' }}>
                * Location determined by IP
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default IPLocationMap;