const mockApi = {
  async submitCheck(target, checkType) {
    console.log(`Mock: Submitting ${checkType} check for ${target}`);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      taskId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      target: target,
      status: 'running',
      checkType: checkType
    };
  },

  async getTaskStatus(taskId, checkType) {
    console.log(`Mock: Getting status for ${taskId}, type: ${checkType}`);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      taskId: taskId,
      status: 'completed',
      progress: 100,
      results: generateMockResults(checkType)
    };
  },

  async getAgentMetrics() {
    console.log('Mock: Getting agent metrics');
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return [
      {
        agentName: 'de1-agent',
        metricType: 'AGENT_AVAILABILITY',
        value: 95.5,
        timestamp: new Date().toISOString()
      },
      {
        agentName: 'us1-agent', 
        metricType: 'REQUEST_COUNT',
        value: 1247,
        timestamp: new Date().toISOString()
      },
      {
        agentName: 'de1-agent',
        metricType: 'RESPONSE_DELAY', 
        value: 23.4,
        timestamp: new Date().toISOString()
      }
    ];
  }
};

const generateMockResults = (checkType) => {
  switch (checkType) {
    case 'ping':
      return {
        "de1.node.check-host.net": [
          [
            ["OK", 0.045, "142.250.185.206"],
            ["OK", 0.042],
            ["OK", 0.048],
            ["OK", 0.043]
          ]
        ],
        "us1.node.check-host.net": [
          [
            ["OK", 0.067, "142.250.185.206"],
            ["OK", 0.065],
            ["TIMEOUT", 3.000],
            ["OK", 0.069]
          ]
        ]
      };

    case 'http':
      return {
        "de1.node.check-host.net": [
          [1, 0.136, "OK", "200", "142.250.185.206"]
        ],
        "us1.node.check-host.net": [
          [1, 0.854, "OK", "200", "142.250.185.206"]
        ]
      };

    case 'tcp':
      return {
        "de1.node.check-host.net": [
          { "address": "142.250.185.206", "time": 0.044 }
        ],
        "us1.node.check-host.net": [
          { "address": "142.250.185.206", "time": 0.224 }
        ]
      };

    case 'dns':
      return {
        "de1.node.check-host.net": [
          { "A": ["142.250.185.206"], "AAAA": [], "TTL": 381 }
        ],
        "us1.node.check-host.net": [
          { "A": ["142.250.185.206"], "AAAA": [], "TTL": 381 }
        ]
      };

    case 'info':
      return {
        info: {
          ip: '158.160.46.143',  
          hostname: '158.160.46.143',
          asn: '200350',
          isp: 'Yandex Cloud LLC',
          country: 'Russia (RU)',
          region: 'Moscow',
          timezone: 'Europe/Moscow, GMT+0300',
          localTime: '12:15 (MSK) 2025.10.25',
          sources: [
            {
              name: 'DB-IP',
              date: '04.10.2025',
              ipRange: '158.160.0.0-158.160.255.255 CIDR',
              city: 'Moscow',
              postalCode: '',
            }
          ]
        }
      };

    default:
      return null;
  }
};

export default mockApi;