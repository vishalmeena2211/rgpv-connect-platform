'use client';

import { useCallback } from 'react';

// RGPV sessions stay usable for about four minutes; one warm per two covers a person typing.
const WARM_EVERY_MS = 2 * 60 * 1000;
let lastWarm = 0;

/**
 * Ask the server to get an RGPV session ready, at most once every two
 * minutes per tab. Call it when someone starts on an enrollment number.
 */
export function useWarmLookup(): () => void {
  return useCallback(() => {
    if (Date.now() - lastWarm < WARM_EVERY_MS) return;
    lastWarm = Date.now();
    fetch('/api/result/warm', { method: 'POST', keepalive: true }).catch(() => {
      // Best-effort.
    });
  }, []);
}
