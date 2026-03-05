import { NextRequest } from "next/server";
import { db } from "@/lib/db/client";
import {
  promptsTable,
  promptVersionsTable,
  usersTable,
} from "@/lib/db/schema";
import { eq, asc, inArray } from "drizzle-orm";

// GET /api/prompts/:id/versions — 루트부터 현재까지 포크 트리 전체를 v1, v2, … 로 반환
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const promptId = Number(id);

  const [current] = await db
    .select()
    .from(promptsTable)
    .where(eq(promptsTable.id, promptId))
    .limit(1);
  if (!current) return Response.json({ data: [] });

  // 루트 찾기
  let root = current;
  while (root.parentPromptId != null) {
    const [parent] = await db
      .select()
      .from(promptsTable)
      .where(eq(promptsTable.id, root.parentPromptId))
      .limit(1);
    if (!parent) break;
    root = parent;
  }

  // 트리 내 모든 프롬프트 ID 수집 (루트 + 모든 자식)
  const treeIds = new Set<number>([root.id]);
  let levelIds: number[] = [root.id];
  while (levelIds.length > 0) {
    const children = await db
      .select({ id: promptsTable.id })
      .from(promptsTable)
      .where(inArray(promptsTable.parentPromptId, levelIds));
    const newIds = children.map((c) => c.id).filter((id) => !treeIds.has(id));
    newIds.forEach((id) => treeIds.add(id));
    levelIds = newIds;
  }

  const ids = Array.from(treeIds);
  if (ids.length === 0) return Response.json({ data: [] });

  const rows = await db
    .select({
      id: promptsTable.id,
      versionNo: promptsTable.currentVersionNo,
      title: promptsTable.title,
      content: promptsTable.content,
      createdAt: promptsTable.createdAt,
      authorId: promptsTable.authorId,
      viewCount: promptsTable.viewCount,
      scrapCount: promptsTable.scrapCount,
      forkCount: promptsTable.forkCount,
    })
    .from(promptsTable)
    .where(inArray(promptsTable.id, ids))
    .orderBy(asc(promptsTable.currentVersionNo));

  const userIds = [...new Set(rows.map((r) => r.authorId))];
  const users =
    userIds.length === 0
      ? []
      : await db
          .select({ id: usersTable.id, name: usersTable.name })
          .from(usersTable)
          .where(inArray(usersTable.id, userIds));

  const userMap = new Map(users.map((u) => [u.id, u]));

  // 각 프롬프트의 현재 버전에 해당하는 prompt_versions 행에서 change_note(버전 메모) 조회
  const versionNotes = await db
    .select({
      promptId: promptVersionsTable.promptId,
      versionNo: promptVersionsTable.versionNo,
      changeNote: promptVersionsTable.changeNote,
    })
    .from(promptVersionsTable)
    .where(
      inArray(
        promptVersionsTable.promptId,
        rows.map((r) => r.id)
      )
    );

  const noteMap = new Map(
    versionNotes.map((v) => [`${v.promptId}-${v.versionNo}`, v.changeNote])
  );

  const seenIds = new Set<number>();
  const data = rows
    .filter((r) => {
      if (seenIds.has(r.id)) return false;
      seenIds.add(r.id);
      return true;
    })
    .map((r) => {
      const memo = noteMap.get(`${r.id}-${r.versionNo}`);
      const defaultNote =
        r.versionNo === 1 ? "원본" : `Fork v${r.versionNo}`;
      return {
        id: r.id,
        versionNo: r.versionNo,
        title: r.title,
        content: r.content,
        changeNote: memo ?? defaultNote,
        createdAt: r.createdAt,
        viewCount: r.viewCount,
        scrapCount: r.scrapCount,
        forkCount: r.forkCount,
        editor: {
          id: userMap.get(r.authorId)?.id ?? r.authorId,
          nickname: userMap.get(r.authorId)?.name ?? "",
        },
      };
    });

  return Response.json({ data });
}
