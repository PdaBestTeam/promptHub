"use client";
// src/features/prompts/components/prompt-detail/prompt-detail.client.tsx
// Client Component: 스크랩·Fork·버전선택·복사 인터랙션 담당

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import { Binoculars, Heart, GitFork, ClipboardList } from "lucide-react";

interface Version {
  id: string;
  versionNo: number;
  title: string;
  content: string;
  changeNote: string | null;
  createdAt: string;
  viewCount?: number;
  scrapCount?: number;
  forkCount?: number;
  editor: { id: string; nickname: string };
}

interface PromptDetailData {
  id: string;
  title: string;
  content: string;
  description: string | null;
  result?: string | null;
  isPublic: boolean;
  currentVersionNo: number;
  viewCount: number;
  scrapCount: number;
  forkCount: number;
  parentPromptId: string | null;
  createdAt: string;
  isScrapped: boolean;
  nextForkVersionNo: number;
  category: { id: number; name: string; slug: string } | null;
  author: { id: string; nickname: string; avatarUrl: string | null };
}

interface Props {
  prompt: PromptDetailData;
  versions: Version[];
}

export default function PromptDetailClient({
  prompt: initialPrompt,
  versions,
}: Props) {
  const router = useRouter();
  const { user, authFetch, loading: authLoading } = useAuth();

  const [prompt, setPrompt] = useState<PromptDetailData>(() => {
    // 목록에서 넘어올 때 저장해 둔 스크랩 상태가 있으면 즉시 반영
    if (typeof window === "undefined") return initialPrompt;
    const saved = sessionStorage.getItem(`prompt-scrap-${initialPrompt.id}`);
    if (saved !== null) {
      const isScrapped = saved === "true";
      const delta = (isScrapped ? 1 : 0) - (initialPrompt.isScrapped ? 1 : 0);
      return {
        ...initialPrompt,
        isScrapped,
        scrapCount: Math.max(0, initialPrompt.scrapCount + delta),
      };
    }
    return initialPrompt;
  });

  // 서버에서는 토큰 접근 불가 → 클라이언트 인증 완료 후 스크랩 상태 동기화 (id 바뀔 때마다 재조회, 조회수 미증가)
  useEffect(() => {
    if (authLoading || !user) return;
    authFetch(`/api/prompts/${initialPrompt.id}`, {
      headers: { "X-Skip-View-Count": "true" },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.isScrapped !== undefined || data.result !== undefined) {
          setPrompt((p) => ({
            ...p,
            ...(data.isScrapped !== undefined && { isScrapped: data.isScrapped, scrapCount: data.scrapCount }),
            ...(data.result !== undefined && { result: data.result ?? null }),
          }));
        }
      })
      .catch(() => {});
  }, [authLoading, user, initialPrompt.id]);
  const [selectedVer, setSelectedVer] = useState<Version | null>(() => {
    const currentId = initialPrompt.id;
    const match = versions.find((v) => Number(v.id) === Number(currentId));
    return match ?? versions[versions.length - 1] ?? null;
  });
  const selectedVerRef = useRef<Version | null>(selectedVer);
  selectedVerRef.current = selectedVer;
  function selectVersion(v: Version) {
    selectedVerRef.current = v;
    setSelectedVer(v);
  }
  const [activeTab, setActiveTab] = useState<"forks" | "versions">("versions");
  const [showForkModal, setShowForkModal] = useState(false);
  const [forkTitle, setForkTitle] = useState("");
  const [forking, setForking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const id = prompt.id;
  const isAuthor = user?.id === prompt.author.id;
  const displayContent = selectedVer?.content ?? prompt.content;
  const displayTitle = selectedVer?.title ?? prompt.title;
  const displayStats = selectedVer
    ? {
        viewCount: selectedVer.viewCount ?? prompt.viewCount,
        scrapCount: selectedVer.scrapCount ?? prompt.scrapCount,
        forkCount: selectedVer.forkCount ?? prompt.forkCount,
        versionNo: selectedVer.versionNo,
      }
    : {
        viewCount: prompt.viewCount,
        scrapCount: prompt.scrapCount,
        forkCount: prompt.forkCount,
        versionNo: prompt.currentVersionNo,
      };
  const stats = [
    {
      key: "views",
      label: "조회수",
      value: displayStats.viewCount,
      icon: Binoculars,
    },
    { key: "scraps", label: "스크랩", value: displayStats.scrapCount, icon: Heart },
    { key: "forks", label: "Fork", value: displayStats.forkCount, icon: GitFork },
    {
      key: "version",
      label: "버전",
      value: `v${displayStats.versionNo}`,
      icon: ClipboardList,
    },
  ] as const;

  async function toggleScrap() {
    if (!user) {
      router.push("/login");
      return;
    }
    const newIsScrapped = !prompt.isScrapped;
    const method = prompt.isScrapped ? "DELETE" : "POST";
    await authFetch(`/api/prompts/${id}/scrap`, { method });
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`prompt-scrap-${id}`, String(newIsScrapped));
    }
    setPrompt((p) => ({
      ...p,
      isScrapped: newIsScrapped,
      scrapCount: p.scrapCount + (newIsScrapped ? 1 : -1),
    }));
  }

  async function handleFork() {
    if (!user) {
      router.push("/login");
      return;
    }
    const current = selectedVerRef.current ?? selectedVer;
    const forkSourceId = current?.id != null ? String(current.id) : id;
    setForking(true);
    const res = await authFetch(`/api/prompts/${forkSourceId}/fork`, {
      method: "POST",
      body: JSON.stringify({ draftOnly: true, title: forkTitle || undefined }),
    });
    const data = await res.json();
    setForking(false);
    setShowForkModal(false);
    if (data.draft && data.sourcePromptId != null) {
      router.push(`/prompts/new?fromFork=${data.sourcePromptId}`);
    } else if (data.id) {
      router.push(`/prompts/${data.id}/edit`);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    await authFetch(`/api/prompts/${id}`, { method: "DELETE" });
    router.push("/");
  }

  function copyPrompt() {
    navigator.clipboard.writeText(selectedVer?.content ?? prompt.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div style={{ paddingTop: 60 }}>
      <div
        style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 36px 80px" }}
      >
        {/* Breadcrumb */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            color: "var(--text-muted)",
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{ cursor: "pointer" }}
            onClick={() => router.back()}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--accent)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-muted)")
            }
          >
            탐색
          </span>
          <span style={{ opacity: 0.3 }}>›</span>
          {prompt.category && <span>{prompt.category.name}</span>}
          {prompt.category && <span style={{ opacity: 0.3 }}>›</span>}
          <span style={{ color: "var(--text-dim)" }}>{prompt.title}</span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 300px",
            gap: 28,
            alignItems: "start",
          }}
        >
          {/* Main */}
          <div style={{ minWidth: 0 }}>
            {/* Meta */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
                marginBottom: 12,
              }}
            >
              {prompt.parentPromptId && (
                <span className="badge badge-fork">🔀 Fork</span>
              )}
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {new Date(prompt.createdAt).toLocaleDateString("ko-KR")}
              </span>
            </div>

            <h1
              style={{
                fontFamily: "'Syne',sans-serif",
                fontWeight: 800,
                fontSize: "clamp(20px,2.5vw,30px)",
                letterSpacing: "-.8px",
                lineHeight: 1.2,
                color: "var(--text)",
                marginBottom: 10,
              }}
            >
              {displayTitle}
            </h1>
            {prompt.description && (
              <p
                style={{
                  color: "var(--text-dim)",
                  fontSize: 14,
                  lineHeight: 1.7,
                  marginBottom: 20,
                }}
              >
                {prompt.description}
              </p>
            )}

            {/* Actions */}
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                marginBottom: 20,
              }}
            >
              <button
                onClick={() => {
                  const src = selectedVerRef.current ?? selectedVer;
                  const base = (src?.title ?? prompt.title).replace(
                    /\s*\(Fork v\d+\)$/,
                    ""
                  );
                  setForkTitle(`${base} (Fork v${prompt.nextForkVersionNo})`);
                  setShowForkModal(true);
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 16px",
                  borderRadius: 9,
                  border: "none",
                  background: "var(--accent)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "opacity .15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                🔀 Fork하기
              </button>
              <button
                onClick={toggleScrap}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 16px",
                  borderRadius: 9,
                  border: `1px solid ${prompt.isScrapped ? "var(--accent-border)" : "var(--border)"}`,
                  background: prompt.isScrapped
                    ? "var(--accent-dim)"
                    : "var(--surface)",
                  color: prompt.isScrapped
                    ? "var(--accent)"
                    : "var(--text-dim)",
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontWeight: 500,
                  transition: "all .15s",
                }}
              >
                {prompt.isScrapped ? "♥" : "♡"}{" "}
                {prompt.isScrapped ? "스크랩됨" : "스크랩"}
              </button>
              {isAuthor && (
                <button
                  className="btn-ghost"
                  style={{ padding: "9px 16px" }}
                  onClick={() => router.push(`/prompts/${id}/edit`)}
                >
                  ✏️ 수정
                </button>
              )}
              {isAuthor && (
                <button
                  className="btn-ghost"
                  style={{
                    padding: "9px 16px",
                    color: "var(--red)",
                    borderColor: "var(--red-border)",
                  }}
                  onClick={() => setShowDeleteModal(true)}
                >
                  🗑 삭제
                </button>
              )}
            </div>

            {/* Version selector */}
            {versions.length > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 16,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    fontWeight: 500,
                  }}
                >
                  버전 선택
                </span>
                {[...versions].reverse().map((v) => (
                  <button
                    key={v.id}
                    onClick={() => selectVersion(v)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 6,
                      border: "1px solid",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all .15s",
                      fontSize: 12,
                      background: "none",
                      borderColor:
                        selectedVer?.id === v.id
                          ? "var(--accent-border)"
                          : "var(--border)",
                      color:
                        selectedVer?.id === v.id
                          ? "var(--accent)"
                          : "var(--text-dim)",
                      fontWeight: selectedVer?.id === v.id ? 600 : 400,
                    }}
                  >
                    v{v.versionNo}
                    {v.versionNo === prompt.currentVersionNo ? " 최신" : ""}
                  </button>
                ))}
              </div>
            )}

            {/* Content */}
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                overflow: "hidden",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border)",
                  background: "var(--surface2)",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: ".8px",
                    color: "var(--text-muted)",
                  }}
                >
                  📋 프롬프트
                </span>
                <button
                  onClick={copyPrompt}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "5px 12px",
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    background: "none",
                    color: copied ? "var(--accent)" : "var(--text-muted)",
                    fontSize: 12,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all .15s",
                  }}
                >
                  {copied ? "✓ 복사됨" : "복사"}
                </button>
              </div>
              <div
                style={{
                  padding: 20,
                  fontSize: 13,
                  lineHeight: 1.85,
                  color: "var(--text-dim)",
                  whiteSpace: "pre-wrap",
                  fontFamily: "inherit",
                }}
              >
                {displayContent}
              </div>
            </div>

            {/* 프롬프트 결과 (result 있을 때만) */}
            {prompt.result && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface2)" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".8px", color: "var(--text-muted)" }}>✨ 프롬프트 결과</span>
                </div>
                <div style={{ padding: 20, fontSize: 13, lineHeight: 1.85, color: "var(--text-dim)", whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
                  {prompt.result}
                </div>
              </div>
            )}

            {/* Tabs */}
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {(["versions", "forks"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: "10px 16px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontSize: 13,
                      fontWeight: 500,
                      transition: "all .15s",
                      color:
                        activeTab === tab
                          ? "var(--accent)"
                          : "var(--text-muted)",
                      borderBottom: `2px solid ${activeTab === tab ? "var(--accent)" : "transparent"}`,
                      marginBottom: -1,
                    }}
                  >
                    {tab === "versions"
                      ? `📋 버전 히스토리 (${versions.length})`
                      : `🔀 Fork 목록 (${prompt.forkCount})`}
                  </button>
                ))}
              </div>
              <div style={{ padding: 18 }}>
                {activeTab === "versions" ? (
                  versions.length === 0 ? (
                    <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                      버전 기록이 없습니다.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      {[...versions].reverse().map((v) => (
                        <div
                          key={v.id}
                          style={{
                            background: "var(--surface2)",
                            border: "1px solid var(--border)",
                            borderRadius: 10,
                            padding: "12px 14px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              marginBottom: 6,
                            }}
                          >
                            <span
                              style={{
                                background: "var(--accent-dim)",
                                border: "1px solid var(--accent-border)",
                                color: "var(--accent)",
                                padding: "2px 8px",
                                borderRadius: 5,
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              v{v.versionNo}
                            </span>
                            <span
                              style={{
                                fontSize: 12,
                                color: "var(--text-muted)",
                              }}
                            >
                              {v.editor.nickname}
                            </span>
                            <span
                              style={{
                                fontSize: 12,
                                color: "var(--text-muted)",
                                marginLeft: "auto",
                              }}
                            >
                              {new Date(v.createdAt).toLocaleDateString(
                                "ko-KR",
                              )}
                            </span>
                          </div>
                          {v.changeNote && (
                            <div
                              style={{ fontSize: 13, color: "var(--text-dim)" }}
                            >
                              {v.changeNote}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                    Fork 목록은 추후 업데이트됩니다.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              position: "sticky",
              top: 76,
            }}
          >
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: 16,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: ".8px",
                  color: "var(--text-muted)",
                  marginBottom: 12,
                }}
              >
                통계
              </div>
              {stats.map(({ key, label, value, icon: Icon }) => (
                <div
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "7px 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: "var(--text-dim)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Icon size={15} strokeWidth={1.8} />
                    {label}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text)",
                    }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: 16,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: ".8px",
                  color: "var(--text-muted)",
                  marginBottom: 12,
                }}
              >
                작성자
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    color: "#fff",
                    fontSize: 14,
                  }}
                >
                  {prompt.author.nickname[0].toUpperCase()}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text)",
                  }}
                >
                  {prompt.author.nickname}
                </div>
              </div>
            </div>
          </div>
        </div>
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
          onClick={() => setShowDeleteModal(false)}
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
            onClick={(e) => e.stopPropagation()}
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

      {/* Fork Modal */}
      {showForkModal && (
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
          onClick={() => setShowForkModal(false)}
        >
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 18,
              padding: 28,
              maxWidth: 480,
              width: "100%",
              margin: 20,
              boxShadow: "0 30px 80px rgba(0,0,0,.6)",
              animation: "fadeUp .2s ease forwards",
              opacity: 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <span
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: "-.5px",
                }}
              >
                🔀 Fork하기
              </span>
              <button
                onClick={() => setShowForkModal(false)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: "none",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>
            <div
              style={{
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: 14,
                marginBottom: 16,
                fontSize: 12,
                color: "var(--text-dim)",
                lineHeight: 1.7,
              }}
            >
              원본:{" "}
              <strong style={{ color: "var(--text)" }}>
                {(selectedVerRef.current ?? selectedVer)?.title ?? prompt.title}
              </strong>
              <br />이 프롬프트를 Fork하여 나만의 버전으로 개선하세요.
            </div>
            <div style={{ marginBottom: 16 }}>
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
                Fork 제목
              </label>
              <input
                className="form-input"
                value={forkTitle}
                onChange={(e) => setForkTitle(e.target.value)}
                placeholder={`${((selectedVerRef.current ?? selectedVer)?.title ?? prompt.title).replace(/\s*\(Fork v\d+\)$/, "")} (Fork v${prompt.nextForkVersionNo})`}
              />
            </div>
            <div
              style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
            >
              <button
                className="btn-ghost"
                onClick={() => setShowForkModal(false)}
              >
                취소
              </button>
              <button
                className="btn-primary"
                onClick={handleFork}
                disabled={forking}
              >
                {forking ? "Fork 중..." : "🔀 Fork 생성"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
