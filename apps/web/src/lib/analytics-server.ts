import 'server-only';

import { randomUUID } from 'node:crypto';

import { headers } from 'next/headers';
import { after } from 'next/server';

import { ANALYTICS_ON, MIXPANEL_API_HOST, MIXPANEL_TOKEN } from './analytics-config';
import type { EventName, EventProps } from './analytics-events';
import { isRobotName } from './robots';

/*
  Sends one event from the server, for what only the server sees finish: an account made, a lookup's outcome, an
  admin's review. Server code only; never import it from a component that runs in the browser.

  It goes after the page has answered, so nobody waits for it, and it never fails a request. No student is attached:
  Mixpanel counts how many, not who. A browser that asks not to be tracked ("Do Not Track", or Global Privacy Control)
  is not counted, and nor is a program that names itself (robots.ts): search engines open public result pages too.
*/
export async function trackOnServer(
  event: EventName,
  props: EventProps = {},
  /** job: an outcome of RGPV Connect's own work (results day), which the server's timer may be the one to finish. */
  options: { job?: boolean } = {},
): Promise<void> {
  if (!ANALYTICS_ON) return;
  if (!options.job) {
    try {
      const h = await headers();
      if (h.get('dnt') === '1' || h.get('sec-gpc') === '1') return;
      const agent = h.get('user-agent') ?? '';
      if (agent === '' || isRobotName(agent)) return;
    } catch {
      // Called outside a request: there is no browser to ask.
    }
  }
  const send = async () => {
    try {
      await fetch(`${MIXPANEL_API_HOST}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/plain' },
        body: JSON.stringify([
          {
            event,
            properties: {
              ...props,
              token: MIXPANEL_TOKEN,
              time: Date.now(),
              distinct_id: '',
              $insert_id: randomUUID(),
              sent_from: 'server',
            },
          },
        ]),
        signal: AbortSignal.timeout(5_000),
      });
    } catch {
      // Counting must never break a request.
    }
  };
  try {
    after(send);
  } catch {
    void send();
  }
}
