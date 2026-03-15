/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const getRemotePatterns = () => {
  const patterns = [
    {
      protocol: 'http',
      hostname: 'localhost',
      port: '4000',
      pathname: '/uploads/**',
    },
  ];

  try {
    const parsedUrl = new URL(apiUrl);
    patterns.push({
      protocol: parsedUrl.protocol.replace(':', ''),
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || undefined,
      pathname: '/uploads/**',
    });
  } catch {
    // Fall back to localhost-only remote patterns if the deployment URL is invalid at build time.
  }

  return patterns;
};

const nextConfig = {
  images: {
    remotePatterns: getRemotePatterns(),
  },
  env: {
    NEXT_PUBLIC_API_URL: apiUrl,
    NEXT_PUBLIC_PAYPAL_CLIENT_ID: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Disable persistent webpack caching in dev to avoid stale chunk references
      // that have been corrupting .next/server on this Windows workspace.
      config.cache = false;
    }

    return config;
  },
};

module.exports = nextConfig;
