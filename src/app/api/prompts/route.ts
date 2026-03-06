import { NextRequest } from "next/server";
import { db } from "@/lib/db/client";
import {
  promptsTable,
  categoriesTable,
  scrapsTable,
  promptVersionsTable,
  promptImagesTable,
} from "@/lib/db/schema";
import { getAuthUser } from "@/lib/http/auth-middleware";
import * as authSchema from "@/lib/db/auth-schema";
import { and, desc, eq, ilike, count, isNull, inArray } from "drizzle-orm";

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

  const conditions = [
    eq(promptsTable.isPublic, true),
    isNull(promptsTable.parentPromptId),
  ];
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
      modelName: promptsTable.modelName,
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

  let scrappedIds = new Set<number>();
  if (auth) {
    const userScraps = await db
      .select({ promptId: scrapsTable.promptId })
      .from(scrapsTable)
      .where(eq(scrapsTable.userId, auth.userId));
    scrappedIds = new Set(userScraps.map((s) => s.promptId));
  }

  let promptImages: { promptId: number; imageUrl: string }[] = [];
  const promptIds = rows.map((r) => r.id);
  if (promptIds.length > 0) {
    promptImages = await db
      .select({ promptId: promptImagesTable.promptId, imageUrl: promptImagesTable.imageUrl })
      .from(promptImagesTable)
      .where(inArray(promptImagesTable.promptId, promptIds));
  }

  const data = rows.map((r) => ({
    ...r,
    isScrapped: scrappedIds.has(r.id),
    images: promptImages.filter(i => i.promptId === r.id).map(i => i.imageUrl),
  }));

  return Response.json({ data, page, limit, total });
}

// POST /api/prompts - create new prompt
export async function POST(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const {
      title,
      content,
      description,
      categoryId,
      isPublic,
      result,
      imageUrls,
      modelName,
    } = await request.json();

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
        result: result ?? null,
        modelName: modelName ?? null,
        categoryId: categoryId ?? null,
        isPublic: isPublic ?? true,
        currentVersionNo: 1,
      })
      .returning();

    await db.insert(promptVersionsTable).values({
      promptId: prompt.id,
      versionNo: 1,
      title,
      content,
      changeNote: "최초 작성",
      editedBy: auth.userId,
    });

    if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
      await db.insert(promptImagesTable).values(
        imageUrls.map((url, index) => ({
          promptId: prompt.id,
          imageUrl: url,
          orderIndex: index,
        }))
      );
    }

    return Response.json(prompt, { status: 201 });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
