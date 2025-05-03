/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Desabilitando a verificação do ESLint durante o build
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig 