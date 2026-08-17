import Link from 'next/link';

import { Card, CardContent } from '@/components/ui/card';
import { getCurrentUser, isVerified } from '@/lib/session';
import { DirectoryFilters } from '@/features/network/directory-filters';
import { getDirectory } from '@/features/network/directory-queries';
import { UserCard } from '@/features/network/user-card';

export const metadata = { title: 'Network' };

/**
 * Student directory. Verified users browse and follow batchmates, scoped to
 * their college by default with a name search. Unverified users are nudged to
 * verify first, since the network is built on real enrollment identities.
 */
export default async function NetworkPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; q?: string }>;
}) {
  const user = await getCurrentUser();

  if (!isVerified(user) || !user) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold">Network</h1>
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            <Link href="/onboarding" className="font-medium text-primary hover:underline">
              Verify your enrollment
            </Link>{' '}
            to discover and connect with batchmates from your college.
          </CardContent>
        </Card>
      </div>
    );
  }

  const { scope, q } = await searchParams;
  const users = await getDirectory(user, {
    scope: scope === 'all' ? 'all' : 'college',
    search: q?.trim() || undefined,
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-3">
        <h1 className="text-2xl font-bold">Network</h1>
        <DirectoryFilters />
      </header>

      {users.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No students match your filters yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {users.map((directoryUser) => (
            <UserCard key={directoryUser.id} user={directoryUser} />
          ))}
        </div>
      )}
    </div>
  );
}
