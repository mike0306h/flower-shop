/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        // 使用 /backend-static/ 路径避免与 Next.js 内置 /static/ 冲突
        source: '/backend-static/:path*',
        destination: 'http://localhost:3457/static/:path*',
      },
    ]
  },
}

module.exports = nextConfig
