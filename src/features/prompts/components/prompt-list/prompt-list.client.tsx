"use client";
// src/features/prompts/components/prompt-list/prompt-list.client.tsx
// Client Component: 검색·필터·스크랩 인터랙션 담당

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Prompt {
  id: string;
  title: string;
  description: string | null;
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
  illustration: "🎨",
  development: "💻",
  "problem-solving": "💬",
  travel: "✈️",
};
const CATEGORY_GRADIENTS: Record<string, string> = {
  illustration: "linear-gradient(135deg,rgb(255, 255, 255) 0%,rgb(255, 255, 255) 100%)",
  development: "linear-gradient(135deg,rgb(255, 255, 255) 0%,rgb(255, 255, 255) 100%)",
  "problem-solving": "linear-gradient(135deg,rgb(255, 255, 255) 0%,rgb(236, 248, 246) 100%)",
  travel: "linear-gradient(135deg,rgb(255, 255, 255) 0%,rgb(255, 255, 255) 100%)",
  default: "linear-gradient(135deg,rgb(255, 255, 255) 0%,rgb(255, 255, 255) 100%)",
};
const CATEGORY_DESCS: Record<string, string> = {
  illustration: "이미지·그래픽",
  development: "코딩·기술",
  "problem-solving": "고민·상담",
  travel: "여행·탐방",
  "": "모든 프롬프트",
};
const BG_COLORS: Record<string, string> = {
  illustration: "#f5eef8",
  development: "#eef5f0",
  "problem-solving": "#fdf6ec",
  travel: "#eef3fb",
  default: "#f0eeeb",
};

export default function PromptListClient({
  initialPrompts,
  initialTotal,
  categories,
  initialQ,
  initialCategory,
  initialSort,
}: Props) {
  const router = useRouter();
  const { user, authFetch } = useAuth();

  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts);
  const [totalCount, setTotalCount] = useState(initialTotal);
  const [q, setQ] = useState(initialQ);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState(initialSort);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialPrompts.length === 12);

  // 상세 페이지에서 뒤로가기 시 스크랩 등 최신 데이터로 목록 갱신
  useEffect(() => {
    const fromDetail = typeof window !== "undefined" && sessionStorage.getItem("prompt-detail-from-list");
    if (fromDetail) {
      sessionStorage.removeItem("prompt-detail-from-list");
      router.refresh();
    }
  }, [router]);

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
    const method = prompt.isScrapped ? "DELETE" : "POST";
    await authFetch(`/api/prompts/${prompt.id}/scrap`, { method });
    setPrompts((prev) =>
      prev.map((p) =>
        p.id === prompt.id
          ? {
              ...p,
              isScrapped: !p.isScrapped,
              scrapCount: p.scrapCount + (p.isScrapped ? -1 : 1),
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

      {/* Category Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${allCategories.length}, 1fr)`,
          gap: 10,
          marginBottom: 24,
        }}
      >
        {allCategories.map((cat) => {
          const isActive = category === cat.slug;
          const gradient = CATEGORY_GRADIENTS[cat.slug] ?? CATEGORY_GRADIENTS.default;
          const emoji = CATEGORY_EMOJIS[cat.slug] ?? "✨";
          const desc = CATEGORY_DESCS[cat.slug] ?? "";
          return (
            <button
              key={cat.slug}
              onClick={() =>
                handleFilter(q, cat.slug === category ? "" : cat.slug, sort)
              }
              style={{
                position: "relative",
                padding: "14px 12px 12px",
                borderRadius: 14,
                border: `2px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "inherit",
                background: isActive
                  ? "var(--accent-dim)"
                  : "var(--surface)",
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
                  e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.08)";
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
            const emoji = CATEGORY_EMOJIS[prompt.category?.slug ?? ""] ?? "✨";
            const bg =
              BG_COLORS[prompt.category?.slug ?? ""] ?? BG_COLORS.default;
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
                    sessionStorage.setItem(`prompt-scrap-${prompt.id}`, String(prompt.isScrapped));
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
                      🔀 Fork
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
                        style={{ fontSize: 11, color: "var(--text-muted)" }}
                      >
                        🔀 {prompt.forkCount}
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
    </div>
  );
}
