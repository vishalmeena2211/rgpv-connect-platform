'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button, type ButtonProps } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

/**
 * "Add to home screen". Uses the browser's own prompt where there is one
 * (Android Chrome); elsewhere shows the two steps to do it by hand.
 */
export function InstallButton({ icon, ...props }: ButtonProps & { icon?: React.ReactNode }) {
  const [installed, setInstalled] = useState(false);
  const [howTo, setHowTo] = useState(false);

  useEffect(() => {
    setInstalled(window.matchMedia('(display-mode: standalone)').matches);
    const done = () => {
      setInstalled(true);
      toast.success('Added to your home screen. Results now open offline.');
    };
    window.addEventListener('appinstalled', done);
    return () => window.removeEventListener('appinstalled', done);
  }, []);

  if (installed) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success-foreground">
        <CheckCircle2 className="size-4" />
        On your home screen
      </span>
    );
  }

  async function install() {
    const prompt = window.__rgpvInstallPrompt;
    if (!prompt) return setHowTo(true);
    await prompt.prompt();
    const choice = await prompt.userChoice;
    window.__rgpvInstallPrompt = null;
    if (choice.outcome === 'accepted') setInstalled(true);
  }

  return (
    <>
      <Button onClick={install} {...props}>
        {icon}
        Add to home screen
      </Button>
      <Dialog open={howTo} onOpenChange={setHowTo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add RGPV Connect to your home screen</DialogTitle>
            <DialogDescription>Your browser does it from its own menu.</DialogDescription>
          </DialogHeader>
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-[13px] leading-5">
            <li>
              <b>iPhone (Safari):</b> tap the Share button, then “Add to Home Screen”.
            </li>
            <li>
              <b>Android (Chrome):</b> tap the ⋮ menu, then “Add to Home screen” or “Install app”.
            </li>
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
}
