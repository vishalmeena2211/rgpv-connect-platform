import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Privacy' };

const SECTIONS: { id?: string; title: string; body: React.ReactNode }[] = [
  {
    title: 'What we collect',
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>Your email, and your Google name and photo if you sign in with Google.</li>
        <li>Your enrollment number and the name RGPV holds for it, once you verify.</li>
        <li>The semester results you save, and anything you post, upload or send.</li>
        <li>For public lookups, the result itself for six hours so repeat checks are fast. Your IP address is turned into a one-way code for rate limits and never stored.</li>
      </ul>
    ),
  },
  {
    title: 'Who sees what',
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>Other students see your name, college, branch, batch and what you choose to share.</li>
        <li>Nobody else sees your grades unless you share a card or turn on the semester board in Settings.</li>
        <li>Batch percentiles are worked out from everyone’s results but only shown for groups of 20 or more, so nobody can be singled out.</li>
        <li>We do not sell data, show ads, or use third-party trackers.</li>
      </ul>
    ),
  },
  {
    title: 'Where results come from',
    body: 'Results are read from RGPV’s public result portal (result.rgpv.ac.in) when you ask for them. RGPV Connect is a student project and is not run by or connected to RGPV.',
  },
  {
    id: 'delete',
    title: 'Deleting your data',
    body: (
      <>
        Go to <Link href="/settings#privacy" className="font-semibold text-accent-foreground">Settings → Privacy</Link> and ask
        for deletion. We wait seven days in case it was a mistake, then delete your account, results, messages and uploads. The
        request itself is kept, without your details, so we can show it was done. This follows India’s Digital Personal Data
        Protection Act, 2023.
      </>
    ),
  },
  {
    title: 'Contact',
    body: 'Write to hotelcityzen5@gmail.com with “Privacy” in the subject line.',
  },
];

export default function PrivacyPage() {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
      <header>
        <h1 className="font-display text-[34px] font-extrabold tracking-[-0.03em]">Privacy</h1>
        <p className="mt-2 text-[13px] text-muted-foreground">Last updated 11 October 2026.</p>
      </header>
      {SECTIONS.map((section) => (
        <section key={section.title} id={section.id} className="scroll-mt-24">
          <h2 className="mb-2 font-display text-lg font-bold">{section.title}</h2>
          <div className="text-[14px] leading-6 text-foreground/90">{section.body}</div>
        </section>
      ))}
    </article>
  );
}
