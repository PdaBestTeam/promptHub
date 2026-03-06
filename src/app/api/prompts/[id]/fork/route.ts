import { NextRequest } from "next/server";
import { db } from "@/lib/db/client";
import { promptsTable, promptVersionsTable } from "@/lib/db/schema";
import {
  getAuthUser,
  unauthorized,
  notFound,
} from "@/lib/http/auth-middleware";
import { and, eq, inArray, ne, sql } from "drizzle-orm";

/** 루트 포함 트리 전체 노드 수. 다음 포크 버전 = nodeCount + 1 (v1,v2,v3 있으면 다음은 v4) */
async function getTreeNodeCount(rootId: number): Promise<number> {
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
  return treeIds.size;
}

// POST /api/prompts/:id/fork
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const promptId = Number(id);
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  const [source] = await db
    .select()
    .from(promptsTable)
    .where(eq(promptsTable.id, promptId))
    .limit(1);
  if (!source) return notFound("프롬프트를 찾을 수 없습니다.");

  const body = await request.json().catch(() => ({}));

  let root = source;
  while (root.parentPromptId != null) {
    const [parent] = await db
      .select()
      .from(promptsTable)
      .where(eq(promptsTable.id, root.parentPromptId))
      .limit(1);
    if (!parent) break;
    root = parent;
  }
  const rootId = root.id;
  const nodeCount = await getTreeNodeCount(rootId);
  const nextVersionNo = nodeCount + 1;
  const sourceVersionNo = source.currentVersionNo;

  if (body.draftOnly === true) {
    const baseTitle = source.title.replace(/\s*\(Fork v\d+\)$/, "");
    const title = body.title ?? `${baseTitle} (Fork v${nextVersionNo})`;
    return Response.json({
      draft: true,
      sourcePromptId: promptId,
      sourceVersionNo,
      nextVersionNo,
      title,
      content: source.content,
      description: source.description ?? "",
      categoryId: source.categoryId,
    });
  }

  if (body.createFromDraft === true) {
    const {
      title,
      content,
      description,
      categoryId,
      changeNote,
      result,
      modelName,
    } = body;
    if (!title?.trim() || !content?.trim()) {
      return Response.json(
        { error: "제목과 내용은 필수입니다." },
        { status: 400 },
      );
    }
    const forkVersionNo = (await getTreeNodeCount(rootId)) + 1;
    const [forked] = await db
      .insert(promptsTable)
      .values({
        authorId: auth.userId,
        categoryId: categoryId ?? source.categoryId,
        title: title.trim(),
        content: (content ?? source.content).trim(),
        description: (description ?? source.description)?.trim() ?? null,
        result: result ?? source.result ?? null,
        modelName: modelName ?? source.modelName ?? null,
        isPublic: true,
        parentPromptId: source.id,
        forkedFromVersionId: body.fromVersionId ?? null,
        currentVersionNo: forkVersionNo,
      })
      .returning();

    await db.insert(promptVersionsTable).values({
      promptId: forked.id,
      versionNo: forkVersionNo,
      title: forked.title,
      content: forked.content,
      changeNote: changeNote?.trim() ?? `"${source.title}"에서 Fork`,
      editedBy: auth.userId,
    });

    await db
      .update(promptsTable)
      .set({ forkCount: sql`${promptsTable.forkCount} + 1` })
      .where(eq(promptsTable.id, promptId));

    return Response.json(forked, { status: 201 });
  }

  const baseTitle = source.title.replace(/\s*\(Fork v\d+\)$/, "");
  const title = body.title ?? `${baseTitle} (Fork v${nextVersionNo})`;
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
      currentVersionNo: nextVersionNo,
    })
    .returning();

  await db.insert(promptVersionsTable).values({
    promptId: forked.id,
    versionNo: nextVersionNo,
    title: forked.title,
    content: forked.content,
    changeNote: `"${source.title}"에서 Fork`,
    editedBy: auth.userId,
  });

  await db
    .update(promptsTable)
    .set({ forkCount: sql`${promptsTable.forkCount} + 1` })
    .where(eq(promptsTable.id, promptId));

  return Response.json(forked, { status: 201 });
}
