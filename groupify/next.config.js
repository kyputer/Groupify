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
  // Picture retrieval optimization
  // Adding the spotify CDN as a trusted image source to get album art
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
        port: '',
        pathname: '/image/**',
      },
    ],
  },
};

// https://i.scdn.co/image/ab67616d0000b2733e5a1515b5f85c7b45619273

module.exports = nextConfig;
