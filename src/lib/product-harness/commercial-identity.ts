import { eq } from 'drizzle-orm';
import { db } from '@/lib/database';
import { users } from '@/lib/schema';
import type { CommercialIdentityResolver } from './hubspot';

export const resolveCommercialIdentity: CommercialIdentityResolver = async (accountId) => {
  const [user] = await db
    .select({ email: users.email, name: users.name, phone: users.phone })
    .from(users)
    .where(eq(users.id, accountId))
    .limit(1);

  return user ?? null;
};
