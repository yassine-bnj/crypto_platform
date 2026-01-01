/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Optimizations for Docker
  reactStrictMode: true,
  swcMinify: true,
  // For Docker, ensure we listen on all interfaces
  serverRuntimeConfig: {
    // Only available server-side
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  },
  publicRuntimeConfig: {
    // Available both server and client-side
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  },
}

export default nextConfig
