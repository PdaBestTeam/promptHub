import { NextRequest } from "next/server";
import { db } from "@/lib/db/client";
import { promptVersionsTable, usersTable } from "@/lib/db/schema";
import { notFound } from "@/lib/http/auth-middleware";
import { eq, asc } from "drizzle-orm";

// GET /api/prompts/:id/versions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const promptId = Number(id);

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
        nickname: usersTable.nickname,
      },
    })
    .from(promptVersionsTable)
    .innerJoin(usersTable, eq(promptVersionsTable.editedBy, usersTable.id))
    .where(eq(promptVersionsTable.promptId, promptId))
    .orderBy(asc(promptVersionsTable.versionNo));

  return Response.json({ data: versions });
}
