import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Terms', description: 'The few rules for using RGPV Connect.', alternates: { canonical: '/terms' } };

const RULES = [
  'Use your own enrollment number. Verifying with someone else’s number gets the account removed.',
  'Upload notes and papers you made or are allowed to share. Reviewers remove anything that is not.',
  'Be decent. Harassment, spam and other people’s personal information are removed, and repeat removals pause posting for 30 days.',
  'Market listings are between students. RGPV Connect never takes payment, so meet in person and pay when you have the item.',
  'Results come from RGPV’s portal as they are. For anything official, RGPV’s own documents count, not this site.',
];

export default function TermsPage() {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
      <header>
        <h1 className="font-display text-[34px] font-extrabold tracking-[-0.03em]">Terms</h1>
        <p className="mt-2 text-[13px] text-muted-foreground">
          RGPV Connect is free, open source and run by students. These are the rules that keep it useful.
        </p>
      </header>
      <ol className="flex list-decimal flex-col gap-3 pl-5 text-[14px] leading-6">
        {RULES.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ol>
    </article>
  );
}
