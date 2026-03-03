import { NextRequest } from "next/server";
import { db } from "@/lib/db/client";
import { usersTable } from "@/lib/db/schema";
import { signAccessToken } from "@/lib/auth/jwt";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export async function POST(request: NextRequest) {
  try {
    const { email, password, nickname } = await request.json();

    if (!email || !password || !nickname) {
      return Response.json({ error: "이메일, 비밀번호, 닉네임을 모두 입력해주세요." }, { status: 400 });
    }
    if (password.length < 8) {
      return Response.json({ error: "비밀번호는 8자 이상이어야 합니다." }, { status: 400 });
    }

    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (existing.length > 0) {
      return Response.json({ error: "이미 사용 중인 이메일입니다." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [user] = await db
      .insert(usersTable)
      .values({ email, passwordHash, nickname })
      .returning({
        id: usersTable.id,
        email: usersTable.email,
        nickname: usersTable.nickname,
        role: usersTable.role,
        avatarUrl: usersTable.avatarUrl,
        createdAt: usersTable.createdAt,
      });

    const token = await signAccessToken({
      userId: user.id,
      email: user.email,
      nickname: user.nickname,
      role: user.role,
    });

    return Response.json({ token, user }, { status: 201 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
