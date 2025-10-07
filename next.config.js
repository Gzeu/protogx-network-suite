/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  experimental: {
    serverComponentsExternalPackages: ['@multiversx/sdk-core'],
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'framer-motion']
  },

  // Image optimization
  images: {
    domains: [
      'gateway.pinata.cloud',
      'ipfs.io',
      'cloudflare-ipfs.com'
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.multiversx.com https://*.ipfs.io https://gateway.pinata.cloud https://vercel.live"
          }
        ]
      }
    ]
  },

  // Webpack optimization
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    // Handle node modules that don't work in browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer')
    }

    // Bundle analyzer for production builds
    if (!dev && !isServer) {
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env.BUILD_ID': JSON.stringify(buildId)
        })
      )
    }

    return config
  },

  // Build optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  
  // Environment variables
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '1.0.0',
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString()
  },

  // Redirects for better SEO
  async redirects() {
    return [
      {
        source: '/game',
        destination: '/games',
        permanent: true
      },
      {
        source: '/dao',
        destination: '/games/quantum-dao',
        permanent: false
      }
    ]
  },

  // Static generation optimization
  trailingSlash: false,
  reactStrictMode: true,
  swcMinify: true
}

module.exports = nextConfig