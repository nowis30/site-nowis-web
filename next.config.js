/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output config for Vercel
  output: 'standalone',
  // Optimize images
  images: {
    domains: ['via.placeholder.com'],
    unoptimized: false,
  },
  // Host and path redirects
  redirects: async () => {
    return [
      // Harmoniser ancienne URL de politique vers la nouvelle
      {
        source: '/privacy',
        destination: '/confidentialite',
        permanent: true,
      },
      // Rediriger www vers le domaine apex (si résolu côté DNS)
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.nowis.store' }],
        destination: 'https://nowis.store/:path*',
        permanent: true,
      },
    ];
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
