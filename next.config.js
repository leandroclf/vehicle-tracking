/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Desabilitando a verificação do ESLint durante o build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Desabilitando a verificação de tipos durante o build
    ignoreBuildErrors: true,
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
  }
}

module.exports = nextConfig