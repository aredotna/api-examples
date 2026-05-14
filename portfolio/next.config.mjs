/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  output: 'export',
  serverExternalPackages: ['@napi-rs/canvas'],
  trailingSlash: true,
}

export default nextConfig
