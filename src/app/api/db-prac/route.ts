// src/app/api/db-prac/route.ts
import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/lib/db/client";
import { blogsTable, postsTable, usersTable } from "@/lib/db/schema";
import { and, eq, gt, lte } from "drizzle-orm";

// export async function GET(request: NextRequest) {
//   // Drizzle은 SQL-Like ORM

//   // 게시글 추가
//   const result = await db
//     .insert(blogsTable)
//     .values({
//       title: "게시글1",
//       content: "게시글1 내용.",
//     })
//     .returning();
//   console.log(result);

//   return NextResponse.json({});
// }

//비동기여서 순서 보장 안함

// export async function GET(request: NextRequest) {
//   // 게시글 추가
//   const promises = Array(10)
//     .keys()
//     .map((value) => {
//       return db
//         .insert(blogsTable)
//         .values({
//           title: `게시글 ${value}`,
//           content: `게시글 ${value} 내용`,
//         })
//         .returning();
//     });
//   const result = await Promise.all(promises);
//   console.log(result);
//   return NextResponse.json({});
// }

// export async function GET(request: NextRequest) {
//   // 게시글 추가
//   // Update(수정)
//   const result = await db
//     .update(blogsTable)
//     .set({
//       title: "수정된 게시글",
//       content: "수정된 내용",
//       // import { eq } from "drizzle-orm";
//     })
//     .where(eq(blogsTable.id, 1))
//     .returning();
//   console.log(result);

//   return NextResponse.json({});
// }

// export async function GET(request: NextRequest) {
//   const result = await db
//     .delete(blogsTable)
//     .where(eq(blogsTable.id, 1))
//     .returning();
//   console.log(result);

export async function GET(request: NextRequest) {
  // 1. 컬럼 지정해서 가져오기
  const result = await db
    .select({ id: blogsTable.id, title: blogsTable.title })
    .from(blogsTable);
  console.log(result);

  // 2. 전체 컬럼 가져오기
  const result2 = await db.select().from(blogsTable);
  console.log(result2);

  // 3. 조건 지정해서 가져오기 (where )
  const result3 = await db
    .select()
    .from(blogsTable)
    // import {gt, lte} from 'drizzle-orm'
    .where(and(gt(blogsTable.id, 3), lte(blogsTable.id, 8)));
  console.log(result3);
}
