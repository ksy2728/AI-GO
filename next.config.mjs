/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Force rebuild with unique build ID
  generateBuildId: async () => {
    // Generate unique build ID to bypass cache - updated for table deployment
    return `table-${Date.now()}-${Math.random().toString(36).substring(7)}`
  },
  
  // Disable caching for API routes
  headers: async () => {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
        ],
      },
    ]
  },
  
  // Performance optimizations
  experimental: {
    // Optimize imports for heavy packages
    optimizePackageImports: [
      'recharts', 
      '@tanstack/react-query', 
      'lucide-react',
      '@radix-ui/react-tabs',
      '@radix-ui/react-select',
      '@radix-ui/react-scroll-area',
      'socket.io-client',
    ],
    // Enable optimized CSS
    optimizeCss: true,
  },
  
  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Image optimization
  images: {
    domains: [
      'cdn.ai-go.com',
      'upload.wikimedia.org',
      'mistral.ai',
      'cohere.com',
      'huggingface.co',
    ],
    formats: ['image/avif', 'image/webp'],
    // Enable image optimization
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      // Enable SWC minification
      config.optimization.minimize = true
      
      // Split chunks for better caching
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          // Common components chunk
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      }
    }
    
    return config
  },
  
  // Module resolution optimization
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
  },
  
  // Build performance
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Enable build output analysis
  productionBrowserSourceMaps: false,
  
  // Server external packages (moved from experimental)
  serverExternalPackages: ['prisma', '@prisma/client', 'bcryptjs'],
}

export default nextConfig