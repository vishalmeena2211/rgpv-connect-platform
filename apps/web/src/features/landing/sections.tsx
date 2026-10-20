import Link from 'next/link';
import { ArrowRight, BellRing, Calculator, FileText, GraduationCap, Share2, ShieldCheck, TrendingUp } from 'lucide-react';
import type { SemesterResult } from '@rgpv/shared';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getCatalogueBranches } from '@/features/resources/queries';
import { ResultCard } from '@/features/results/result-card';
import { Sparkline } from '@/features/results/trend-chart';

/*
  The long landing page below the hero, in reading order: what you can count on, how a check works, an example
  result, what joining adds, the results calendar, notes and papers, verification and privacy, questions, and a
  closing call to action. Every number shown is either example data (labelled) or a rule the code applies.
*/

const GITHUB = 'https://github.com/vishalmeena2211/rgpv-connect-platform';

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent-foreground">{children}</span>;
}

function SectionTitle({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return (
    <div className="flex max-w-[680px] flex-col gap-2.5">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="text-balance font-display text-[28px] font-extrabold leading-[1.1] tracking-[-0.03em] sm:text-[36px]">{title}</h2>
      {intro ? <p className="text-[16px] leading-[26px] text-muted-foreground">{intro}</p> : null}
    </div>
  );
}

/** Four plain promises, right under the hero. */
export function PromiseStrip() {
  const items = ['Live from RGPV’s result portal', 'No account needed to check', 'Free, MIT-licensed code on GitHub', 'Made by RGPV students'];
  return (
    <section aria-label="What you can count on" className="relative mx-auto max-w-6xl px-4 pb-14 sm:px-6">
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <li key={item} className="rounded-lg border bg-card px-4 py-3.5 text-sm font-semibold shadow-card">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The three steps of a lookup. */
export function HowItWorks() {
  const steps = [
    {
      title: 'Type your enrollment number',
      body: 'We read your college, branch and batch straight from it, so there is nothing else to fill in. Pick a semester or let us pick the latest one.',
    },
    {
      title: 'We ask RGPV live',
      body: 'RGPV’s portal is slow and fussy on results day. We take care of its steps for you and keep trying, so you are not refreshing it over and over.',
    },
    {
      title: 'Read it clearly',
      body: 'Name, pass status, SGPA and CGPA up top, then every subject with credits, grade and grade points, laid out to read on a phone.',
    },
  ];
  return (
    <section id="how" className="scroll-mt-20 border-y bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 sm:py-20">
        <SectionTitle eyebrow="How it works" title="How a result check works" />
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-3 rounded-xl bg-background p-6">
              <span className="grid size-10 place-items-center rounded-[12px] bg-primary font-display font-extrabold text-primary-foreground">
                {index + 1}
              </span>
              <h3 className="font-display text-lg font-bold">{step.title}</h3>
              <p className="text-[15px] leading-[23px] text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Example data, drawn with the real result card so the page shows exactly what a student gets. */
const EXAMPLE: SemesterResult = {
  name: 'PRIYANSHI RATHORE',
  enrollment: '0151CS241042',
  session: 'Jun 2026',
  branch: 'CS',
  semester: 4,
  status: 'PASS',
  sgpa: 8.41,
  cgpa: 7.95,
  subjects: [
    { name: 'CS401- [T]', grade: 'A' },
    { name: 'CS402- [T]', grade: 'B+' },
    { name: 'CS403- [T]', grade: 'B+' },
    { name: 'CS404- [T]', grade: 'B' },
    { name: 'CS405- [T]', grade: 'A+' },
    { name: 'CS406- [P]', grade: 'A' },
  ],
};
const EXAMPLE_CREDITS = new Map([
  ['CS401', 4],
  ['CS402', 3],
  ['CS403', 3],
  ['CS404', 3],
  ['CS405', 2],
  ['CS406', 2],
]);
const EXAMPLE_NAMES = new Map([
  ['CS401', 'Analysis & Design of Algorithms'],
  ['CS402', 'Software Engineering'],
  ['CS403', 'Computer Organisation & Architecture'],
  ['CS404', 'Operating Systems'],
  ['CS405', 'Java Programming'],
  ['CS406', 'Algorithms Lab'],
]);

export function ExampleResult() {
  return (
    <section className="mx-auto flex max-w-6xl flex-wrap items-center gap-10 px-4 py-16 sm:px-6 sm:py-20">
      <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-4">
        <SectionTitle
          eyebrow="Your result page"
          title="A result you can actually read"
          intro="RGPV’s page was built for a desktop. Ours puts the numbers you care about first and keeps theory and practical rows apart."
        />
        <ul className="flex list-disc flex-col gap-2 pl-5 text-[15px]">
          <li>SGPA, CGPA and credits at the top</li>
          <li>Grade points next to every grade</li>
          <li>Practicals shown as their own rows</li>
          <li>A share card for WhatsApp, CGPA only if you choose</li>
        </ul>
      </div>
      <div className="min-w-0 flex-[1_1_520px]">
        <ResultCard result={EXAMPLE} credits={EXAMPLE_CREDITS} names={EXAMPLE_NAMES} actions={<Badge variant="warning">Example</Badge>} />
      </div>
    </section>
  );
}

/** What joining adds on top of a lookup. */
export function JoinFeatures() {
  const features = [
    {
      icon: Calculator,
      title: 'What-if calculator',
      body: 'Pick the SGPA you are aiming for next semester and see the CGPA it would give you. Aim for 8.82 after the example above and the CGPA becomes 8.12.',
    },
    {
      icon: BellRing,
      title: 'Results-day alert',
      body: 'Turn on one notification. When RGPV declares your next semester, it arrives with your result already fetched. Nothing else, ever.',
    },
    {
      icon: FileText,
      title: 'Notes and previous papers',
      body: 'Shared by verified students, sorted by branch, semester and subject, and checked by a reviewer before they go up.',
    },
    {
      icon: Share2,
      title: 'A share card for WhatsApp',
      body: 'Send a clean image of your SGPA to family or your batch group. CGPA and rank appear only if you switch them on.',
    },
    {
      icon: ShieldCheck,
      title: 'A batch you can trust',
      body: 'Your college, branch and batch come from your enrollment number and your name from RGPV’s record, so everyone here is a real RGPV student.',
    },
  ];
  return (
    <section className="border-y bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 sm:py-20">
        <SectionTitle
          eyebrow="After the result"
          title="Join once, and the rest of your degree is easier"
          intro="Checking a result never needs an account. Joining with your enrollment number adds these."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article className="flex flex-col gap-2.5 rounded-xl bg-background p-6">
            <span className="grid size-[38px] place-items-center rounded-[11px] bg-accent">
              <TrendingUp className="size-[18px] text-accent-foreground" />
            </span>
            <h3 className="font-display text-[17px] font-bold">Every semester, one timeline</h3>
            <p className="text-[14.5px] leading-[22px] text-muted-foreground">
              We fetch your other semesters too and chart your CGPA. Example: SGPA 7.42, 7.85, 8.10, 8.41.
            </p>
            <Sparkline values={[7.42, 7.85, 8.1, 8.41]} className="mt-auto h-11 w-full" />
          </article>
          {features.map(({ icon: Icon, title, body }) => (
            <article key={title} className="flex flex-col gap-2.5 rounded-xl bg-background p-6">
              <span className="grid size-[38px] place-items-center rounded-[11px] bg-accent">
                <Icon className="size-[18px] text-accent-foreground" />
              </span>
              <h3 className="font-display text-[17px] font-bold">{title}</h3>
              <p className="text-[14.5px] leading-[22px] text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
        <div>
          <Button asChild size="lg">
            <Link href="/login">
              Join with your enrollment
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/** The usual declaration windows, from the same rule the app uses (packages/shared academics/calendar). */
export function ResultsCalendar() {
  const rows = [
    { title: 'Odd semesters · 1, 3, 5, 7', exams: 'Nov to Dec', results: 'Jan to Feb' },
    { title: 'Even semesters · 2, 4, 6, 8', exams: 'May to Jun', results: 'Jul to Aug' },
  ];
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 sm:py-20">
      <SectionTitle
        eyebrow="Results calendar"
        title="When RGPV usually declares results"
        intro="These are the usual windows, not promises. RGPV’s own portal is always the final word, and some years run late."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((row) => (
          <article key={row.title} className="flex flex-col gap-3.5 rounded-xl border bg-card p-6 shadow-card">
            <h3 className="flex items-center gap-2 font-display text-lg font-bold">
              <GraduationCap className="size-5 text-accent-foreground" aria-hidden />
              {row.title}
            </h3>
            <div className="flex flex-wrap gap-2.5 text-[15px]">
              <span className="rounded-[12px] bg-muted px-3.5 py-2.5">
                <b>Exams</b> {row.exams}
              </span>
              <span className="rounded-[12px] bg-accent px-3.5 py-2.5 text-accent-foreground">
                <b>Results</b> usually {row.results}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/** Notes and papers, with one link per branch the catalogue knows. */
export async function NotesBand() {
  const branches = await getCatalogueBranches().catch(() => []);
  return (
    <section id="notes" className="scroll-mt-20 border-y bg-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-start gap-10 px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-4">
          <SectionTitle
            eyebrow="Notes and papers"
            title="Notes and previous year papers for your branch"
            intro="Free to read and download. Every upload is checked by a reviewer, usually within two days."
          />
          <div className="flex flex-wrap gap-2.5">
            <Button asChild>
              <Link href="/notes">Browse notes</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/papers">Browse papers</Link>
            </Button>
          </div>
        </div>
        {branches.length > 0 ? (
          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-3 rounded-xl bg-background p-6">
            <p className="text-[13px] font-semibold text-muted-foreground">Pick your branch</p>
            <ul className="flex flex-wrap gap-2">
              {branches.map((branch) => (
                <li key={branch.code}>
                  <Link
                    href={`/notes?branch=${branch.code}&semester=1`}
                    className="inline-flex rounded-full border bg-card px-3.5 py-2 text-sm font-semibold hover:border-primary hover:text-accent-foreground"
                  >
                    {branch.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** Verification and privacy, side by side. */
export function TrustAndPrivacy() {
  return (
    <section className="mx-auto grid max-w-6xl gap-4 px-4 py-16 sm:px-6 sm:py-20 md:grid-cols-2">
      <article className="flex flex-col gap-3.5 rounded-xl border bg-card p-7 shadow-card">
        <Eyebrow>Verification</Eyebrow>
        <h2 className="font-display text-[24px] font-extrabold tracking-[-0.02em]">Nobody can pretend to be you</h2>
        <ul className="flex list-disc flex-col gap-2 pl-5 text-[15px] leading-[23px]">
          <li>You sign in with an email link or Google, with no password to remember.</li>
          <li>We fetch one of your real results from RGPV; the name on it becomes your name here.</li>
          <li>One enrollment number belongs to one account. If someone took yours, you can claim it back.</li>
        </ul>
        <Link href="/how-it-works" className="text-sm font-bold text-accent-foreground hover:underline">
          Read how verification works
        </Link>
      </article>
      <article className="flex flex-col gap-3.5 rounded-xl border bg-card p-7 shadow-card">
        <Eyebrow>Your data</Eyebrow>
        <h2 className="font-display text-[24px] font-extrabold tracking-[-0.02em]">Your marks stay yours</h2>
        <ul className="flex list-disc flex-col gap-2 pl-5 text-[15px] leading-[23px]">
          <li>Result pages are kept out of Google and other search engines.</li>
          <li>Share cards show only what you switch on.</li>
          <li>Delete your account and everything with it at any time.</li>
        </ul>
        <Link href="/privacy" className="text-sm font-bold text-accent-foreground hover:underline">
          Read the privacy page
        </Link>
      </article>
    </section>
  );
}

/** Questions students search for. Also published as FAQPage structured data on the home page. */
export const FAQ: { q: string; a: string }[] = [
  {
    q: 'How do I check my RGPV result?',
    a: 'Type your 12-character enrollment number, such as 0151CS241042, pick the semester and press Check result. We ask RGPV’s result portal for you and show the result in about ten seconds.',
  },
  {
    q: 'Is RGPV Connect the official RGPV website?',
    a: 'No. It is a free, independent project by RGPV students and is not affiliated with Rajiv Gandhi Proudyogiki Vishwavidyalaya. Results come from RGPV’s public result portal, which stays the official source.',
  },
  {
    q: 'How are SGPA and CGPA calculated?',
    a: 'SGPA is each subject’s credits multiplied by its grade points, added up and divided by the total credits. Grade points: A+ 10, A 9, B+ 8, B 7, C+ 6, C 5, D 4, F 0. CGPA combines your semesters’ SGPAs, weighted by credits when we know them.',
  },
  {
    q: 'Why does a check take about ten seconds?',
    a: 'We ask RGPV’s portal live every time instead of showing an old copy, and the portal takes a few seconds to answer. A result we fetched recently comes back instantly.',
  },
  {
    q: 'Is it free?',
    a: 'Yes, completely, with no ads and no paid tier. The code is open source under the MIT licence.',
  },
  {
    q: 'Can I delete my data?',
    a: 'Yes. Use Delete my data in the footer or on the privacy page, and your account and everything linked to it is removed.',
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 border-y bg-card">
      <div className="mx-auto flex max-w-[860px] flex-col gap-6 px-4 py-16 sm:px-6 sm:py-20">
        <SectionTitle eyebrow="FAQ" title="Questions students ask" />
        <div className="flex flex-col gap-2.5">
          {FAQ.map((item, index) => (
            <details key={item.q} open={index === 0} className="group rounded-xl bg-background px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[16px] font-bold [&::-webkit-details-marker]:hidden">
                {item.q}
                <span className="text-muted-foreground transition-transform group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-2.5 text-[15px] leading-[24px] text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/** The closing call to action. */
export function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="bg-ink-gradient relative flex flex-wrap items-center justify-between gap-7 overflow-hidden rounded-[28px] p-7 text-ink-foreground shadow-float sm:p-12">
        <div className="glow-primary pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative flex min-w-0 flex-[1_1_420px] flex-col gap-3">
          <h2 className="font-display text-[28px] font-extrabold leading-[1.08] tracking-[-0.03em] sm:text-[40px]">Check your result now</h2>
          <p className="text-[16px] leading-[26px] text-ink-foreground/80">
            No sign-up, no ads. Built in the open by RGPV students, and the code is on GitHub for anyone to read.
          </p>
        </div>
        <div className="relative flex flex-wrap gap-3">
          <Button asChild size="lg" className="bg-[#F6C343] text-[#0F2A24] hover:bg-[#F2B807]">
            <Link href="/#check">Check a result</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white/35 bg-transparent text-ink-foreground hover:bg-white/10 hover:text-ink-foreground">
            <a href={GITHUB}>Read the code</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
