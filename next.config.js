/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output config for Vercel
  output: 'standalone',
  // Optimize images
  images: {
    domains: ['via.placeholder.com'],
    unoptimized: false,
  },
  // PWA support
  headers: async () => {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
