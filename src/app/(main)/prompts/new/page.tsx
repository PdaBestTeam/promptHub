"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";

interface Category { id: number; name: string; slug: string; }

export default function NewPromptPage() {
  const router = useRouter();
  const { user, authFetch } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    fetch("/api/categories").then((r) => r.json()).then((d) => setCategories(d.data ?? []));
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) { setError("제목과 내용은 필수입니다."); return; }
    setSaving(true);
    setError("");
    const res = await authFetch("/api/prompts", {
      method: "POST",
      body: JSON.stringify({ title, description, content, categoryId: categoryId || null, isPublic }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    router.push(`/prompts/${data.id}`);
  }

  const inputStyle = { width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: "11px 14px", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none" };

  return (
    <div style={{ paddingTop: 60 }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 36px 80px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(24px,3vw,36px)", letterSpacing: "-1.2px", color: "var(--text)", marginBottom: 6 }}>새 프롬프트 등록</h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
            검증된 프롬프트를 커뮤니티와 공유하세요. 변수는{" "}
            <code style={{ background: "var(--accent-dim)", color: "var(--accent)", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>{"{{변수명}}"}</code>{" "}
            형식으로 작성하세요.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic info */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 28, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".9px", color: "var(--text-muted)", marginBottom: 18, paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>기본 정보</div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: ".7px", marginBottom: 6 }}>제목 <span style={{ color: "var(--accent)" }}>*</span></label>
              <input style={inputStyle} placeholder="프롬프트를 잘 설명하는 제목을 입력하세요" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>좋은 제목은 목적 + 기능이 명확하게 담겨 있습니다.</div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: ".7px", marginBottom: 6 }}>설명</label>
              <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical", lineHeight: 1.6 } as React.CSSProperties} placeholder="이 프롬프트가 무엇을 하는지 간략하게 설명하세요." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: ".7px", marginBottom: 6 }}>카테고리</label>
              <select style={{ ...inputStyle, appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' fill='%236b6b80' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 13px center", paddingRight: 36, cursor: "pointer" } as React.CSSProperties}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value === "" ? "" : Number(e.target.value))}>
                <option value="">카테고리 선택 (선택사항)</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Content */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 28, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".9px", color: "var(--text-muted)", marginBottom: 18, paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>프롬프트 내용</div>
            <div style={{ marginBottom: 8, display: "flex", gap: 6 }}>
              <button type="button" onClick={() => setContent(content + "{{변수명}}")} style={{ padding: "5px 10px", borderRadius: 6, background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>+ {"{{변수}}"} 삽입</button>
            </div>
            <textarea
              style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: 14, color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", minHeight: 200, lineHeight: 1.8 } as React.CSSProperties}
              placeholder={"프롬프트 내용을 입력하세요. 변수는 {{변수명}} 형식으로 표시하세요."}
              value={content} onChange={(e) => setContent(e.target.value)} required
            />
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, display: "flex", justifyContent: "space-between" }}>
              <span>변수는 자동 감지되어 입력 폼이 생성됩니다.</span>
              <span>{content.length}자</span>
            </div>
          </div>

          {/* Visibility */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 28, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".9px", color: "var(--text-muted)", marginBottom: 18, paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>공개 설정</div>
            <div style={{ display: "flex", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", width: "fit-content" }}>
              {[{ val: true, label: "🌍 공개" }, { val: false, label: "🔒 비공개" }].map(({ val, label }) => (
                <div key={String(val)} onClick={() => setIsPublic(val)} style={{ padding: "8px 18px", cursor: "pointer", fontSize: 13, background: isPublic === val ? "var(--accent)" : "none", color: isPublic === val ? "#fff" : "var(--text-muted)", fontWeight: isPublic === val ? 600 : 400, transition: "all .15s" }}>
                  {label}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>비공개로 설정하면 나만 볼 수 있습니다.</div>
          </div>

          {error && <div style={{ fontSize: 12, color: "var(--red)", marginBottom: 12, padding: "8px 12px", background: "var(--red-dim)", border: "1px solid var(--red-border)", borderRadius: 8 }}>{error}</div>}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8 }}>
            <button type="button" className="btn-secondary" onClick={() => router.back()}>← 취소</button>
            <button type="submit" className="btn-primary" disabled={saving} style={{ padding: "9px 22px", fontSize: 14 }}>
              {saving ? "등록 중..." : "등록하기 →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
