import type { Metadata } from 'next';
import { Building2, UsersRound } from 'lucide-react';

import { FeatureClosed } from '@/components/feature-closed';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { getGroups } from '@/features/groups/group-queries';
import { JoinButton } from '@/features/groups/join-button';
import { isFeatureOpen } from '@/lib/features';
import { requireUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Groups' };

const TYPE_LABEL = { COLLEGE: 'College', BRANCH: 'Batch', INTEREST: 'Interest' } as const;

/** Your college and batch groups (joined automatically), plus any others. */
export default async function GroupsPage() {
  const user = await requireUser('/groups');
  if (!isFeatureOpen('network', user.role)) return <FeatureClosed feature="network" />;
  const groups = await getGroups(user.id);
  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4">
      <PageHeader title="Groups" description="Your college and batch groups are joined automatically from your enrollment number." />
      {groups.length === 0 ? (
        <Card><EmptyState icon={UsersRound} title="No groups yet">They appear as soon as you verify.</EmptyState></Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {groups.map((group) => (
            <li key={group.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md border bg-card px-4 py-3 shadow-card">
              <span className="grid size-9 place-items-center rounded-full bg-accent">
                {group.type === 'COLLEGE' ? <Building2 className="size-4 text-accent-foreground" /> : <UsersRound className="size-4 text-accent-foreground" />}
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[13px] font-semibold">{group.name}<Badge>{TYPE_LABEL[group.type]}</Badge></p>
                <p className="text-xs text-muted-foreground">{group.memberCount} member{group.memberCount === 1 ? '' : 's'}</p>
              </div>
              {group.type === 'INTEREST' ? <JoinButton groupId={group.id} initialMember={group.isMember} /> : group.isMember ? <span className="text-xs font-medium text-success-foreground">Joined</span> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
