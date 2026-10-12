import type { Mixpanel } from 'mixpanel-browser';

import { ANALYTICS_ON, MIXPANEL_API_HOST, MIXPANEL_TOKEN, RECORD_PERCENT } from './analytics-config';
import type { EventName, EventProps } from './analytics-events';

/*
  What RGPV Connect tells Mixpanel, in the browser only. Which project, and
  when counting is on: analytics-config.ts. The event list: analytics-events.ts.

  Pages are counted as patterns, never as raw addresses: a shared result's
  address holds an enrollment number, so /result/0151CS241042 is counted as
  /result/:enrollment. Nothing after "?" and no referring page's full address
  is kept. A browser set to "Do Not Track" is not counted, and nor is one run by
  a program (a crawler, a page inspector, a test tool).

  In development nothing is sent: each event is written to the console instead.
*/

export { EVENTS, type EventName, type EventProps } from './analytics-events';

const SEND = ANALYTICS_ON;

let started: Promise<Mixpanel | null> | null = null;

// Words only programs put in the browser's name. Mixpanel skips the crawlers it knows by name, but not a browser
// driven by a program: headless Chrome, Google's page inspector, SEO crawlers, link previews, test tools.
const ROBOT = /bot\b|bot\/|crawl|spider|slurp|headless|lighthouse|inspectiontool|pagespeed|preview|phantom|selenium|puppeteer|playwright/i;

/** A browser run by a program, not a person. Such a visit is neither counted nor recorded. */
export function looksAutomated(): boolean {
  try {
    const ua = navigator.userAgent;
    // A phone named Cubot has "bot" in its name; its owner is a person.
    return navigator.webdriver === true || (ROBOT.test(ua) && !/cubot/i.test(ua));
  } catch {
    return false;
  }
}

/** Segments that identify a person or a private thing, replaced before a path is sent. */
const PRIVATE_SEGMENTS: [RegExp, string][] = [
  [/^\/result\/[^/]+/, '/result/:enrollment'],
  [/^\/s\/[^/]+/, '/s/:token'],
  [/^\/u\/[^/]+/, '/u/:id'],
  [/^\/messages\/[^/]+/, '/messages/:id'],
  [/^\/market\/(?!new\b)[^/]+/, '/market/:id'],
  [/^\/resources\/[^/]+/, '/resources/:id'],
];

/** A page's path with ids replaced, safe to send. */
export function pagePattern(path: string): string {
  for (const [pattern, replacement] of PRIVATE_SEGMENTS) {
    if (pattern.test(path)) return path.replace(pattern, replacement);
  }
  return path;
}

/** Loads Mixpanel once, after the page is up, so no page waits for it. Does nothing where counting is off. */
export function startAnalytics(): Promise<Mixpanel | null> {
  if (started) return started;
  if (typeof window === 'undefined' || !SEND || looksAutomated()) {
    started = Promise.resolve(null);
    return started;
  }
  started = import('mixpanel-browser')
    .then(({ default: mixpanel }) => {
      mixpanel.init(MIXPANEL_TOKEN, {
        api_host: MIXPANEL_API_HOST,
        // Pages are counted by AnalyticsStart as patterns, never by raw address.
        track_pageview: false,
        // Raw addresses and referring pages can hold an enrollment number or a share token.
        property_blacklist: ['$current_url', 'current_url_search', '$referrer', '$initial_referrer', 'current_url_path', 'current_page_title'],
        autocapture: false,
        record_sessions_percent: 0,
        record_mask_all_inputs: true,
        record_mask_all_text: false,
        record_mask_text_selector: ['[data-private]'],
        record_block_selector: 'video, audio, iframe, [data-private-block]',
        record_console: false,
        record_network: false,
        record_canvas: false,
        // The random visitor number lives in the browser's storage, not in a cookie sent with every page.
        persistence: 'localStorage',
        ignore_dnt: false,
        debug: process.env.NODE_ENV === 'development',
      });
      return mixpanel;
    })
    .catch(() => null);
  return started;
}

/** Sends one event. Safe to call anywhere: where counting is off, or on the server, it does nothing. */
export function track(event: EventName, props: EventProps = {}): void {
  if (typeof window === 'undefined') return;
  if (!SEND) {
    // eslint-disable-next-line no-console -- development only: shows each event instead of sending it
    if (process.env.NODE_ENV === 'development') console.debug(`[analytics] ${event}`, props);
    return;
  }
  void startAnalytics().then((mixpanel) => mixpanel?.track(event, props));
}

/** Pages never recorded: anything showing a result, an account, messages, signing in, or admin. */
const NOT_RECORDED = [/^\/result/, /^\/s\//, /^\/me/, /^\/u\//, /^\/messages/, /^\/settings/, /^\/login/, /^\/onboarding/, /^\/welcome/, /^\/admin/, /^\/notifications/, /^\/uploads/];

export function mayRecord(path: string): boolean {
  return !NOT_RECORDED.some((r) => r.test(path));
}

let chosen: boolean | null = null;
let recording = false;

/** Starts the screen recording on a page that may be recorded, and stops it before one that may not. */
export function followRecording(path: string): void {
  if (typeof window === 'undefined' || !SEND || RECORD_PERCENT === 0) return;
  chosen ??= Math.random() * 100 < RECORD_PERCENT;
  if (!chosen) return;
  const allowed = mayRecord(path);
  if (allowed === recording) return;
  recording = allowed;
  void startAnalytics().then((mixpanel) => {
    if (!mixpanel) return;
    if (allowed) mixpanel.start_session_recording();
    else mixpanel.stop_session_recording();
  });
}
