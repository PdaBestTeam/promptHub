import { NextRequest } from "next/server";
import { db } from "@/lib/db/client";
import { usersTable } from "@/lib/db/schema";
import { signAccessToken } from "@/lib/auth/jwt";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: "이메일과 비밀번호를 입력해주세요." }, { status: 400 });
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (!user) {
      return Response.json({ error: "이메일 또는 비밀번호가 일치하지 않습니다." }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return Response.json({ error: "이메일 또는 비밀번호가 일치하지 않습니다." }, { status: 401 });
    }

    const token = await signAccessToken({
      userId: user.id,
      email: user.email,
      nickname: user.nickname,
      role: user.role,
    });

    return Response.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        role: user.role,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
