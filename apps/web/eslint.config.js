import nextConfig from '@rgpv/config/eslint/next';

export default [
  ...nextConfig,
  {
    ignores: ['.next/**', 'next-env.d.ts'],
  },
];
