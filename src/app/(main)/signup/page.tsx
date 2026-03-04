"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthContext";

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("비밀번호는 8자 이상이어야 합니다."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, nickname }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      login(data.token, data.user);
      router.push("/");
    } catch {
      setError("서버 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 20px 40px" }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 36, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,.10)" }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, color: "var(--accent)", marginBottom: 6 }}>PromptHub</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 28, lineHeight: 1.5 }}>지금 가입하고 첫 프롬프트를 공유하세요.</div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 24, letterSpacing: "-.8px", color: "var(--text)", marginBottom: 4 }}>계정 만들기 ✨</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>무료로 가입하고 프롬프트에 접근하세요.</div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: ".7px" }}>닉네임 <span style={{ color: "var(--accent)" }}>*</span></label>
            <input className="form-input" placeholder="예: devmindset" value={nickname} onChange={(e) => setNickname(e.target.value)} required minLength={2} maxLength={20} />
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>영문, 숫자, 한국어 가능 · 2~20자</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: ".7px" }}>이메일 <span style={{ color: "var(--accent)" }}>*</span></label>
            <input className="form-input" type="email" placeholder="hello@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: ".7px" }}>비밀번호 <span style={{ color: "var(--accent)" }}>*</span></label>
            <div style={{ position: "relative" }}>
              <input className="form-input" type={showPw ? "text" : "password"} placeholder="8자 이상, 영문+숫자 포함" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, padding: 4 }}>
                {showPw ? "🙈" : "👁"}
              </button>
            </div>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>8자 이상, 영문+숫자 조합</span>
          </div>

          {error && <div style={{ fontSize: 12, color: "var(--red)", marginBottom: 12, padding: "8px 12px", background: "var(--red-dim)", border: "1px solid var(--red-border)", borderRadius: 8 }}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: 12, background: "var(--accent)", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, borderRadius: 10, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1, transition: "opacity .15s" }}
          >
            {loading ? "가입 중..." : "가입하기"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--text-muted)" }}>
          이미 계정이 있으신가요?{" "}
          <Link href="/login" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>로그인</Link>
        </div>
        <div style={{ textAlign: "center", marginTop: 14, fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>
          가입하면 이용약관 및 개인정보처리방침에 동의합니다.
        </div>
      </div>
    </div>
  );
}
