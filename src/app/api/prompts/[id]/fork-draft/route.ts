import { NextRequest } from "next/server";
import { db } from "@/lib/db/client";
import { promptsTable } from "@/lib/db/schema";
import { getAuthUser, notFound } from "@/lib/http/auth-middleware";
import { and, eq, inArray, ne } from "drizzle-orm";

/** 루트 포함 트리 전체 노드 수. 다음 포크 버전 = nodeCount + 1 */
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
          ne(promptsTable.id, rootId)
        )
      );
    const newIds = children.map((c) => c.id).filter((id) => !treeIds.has(id));
    newIds.forEach((id) => treeIds.add(id));
    levelIds = newIds;
  }
  return treeIds.size;
}

// GET /api/prompts/:id/fork-draft — 포크 초안 데이터 (DB 미생성). 저장 시에만 반영됨.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const promptId = Number(id);
  const auth = await getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [source] = await db
    .select()
    .from(promptsTable)
    .where(eq(promptsTable.id, promptId))
    .limit(1);
  if (!source) return notFound("프롬프트를 찾을 수 없습니다.");

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
  const nodeCount = await getTreeNodeCount(root.id);
  const nextVersionNo = nodeCount + 1;
  const baseTitle = source.title.replace(/\s*\(Fork v\d+\)$/, "");

  return Response.json({
    draft: true,
    sourcePromptId: promptId,
    sourceVersionNo: source.currentVersionNo,
    nextVersionNo,
    title: `${baseTitle} (Fork v${nextVersionNo})`,
    content: source.content,
    description: source.description ?? "",
    categoryId: source.categoryId,
  });
}
