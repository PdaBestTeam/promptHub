import { NextRequest } from "next/server";
import { verifyAccessToken, AccessTokenPayload } from "@/lib/auth/jwt";

export async function getAuthUser(
  request: NextRequest
): Promise<AccessTokenPayload | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  return await verifyAccessToken(token);
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
