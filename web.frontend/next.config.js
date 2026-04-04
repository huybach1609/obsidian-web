import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Force a single physical copy of @codemirror/state so extension instanceof checks work (avoids duplicate nested installs). */
const codemirrorStateRoot = path.resolve(__dirname, 'node_modules/@codemirror/state');
/** Same for React Aria — duplicate @react-aria/interactions breaks PressResponder context (react-spectrum#5647). */
const reactAriaInteractionsRoot = path.resolve(
  __dirname,
  'node_modules/@react-aria/interactions',
);
const reactAriaUtilsRoot = path.resolve(__dirname, 'node_modules/@react-aria/utils');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', pathname: '/api/**' },
      { protocol: 'https', hostname: 'localhost', pathname: '/api/**' },
      { protocol: 'http', hostname: '127.0.0.1', pathname: '/api/**' },
      { protocol: 'https', hostname: '127.0.0.1', pathname: '/api/**' },
      ...(process.env.NEXT_PUBLIC_API_HOST
        ? [
            {
              protocol: 'http',
              hostname: process.env.NEXT_PUBLIC_API_HOST,
              pathname: '/api/**',
            },
            {
              protocol: 'https',
              hostname: process.env.NEXT_PUBLIC_API_HOST,
              pathname: '/api/**',
            },
          ]
        : []),
    ],
  },

  // Turbopack: use project-relative paths only (absolute paths break resolution).
  turbopack: {
    resolveAlias: {
      // Turbopack uses its own resolver (webpack aliases won't apply in dev),
      // so we must force a single physical @codemirror/state copy here too.
      '@codemirror/state': './node_modules/@codemirror/state',
      // @codemirror/view indirectly depends on @codemirror/state and participates in
      // extension identity checks, so alias it as well for extra safety.
      '@codemirror/view': './node_modules/@codemirror/view',
      '@react-aria/interactions': './node_modules/@react-aria/interactions',
      '@react-aria/utils': './node_modules/@react-aria/utils',
    },
  },

  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@codemirror/state': codemirrorStateRoot,
      '@react-aria/interactions': reactAriaInteractionsRoot,
      '@react-aria/utils': reactAriaUtilsRoot,
    };
    return config;
  },

  ...(process.env.NODE_ENV === 'production' ? {
    async rewrites() {
      console.log('process.env.NEXT_PUBLIC_API_HOST', process.env.NEXT_PUBLIC_API_HOST);

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
