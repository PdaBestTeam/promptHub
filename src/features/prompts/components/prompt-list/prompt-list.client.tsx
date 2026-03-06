"use client";
// src/features/prompts/components/prompt-list/prompt-list.client.tsx
// Client Component: 검색·필터·스크랩 인터랙션 담당

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import { GitFork } from "lucide-react";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Prompt {
  id: string;
  title: string;
  description: string | null;
  modelName: string | null;
  currentVersionNo: number;
  viewCount: number;
  scrapCount: number;
  forkCount: number;
  parentPromptId: string | null;
  createdAt: string;
  isScrapped: boolean;
  category: Category | null;
  author: { id: string; nickname: string; avatarUrl: string | null };
}

interface Props {
  initialPrompts: Prompt[];
  initialTotal: number;
  categories: Category[];
  initialQ: string;
  initialCategory: string;
  initialSort: string;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  // 기존
  illustration: "🎨",
  development: "💻",
  "problem-solving": "💬",
  travel: "✈️",
  // 추가
  writing: "✏️",
  education: "📚",
  marketing: "📢",
  research: "🔬",
  work: "💼",
  contents: "🎬",
  etc: "📦",
  fun: "🎉",
  life: "🏠",
};

const CATEGORY_DESCS: Record<string, string> = {
  illustration: "이미지·그래픽",
  development: "코딩·기술",
  "problem-solving": "고민·상담",
  travel: "여행·탐방",
  writing: "글쓰기·창작",
  education: "학습·강의",
  marketing: "홍보·마케팅",
  research: "조사·분석",
  work: "업무·생산성",
  contents: "영상·콘텐츠",
  etc: "기타",
  fun: "재미·유머",
  life: "일상·생활",
  "": "모든 프롬프트",
};
const BG_COLORS: Record<string, string> = {
  illustration: "#f5eef8",
  development: "#eef5f0",
  "problem-solving": "#fdf6ec",
  travel: "#eef3fb",
  default: "#f0eeeb",
};

// AI 유형별 배지: 투명한 파스텔 배경 + 카드와 어울리는 진한 텍스트
const MODEL_BADGE_STYLES: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  chatgpt: {
    bg: "rgba(150, 190, 160, 0.55)",
    border: "rgba(100, 140, 110, 0.35)",
    text: "rgb(55, 95, 65)",
  },
  claude: {
    bg: "rgba(210, 165, 130, 0.55)",
    border: "rgba(160, 115, 85, 0.35)",
    text: "rgb(120, 75, 50)",
  },
  gemini: {
    bg: "rgba(150, 175, 210, 0.55)",
    border: "rgba(100, 125, 165, 0.35)",
    text: "rgb(55, 80, 120)",
  },
  perplexity: {
    bg: "rgba(130, 175, 190, 0.55)",
    border: "rgba(85, 130, 150, 0.35)",
    text: "rgb(45, 85, 105)",
  },
  midjourney: {
    bg: "rgba(175, 140, 195, 0.55)",
    border: "rgba(125, 90, 150, 0.35)",
    text: "rgb(85, 55, 115)",
  },
  "dall-e 3": {
    bg: "rgba(140, 180, 200, 0.55)",
    border: "rgba(95, 140, 165, 0.35)",
    text: "rgb(50, 95, 120)",
  },
  "dall-e": {
    bg: "rgba(140, 180, 200, 0.55)",
    border: "rgba(95, 140, 165, 0.35)",
    text: "rgb(50, 95, 120)",
  },
  "stable diffusion": {
    bg: "rgba(160, 155, 190, 0.55)",
    border: "rgba(115, 110, 150, 0.35)",
    text: "rgb(75, 70, 110)",
  },
  copilot: {
    bg: "rgba(140, 165, 200, 0.55)",
    border: "rgba(95, 120, 160, 0.35)",
    text: "rgb(55, 80, 120)",
  },
  "notion ai": {
    bg: "rgba(130, 130, 135, 0.55)",
    border: "rgba(95, 95, 100, 0.35)",
    text: "rgb(60, 60, 65)",
  },
};
const DEFAULT_BADGE = {
  bg: "rgba(130, 140, 155, 0.55)",
  border: "rgba(95, 105, 120, 0.35)",
  text: "rgb(65, 75, 90)",
};
function getModelBadgeStyle(modelName: string): {
  bg: string;
  border: string;
  text: string;
} {
  const key = modelName.trim().toLowerCase().replace(/\s+/g, " ");
  return (
    MODEL_BADGE_STYLES[key] ??
    MODEL_BADGE_STYLES[key.replace(/\s*\d+$/, "").trim()] ??
    DEFAULT_BADGE
  );
}

function resolveCategoryKey(
  slug?: string | null,
  name?: string | null,
): string {
  const s = (slug ?? "").trim().toLowerCase();
  const n = (name ?? "").trim().toLowerCase();

  if (!s && !n) return "";
  if (s === "development" || s === "dev" || s === "개발" || n === "개발")
    return "development";
  if (
    s === "problem-solving" ||
    s === "problem_solving" ||
    s === "advice" ||
    s === "고민해결" ||
    n === "고민해결"
  ) {
    return "problem-solving";
  }
  if (s === "illustration" || s === "일러스트" || n === "일러스트")
    return "illustration";
  if (s === "travel" || s === "여행" || n === "여행") return "travel";
  return s;
}

export default function PromptListClient({
  initialPrompts,
  initialTotal,
  categories,
  initialQ,
  initialCategory,
  initialSort,
}: Props) {
  const router = useRouter();
  const { user, authFetch, loading: authLoading } = useAuth();
  const authSyncedRef = useRef(false);

  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts);
  const [totalCount, setTotalCount] = useState(initialTotal);
  const [q, setQ] = useState(initialQ);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState(initialSort);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialPrompts.length === 12);

  // 서버 컴포넌트가 새 props를 내려줄 때 (뒤로가기 후 URL 변경·refresh) 클라이언트 상태 동기화
  useEffect(() => {
    setQ(initialQ);
    setCategory(initialCategory);
    setSort(initialSort);
    setPrompts(initialPrompts);
    setTotalCount(initialTotal);
    setPage(1);
    setHasMore(initialPrompts.length === 12);
  }, [initialQ, initialCategory, initialSort, initialPrompts, initialTotal]);

  const fetchPrompts = useCallback(
    async (
      nextQ: string,
      nextCat: string,
      nextSort: string,
      nextPage: number,
      reset: boolean,
    ) => {
      setLoading(true);
      const params = new URLSearchParams({
        sort: nextSort,
        page: String(nextPage),
        limit: "12",
      });
      if (nextQ) params.set("q", nextQ);
      if (nextCat) params.set("category", nextCat);
      const res = await authFetch(`/api/prompts?${params}`);
      const data = await res.json();
      const rows: Prompt[] = data.data ?? [];
      if (typeof data.total === "number") setTotalCount(data.total);
      if (reset) setPrompts(rows);
      else setPrompts((prev) => [...prev, ...rows]);
      setHasMore(rows.length === 12);
      setLoading(false);
    },
    [authFetch],
  );

  // 상세 페이지에서 뒤로가기 시 authFetch로 재조회 (스크랩 상태 반영)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const fromDetail = sessionStorage.getItem("prompt-detail-from-list");
    if (fromDetail) {
      sessionStorage.removeItem("prompt-detail-from-list");
      fetchPrompts(q, category, sort, 1, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPrompts]);

  // 인증 완료 후 스크랩 상태 동기화 (최초 1회)
  useEffect(() => {
    if (authLoading || authSyncedRef.current) return;
    authSyncedRef.current = true;
    if (!user) return;
    fetchPrompts(q, category, sort, 1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  function handleFilter(newQ: string, newCat: string, newSort: string) {
    setQ(newQ);
    setCategory(newCat);
    setSort(newSort);
    setPage(1);
    fetchPrompts(newQ, newCat, newSort, 1, true);
    // Next.js router.replace로 URL 동기화 → 뒤로가기 시 sort/category/q 복원
    const params = new URLSearchParams();
    if (newQ) params.set("q", newQ);
    if (newCat) params.set("category", newCat);
    if (newSort && newSort !== "latest") params.set("sort", newSort);
    const search = params.toString();
    router.replace(search ? `/?${search}` : "/", { scroll: false });
  }

  function loadMore() {
    const next = page + 1;
    setPage(next);
    fetchPrompts(q, category, sort, next, false);
  }

  async function toggleScrap(e: React.MouseEvent, prompt: Prompt) {
    e.stopPropagation();
    if (!user) {
      router.push("/login");
      return;
    }
    const newIsScrapped = !prompt.isScrapped;
    const method = prompt.isScrapped ? "DELETE" : "POST";
    await authFetch(`/api/prompts/${prompt.id}/scrap`, { method });
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        `prompt-scrap-${prompt.id}`,
        String(newIsScrapped),
      );
    }
    setPrompts((prev) =>
      prev.map((p) =>
        p.id === prompt.id
          ? {
              ...p,
              isScrapped: newIsScrapped,
              scrapCount: p.scrapCount + (newIsScrapped ? 1 : -1),
            }
          : p,
      ),
    );
  }

  const allCategories = [{ slug: "", name: "전체", id: 0 }, ...categories];

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 36px" }}>
      {/* Filters row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <svg
            style={{
              position: "absolute",
              left: 13,
              top: "50%",
              transform: "translateY(-50%)",
              opacity: 0.3,
              pointerEvents: "none",
            }}
            width={15}
            height={15}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <circle cx={11} cy={11} r={8} />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            className="form-input"
            style={{ paddingLeft: 40 }}
            placeholder="프롬프트 검색..."
            value={q}
            onChange={(e) => handleFilter(e.target.value, category, sort)}
          />
        </div>
        <select
          className="form-select"
          style={{ width: "auto", paddingRight: 36, paddingLeft: 14 }}
          value={sort}
          onChange={(e) => handleFilter(q, category, e.target.value)}
        >
          <option value="latest">최신순</option>
          <option value="views">조회수순</option>
          <option value="scraps">스크랩순</option>
          <option value="forks">Fork순</option>
        </select>
      </div>

      {/* Category Cards — 우측 페이드로 스크롤 가능 암시 */}
      <div style={{ position: "relative", marginBottom: 24 }}>
        <div
          style={
            {
              display: "flex",
              gap: 10,
              overflowX: "auto",
              paddingTop: 4,
              paddingBottom: 6,
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "thin",
              scrollbarColor: "var(--border) transparent",
            } as React.CSSProperties
          }
        >
          {allCategories.map((cat) => {
            const catKey = resolveCategoryKey(cat.slug, cat.name);
            const isActive = category === cat.slug;
            const emoji = CATEGORY_EMOJIS[catKey] ?? "✨";
            const desc = CATEGORY_DESCS[catKey] ?? "";
            return (
              <button
                key={cat.id}
                onClick={() =>
                  handleFilter(q, cat.slug === category ? "" : cat.slug, sort)
                }
                style={{
                  flexShrink: 0,
                  width: "calc((100% - 40px) / 5)",
                  minWidth: 100,
                  scrollSnapAlign: "start",
                  position: "relative",
                  padding: "14px 12px 12px",
                  borderRadius: 14,
                  border: `2px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  background: isActive ? "var(--accent-dim)" : "var(--surface)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.2s ease",
                  transform: isActive ? "translateY(-2px)" : "none",
                  boxShadow: isActive
                    ? "0 6px 20px var(--accent-border)"
                    : "none",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = "var(--border-hover)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 14px rgba(0,0,0,0.08)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              >
                {/* Gradient bar on top (비활성화: 색상 미표시) */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: "transparent",
                    borderRadius: "14px 14px 0 0",
                    transition: "all 0.2s ease",
                  }}
                />
                <span
                  style={{
                    fontSize: 26,
                    lineHeight: 1,
                    filter: isActive
                      ? "drop-shadow(0 2px 6px rgba(0,0,0,0.15))"
                      : "none",
                    transition: "filter 0.2s",
                  }}
                >
                  {cat.slug === "" ? "🌐" : emoji}
                </span>
                <span
                  style={{
                    fontWeight: isActive ? 700 : 600,
                    color: isActive ? "var(--accent)" : "var(--text)",
                    fontSize: 12,
                    letterSpacing: "-0.2px",
                  }}
                >
                  {cat.name}
                </span>
                {desc && (
                  <span
                    style={{
                      fontSize: 10,
                      color: isActive ? "var(--accent)" : "var(--text-muted)",
                      opacity: 0.8,
                    }}
                  >
                    {desc}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {/* 우측 그라데이션 페이드 — 더 스크롤 가능함을 암시 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 60,
            height: "calc(100% - 6px)",
            background: "linear-gradient(to right, transparent, var(--bg))",
            pointerEvents: "none",
          }}
        />
      </div>

      <div
        style={{ marginBottom: 16, fontSize: 13, color: "var(--text-muted)" }}
      >
        총 <strong style={{ color: "var(--text)" }}>{totalCount}</strong>건
      </div>

      {/* Cards grid */}
      {loading && prompts.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 80,
            color: "var(--text-muted)",
          }}
        >
          불러오는 중...
        </div>
      ) : prompts.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 80,
            color: "var(--text-muted)",
          }}
        >
          프롬프트가 없습니다.{" "}
          <span
            style={{ color: "var(--accent)", cursor: "pointer" }}
            onClick={() => router.push("/prompts/new")}
          >
            첫 프롬프트를 등록해보세요!
          </span>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))",
            gap: 14,
          }}
        >
          {prompts.map((prompt, i) => {
            const promptCatKey = resolveCategoryKey(
              prompt.category?.slug,
              prompt.category?.name,
            );
            const emoji = CATEGORY_EMOJIS[promptCatKey] ?? "✨";
            const bg = BG_COLORS[promptCatKey] ?? BG_COLORS.default;
            return (
              <div
                key={prompt.id}
                className="ph-card animate-fade-up"
                style={{
                  animationDelay: `${Math.min(i, 8) * 0.04}s`,
                  opacity: 0,
                }}
                onClick={() => {
                  if (typeof window !== "undefined") {
                    sessionStorage.setItem("prompt-detail-from-list", "1");
                    sessionStorage.setItem("prompt-goto-latest", "1");
                    sessionStorage.setItem(
                      `prompt-scrap-${prompt.id}`,
                      String(prompt.isScrapped),
                    );
                  }
                  router.push(`/prompts/${prompt.id}`);
                }}
              >
                <div
                  style={{
                    height: 118,
                    position: "relative",
                    overflow: "hidden",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: bg,
                  }}
                >
                  {prompt.modelName &&
                    (() => {
                      const { bg, border, text } = getModelBadgeStyle(
                        prompt.modelName,
                      );
                      return (
                        <span
                          style={{
                            position: "absolute",
                            top: 9,
                            left: 9,
                            padding: "4px 9px",
                            borderRadius: 20,
                            background: bg,
                            border: `1px solid ${border}`,
                            fontSize: 10,
                            fontWeight: 700,
                            color: text,
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                          }}
                        >
                          {prompt.modelName}
                        </span>
                      );
                    })()}
                  <span style={{ fontSize: 44, lineHeight: 1 }}>{emoji}</span>
                  {prompt.parentPromptId && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: 8,
                        right: 9,
                        padding: "2px 7px",
                        borderRadius: 4,
                        background: "var(--accent-dim)",
                        border: "1px solid var(--accent-border)",
                        fontSize: 10,
                        color: "var(--accent)",
                        fontWeight: 600,
                      }}
                    >
                      <GitFork
                        size={10}
                        style={{ verticalAlign: "middle", marginRight: 2 }}
                      />
                      Fork
                    </span>
                  )}
                  <button
                    onClick={(e) => toggleScrap(e, prompt)}
                    style={
                      {
                        position: "absolute",
                        top: 9,
                        right: 9,
                        width: 28,
                        height: 28,
                        backdropFilter: "blur(8px)",
                        border: `1px solid ${prompt.isScrapped ? "var(--accent-border)" : "var(--border)"}`,
                        borderRadius: 7,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontSize: 13,
                        color: prompt.isScrapped
                          ? "var(--accent)"
                          : "var(--text-muted)",
                        background: prompt.isScrapped
                          ? "var(--accent-dim)"
                          : "rgba(255,255,255,0.75)",
                        transition: "all .15s",
                      } as React.CSSProperties
                    }
                  >
                    {prompt.isScrapped ? "♥" : "♡"}
                  </button>
                </div>
                <div
                  style={{
                    padding: "13px 15px",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 7,
                  }}
                >
                  {prompt.category && (
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: ".7px",
                        textTransform: "uppercase",
                        color: "var(--accent)",
                      }}
                    >
                      {prompt.category.name}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      lineHeight: 1.45,
                      color: "var(--text)",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {prompt.title}
                  </div>
                  {prompt.description && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        lineHeight: 1.55,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {prompt.description}
                    </div>
                  )}
                  <div
                    style={{
                      marginTop: "auto",
                      paddingTop: 10,
                      borderTop: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 12,
                        color: "var(--text-muted)",
                      }}
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: "var(--accent)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#fff",
                          flexShrink: 0,
                        }}
                      >
                        {prompt.author.nickname[0].toUpperCase()}
                      </div>
                      {prompt.author.nickname}
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <span
                        style={{ fontSize: 11, color: "var(--text-muted)" }}
                      >
                        ♡ {prompt.scrapCount}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 2,
                        }}
                      >
                        <GitFork size={11} />
                        {prompt.forkCount}
                      </span>
                      <span
                        style={{ fontSize: 11, color: "var(--text-muted)" }}
                      >
                        v{prompt.currentVersionNo}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {hasMore && !loading && (
        <div style={{ textAlign: "center", marginTop: 36 }}>
          <button
            onClick={loadMore}
            className="btn-secondary"
            style={{ padding: "11px 28px" }}
          >
            ↓ 더 보기
          </button>
        </div>
      )}

      <Link
        href="/about"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 100,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 14px",
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: "var(--surface)",
          color: "var(--text-dim)",
          fontSize: 13,
          fontWeight: 500,
          textDecoration: "none",
          fontFamily: "inherit",
          transition: "all .15s",
          boxShadow: "0 4px 20px rgba(0,0,0,.12)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--border-hover)";
          e.currentTarget.style.color = "var(--text)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.color = "var(--text-dim)";
        }}
      >
        📖 사용법 가이드
      </Link>
    </div>
  );
}
