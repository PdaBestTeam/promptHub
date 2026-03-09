import { NextRequest } from "next/server";
import { db } from "@/lib/db/client";
import { scrapsTable } from "@/lib/db/schema";
import { getAuthUser, unauthorized } from "@/lib/http/auth-middleware";
import { eq } from "drizzle-orm";

// GET /api/me/scrap-ids
export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  const scraps = await db
    .select({ promptId: scrapsTable.promptId })
    .from(scrapsTable)
    .where(eq(scrapsTable.userId, auth.userId));

  return Response.json({ ids: scraps.map((s) => s.promptId) });
}
