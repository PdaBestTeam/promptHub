import { NextRequest } from "next/server";
import { db } from "@/lib/db/client";
import {
  promptsTable,
  categoriesTable,
  usersTable,
  promptVersionsTable,
  scrapsTable,
  promptImagesTable,
} from "@/lib/db/schema";
import { getAuthUser, forbidden, notFound } from "@/lib/http/auth-middleware";
import { and, eq, inArray, ne, sql } from "drizzle-orm";

// GET /api/prompts/:id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
      result: promptsTable.result,
      modelName: promptsTable.modelName,
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

  const skipViewCount = request.headers.get("X-Skip-View-Count") === "true";
  if (!skipViewCount) {
    await db
      .update(promptsTable)
      .set({ viewCount: sql`${promptsTable.viewCount} + 1` })
      .where(eq(promptsTable.id, promptId));
  }

  let isScrapped = false;
  if (auth) {
    const [scrap] = await db
      .select({ userId: scrapsTable.userId })
      .from(scrapsTable)
      .where(
        and(
          eq(scrapsTable.userId, auth.userId),
          eq(scrapsTable.promptId, promptId),
        ),
      )
      .limit(1);
    isScrapped = !!scrap;
  }

  let root = {
    id: prompt.id,
    parentPromptId: prompt.parentPromptId as number | null,
  };
  while (root.parentPromptId != null) {
    const [parent] = await db
      .select({
        id: promptsTable.id,
        parentPromptId: promptsTable.parentPromptId,
      })
      .from(promptsTable)
      .where(eq(promptsTable.id, root.parentPromptId))
      .limit(1);
    if (!parent) break;
    root = parent;
  }
  const rootId = root.id;
  const treeIds = new Set<number>([rootId]);
  let levelIds: number[] = [rootId];
  while (levelIds.length > 0) {
    const children = await db
      .select({ id: promptsTable.id })
      .from(promptsTable)
      .where(
        and(
          inArray(promptsTable.parentPromptId, levelIds),
          ne(promptsTable.id, rootId),
        ),
      );
    const newIds = children.map((c) => c.id).filter((id) => !treeIds.has(id));
    newIds.forEach((id) => treeIds.add(id));
    levelIds = newIds;
  }
  const nextForkVersionNo = treeIds.size + 1;

  const [{ count: versionRecordCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(promptVersionsTable)
    .where(eq(promptVersionsTable.promptId, promptId));
  const nextVersionNoOnSave =
    (versionRecordCount ?? 0) > 1
      ? prompt.currentVersionNo + 1
      : prompt.currentVersionNo;

  const promptImages = await db
    .select({ imageUrl: promptImagesTable.imageUrl })
    .from(promptImagesTable)
    .where(eq(promptImagesTable.promptId, promptId))
    .orderBy(promptImagesTable.orderIndex);
  const imageUrls = promptImages.map(img => img.imageUrl);

  return Response.json({
    ...prompt,
    imageUrls,
    isScrapped,
    nextForkVersionNo,
    nextVersionNoOnSave,
  });
}

// PATCH /api/prompts/:id
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const promptId = Number(id);
  const auth = await getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [existing] = await db
    .select({
      authorId: promptsTable.authorId,
      currentVersionNo: promptsTable.currentVersionNo,
    })
    .from(promptsTable)
    .where(eq(promptsTable.id, promptId))
    .limit(1);

  if (!existing) return notFound("프롬프트를 찾을 수 없습니다.");
  if (existing.authorId !== auth.userId) return forbidden();

  const {
    title,
    content,
    description,
    categoryId,
    isPublic,
    changeNote,
    result,
    imageUrls,
    modelName,
  } = await request.json();

  const newVersionNo = existing.currentVersionNo + 1;

  const [updated] = await db
    .update(promptsTable)
    .set({
      ...(title ? { title } : {}),
      ...(content ? { content } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(categoryId !== undefined ? { categoryId } : {}),
      ...(isPublic !== undefined ? { isPublic } : {}),
      ...(result !== undefined ? { result: result ?? null } : {}),
      ...(modelName !== undefined ? { modelName: modelName ?? null } : {}),
      currentVersionNo: newVersionNo,
    })
    .where(eq(promptsTable.id, promptId))
    .returning();

  await db.insert(promptVersionsTable).values({
    promptId: promptId,
    versionNo: newVersionNo,
    title: updated.title,
    content: updated.content,
    changeNote: changeNote ?? null,
    editedBy: auth.userId,
  });

  if (imageUrls !== undefined && Array.isArray(imageUrls)) {
    await db.delete(promptImagesTable).where(eq(promptImagesTable.promptId, promptId));
    if (imageUrls.length > 0) {
      await db.insert(promptImagesTable).values(
        imageUrls.map((url, idx) => ({
          promptId,
          imageUrl: url,
          orderIndex: idx,
        }))
      );
    }
  }

  return Response.json(updated);
}

// DELETE /api/prompts/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
