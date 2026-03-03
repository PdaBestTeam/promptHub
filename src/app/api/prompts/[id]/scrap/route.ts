import { NextRequest } from "next/server";
import { db } from "@/lib/db/client";
import { scrapsTable, promptsTable } from "@/lib/db/schema";
import { getAuthUser, unauthorized, notFound } from "@/lib/http/auth-middleware";
import { and, eq, sql } from "drizzle-orm";

// POST /api/prompts/:id/scrap
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const promptId = Number(id);
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  const [prompt] = await db
    .select({ id: promptsTable.id })
    .from(promptsTable)
    .where(eq(promptsTable.id, promptId))
    .limit(1);
  if (!prompt) return notFound();

  await db
    .insert(scrapsTable)
    .values({ userId: auth.userId, promptId: promptId })
    .onConflictDoNothing();

  // Update scrap_count
  await db
    .update(promptsTable)
    .set({ scrapCount: sql`${promptsTable.scrapCount} + 1` })
    .where(eq(promptsTable.id, promptId));

  return Response.json({ scrapped: true });
}

// DELETE /api/prompts/:id/scrap
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const promptId = Number(id);
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  const deleted = await db
    .delete(scrapsTable)
    .where(and(eq(scrapsTable.userId, auth.userId), eq(scrapsTable.promptId, promptId)))
    .returning();

  if (deleted.length > 0) {
    await db
      .update(promptsTable)
      .set({ scrapCount: sql`GREATEST(${promptsTable.scrapCount} - 1, 0)` })
      .where(eq(promptsTable.id, promptId));
  }

  return Response.json({ scrapped: false });
}
