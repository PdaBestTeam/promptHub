import { NextRequest } from "next/server";
import { db } from "@/lib/db/client";
import { promptsTable, categoriesTable, usersTable } from "@/lib/db/schema";
import { getAuthUser, unauthorized } from "@/lib/http/auth-middleware";
import { eq, desc, asc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(20, Math.max(1, Number(searchParams.get("limit") ?? 10)));
  const offset = (page - 1) * limit;

  const prompts = await db
    .select({
      id: promptsTable.id,
      title: promptsTable.title,
      description: promptsTable.description,
      isPublic: promptsTable.isPublic,
      currentVersionNo: promptsTable.currentVersionNo,
      viewCount: promptsTable.viewCount,
      scrapCount: promptsTable.scrapCount,
      forkCount: promptsTable.forkCount,
      createdAt: promptsTable.createdAt,
      parentPromptId: promptsTable.parentPromptId,
      category: {
        id: categoriesTable.id,
        name: categoriesTable.name,
        slug: categoriesTable.slug,
      },
    })
    .from(promptsTable)
    .leftJoin(categoriesTable, eq(promptsTable.categoryId, categoriesTable.id))
    .where(eq(promptsTable.authorId, auth.userId))
    .orderBy(desc(promptsTable.createdAt))
    .limit(limit)
    .offset(offset);

  return Response.json({ data: prompts, page, limit });
}
