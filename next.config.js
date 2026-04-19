/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/sign/**',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['sharp', 'fluent-ffmpeg'],
  },
}

module.exports = nextConfig
