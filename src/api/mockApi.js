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