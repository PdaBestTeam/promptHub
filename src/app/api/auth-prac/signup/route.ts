import { db } from "@/lib/db/client";
import { usersTable } from "@/lib/db/schema";
import response from "@/lib/http/response";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { NextRequest } from "next/server";

import { z } from "zod";
import { signAccessToken } from "@/lib/auth/jwt";
import { cookies } from "next/headers";

// 따로 파일로 분리하는 게 맞지만, 학습적인 직관을 위해 해당 파일에 작성
const signupSchema = z.object({
  email: z.email({ message: "이메일 형식이 아닙니다." }),
  password: z.string().min(8, { message: "비밀번호는 8자 이상이어야 합니다." }),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  // validation Check
  const result = signupSchema.safeParse(body);

  if (!result.success) {
    return response.fail(
      result.error.message,
      400,
      z.treeifyError(result.error),
    );
  }

  const { email, password } = result.data;
  const [existingUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (existingUser) {
    return response.fail("이미 존재하는 이메일입니다.", 400);
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(usersTable)
    .values({
      email,
      passwordHash: hashedPassword,
      nickname: email,
      role: "user",
    })
    .returning();

  const accessToken = await signAccessToken({
    userId: user.id,
    email: user.email,
    nickname: user.nickname,
    role: user.role,
  });

  const cookieStore = await cookies();
  cookieStore.set("access-token", accessToken, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 1, // 1 hour
  });
  return response.ok(
    {
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        role: user.role,
      },
      token: accessToken,
    },
    { status: 201 },
  );
}
