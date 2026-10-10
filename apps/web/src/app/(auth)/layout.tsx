import { Wordmark } from '@/components/brand';

/** Sign-in and onboarding: one centred card on the soft mesh, nothing else to click. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div className="hero-mesh pointer-events-none absolute inset-0" aria-hidden />
      <header className="relative px-4 py-4 sm:px-6">
        <Wordmark />
      </header>
      <main className="relative flex flex-1 items-start justify-center px-4 pb-10 pt-4 sm:items-center sm:pt-0">
        <div className="w-full max-w-[440px] rounded-xl border bg-card p-6 shadow-float sm:p-7">{children}</div>
      </main>
    </div>
  );
}
