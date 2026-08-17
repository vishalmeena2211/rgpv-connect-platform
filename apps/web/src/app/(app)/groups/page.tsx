import { UsersRound } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/auth';
import { getGroups } from '@/features/groups/group-queries';
import { JoinButton } from '@/features/groups/join-button';

export const metadata = { title: 'Groups' };

const TYPE_LABEL = { COLLEGE: 'College', BRANCH: 'Branch', INTEREST: 'Interest' } as const;

/** Browse and join communities — college, branch, and interest groups. */
export default async function GroupsPage() {
  const session = await auth();
  const groups = await getGroups(session?.user?.id ?? null);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Groups</h1>
        <p className="text-sm text-muted-foreground">
          Join your college, branch, and interest communities.
        </p>
      </header>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No groups yet. They&apos;ll appear here as communities form.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <Card key={group.id}>
              <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
                <div className="min-w-0 space-y-1">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {group.name}
                    <Badge variant="secondary">{TYPE_LABEL[group.type]}</Badge>
                  </CardTitle>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <UsersRound className="size-3.5" />
                    {group.memberCount} member{group.memberCount === 1 ? '' : 's'}
                    {group.collegeName ? ` · ${group.collegeName}` : ''}
                  </p>
                </div>
                <JoinButton groupId={group.id} initialMember={group.isMember} />
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
