import { NextRequest } from "next/server";
import { db } from "@/lib/db/client";
import { usersTable, promptsTable, scrapsTable } from "@/lib/db/schema";
import { getAuthUser, unauthorized } from "@/lib/http/auth-middleware";
import { eq, sql, count } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  const [user] = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      nickname: usersTable.nickname,
      role: usersTable.role,
      avatarUrl: usersTable.avatarUrl,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(eq(usersTable.id, auth.userId))
    .limit(1);

  if (!user) return unauthorized();

  // Prompt count
  const [{ promptCount }] = await db
    .select({ promptCount: count() })
    .from(promptsTable)
    .where(eq(promptsTable.authorId, auth.userId));

  // Scrap count
  const [{ scrapCount }] = await db
    .select({ scrapCount: count() })
    .from(scrapsTable)
    .where(eq(scrapsTable.userId, auth.userId));

  return Response.json({ ...user, promptCount, scrapCount });
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  const { nickname, avatarUrl } = await request.json();

  const [updated] = await db
    .update(usersTable)
    .set({
      ...(nickname ? { nickname } : {}),
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
    })
    .where(eq(usersTable.id, auth.userId))
    .returning({
      id: usersTable.id,
      email: usersTable.email,
      nickname: usersTable.nickname,
      role: usersTable.role,
      avatarUrl: usersTable.avatarUrl,
    });

  return Response.json(updated);
}
