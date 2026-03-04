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
      nickname: usersTable.name,
      role: sql<string>`'user'`,
      avatarUrl: usersTable.image,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(eq(usersTable.id, auth.userId))
    .limit(1);

  if (!user) return unauthorized();

  // Prompt count (실제 존재하는 프롬프트 행 수, bigint → number 보장)
  const [promptRow] = await db
    .select({ promptCount: count() })
    .from(promptsTable)
    .where(eq(promptsTable.authorId, auth.userId));
  const promptCount = Number(promptRow?.promptCount ?? 0);

  // Scrap count
  const [scrapRow] = await db
    .select({ scrapCount: count() })
    .from(scrapsTable)
    .where(eq(scrapsTable.userId, auth.userId));
  const scrapCount = Number(scrapRow?.scrapCount ?? 0);

  return Response.json({ ...user, promptCount, scrapCount });
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  const { nickname, avatarUrl } = await request.json();

  const [updated] = await db
    .update(usersTable)
    .set({
      ...(nickname ? { name: nickname } : {}),
      ...(avatarUrl !== undefined ? { image: avatarUrl } : {}),
    })
    .where(eq(usersTable.id, auth.userId))
    .returning({
      id: usersTable.id,
      email: usersTable.email,
      nickname: usersTable.name,
      role: sql<string>`'user'`,
      avatarUrl: usersTable.image,
    });

  return Response.json(updated);
}
