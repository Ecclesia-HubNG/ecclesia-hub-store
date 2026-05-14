/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-10bc4fec8b2b43a0992e28a4cf1acf41.r2.dev',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
