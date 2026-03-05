"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import { SunMoon } from "lucide-react";
import { useTheme } from "next-themes";
import GenerativeAIModal from "@/components/ui/GenerativeAIModal";

export default function AppHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

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
        background: "var(--bg)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <style>{`
        @media (max-width: 860px) {
          .nav-hide-md { display: none !important; }
        }
        @media (max-width: 640px) {
          .nav-hide-sm { display: none !important; }
          .nav-btn-text { display: none !important; }
          nav { padding-left: 18px !important; padding-right: 18px !important; }
        }
      `}</style>

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
          flexShrink: 0,
        }}
      >
        PromptHub
      </Link>

      <div />

      {/* Right side */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          className="btn-ghost"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          aria-label="테마 전환"
          style={{ padding: "6px 10px", flexShrink: 0 }}
        >
          <SunMoon size={16} />
        </button>
        {user ? (
          <>
            <GenerativeAIModal />

            {/* 프롬프트 등록 — 아주 좁은 화면에서 텍스트 숨기고 "+" 만 표시 */}
            <button
              className="btn-primary nav-prompt-btn"
              onClick={() => router.push("/prompts/new")}
              style={{ flexShrink: 0 }}
            >
              +<span className="nav-btn-text"> 프롬프트 등록</span>
            </button>

            {/* 유저 아바타 + 닉네임 — 좁은 화면에서 닉네임 텍스트 숨김 */}
            <div
              onClick={() => router.push("/mypage")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 8px 5px 6px",
                borderRadius: 24,
                border: "1px solid var(--border)",
                cursor: "pointer",
                background: "var(--surface)",
                transition: "all .15s",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor =
                  "var(--border-hover)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor =
                  "var(--border)";
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
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <span
                className="nav-hide-md"
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text-dim)",
                }}
              >
                {user.nickname}
              </span>
            </div>

            {/* 로그아웃 — 좁은 화면에서 숨김 (마이페이지에서 가능) */}
            <button
              className="btn-ghost nav-hide-md"
              onClick={handleLogout}
              style={{ fontSize: 12, padding: "6px 12px" }}
            >
              로그아웃
            </button>
          </>
        ) : (
          <>
            <button className="btn-ghost" onClick={() => router.push("/login")}>
              로그인
            </button>
            <button
              className="btn-primary"
              onClick={() => router.push("/signup")}
            >
              회원가입
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
