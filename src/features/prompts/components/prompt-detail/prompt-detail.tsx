// src/features/prompts/components/prompt-detail/prompt-detail.tsx

import PromptDetailClient from "./prompt-detail.client";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import {
  promptsTable,
  categoriesTable,
  usersTable,
  promptVersionsTable,
} from "@/lib/db/schema";
import { eq, asc, sql, inArray } from "drizzle-orm";

export default async function PromptDetail({ id }: { id: string }) {
  const promptId = Number(id);

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

  if (!prompt) notFound();
  if (!prompt.isPublic) notFound();

  await db
    .update(promptsTable)
    .set({ viewCount: sql`${promptsTable.viewCount} + 1` })
    .where(eq(promptsTable.id, promptId));

  let root: { id: number; parentPromptId: number | null } = {
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
  const rows = await db
    .select({
      id: promptsTable.id,
      versionNo: promptsTable.currentVersionNo,
      title: promptsTable.title,
      content: promptsTable.content,
      createdAt: promptsTable.createdAt,
      authorId: promptsTable.authorId,
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
        rows.map((r) => r.id),
      ),
    );
  const noteMap = new Map(
    versionNotes.map((v) => [`${v.promptId}-${v.versionNo}`, v.changeNote]),
  );

  const versions = rows.map((r) => {
    const memo = noteMap.get(`${r.id}-${r.versionNo}`);
    const defaultNote = r.versionNo === 1 ? "원본" : `Fork v${r.versionNo}`;
    return {
      id: String(r.id),
      versionNo: r.versionNo,
      title: r.title,
      content: r.content,
      changeNote: memo ?? defaultNote,
      createdAt:
        r.createdAt instanceof Date
          ? r.createdAt.toISOString()
          : String(r.createdAt),
      editor: {
        id: userMap.get(r.authorId)?.id ?? r.authorId,
        nickname: userMap.get(r.authorId)?.name ?? "",
      },
    };
  });

  return (
    <PromptDetailClient
      prompt={{
        id: String(prompt.id),
        title: prompt.title,
        content: prompt.content,
        description: prompt.description,
        isPublic: prompt.isPublic,
        currentVersionNo: prompt.currentVersionNo,
        nextForkVersionNo: prompt.currentVersionNo,
        viewCount: prompt.viewCount,
        scrapCount: prompt.scrapCount,
        forkCount: prompt.forkCount,
        parentPromptId:
          prompt.parentPromptId != null ? String(prompt.parentPromptId) : null,
        createdAt:
          prompt.createdAt instanceof Date
            ? prompt.createdAt.toISOString()
            : String(prompt.createdAt),
        isScrapped: false,
        category: prompt.category,
        author: prompt.author,
      }}
      versions={versions}
    />
  );
}
