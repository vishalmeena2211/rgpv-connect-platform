'use client';

import { useEffect, useRef } from 'react';

import { track, type EventName, type EventProps } from '@/lib/analytics';

/**
 * Counts one event when a server-made page shows something worth counting: a
 * filter chosen, a search run, a sign-in error. Counting in the browser, not on
 * the server, leaves out programs and "Do Not Track" browsers the same way as
 * every other count. Renders nothing.
 */
export function TrackView({ event, props = {} }: { event: EventName; props?: EventProps }) {
  // Once per thing shown: a new filter or search on the same page counts again, a re-render does not.
  const sent = useRef<string | null>(null);
  const key = `${event}|${JSON.stringify(props)}`;
  useEffect(() => {
    if (sent.current === key) return;
    sent.current = key;
    track(event, JSON.parse(key.slice(event.length + 1)) as EventProps);
  }, [event, key]);
  return null;
}
