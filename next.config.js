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
}

module.exports = nextConfig 