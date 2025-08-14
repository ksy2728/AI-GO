/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export', // 정적 사이트 생성 활성화
  trailingSlash: true, // URL 끝에 슬래시 추가
  images: {
    unoptimized: true, // 이미지 최적화 비활성화 (정적 호스팅용)
  },
  experimental: {
    optimizePackageImports: ['recharts', '@tanstack/react-query', 'lucide-react'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 정적 생성을 위한 설정
  basePath: '', // GitHub Pages 등에서 서브디렉토리 배포 시 사용
  assetPrefix: '', // CDN 사용 시 설정
}

export default nextConfig