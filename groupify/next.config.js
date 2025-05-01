/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
    allowedDevOrigins: ['http://127.0.0.1:3000'],
  },
};

module.exports = {
  ...nextConfig,
  webpack: (config) => {
    config.entry = async () => {
      const entries = await config.entry();
      if (entries['main.js'] && !entries['main.js'].includes('./src/lib/init.js')) {
        entries['main.js'].unshift('./src/lib/init.js'); // Ensure init.js runs on startup
      }
      return entries;
    };
    return config;
  },
};
