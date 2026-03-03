import { db } from "@/lib/db/client";
import { categoriesTable } from "@/lib/db/schema";

// GET /api/categories
export async function GET() {
  const categories = await db.select().from(categoriesTable).orderBy(categoriesTable.id);
  return Response.json({ data: categories });
}
