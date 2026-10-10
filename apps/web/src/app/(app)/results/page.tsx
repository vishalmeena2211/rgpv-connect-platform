import { redirect } from 'next/navigation';

import { getCurrentUser, isVerified } from '@/lib/session';

/** Results opens on your own results once verified, on the lookup before that. */
export default async function ResultsIndex() {
  const user = await getCurrentUser();
  redirect(isVerified(user) ? '/results/me' : '/results/lookup');
}
