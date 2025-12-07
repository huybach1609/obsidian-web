/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  ...(process.env.NODE_ENV === 'production' ? {
    async rewrites() {
      let apiHost = process.env.NEXT_PUBLIC_API_HOST ;
      let apiPort = process.env.NEXT_PUBLIC_API_PORT ;

      if (!apiHost || apiHost.trim() === '') {
        throw new Error('NEXT_PUBLIC_API_HOST is required in production and cannot be empty or null');
      }

      if (!apiPort || apiPort.trim() === '') {
        throw new Error('NEXT_PUBLIC_API_PORT is required in production and cannot be empty or null');
      }

      return [
        {
          source: '/api/:path*',
          destination: `http://${apiHost}:${apiPort}/api/:path*`,
        },
      ];
    },
  } : {}),
};

export default nextConfig;
