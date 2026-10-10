import { redirect } from 'next/navigation';

import { requireUser } from '@/lib/session';

/** "Me" in the tab bar: your own profile. */
export default async function MePage() {
  const user = await requireUser('/me');
  redirect(`/u/${user.id}`);
}
