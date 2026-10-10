import Link from 'next/link';
import { Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import type { Feature } from '@/lib/features';

const COPY: Record<Feature, { title: string; body: string }> = {
  network: {
    title: 'The campus network opens when your college reaches a third',
    body: 'A feed with ten people in it is not worth opening. Once about a third of a batch is verified, the feed, directory and groups open for that college.',
  },
  campus: {
    title: 'Jobs and the campus market open after launch',
    body: 'They open with the network, once enough of your college is verified that buyers and sellers can trust each other.',
  },
};

/** Shown instead of an after-launch section while its switch is off. */
export function FeatureClosed({ feature }: { feature: Feature }) {
  return (
    <div className="mx-auto max-w-[720px]">
      <Card>
        <EmptyState
          icon={Lock}
          title={COPY[feature].title}
          action={
            <>
              <Button asChild>
                <Link href="/results/me">Open My results</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/results/me">Share my card with the batch</Link>
              </Button>
            </>
          }
        >
          {COPY[feature].body}
        </EmptyState>
      </Card>
    </div>
  );
}
