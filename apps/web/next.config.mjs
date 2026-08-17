/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emit a self-contained server bundle for the Docker image.
  output: 'standalone',
  // Transpile workspace packages that ship raw TS.
  transpilePackages: ['@rgpv/shared', '@rgpv/db'],
  experimental: {
    // Server Actions handle our mutations; keep payload limits sane.
    serverActions: { bodySizeLimit: '2mb' },
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }],
  },
};

export default nextConfig;
