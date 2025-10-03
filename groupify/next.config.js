/** @type {import('next').NextConfig} */
const nextConfig = {
  // Clean configuration for Turbopack compatibility
  experimental: {
    //
    // Turbopack is enabled via CLI flag, no additional config needed
    // },
    // webpack: (config, { isServer }) => {
    //   // Only modify webpack config when not using turbopack
    //   if (!isServer) {
    //     config.entry = async () => {
    //       const entries = await config.entry();
    //       if (
    //         entries['main.js'] &&
    //         !entries['main.js'].includes('./src/lib/init.js')
    //       ) {
    //         entries['main.js'].unshift('./src/lib/init.js'); // Ensure init.js runs on startup
    //       }
    //       return entries;
    //     };
    //   }
    //   return config;
    // Add any experimental features here if needed
  },
};

module.exports = nextConfig;
