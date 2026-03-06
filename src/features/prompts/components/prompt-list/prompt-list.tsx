// src/features/prompts/components/prompt-list/prompt-list.tsx
// Server Component: DB 직접 조회 후 Client Component에 전달

import PromptListClient from "./prompt-list.client";
import { db } from "@/lib/db/client";
import { promptsTable, categoriesTable } from "@/lib/db/schema";
import * as authSchema from "@/lib/db/auth-schema";
import { and, desc, eq, ilike, count, isNull } from "drizzle-orm";

interface SearchProps {
  q?: string;
  category?: string;
  sort?: string;
}

export default async function PromptList({
  q = "",
  category = "",
  sort = "latest",
}: SearchProps) {
  // category slug 변환
  const resolvedCategory =
    category === "dev"
      ? "development"
      : category === "advice"
        ? "problem-solving"
        : category;

  const limit = 12;
  const offset = 0;

  const orderBy =
    sort === "views"
      ? desc(promptsTable.viewCount)
      : sort === "scraps"
        ? desc(promptsTable.scrapCount)
        : sort === "forks"
          ? desc(promptsTable.forkCount)
          : desc(promptsTable.createdAt);

  const conditions = [
    eq(promptsTable.isPublic, true),
    isNull(promptsTable.parentPromptId),
  ];
  if (q) conditions.push(ilike(promptsTable.title, `%${q}%`));
  if (resolvedCategory)
    conditions.push(eq(categoriesTable.slug, resolvedCategory));

  // 전체 건수
  const [countRow] = await db
    .select({ total: count() })
    .from(promptsTable)
    .leftJoin(categoriesTable, eq(promptsTable.categoryId, categoriesTable.id))
    .where(and(...conditions));
  const total = Number(countRow?.total ?? 0);

  // 프롬프트 목록
  const rows = await db
    .select({
      id: promptsTable.id,
      title: promptsTable.title,
      description: promptsTable.description,
      currentVersionNo: promptsTable.currentVersionNo,
      viewCount: promptsTable.viewCount,
      scrapCount: promptsTable.scrapCount,
      forkCount: promptsTable.forkCount,
      parentPromptId: promptsTable.parentPromptId,
      createdAt: promptsTable.createdAt,
      modelName: promptsTable.modelName,
      category: {
        id: categoriesTable.id,
        name: categoriesTable.name,
        slug: categoriesTable.slug,
      },
      author: {
        id: authSchema.user.id,
        nickname: authSchema.user.name,
        avatarUrl: authSchema.user.image,
      },
    })
    .from(promptsTable)
    .leftJoin(categoriesTable, eq(promptsTable.categoryId, categoriesTable.id))
    .innerJoin(authSchema.user, eq(promptsTable.authorId, authSchema.user.id))
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  // 카테고리 목록
  const categories = await db
    .select()
    .from(categoriesTable)
    .orderBy(categoriesTable.id);

  const data = rows.map((r) => ({
    ...r,
    id: String(r.id),
    parentPromptId: r.parentPromptId != null ? String(r.parentPromptId) : null,
    createdAt:
      r.createdAt instanceof Date
        ? r.createdAt.toISOString()
        : String(r.createdAt),
    isScrapped: false,
  }));

  return (
    <PromptListClient
      initialPrompts={data}
      initialTotal={total}
      categories={categories}
      initialQ={q}
      initialCategory={category}
      initialSort={sort}
    />
  );
}
