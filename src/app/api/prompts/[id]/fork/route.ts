import { NextRequest } from "next/server";
import { db } from "@/lib/db/client";
import {
  promptsTable,
  promptVersionsTable,
  usersTable,
} from "@/lib/db/schema";
import { getAuthUser, unauthorized, notFound } from "@/lib/http/auth-middleware";
import { eq, sql } from "drizzle-orm";

// POST /api/prompts/:id/fork
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const promptId = Number(id);
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  // Get source prompt
  const [source] = await db
    .select()
    .from(promptsTable)
    .where(eq(promptsTable.id, promptId))
    .limit(1);

  if (!source) return notFound("프롬프트를 찾을 수 없습니다.");

  const body = await request.json().catch(() => ({}));
  const title = body.title ?? `${source.title} (Fork)`;

  // Create forked prompt
  const [forked] = await db
    .insert(promptsTable)
    .values({
      authorId: auth.userId,
      categoryId: source.categoryId,
      title,
      content: source.content,
      description: source.description,
      isPublic: true,
      parentPromptId: source.id,
      forkedFromVersionId: body.fromVersionId ?? null,
      currentVersionNo: 1,
    })
    .returning();

  // Create v1 for forked prompt
  await db.insert(promptVersionsTable).values({
    promptId: forked.id,
    versionNo: 1,
    title: forked.title,
    content: forked.content,
    changeNote: `"${source.title}"에서 Fork`,
    editedBy: auth.userId,
  });

  // Increment fork_count on source
  await db
    .update(promptsTable)
    .set({ forkCount: sql`${promptsTable.forkCount} + 1` })
    .where(eq(promptsTable.id, promptId));

  return Response.json(forked, { status: 201 });
}
