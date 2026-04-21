/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/backend-static/:path*',
        destination: 'http://localhost:3457/static/:path*',
      },
    ]
  },
}

module.exports = nextConfig
