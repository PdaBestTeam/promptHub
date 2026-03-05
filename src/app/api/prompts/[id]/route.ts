import { NextRequest } from "next/server";
import { db } from "@/lib/db/client";
import {
  promptsTable,
  categoriesTable,
  usersTable,
  promptVersionsTable,
  scrapsTable,
} from "@/lib/db/schema";
import { getAuthUser, forbidden, notFound } from "@/lib/http/auth-middleware";
import { and, eq, inArray, ne, sql } from "drizzle-orm";

// GET /api/prompts/:id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const promptId = Number(id);
  const auth = await getAuthUser(request);

  const [prompt] = await db
    .select({
      id: promptsTable.id,
      title: promptsTable.title,
      content: promptsTable.content,
      description: promptsTable.description,
      isPublic: promptsTable.isPublic,
      currentVersionNo: promptsTable.currentVersionNo,
      viewCount: promptsTable.viewCount,
      scrapCount: promptsTable.scrapCount,
      forkCount: promptsTable.forkCount,
      parentPromptId: promptsTable.parentPromptId,
      forkedFromVersionId: promptsTable.forkedFromVersionId,
      createdAt: promptsTable.createdAt,
      updatedAt: promptsTable.updatedAt,
      category: {
        id: categoriesTable.id,
        name: categoriesTable.name,
        slug: categoriesTable.slug,
      },
      author: {
        id: usersTable.id,
        nickname: usersTable.name,
        avatarUrl: usersTable.image,
      },
    })
    .from(promptsTable)
    .leftJoin(categoriesTable, eq(promptsTable.categoryId, categoriesTable.id))
    .innerJoin(usersTable, eq(promptsTable.authorId, usersTable.id))
    .where(eq(promptsTable.id, promptId))
    .limit(1);

  if (!prompt) return notFound("프롬프트를 찾을 수 없습니다.");
  if (!prompt.isPublic && prompt.author.id !== auth?.userId) {
    return forbidden();
  }

  // Increment view count
  await db
    .update(promptsTable)
    .set({ viewCount: sql`${promptsTable.viewCount} + 1` })
    .where(eq(promptsTable.id, promptId));

  // Check if user scrapped this
  let isScrapped = false;
  if (auth) {
    const [scrap] = await db
      .select({ userId: scrapsTable.userId })
      .from(scrapsTable)
      .where(
        and(eq(scrapsTable.userId, auth.userId), eq(scrapsTable.promptId, promptId))
      )
      .limit(1);
    isScrapped = !!scrap;
  }

  // 다음 Fork에 붙을 버전 번호 = 트리 전체 노드 수 + 1
  let root = { id: prompt.id, parentPromptId: prompt.parentPromptId as number | null };
  while (root.parentPromptId != null) {
    const [parent] = await db
      .select({ id: promptsTable.id, parentPromptId: promptsTable.parentPromptId })
      .from(promptsTable)
      .where(eq(promptsTable.id, root.parentPromptId))
      .limit(1);
    if (!parent) break;
    root = parent;
  }
  const rootId = root.id;
  const visitedIds = new Set<number>([rootId]);
  let nodeCount = 1;
  let parentIds: number[] = [rootId];
  while (parentIds.length > 0) {
    const children = await db
      .select({ id: promptsTable.id })
      .from(promptsTable)
      .where(and(inArray(promptsTable.parentPromptId, parentIds), ne(promptsTable.id, rootId)));
    const newIds = children.map((c) => c.id).filter((id) => !visitedIds.has(id));
    newIds.forEach((id) => visitedIds.add(id));
    nodeCount += newIds.length;
    parentIds = newIds;
  }
  const nextForkVersionNo = nodeCount + 1;

  return Response.json({ ...prompt, isScrapped, nextForkVersionNo });
}

// PATCH /api/prompts/:id
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const promptId = Number(id);
  const auth = await getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [existing] = await db
    .select({ authorId: promptsTable.authorId, currentVersionNo: promptsTable.currentVersionNo })
    .from(promptsTable)
    .where(eq(promptsTable.id, promptId))
    .limit(1);

  if (!existing) return notFound("프롬프트를 찾을 수 없습니다.");
  if (existing.authorId !== auth.userId) return forbidden();

  const { title, content, description, categoryId, isPublic, changeNote } =
    await request.json();

  const newVersionNo = existing.currentVersionNo + 1;

  const [updated] = await db
    .update(promptsTable)
    .set({
      ...(title ? { title } : {}),
      ...(content ? { content } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(categoryId !== undefined ? { categoryId } : {}),
      ...(isPublic !== undefined ? { isPublic } : {}),
      currentVersionNo: newVersionNo,
    })
    .where(eq(promptsTable.id, promptId))
    .returning();

  // Auto-create new version record
  await db.insert(promptVersionsTable).values({
    promptId: promptId,
    versionNo: newVersionNo,
    title: updated.title,
    content: updated.content,
    changeNote: changeNote ?? null,
    editedBy: auth.userId,
  });

  return Response.json(updated);
}

// DELETE /api/prompts/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const promptId = Number(id);
  const auth = await getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [existing] = await db
    .select({ authorId: promptsTable.authorId })
    .from(promptsTable)
    .where(eq(promptsTable.id, promptId))
    .limit(1);

  if (!existing) return notFound("프롬프트를 찾을 수 없습니다.");
  if (existing.authorId !== auth.userId) return forbidden();

  await db.delete(promptsTable).where(eq(promptsTable.id, promptId));

  return Response.json({ success: true });
}
