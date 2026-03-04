"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useState,
} from "react";
import { authClient } from "@/lib/auth/auth-client";

/* ------------------ types ------------------ */

interface User {
  id: string;
  email: string;
  nickname: string;
  role: string;
  avatarUrl?: string | null;
  createdAt: string;
  promptCount?: number;
  scrapCount?: number;
}

type SessionUser = {
  id?: string;
  email?: string;
  name?: string;
  image?: string | null;
  createdAt?: string;
};

type BetterAuthSession = {
  user?: SessionUser;
};

interface AuthContextType {
  user: User | null;
  loading: boolean;

  refresh: () => Promise<void>;
  login: (
    email: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  signup: (
    nickname: string,
    email: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => Promise<void>;

  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

/* ------------------ context ------------------ */

const AuthContext = createContext<AuthContextType | null>(null);

/* ------------------ type guards ------------------ */

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSession(value: unknown): value is BetterAuthSession {
  if (!isObject(value)) return false;
  if (!("user" in value)) return false;

  const user = (value as { user?: unknown }).user;

  if (!isObject(user)) return false;

  return true;
}

function getErrorMessage(value: unknown, fallback: string): string | null {
  if (!isObject(value) || !("error" in value)) return null;

  const error = (value as { error?: unknown }).error;
  if (!error) return null;
  if (typeof error === "string") return error;
  if (isObject(error) && typeof error.message === "string") return error.message;

  return fallback;
}

function extractSession(value: unknown): BetterAuthSession | null {
  if (isSession(value)) return value;

  if (!isObject(value)) return null;

  if ("data" in value) {
    const data = (value as { data?: unknown }).data;
    if (isSession(data)) return data;
    if (isObject(data) && "session" in data) {
      const session = (data as { session?: unknown }).session;
      if (isSession(session)) return session;
    }
  }

  if ("session" in value) {
    const session = (value as { session?: unknown }).session;
    if (isSession(session)) return session;
  }

  return null;
}

/* ------------------ helpers ------------------ */

function mapSessionToUser(session: BetterAuthSession | null): User | null {
  if (!session?.user?.id) return null;

  const u = session.user;

  return {
    id: String(u.id),
    email: String(u.email ?? ""),
    nickname: String(u.name ?? u.email ?? "user"),
    role: "user",
    avatarUrl: u.image ?? null,
    createdAt: String(u.createdAt ?? new Date().toISOString()),
  };
}

/* ------------------ session fetch ------------------ */

async function getSessionSafe(): Promise<BetterAuthSession | null> {
  try {
    const client = authClient as unknown as {
      getSession?: () => Promise<unknown>;
      session?: { get?: () => Promise<unknown> };
      auth?: { getSession?: () => Promise<unknown> };
    };

    const raw =
      (await client.getSession?.()) ??
      (await client.session?.get?.()) ??
      (await client.auth?.getSession?.());

    return extractSession(raw);
  } catch {
    return null;
  }
}

/* ------------------ provider ------------------ */

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);

    const session = await getSessionSafe();

    setUser(mapSessionToUser(session));

    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const session = await getSessionSafe();
      if (!mounted) return;
      setUser(mapSessionToUser(session));
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const result = await authClient.signIn.email({
          email,
          password,
        });

        const error = getErrorMessage(result, "로그인 실패");
        if (error) {
          return { ok: false as const, error };
        }

        await refresh();

        return { ok: true as const };
      } catch {
        return {
          ok: false as const,
          error: "서버 오류가 발생했습니다.",
        };
      }
    },
    [refresh],
  );

  const signup = useCallback(
    async (nickname: string, email: string, password: string) => {
      try {
        const result = await authClient.signUp.email({
          email,
          password,
          name: nickname,
        });

        const error = getErrorMessage(result, "회원가입 실패");
        if (error) {
          return { ok: false as const, error };
        }

        await refresh();

        return { ok: true as const };
      } catch {
        return {
          ok: false as const,
          error: "서버 오류가 발생했습니다.",
        };
      }
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    await authClient.signOut();
    setUser(null);
  }, []);

  const authFetch = useCallback((url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      credentials: "include",
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, refresh, login, signup, logout, authFetch }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ------------------ hook ------------------ */

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
