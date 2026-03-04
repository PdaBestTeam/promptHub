import { NextRequest } from "next/server";
import { auth } from "../auth";

export async function getAuthUser(
  request: NextRequest,
): Promise<{ userId: string } | null> {
  // better-auth는 request를 받아 세션 확인하는 API가 있음.

  const session = await auth.api.getSession({ headers: request.headers });
  // const session = await auth.getSession({ headers: request.headers });

  const id = session?.user?.id;
  if (!id) return null;
  return { userId: id };
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
export function forbidden() {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}
export function notFound(message = "Not found") {
  return Response.json({ error: message }, { status: 404 });
}
export function badRequest(message = "Bad request") {
  return Response.json({ error: message }, { status: 400 });
}
