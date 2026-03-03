import { JWTPayload, jwtVerify, SignJWT } from "jose";

const ACCESS_TOKEN_JWT_SECRET = process.env.ACCESS_TOKEN_JWT_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "1h";

if (!ACCESS_TOKEN_JWT_SECRET) {
  throw new Error("ACCESS_TOKEN_JWT_SECRET is not defined");
}

// type 변환 --> string to Uint8Array
const accessSecret = new TextEncoder().encode(ACCESS_TOKEN_JWT_SECRET);

export interface AccessTokenClaims {
  userId: string;
  email: string;
  nickname: string;
  role: string;
}

export type AccessTokenPayload = AccessTokenClaims &
  JWTPayload & {
    type: "access";
  };
export async function signAccessToken(
  payload: AccessTokenClaims,
): Promise<string> {
  return new SignJWT({
    type: "access",
    userId: payload.userId,
    email: payload.email,
    nickname: payload.nickname,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRES_IN)
    .sign(accessSecret);
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, accessSecret, {
      algorithms: ["HS256"],
    });

    if (payload.type !== "access") {
      return null;
    }
    return payload as AccessTokenPayload;
  } catch {
    return null;
  }
}

export async function refreshAccessToken(token: string) {
  const payload = await verifyAccessToken(token);
  if (!payload) {
    return null;
  }
  return await signAccessToken(payload);
}
