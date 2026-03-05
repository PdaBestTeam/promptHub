// src/features/prompts/components/prompt-detail/prompt-detail.tsx
// Server Component: DB 직접 조회 후 Client에 전달

import PromptDetailClient from "./prompt-detail.client";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import {
  promptsTable,
  categoriesTable,
  usersTable,
  promptVersionsTable,
} from "@/lib/db/schema";
import { eq, asc, sql } from "drizzle-orm";

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

  // 조회수 증가
  await db
    .update(promptsTable)
    .set({ viewCount: sql`${promptsTable.viewCount} + 1` })
    .where(eq(promptsTable.id, promptId));

  // 버전 목록 조회
  const versions = await db
    .select({
      id: promptVersionsTable.id,
      versionNo: promptVersionsTable.versionNo,
      title: promptVersionsTable.title,
      content: promptVersionsTable.content,
      changeNote: promptVersionsTable.changeNote,
      createdAt: promptVersionsTable.createdAt,
      editor: {
        id: usersTable.id,
        nickname: usersTable.name,
      },
    })
    .from(promptVersionsTable)
    .innerJoin(usersTable, eq(promptVersionsTable.editedBy, usersTable.id))
    .where(eq(promptVersionsTable.promptId, promptId))
    .orderBy(asc(promptVersionsTable.versionNo));

  return <PromptDetailClient prompt={{ ...prompt, isScrapped: false }} versions={versions ?? []} />;
}
