import { NextRequest } from "next/server";
import { db } from "@/lib/db/client";
import {
  promptsTable,
  categoriesTable,
  scrapsTable,
  promptVersionsTable,
} from "@/lib/db/schema";
import { getAuthUser } from "@/lib/http/auth-middleware";
import * as authSchema from "@/lib/db/auth-schema";
import { and, desc, eq, ilike, count } from "drizzle-orm";

// GET /api/prompts?q=&category=&sort=latest|views|scraps|forks&page=&limit=
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const rawcategory = searchParams.get("category") ?? "";
  const category =
    rawcategory === "dev"
      ? "development"
      : rawcategory === "advice"
        ? "problem-solving"
        : rawcategory;
  const sort = searchParams.get("sort") ?? "latest";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(
    20,
    Math.max(1, Number(searchParams.get("limit") ?? 12)),
  );
  const offset = (page - 1) * limit;

  const auth = await getAuthUser(request);

  const conditions = [eq(promptsTable.isPublic, true)];
  if (q) conditions.push(ilike(promptsTable.title, `%${q}%`));
  if (category) conditions.push(eq(categoriesTable.slug, category));

  const orderBy =
    sort === "views"
      ? desc(promptsTable.viewCount)
      : sort === "scraps"
        ? desc(promptsTable.scrapCount)
        : sort === "forks"
          ? desc(promptsTable.forkCount)
          : desc(promptsTable.createdAt);

  // 동일 조건 전체 건수 (총 N건 표시용)
  const [countRow] = await db
    .select({ total: count() })
    .from(promptsTable)
    .leftJoin(categoriesTable, eq(promptsTable.categoryId, categoriesTable.id))
    .where(and(...conditions));
  const total = Number(countRow?.total ?? 0);

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

  // If logged in, also return which ones the user scrapped
  let scrappedIds = new Set<number>();
  if (auth) {
    const userScraps = await db
      .select({ promptId: scrapsTable.promptId })
      .from(scrapsTable)
      .where(eq(scrapsTable.userId, auth.userId));
    scrappedIds = new Set(userScraps.map((s) => s.promptId));
  }

  const data = rows.map((r) => ({ ...r, isScrapped: scrappedIds.has(r.id) }));

  return Response.json({ data, page, limit, total });
}

// POST /api/prompts - create new prompt
export async function POST(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { title, content, description, categoryId, isPublic } =
      await request.json();

    if (!title || !content) {
      return Response.json(
        { error: "제목과 내용은 필수입니다." },
        { status: 400 },
      );
    }

    const [prompt] = await db
      .insert(promptsTable)
      .values({
        authorId: auth.userId,
        title,
        content,
        description: description ?? null,
        categoryId: categoryId ?? null,
        isPublic: isPublic ?? true,
        currentVersionNo: 1,
      })
      .returning();

    // Auto-create v1
    await db.insert(promptVersionsTable).values({
      promptId: prompt.id,
      versionNo: 1,
      title,
      content,
      changeNote: "최초 작성",
      editedBy: auth.userId,
    });

    return Response.json(prompt, { status: 201 });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
