import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RGPV Connect',
    short_name: 'RGPV Connect',
    description: 'RGPV results in seconds, your CGPA trend, notes and papers, and your verified batch.',
    start_url: '/results',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F6F6F3',
    theme_color: '#0F8A6F',
    categories: ['education', 'productivity'],
    icons: [
      { src: '/icons/192', sizes: '192x192', type: 'image/png' },
      { src: '/icons/512', sizes: '512x512', type: 'image/png' },
      { src: '/icons/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
