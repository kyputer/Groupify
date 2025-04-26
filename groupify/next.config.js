/** @type {import('next').NextConfig} */
const nextConfig = {
  // ...existing config...
  experimental: {
    allowedDevOrigins: ['http://127.0.0.1:3000'],
  },
};

module.exports = nextConfig;
