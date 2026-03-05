import { NextRequest } from "next/server";
import { db } from "@/lib/db/client";
import {
  promptsTable,
  promptVersionsTable,
} from "@/lib/db/schema";
import { getAuthUser, unauthorized, notFound } from "@/lib/http/auth-middleware";
import { and, eq, inArray, ne, sql } from "drizzle-orm";

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
  const title = body.title ?? `${source.title} (Fork v${source.currentVersionNo})`;

  // 루트(원본 A) 찾기
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

  // A 트리 내 노드 수 = 이번 포크의 버전 번호 (1번째 포크→v1, 2번째→v2, 3번째→v3 …)
  const visitedIds = new Set<number>([rootId]);
  let nodeCount = 1;
  let parentIds: number[] = [rootId];
  while (parentIds.length > 0) {
    const children = await db
      .select({ id: promptsTable.id })
      .from(promptsTable)
      .where(
        and(
          inArray(promptsTable.parentPromptId, parentIds),
          ne(promptsTable.id, rootId)
        )
      );
    const newIds = children.map((c) => c.id).filter((id) => !visitedIds.has(id));
    newIds.forEach((id) => visitedIds.add(id));
    nodeCount += newIds.length;
    parentIds = newIds;
  }
  // 이번에 만들 포크가 트리에서 nodeCount번째 → v{nodeCount} 수정중, 저장 시 v{nodeCount+1}
  const forkVersionNo = nodeCount;

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
      currentVersionNo: forkVersionNo,
    })
    .returning();

  await db.insert(promptVersionsTable).values({
    promptId: forked.id,
    versionNo: forkVersionNo,
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
