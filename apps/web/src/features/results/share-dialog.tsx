'use client';

import { useEffect, useState, useTransition } from 'react';
import { Copy, Download, Loader2, Share2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { shareMyResult, sharePublicResult } from './actions';
import type { ShareCardData } from './share';
import { ShareCardView } from './share-card-view';

type Props =
  | {
      kind: 'own';
      semester: number;
      preview: ShareCardData;
      /** Null when the cohort is too small to rank. */
      rankLabel: string | null;
      trigger?: React.ReactNode;
    }
  | {
      kind: 'public';
      enrollment: string;
      semester: number;
      preview: ShareCardData;
      trigger?: React.ReactNode;
    };

function whatsappHref(url: string, sgpa: number | null, semester: number): string {
  const text = `My semester ${semester} SGPA${sgpa != null ? `: ${sgpa.toFixed(2)}` : ''}. Check yours in 10 seconds:`;
  return `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
}

/**
 * Share a result as a card. The card is created on the server (a random token,
 * never the enrollment number, goes in the link), then shared to WhatsApp,
 * saved as an image or copied as a link.
 */
export function ShareDialog(props: Props) {
  const [open, setOpen] = useState(false);
  const [showCgpa, setShowCgpa] = useState(true);
  const [showRank, setShowRank] = useState(false);
  const [link, setLink] = useState<{ url: string; token: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const preview: ShareCardData = {
    ...props.preview,
    cgpa: showCgpa ? props.preview.cgpa : null,
    previousCgpa: showCgpa ? props.preview.previousCgpa : null,
    rank: props.kind === 'own' && showRank ? props.rankLabel : null,
  };

  // Create the card as soon as the dialog opens (and again when the options
  // change), so every button below is a real link and never a blocked popup.
  const kind = props.kind;
  const semester = props.semester;
  const enrollment = props.kind === 'public' ? props.enrollment : null;
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLink(null);
    startTransition(async () => {
      const result =
        kind === 'own'
          ? await shareMyResult({ semester, showCgpa, showRank })
          : await sharePublicResult({ enrollment: enrollment!, semester });
      if (cancelled) return;
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setLink({ url: result.url, token: result.token });
    });
    return () => {
      cancelled = true;
    };
  }, [open, kind, semester, enrollment, showCgpa, showRank]);

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.url);
      toast.success('Link copied');
    } catch {
      toast.message(link.url);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        {props.trigger ?? (
          <Button variant="outline" size="sm">
            <Share2 />
            Share card
          </Button>
        )}
      </DialogTrigger>
      <DialogContent wide>
        <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
          <ShareCardView data={preview} className="mx-auto" />
          <div className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Share your semester {props.semester} card</DialogTitle>
              <DialogDescription>
                {props.kind === 'own'
                  ? 'Your name, SGPA and CGPA, marked as verified. The card links to RGPV Connect so friends can check their own result.'
                  : 'The SGPA and CGPA with the enrollment serial hidden. Sign in and verify to put your name on it.'}
              </DialogDescription>
            </DialogHeader>
            {props.kind === 'own' ? (
              <div className="flex flex-col gap-2.5">
                <p className="text-xs font-semibold">What’s on the card</p>
                <Checkbox id="share-sgpa" label={`SGPA ${props.preview.sgpa?.toFixed(2) ?? ''}`} checked disabled readOnly />
                <Checkbox
                  id="share-cgpa"
                  label="CGPA and the change"
                  checked={showCgpa}
                  onChange={(e) => setShowCgpa(e.target.checked)}
                />
                <Checkbox
                  id="share-rank"
                  label={props.rankLabel ? `Rank in batch (${props.rankLabel})` : 'Rank in batch'}
                  hint={props.rankLabel ? undefined : 'Shown once 20 or more of your batch are verified.'}
                  checked={showRank}
                  disabled={!props.rankLabel}
                  onChange={(e) => setShowRank(e.target.checked)}
                />
              </div>
            ) : null}
            {link && !pending ? (
              <Button asChild size="lg" className="w-full">
                <a href={whatsappHref(link.url, preview.sgpa, props.semester)} target="_blank" rel="noopener noreferrer">
                  <Share2 />
                  Share to WhatsApp
                </a>
              </Button>
            ) : (
              <Button size="lg" className="w-full" disabled>
                <Loader2 className="animate-spin" />
                Preparing your card…
              </Button>
            )}
            <div className="grid grid-cols-2 gap-2">
              {link && !pending ? (
                <Button asChild variant="outline">
                  <a href={`/api/share/${link.token}/image?download=1`} download={`rgpv-semester-${props.semester}.png`}>
                    <Download />
                    Save image
                  </a>
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  <Download />
                  Save image
                </Button>
              )}
              <Button variant="outline" disabled={!link || pending} onClick={copy}>
                <Copy />
                Copy link
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with the link sees the card and a “check your result” button. Your subject grades are never on it.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
