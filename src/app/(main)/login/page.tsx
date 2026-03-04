"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 20px 40px",
      }}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: 36,
          width: "100%",
          maxWidth: 420,
          boxShadow: "0 30px 80px rgba(0,0,0,.4)",
        }}
      >
        <div
          style={{
            fontFamily: "'Syne',sans-serif",
            fontWeight: 800,
            fontSize: 22,
            color: "var(--accent)",
            marginBottom: 6,
          }}
        >
          PromptHub
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--text-muted)",
            marginBottom: 28,
            lineHeight: 1.5,
          }}
        >
          검증된 프롬프트를 찾고, Fork하고, 발전시키세요.
        </div>
        <div
          style={{
            fontFamily: "'Syne',sans-serif",
            fontWeight: 800,
            fontSize: 24,
            letterSpacing: "-.8px",
            color: "#fff",
            marginBottom: 4,
          }}
        >
          다시 오셨군요 👋
        </div>
        <div
          style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}
        >
          로그인하고 프롬프트를 이어서 탐색하세요.
        </div>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              marginBottom: 18,
            }}
          >
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: ".7px",
              }}
            >
              이메일
            </label>
            <input
              className="form-input"
              type="email"
              placeholder="hello@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              marginBottom: 8,
            }}
          >
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: ".7px",
              }}
            >
              비밀번호
            </label>
            <div style={{ position: "relative" }}>
              <input
                className="form-input"
                type={showPw ? "text" : "password"}
                placeholder="비밀번호 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: "absolute",
                  right: 13,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: 13,
                  padding: 4,
                }}
              >
                {showPw ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                fontSize: 12,
                color: "var(--red)",
                marginBottom: 12,
                padding: "8px 12px",
                background: "var(--red-dim)",
                border: "1px solid var(--red-border)",
                borderRadius: 8,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: 12,
              background: "var(--accent)",
              border: "none",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              borderRadius: 10,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              opacity: loading ? 0.7 : 1,
              marginTop: 4,
              transition: "opacity .15s",
            }}
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div
          style={{
            textAlign: "center",
            marginTop: 20,
            fontSize: 13,
            color: "var(--text-muted)",
          }}
        >
          계정이 없으신가요?{" "}
          <Link
            href="/signup"
            style={{
              color: "var(--accent)",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
}
