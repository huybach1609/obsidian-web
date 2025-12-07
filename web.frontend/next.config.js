/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    let apiHost = 'backend';
    let apiPort = '2112';
    
    if (isProduction) {
      apiHost = process.env.API_HOST;
      apiPort = process.env.API_PORT;
      
      if (!apiHost || apiHost.trim() === '') {
        throw new Error('API_HOST is required in production and cannot be empty or null');
      }
      
      if (!apiPort || apiPort.trim() === '') {
        throw new Error('API_PORT is required in production and cannot be empty or null');
      }
    }
    
    return [
      {
        source: '/api/:path*',
        destination: `http://${apiHost}:${apiPort}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
