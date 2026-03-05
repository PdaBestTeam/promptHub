"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function EditPromptPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user, loading: authLoading, authFetch } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [changeNote, setChangeNote] = useState("");
  const [currentVersionNo, setCurrentVersionNo] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    async function load() {
      const [pr, cats] = await Promise.all([
        authFetch(`/api/prompts/${id}`).then((r) => r.json()),
        fetch("/api/categories").then((r) => r.json()),
      ]);
      if (pr.error || pr.author?.id !== user?.id) {
        router.push(`/prompts/${id}`);
        return;
      }
      setTitle(pr.title);
      setDescription(pr.description ?? "");
      setContent(pr.content);
      setCategoryId(pr.category?.id ?? "");
      setCurrentVersionNo(pr.currentVersionNo);
      setCategories(cats.data ?? []);
      setLoading(false);
    }
    load();
  }, [id, authLoading, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await authFetch(`/api/prompts/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        title,
        description,
        content,
        categoryId: categoryId || null,
        isPublic: true,
        changeNote,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      setSaving(false);
      return;
    }
    router.push(`/prompts/${id}`);
  }

  async function handleDelete() {
    setDeleting(true);
    await authFetch(`/api/prompts/${id}`, { method: "DELETE" });
    router.push("/");
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
        <div
          style={{
            fontSize: 13,
            color: "var(--text-muted)",
            marginBottom: 10,
            cursor: "pointer",
          }}
          onClick={() => router.push(`/prompts/${id}`)}
        >
          ← 상세 페이지로 돌아가기
        </div>
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
            프롬프트 수정
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
            수정 내용은 새 버전(v{currentVersionNo + 1})으로 자동 저장됩니다.
          </p>
        </div>

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
              style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)" }}
            >
              현재 v{currentVersionNo} 수정 중
            </div>
            <div
              style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}
            >
              저장 시 v{currentVersionNo + 1}로 업데이트됩니다.
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
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
                제목
              </label>
              <input
                style={inputStyle}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
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
                카테고리
              </label>
              <select
                style={
                  {
                    ...inputStyle,
                    appearance: "none",
                    paddingRight: 36,
                    cursor: "pointer",
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' fill='%236b6b80' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 13px center",
                  } as React.CSSProperties
                }
                value={categoryId}
                onChange={(e) =>
                  setCategoryId(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
              >
                <option value="">카테고리 없음</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
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
              프롬프트 내용
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
                  minHeight: 220,
                  lineHeight: 1.8,
                } as React.CSSProperties
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
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
              style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}
            >
              버전 히스토리에 표시됩니다.
            </div>
          </div>

          {/* Danger zone */}
          <div
            style={{
              background: "var(--red-dim)",
              border: "1px solid var(--red-border)",
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--red)",
                marginBottom: 6,
              }}
            >
              ⚠️ 주의
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--text-dim)",
                marginBottom: 12,
              }}
            >
              삭제 시 모든 버전 히스토리가 함께 삭제됩니다. 되돌릴 수 없습니다.
            </div>
            <button
              type="button"
              className="btn-danger"
              onClick={() => setShowDeleteModal(true)}
            >
              🗑 프롬프트 삭제
            </button>
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
              onClick={() => router.push(`/prompts/${id}`)}
            >
              ← 취소
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
              style={{ padding: "9px 22px", fontSize: 14 }}
            >
              {saving ? "저장 중..." : `v${currentVersionNo + 1}로 저장 →`}
            </button>
          </div>
        </form>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.7)",
            backdropFilter: "blur(4px)",
            zIndex: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 18,
              padding: 28,
              maxWidth: 400,
              width: "100%",
              margin: 20,
            }}
          >
            <div
              style={{
                fontFamily: "'Syne',sans-serif",
                fontSize: 18,
                fontWeight: 800,
                marginBottom: 12,
              }}
            >
              정말 삭제하시겠어요?
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--text-dim)",
                marginBottom: 24,
              }}
            >
              이 작업은 되돌릴 수 없습니다.
            </div>
            <div
              style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
            >
              <button
                className="btn-ghost"
                onClick={() => setShowDeleteModal(false)}
              >
                취소
              </button>
              <button
                className="btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "삭제 중..." : "🗑 삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
