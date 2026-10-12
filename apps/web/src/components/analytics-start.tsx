'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { followRecording, pagePattern, startAnalytics, track, type EventName, type EventProps } from '@/lib/analytics';

/**
 * Starts Mixpanel once the page is up, counts each page as a pattern, and
 * counts links and buttons marked with data-track. A server-rendered part of a
 * page names its event in the markup instead of needing script of its own:
 *   <a data-track="Resource opened" data-track-props='{"type":"NOTE"}'>
 */
export function AnalyticsStart() {
  const path = usePathname();

  useEffect(() => {
    followRecording(path);
    const page = pagePattern(path);
    track('Page viewed', { page, section: page.split('/')[1] || 'home' });
  }, [path]);

  useEffect(() => {
    void startAnalytics();
    function leaving(event: MouseEvent) {
      const a = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
      if (!a || a.origin !== window.location.origin) return;
      followRecording(a.pathname);
    }
    function back() {
      followRecording(window.location.pathname);
    }
    function counted(event: MouseEvent) {
      const el = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-track]') : null;
      const name = el?.dataset.track;
      if (!el || !name) return;
      let props: EventProps = {};
      try {
        props = el.dataset.trackProps ? (JSON.parse(el.dataset.trackProps) as EventProps) : {};
      } catch {
        // A mistyped marking still counts the event, without its details.
      }
      track(name as EventName, props);
    }
    document.addEventListener('click', leaving, { capture: true });
    document.addEventListener('click', counted, { capture: true });
    window.addEventListener('popstate', back);
    return () => {
      document.removeEventListener('click', leaving, { capture: true });
      document.removeEventListener('click', counted, { capture: true });
      window.removeEventListener('popstate', back);
    };
  }, []);

  return null;
}
