import { debugAuth } from '../utils/auth';
import { apiService } from '../services/apiService';

const AuthTester = () => {
  const testAuth = async () => {
    console.clear();
    console.log('Testing authentication...');
    
    // Тест 1: Проверка учетных данных
    const authInfo = debugAuth();
    console.log('Auth Info:', authInfo);
    
    // Тест 2: Проверка API endpoints
    try {
      console.log('Testing API connection...');
      
      const metrics = await apiService.getAgentMetrics();
      console.log('Metrics test passed:', metrics);
      
      const task = await apiService.submitCheck('google.com', 'ping');
      console.log('Task creation test passed:', task);
      
      alert('All tests passed! Authentication is working.');
      
    } catch (error) {
      console.error('API test failed:', error);
      alert(`Test failed: ${error.message}`);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      background: '#2196f3',
      color: 'white',
      padding: '10px',
      borderRadius: '4px',
      fontSize: '12px',
      zIndex: 1000
    }}>
      <button 
        onClick={testAuth}
        style={{
          background: 'white',
          color: '#2196f3',
          border: 'none',
          padding: '5px 10px',
          borderRadius: '3px',
          cursor: 'pointer'
        }}
      >
        Test Auth
      </button>
      <div style={{marginTop: '5px', fontSize: '10px'}}>
        Real Backend Mode
      </div>
    </div>
  );
};

export default AuthTester;