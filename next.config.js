/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
})

// Configuration for better performance and modern features
const nextConfig = {
  // Enable experimental features for Next.js 15
  experimental: {
    // Enable Turbo mode for faster builds
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js'
        }
      },
      resolveAlias: {
        '@': './src',
        '@/components': './src/components',
        '@/lib': './src/lib',
        '@/types': './src/types',
        '@/hooks': './src/hooks',
        '@/utils': './src/utils',
        '@/config': './src/config'
      }
    },
    // Enable React 19 concurrent features
    reactRoot: true,
    // Enable Server Components
    serverComponents: true,
    // Enable optimized images
    optimizeImages: true,
    // Enable optimized CSS
    optimizeCss: true,
    // Enable Edge Runtime for better performance
    runtime: 'edge',
    // Enable modern JS features
    esmExternals: true,
    // Enable font optimization
    fontLoaders: [{
      loader: 'next/font/google',
      options: { subsets: ['latin'] }
    }]
  },

  // TypeScript configuration
  typescript: {
    // Strict type checking
    ignoreBuildErrors: false
  },

  // ESLint configuration
  eslint: {
    // Strict linting
    ignoreDuringBuilds: false,
    dirs: ['src', 'components', 'lib', 'hooks', 'utils']
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: [
      'raw.githubusercontent.com',
      'gateway.pinata.cloud',
      'ipfs.io',
      'cloudflare-ipfs.com',
      'res.cloudinary.com',
      'images.unsplash.com',
      'avatars.githubusercontent.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.ipfs.io',
      },
      {
        protocol: 'https',
        hostname: '**.cloudflare-ipfs.com',
      },
      {
        protocol: 'https',
        hostname: '**.pinata.cloud',
      }
    ],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 1 week
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },

  // Webpack 5 optimizations
  webpack: (config, { dev, isServer }) => {
    // Performance optimizations
    if (!dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': require('path').resolve(__dirname, 'src')
      }
    }

    // SVG handling
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack']
    })

    // WebAssembly support for smart contracts
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true
    }

    // Optimize bundle size
    if (!dev) {
      config.optimization.usedExports = true
      config.optimization.sideEffects = false
    }

    return config
  },

  // Environment variables
  env: {
    CUSTOM_KEY: 'protogx-network'
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
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel.app *.google.com *.googleapis.com;
              style-src 'self' 'unsafe-inline' *.googleapis.com;
              img-src 'self' data: blob: *.ipfs.io *.pinata.cloud *.cloudflare-ipfs.com *.unsplash.com *.githubusercontent.com;
              font-src 'self' *.googleapis.com *.gstatic.com;
              connect-src 'self' *.multiversx.com *.vercel.app *.supabase.co *.openai.com *.anthropic.com wss:;
              frame-src 'self' *.multiversx.com *.vercel.app;
              worker-src 'self' blob:;
              child-src 'self';
            `.replace(/\s+/g, ' ').trim()
          }
        ]
      }
    ]
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
        source: '/play',
        destination: '/games',
        permanent: true
      }
    ]
  },

  // Rewrites for API routes
  async rewrites() {
    return [
      {
        source: '/api/ai/:path*',
        destination: '/api/ai/:path*'
      },
      {
        source: '/api/blockchain/:path*',
        destination: '/api/blockchain/:path*'
      }
    ]
  },

  // Compression
  compress: true,

  // Power by header removal
  poweredByHeader: false,

  // React strict mode
  reactStrictMode: true,

  // SWC minify for better performance
  swcMinify: true,

  // Static page generation
  trailingSlash: false,

  // Output configuration for deployment
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  // Analytics integration
  analytics: {
    enabled: process.env.NODE_ENV === 'production'
  },

  // Performance monitoring
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously
    pagesBufferLength: 2
  },

  // Logging
  logging: {
    fetches: {
      fullUrl: true
    }
  }
}

module.exports = withBundleAnalyzer(nextConfig)