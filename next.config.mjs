/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['recharts', '@tanstack/react-query', 'lucide-react'],
  },
  images: {
    domains: ['cdn.ai-go.com'],
    formats: ['image/avif', 'image/webp'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig