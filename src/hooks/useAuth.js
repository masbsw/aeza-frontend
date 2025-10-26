import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { debugAuth, getAdminAuthorizationHeader } from '../utils/auth';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const checkAuthentication = async () => {
    debugAuth();

    const authHeader = getAdminAuthorizationHeader();
    if (!authHeader) {
      setAuthError('Admin credentials not configured in environment variables');
      setAuthLoading(false);
      setIsAuthenticated(false);
      return false;
    }

    try {
      await apiService.getAgentMetrics();
      setIsAuthenticated(true);
      setAuthError(null);
      return true;
    } catch (error) {
      setIsAuthenticated(false);
      
      if (error.message.includes('401') || error.message.includes('Authentication failed')) {
        setAuthError('Invalid admin credentials. Please check REACT_APP_ADMIN_USERNAME and REACT_APP_ADMIN_PASSWORD.');
      } else if (error.message.includes('403')) {
        setAuthError('Access denied. ADMIN role required.');
      } else {
        setAuthError(`Authentication check failed: ${error.message}`);
      }
      
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    checkAuthentication();
  }, []);

  return {
    isAuthenticated,
    authLoading,
    authError,
    checkAuthentication
  };
};