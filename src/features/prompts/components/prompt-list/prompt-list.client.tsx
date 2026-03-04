"use client";
// src/features/prompts/components/prompt-list/prompt-list.client.tsx
// Client Component: 검색·필터·스크랩 인터랙션 담당

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";

interface Category { id: number; name: string; slug: string; }

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
  categories: Category[];
  initialQ: string;
  initialCategory: string;
  initialSort: string;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  illustration: "🎨", dev: "💻", advice: "💬", travel: "✈️",
};
const BG_COLORS: Record<string, string> = {
  illustration: "#f5eef8", dev: "#eef5f0", advice: "#fdf6ec", travel: "#eef3fb", default: "#f0eeeb",
};

export default function PromptListClient({
  initialPrompts,
  categories,
  initialQ,
  initialCategory,
  initialSort,
}: Props) {
  const router = useRouter();
  const { user, authFetch } = useAuth();

  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts);
  const [q, setQ] = useState(initialQ);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState(initialSort);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialPrompts.length === 12);

  const fetchPrompts = useCallback(
    async (nextQ: string, nextCat: string, nextSort: string, nextPage: number, reset: boolean) => {
      setLoading(true);
      const params = new URLSearchParams({ sort: nextSort, page: String(nextPage), limit: "12" });
      if (nextQ) params.set("q", nextQ);
      if (nextCat) params.set("category", nextCat);
      const res = await authFetch(`/api/prompts?${params}`);
      const data = await res.json();
      const rows: Prompt[] = data.data ?? [];
      if (reset) setPrompts(rows);
      else setPrompts((prev) => [...prev, ...rows]);
      setHasMore(rows.length === 12);
      setLoading(false);
    },
    [authFetch]
  );

  function handleFilter(newQ: string, newCat: string, newSort: string) {
    setQ(newQ); setCategory(newCat); setSort(newSort); setPage(1);
    fetchPrompts(newQ, newCat, newSort, 1, true);
  }

  function loadMore() {
    const next = page + 1;
    setPage(next);
    fetchPrompts(q, category, sort, next, false);
  }

  async function toggleScrap(e: React.MouseEvent, prompt: Prompt) {
    e.stopPropagation();
    if (!user) { router.push("/login"); return; }
    const method = prompt.isScrapped ? "DELETE" : "POST";
    await authFetch(`/api/prompts/${prompt.id}/scrap`, { method });
    setPrompts((prev) =>
      prev.map((p) =>
        p.id === prompt.id
          ? { ...p, isScrapped: !p.isScrapped, scrapCount: p.scrapCount + (p.isScrapped ? -1 : 1) }
          : p
      )
    );
  }

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 36px" }}>
      {/* Filters row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <svg style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", opacity: 0.3, pointerEvents: "none" }} width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx={11} cy={11} r={8} /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            className="form-input"
            style={{ paddingLeft: 40 }}
            placeholder="프롬프트 검색..."
            value={q}
            onChange={(e) => handleFilter(e.target.value, category, sort)}
          />
        </div>
        <select className="form-select" style={{ width: "auto", paddingRight: 36, paddingLeft: 14 }} value={sort} onChange={(e) => handleFilter(q, category, e.target.value)}>
          <option value="latest">최신순</option>
          <option value="views">조회수순</option>
          <option value="scraps">스크랩순</option>
          <option value="forks">Fork순</option>
        </select>
      </div>

      {/* Category chips */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
        {[{ slug: "", name: "전체" }, ...categories].map((cat) => (
          <button
            key={cat.slug}
            onClick={() => handleFilter(q, cat.slug === category ? "" : cat.slug, sort)}
            style={{
              padding: "5px 12px", borderRadius: 20, border: "1px solid", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
              background: category === cat.slug ? "var(--accent-dim)" : "none",
              borderColor: category === cat.slug ? "var(--accent-border)" : "var(--border)",
              color: category === cat.slug ? "var(--accent)" : "var(--text-muted)",
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 16, fontSize: 13, color: "var(--text-muted)" }}>
        총 <strong style={{ color: "var(--text)" }}>{prompts.length}</strong>건
      </div>

      {/* Cards grid */}
      {loading && prompts.length === 0 ? (
        <div style={{ textAlign: "center", padding: 80, color: "var(--text-muted)" }}>불러오는 중...</div>
      ) : prompts.length === 0 ? (
        <div style={{ textAlign: "center", padding: 80, color: "var(--text-muted)" }}>
          프롬프트가 없습니다.{" "}
          <span style={{ color: "var(--accent)", cursor: "pointer" }} onClick={() => router.push("/prompts/new")}>
            첫 프롬프트를 등록해보세요!
          </span>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: 14 }}>
          {prompts.map((prompt, i) => {
            const emoji = CATEGORY_EMOJIS[prompt.category?.slug ?? ""] ?? "✨";
            const bg = BG_COLORS[prompt.category?.slug ?? ""] ?? BG_COLORS.default;
            return (
              <div
                key={prompt.id}
                className="ph-card animate-fade-up"
                style={{ animationDelay: `${Math.min(i, 8) * 0.04}s`, opacity: 0 }}
                onClick={() => router.push(`/prompts/${prompt.id}`)}
              >
                <div style={{ height: 118, position: "relative", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: bg }}>
                  <span style={{ fontSize: 44, lineHeight: 1 }}>{emoji}</span>
                  {prompt.parentPromptId && (
                    <span style={{ position: "absolute", bottom: 8, right: 9, padding: "2px 7px", borderRadius: 4, background: "var(--accent-dim)", border: "1px solid var(--accent-border)", fontSize: 10, color: "var(--accent)", fontWeight: 600 }}>🔀 Fork</span>
                  )}
                  <button
                    onClick={(e) => toggleScrap(e, prompt)}
                    style={{ position: "absolute", top: 9, right: 9, width: 28, height: 28, backdropFilter: "blur(8px)", border: `1px solid ${prompt.isScrapped ? "var(--accent-border)" : "var(--border)"}`, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 13, color: prompt.isScrapped ? "var(--accent)" : "var(--text-muted)", background: prompt.isScrapped ? "var(--accent-dim)" : "rgba(255,255,255,0.75)", transition: "all .15s" } as React.CSSProperties}
                  >
                    {prompt.isScrapped ? "♥" : "♡"}
                  </button>
                </div>
                <div style={{ padding: "13px 15px", flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
                  {prompt.category && (
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".7px", textTransform: "uppercase", color: "var(--accent)" }}>{prompt.category.name}</div>
                  )}
                  <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.45, color: "var(--text)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {prompt.title}
                  </div>
                  {prompt.description && (
                    <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {prompt.description}
                    </div>
                  )}
                  <div style={{ marginTop: "auto", paddingTop: 10, borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                        {prompt.author.nickname[0].toUpperCase()}
                      </div>
                      {prompt.author.nickname}
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>♡ {prompt.scrapCount}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>🔀 {prompt.forkCount}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>v{prompt.currentVersionNo}</span>
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
          <button onClick={loadMore} className="btn-secondary" style={{ padding: "11px 28px" }}>↓ 더 보기</button>
        </div>
      )}
    </div>
  );
}
