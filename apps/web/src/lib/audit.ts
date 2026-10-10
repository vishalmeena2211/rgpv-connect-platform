import 'server-only';

import { type Prisma, prisma } from '@rgpv/db';

/** Record an admin decision with who made it and when. */
export async function audit(params: {
  actorId: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  data?: Prisma.InputJsonValue;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: params.actorId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId ?? null,
      data: params.data,
    },
  });
}
