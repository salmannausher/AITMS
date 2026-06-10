import { inngest } from '../inngest/inngest.client';
import { PrismaService } from '../prisma/prisma.service';

export function createCleanCacheFunction(prisma: PrismaService) {
  return inngest.createFunction(
    { id: 'clean-cache', triggers: [{ cron: '0 3 * * *' }] },
    async ({ step }) => {
      const deleted = await step.run('delete-expired', () =>
        prisma.cache.deleteMany({ where: { expires_at: { lt: new Date() } } }),
      );
      return { deletedCount: deleted.count };
    },
  );
}
