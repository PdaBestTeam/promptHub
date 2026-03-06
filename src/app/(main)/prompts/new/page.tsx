"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";

interface Category {
  id: number;
  name: string;
  slug: string;
}

function NewPromptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromForkId = searchParams.get("fromFork");
  const { user, loading: authLoading, authFetch } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [modelName, setModelName] = useState("");
  const [result, setResult] = useState("");
  const [sourceVersionNo, setSourceVersionNo] = useState<number | null>(null);
  const [nextVersionNoOnSave, setNextVersionNoOnSave] = useState<number | null>(
    null,
  );
  const [changeNote, setChangeNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!!fromForkId);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.data ?? []));
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!fromForkId || !user) return;
    authFetch(`/api/prompts/${fromForkId}/fork-draft`)
      .then((r) => r.json())
      .then((d) => {
        if (d.title != null) setTitle(d.title);
        if (d.content != null) setContent(d.content);
        if (d.description != null) setDescription(d.description);
        if (d.categoryId != null) setCategoryId(d.categoryId);
        if (d.sourceVersionNo != null) setSourceVersionNo(d.sourceVersionNo);
        if (d.nextVersionNo != null) setNextVersionNoOnSave(d.nextVersionNo);
      })
      .finally(() => setLoading(false));
  }, [fromForkId, user, authFetch]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !categoryId || !content.trim()) {
      setError("제목, 카테고리, 내용은 필수입니다.");
      return;
    }
    setSaving(true);
    setError("");
    if (fromForkId) {
      const res = await authFetch(`/api/prompts/${fromForkId}/fork`, {
        method: "POST",
        body: JSON.stringify({
          createFromDraft: true,
          title: title.trim(),
          content: content.trim(),
          description: description.trim() || null,
          categoryId: categoryId || null,
          result: result.trim() || null,
          modelName: modelName.trim() || null,
          changeNote: changeNote.trim() || "Fork 후 저장",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "저장에 실패했습니다.");
        setSaving(false);
        return;
      }
      router.push(`/prompts/${data.id}`);
      return;
    }
    const res = await authFetch("/api/prompts", {
      method: "POST",
      body: JSON.stringify({
        title,
        description,
        content,
        categoryId: categoryId || null,
        result: result.trim() || null,
        modelName: modelName.trim() || null,
        isPublic: true,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      setSaving(false);
      return;
    }
    router.push(`/prompts/${data.id}`);
  }

  const inputStyle = {
    width: "100%",
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: "11px 14px",
    color: "var(--text)",
    fontSize: 13,
    fontFamily: "inherit",
    outline: "none",
  };
  const isForkDraft =
    !!fromForkId && nextVersionNoOnSave != null && sourceVersionNo != null;

  if (loading)
    return (
      <div
        style={{
          paddingTop: 80,
          textAlign: "center",
          color: "var(--text-muted)",
        }}
      >
        불러오는 중...
      </div>
    );

  return (
    <div style={{ paddingTop: 60 }}>
      <div
        style={{ maxWidth: 900, margin: "0 auto", padding: "40px 36px 80px" }}
      >
        <div style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontFamily: "'Syne',sans-serif",
              fontWeight: 800,
              fontSize: "clamp(24px,3vw,36px)",
              letterSpacing: "-1.2px",
              color: "var(--text)",
              marginBottom: 6,
            }}
          >
            {isForkDraft ? "Fork로 새 프롬프트 만들기" : "새 프롬프트 등록"}
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
            {isForkDraft
              ? "저장하면 포크가 반영됩니다. 저장하지 않고 나가면 카운트되지 않습니다."
              : "검증된 프롬프트를 커뮤니티와 공유하세요."}
          </p>
        </div>

        {isForkDraft && (
          <div
            style={{
              background: "var(--accent-dim)",
              border: "1px solid var(--accent-border)",
              borderRadius: 12,
              padding: "14px 16px",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 18 }}>📋</span>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--accent)",
                }}
              >
                v{sourceVersionNo}를 기반으로 작성 중
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginTop: 2,
                }}
              >
                저장 시 v{nextVersionNoOnSave}로 포크가 반영됩니다.
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Basic info */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: 28,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: ".9px",
                color: "var(--text-muted)",
                marginBottom: 18,
                paddingBottom: 10,
                borderBottom: "1px solid var(--border)",
              }}
            >
              기본 정보
            </div>
            <div style={{ marginBottom: 18 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-dim)",
                  textTransform: "uppercase",
                  letterSpacing: ".7px",
                  marginBottom: 6,
                }}
              >
                제목 <span style={{ color: "var(--accent)" }}>*</span>
              </label>
              <input
                style={inputStyle}
                placeholder="프롬프트를 잘 설명하는 제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  marginTop: 4,
                }}
              >
                좋은 제목은 목적 + 기능이 명확하게 담겨 있습니다.
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-dim)",
                  textTransform: "uppercase",
                  letterSpacing: ".7px",
                  marginBottom: 6,
                }}
              >
                설명
              </label>
              <textarea
                style={
                  {
                    ...inputStyle,
                    minHeight: 80,
                    resize: "vertical",
                    lineHeight: 1.6,
                  } as React.CSSProperties
                }
                placeholder="이 프롬프트가 무엇을 하는지 간략하게 설명하세요."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-dim)",
                  textTransform: "uppercase",
                  letterSpacing: ".7px",
                  marginBottom: 6,
                }}
              >
                카테고리 <span style={{ color: "var(--accent)" }}>*</span>
              </label>
              <select
                style={
                  {
                    ...inputStyle,
                    appearance: "none",
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' fill='%236b6b80' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 13px center",
                    paddingRight: 36,
                    cursor: "pointer",
                  } as React.CSSProperties
                }
                value={categoryId}
                onChange={(e) =>
                  setCategoryId(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
              >
                <option value="" disabled>
                  카테고리를 선택해주세요
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-dim)",
                  textTransform: "uppercase",
                  letterSpacing: ".7px",
                  marginBottom: 6,
                }}
              >
                생성형 AI 유형
              </label>
              <select
                style={
                  {
                    ...inputStyle,
                    appearance: "none",
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' fill='%236b6b80' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 13px center",
                    paddingRight: 36,
                    cursor: "pointer",
                  } as React.CSSProperties
                }
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
              >
                <option value="">선택 (선택사항)</option>
                <option value="ChatGPT">ChatGPT</option>
                <option value="Claude">Claude</option>
                <option value="Gemini">Gemini</option>
                <option value="Perplexity">Perplexity</option>
                <option value="Midjourney">Midjourney</option>
                <option value="DALL-E 3">DALL-E 3</option>
                <option value="Stable Diffusion">Stable Diffusion</option>
                <option value="Copilot">Copilot</option>
                <option value="Notion AI">Notion AI</option>
              </select>
            </div>
          </div>

          {/* Content */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: 28,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: ".9px",
                color: "var(--text-muted)",
                marginBottom: 18,
                paddingBottom: 10,
                borderBottom: "1px solid var(--border)",
              }}
            >
              프롬프트 내용{" "}
              <span style={{ color: "var(--accent)", fontWeight: 700 }}>*</span>
            </div>
            <textarea
              style={
                {
                  width: "100%",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: 14,
                  color: "var(--text)",
                  fontSize: 13,
                  fontFamily: "inherit",
                  outline: "none",
                  resize: "vertical",
                  minHeight: 200,
                  lineHeight: 1.8,
                } as React.CSSProperties
              }
              placeholder="프롬프트 내용을 입력하세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                marginTop: 4,
                textAlign: "right",
              }}
            >
              {content.length}자
            </div>
          </div>

          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: 28,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: ".9px",
                color: "var(--text-muted)",
                marginBottom: 18,
                paddingBottom: 10,
                borderBottom: "1px solid var(--border)",
              }}
            >
              프롬프트 결과{" "}
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  fontWeight: 400,
                  textTransform: "none",
                }}
              >
                (선택)
              </span>
            </div>
            <textarea
              style={
                {
                  ...inputStyle,
                  minHeight: 100,
                  resize: "vertical",
                  lineHeight: 1.6,
                } as React.CSSProperties
              }
              placeholder="이 프롬프트를 사용했을 때 나온 결과 예시를 적어주세요."
              value={result}
              onChange={(e) => setResult(e.target.value)}
            />
          </div>

          {isForkDraft && (
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                padding: 28,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: ".9px",
                  color: "var(--text-muted)",
                  marginBottom: 18,
                  paddingBottom: 10,
                  borderBottom: "1px solid var(--border)",
                }}
              >
                버전 메모{" "}
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    fontWeight: 400,
                    textTransform: "none",
                    letterSpacing: 0,
                  }}
                >
                  (선택)
                </span>
              </div>
              <input
                style={inputStyle}
                placeholder="이번 버전에서 변경한 내용을 간략히 적어주세요."
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
              />
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  marginTop: 4,
                }}
              >
                버전 히스토리에 표시됩니다.
              </div>
            </div>
          )}

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

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 8,
            }}
          >
            <button
              type="button"
              className="btn-secondary"
              onClick={() => router.back()}
            >
              ← 취소
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
              style={{ padding: "9px 22px", fontSize: 14 }}
            >
              {saving
                ? fromForkId
                  ? "저장 중..."
                  : "등록 중..."
                : fromForkId
                  ? "저장하기"
                  : "등록하기 →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewPromptPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            paddingTop: 80,
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          로딩 중...
        </div>
      }
    >
      <NewPromptContent />
    </Suspense>
  );
}
