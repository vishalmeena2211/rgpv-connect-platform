'use client';

import { useEffect } from 'react';

import { track } from '@/lib/analytics';

declare global {
  interface Window {
    __rgpvInstallPrompt?: BeforeInstallPromptEvent | null;
  }
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  }
}

/**
 * Registers the service worker and keeps the browser's install prompt for
 * later, so "Add to home screen" can be offered after a value moment instead
 * of on first load.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    const keep = (event: Event) => {
      event.preventDefault();
      window.__rgpvInstallPrompt = event as BeforeInstallPromptEvent;
      window.dispatchEvent(new Event('rgpv:installable'));
    };
    // Counted here, once for the whole page, however many "Add to home screen" buttons it shows.
    const installed = () => track('App installed');
    window.addEventListener('beforeinstallprompt', keep);
    window.addEventListener('appinstalled', installed);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => undefined);
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', keep);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);
  return null;
}
