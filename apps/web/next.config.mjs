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
  async headers() {
    return [
      {
        // Only rgpvconnect.co.in belongs in search results. The same site on a
        // *.vercel.app deployment address, a preview, or this machine is kept
        // out, so search engines never list a copy.
        source: '/:path*',
        missing: [{ type: 'host', value: 'rgpvconnect.co.in' }],
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // Vercel Blob (STORAGE_DRIVER=blob) serves uploads from the store's public host.
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
};

export default nextConfig;
