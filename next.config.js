/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output config for Vercel
  output: 'standalone',
  // Security hardening
  poweredByHeader: false,
  // Optimize images
  images: {
    domains: ['via.placeholder.com', 'i.ytimg.com', 'img.youtube.com', 'i.scdn.co', 'mosaic.scdn.co', 'localhost', '127.0.0.1', 'nowis.store', 'nowis-admin.vercel.app'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
    ],
    unoptimized: false,
  },
  // Proxy /games/* and /audio/* vers S3 (évite les problèmes cross-origin dans les iframes)
  rewrites: async () => {
    return [
      {
        source: '/games/:path*',
        destination: 'https://nowis-crm-files.s3.us-east-1.amazonaws.com/games/:path*',
      },
      {
        source: '/audio/:path*',
        destination: 'https://nowis-crm-files.s3.us-east-1.amazonaws.com/audio/:path*',
      },
    ];
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
      {
        source: '/jeux/H%C3%A9ritierMillionaire',
        destination: '/jeux/heritier-millionnaire',
        permanent: true,
      },
      {
        source: '/jeux/HéritierMillionaire',
        destination: '/jeux/heritier-millionnaire',
        permanent: true,
      },
      {
        source: '/jeux/HeritierMillionaire',
        destination: '/jeux/heritier-millionnaire',
        permanent: true,
      },
      {
        source: '/logements/:slug/reserver',
        destination: '/logements/:slug',
        permanent: true,
      },
      {
        source: '/projects/:slug',
        destination: '/portfolio',
        permanent: true,
      },
      {
        source: '/proprietaire',
        destination: '/connexion?next=/client/dashboard',
        permanent: true,
      },
      {
        source: '/proprietaire/:path*',
        destination: '/connexion?next=/client/dashboard',
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
  // Security & PWA headers
  headers: async () => {
    const securityHeaders = [
      // Force HTTPS for 1 year, includeSubDomains
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload',
      },
      // Block clickjacking — only allow framing from same origin
      {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN',
      },
      // Prevent MIME-type sniffing
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      // Limit referrer info sent to external domains
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      // Restrict browser feature APIs
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
      },
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on',
      },
      {
        key: 'Cross-Origin-Opener-Policy',
        value: 'same-origin-allow-popups',
      },
      // Content Security Policy
      // - script-src: self + unsafe-inline required by Next.js App Router
      // - frame-src: allow YouTube embeds
      // - img-src: allow all HTTPS images + data URIs (thumbnails, blobs)
      // - connect-src: allow API calls to self and admin backend
      // - object-src: none — block Flash/plugins
      // - base-uri/form-action: restrict to self
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          process.env.NODE_ENV === 'production'
            ? "script-src 'self' 'unsafe-inline'"
            : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https:",
          "font-src 'self' data:",
          "frame-src 'self' https://www.youtube.com https://youtube.com https://nowis-crm-files.s3.us-east-1.amazonaws.com",
          "frame-ancestors 'self'",
          "connect-src 'self' https:",
          "media-src 'self' blob: https: https://nowis-crm-files.s3.us-east-1.amazonaws.com",
          "worker-src 'self' blob:",
          "manifest-src 'self'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "upgrade-insecure-requests",
        ].join('; '),
      },
    ];

    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        // Service worker must not be cached
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
