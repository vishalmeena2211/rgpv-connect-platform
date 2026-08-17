/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emit a self-contained server bundle for the Docker image (infra/).
  // Skipped on Vercel, which has its own build output pipeline — standalone
  // output in a monorepo can otherwise break Vercel's output detection.
  output: process.env.VERCEL ? undefined : 'standalone',
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
