import { NextRequest } from "next/server";
import { db } from "@/lib/db/client";
import { scrapsTable, promptsTable, categoriesTable, usersTable } from "@/lib/db/schema";
import { getAuthUser, unauthorized } from "@/lib/http/auth-middleware";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(20, Math.max(1, Number(searchParams.get("limit") ?? 10)));
  const offset = (page - 1) * limit;

  const scraps = await db
    .select({
      scrapCreatedAt: scrapsTable.createdAt,
      prompt: {
        id: promptsTable.id,
        title: promptsTable.title,
        description: promptsTable.description,
        currentVersionNo: promptsTable.currentVersionNo,
        scrapCount: promptsTable.scrapCount,
        forkCount: promptsTable.forkCount,
        createdAt: promptsTable.createdAt,
      },
      category: {
        id: categoriesTable.id,
        name: categoriesTable.name,
        slug: categoriesTable.slug,
      },
      author: {
        id: usersTable.id,
        nickname: usersTable.nickname,
        avatarUrl: usersTable.avatarUrl,
      },
    })
    .from(scrapsTable)
    .innerJoin(promptsTable, eq(scrapsTable.promptId, promptsTable.id))
    .leftJoin(categoriesTable, eq(promptsTable.categoryId, categoriesTable.id))
    .innerJoin(usersTable, eq(promptsTable.authorId, usersTable.id))
    .where(eq(scrapsTable.userId, auth.userId))
    .orderBy(desc(scrapsTable.createdAt))
    .limit(limit)
    .offset(offset);

  return Response.json({ data: scraps, page, limit });
}
