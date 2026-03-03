"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";

export default function Nav() {
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/");
  }

  const initials = user?.nickname ? user.nickname[0].toUpperCase() : "";

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 36px",
        height: "60px",
        background: "rgba(10,10,15,0.92)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: 20,
          letterSpacing: "-0.5px",
          color: "var(--accent)",
          textDecoration: "none",
          userSelect: "none",
        }}
      >
        PromptHub
      </Link>

      {/* Links */}
      <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
        <Link
          href="/"
          style={{
            textDecoration: "none",
            color: "var(--text-muted)",
            fontSize: 13,
            fontWeight: 500,
            padding: "6px 14px",
            borderRadius: 8,
            transition: "all .15s",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLAnchorElement).style.color = "var(--text)";
            (e.target as HTMLAnchorElement).style.background = "var(--surface2)";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLAnchorElement).style.color = "var(--text-muted)";
            (e.target as HTMLAnchorElement).style.background = "transparent";
          }}
        >
          탐색
        </Link>
      </div>

      {/* Right side */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {user ? (
          <>
            <button className="btn-primary" onClick={() => router.push("/prompts/new")}>
              + 프롬프트 등록
            </button>
            <div
              onClick={() => router.push("/mypage")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 12px 5px 6px",
                borderRadius: 24,
                border: "1px solid var(--border)",
                cursor: "pointer",
                background: "var(--surface)",
                transition: "all .15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-hover)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {initials}
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-dim)" }}>
                {user.nickname}
              </span>
            </div>
            <button className="btn-ghost" onClick={handleLogout} style={{ fontSize: 12, padding: "6px 12px" }}>
              로그아웃
            </button>
          </>
        ) : (
          <>
            <button className="btn-ghost" onClick={() => router.push("/login")}>
              로그인
            </button>
            <button className="btn-primary" onClick={() => router.push("/signup")}>
              회원가입
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
