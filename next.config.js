/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; img-src 'self' data: blob: https:; script-src 'self' 'unsafe-eval' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https: fonts.googleapis.com; font-src 'self' data: https: fonts.gstatic.com; connect-src 'self' https: wss: ws:;"
          }
        ]
      }
    ]
  },
  async redirects() {
    return [
      {
        source: '/dashboard/dashboard',
        destination: '/dashboard',
        permanent: true, // redirecionamento 308
      },
      {
        source: '/dashboard/dashboard/:path*',
        destination: '/dashboard/:path*',
        permanent: true,
      }
    ]
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Evita root incorreto quando há lockfile fora deste projeto
  outputFileTracingRoot: path.join(__dirname)
}


module.exports = nextConfig
