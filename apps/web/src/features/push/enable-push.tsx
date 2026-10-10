'use client';

import { useEffect, useState, useTransition } from 'react';
import { BellOff, BellRing, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { removePushSubscription, savePushSubscription } from './actions';

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

type State = 'unsupported' | 'off-server' | 'denied' | 'off' | 'on' | 'loading';

/** Turn notifications on this device on or off. Says why when it cannot. */
export function EnablePush({ vapidPublicKey }: { vapidPublicKey: string | null }) {
  const [state, setState] = useState<State>('loading');
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!vapidPublicKey) return setState('off-server');
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return setState('unsupported');
    if (Notification.permission === 'denied') return setState('denied');
    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => setState(subscription ? 'on' : 'off'))
      .catch(() => setState('off'));
  }, [vapidPublicKey]);

  function enable() {
    startTransition(async () => {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'off');
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey!) as BufferSource,
      });
      const result = await savePushSubscription(subscription.toJSON());
      if (result.ok) {
        setState('on');
        toast.success('Notifications are on for this device.');
      } else {
        toast.error('Could not turn notifications on. Try again.');
      }
    });
  }

  function disable() {
    startTransition(async () => {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await removePushSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setState('off');
    });
  }

  const reason: Partial<Record<State, string>> = {
    'off-server': 'Push notifications are not set up on this server yet. You still get them in the app.',
    unsupported: 'This browser cannot show notifications. On iPhone, add RGPV Connect to your home screen first.',
    denied: 'Notifications are blocked for this site. Allow them in your browser settings, then come back.',
  };

  if (state === 'on') {
    return (
      <Button variant="outline" size="sm" onClick={disable} disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <BellOff />}
        Turn off on this device
      </Button>
    );
  }
  return (
    <div className="flex flex-col items-start gap-1.5">
      <Button size="sm" onClick={enable} disabled={pending || state !== 'off'} title={reason[state]}>
        {pending || state === 'loading' ? <Loader2 className="animate-spin" /> : <BellRing />}
        Turn on for this device
      </Button>
      {reason[state] ? <p className="text-xs text-muted-foreground">{reason[state]}</p> : null}
    </div>
  );
}
