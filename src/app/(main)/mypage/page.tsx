"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";

interface MyPrompt {
  id: string;
  title: string;
  description: string | null;
  currentVersionNo: number;
  scrapCount: number;
  forkCount: number;
  isPublic: boolean;
  parentPromptId: string | null;
  createdAt: string;
  category: { name: string; slug: string } | null;
}

interface ScrapItem {
  scrapCreatedAt: string;
  prompt: {
    id: string;
    title: string;
    currentVersionNo: number;
    scrapCount: number;
    forkCount: number;
    createdAt: string;
  };
  category: { name: string } | null;
  author: { nickname: string };
}

interface UserInfo {
  id: string;
  email: string;
  nickname: string;
  role: string;
  avatarUrl: string | null;
  createdAt: string;
  promptCount: number;
  scrapCount: number;
}

export default function MypagePage() {
  const router = useRouter();
  const { user, authFetch, logout, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<"written" | "scraps" | "profile">("written");
  const [myPrompts, setMyPrompts] = useState<MyPrompt[]>([]);
  const [scraps, setScraps] = useState<ScrapItem[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [scrapCategory, setScrapCategory] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    async function load() {
      const [info, mp, sc] = await Promise.all([
        authFetch("/api/me").then((r) => r.json()),
        authFetch("/api/me/prompts?limit=20").then((r) => r.json()),
        authFetch("/api/me/scraps?limit=20").then((r) => r.json()),
      ]);
      setUserInfo(info);
      setNickname(info.nickname ?? "");
      setMyPrompts(mp.data ?? []);
      setScraps(sc.data ?? []);
      setLoading(false);
    }
    load();
  }, [authLoading, user, authFetch, router]);

  async function handleDelete() {
    if (!deleteTargetId) return;
    setDeleting(true);
    await authFetch(`/api/prompts/${deleteTargetId}`, { method: "DELETE" });
    setMyPrompts((prev) => prev.filter((p) => p.id !== deleteTargetId));
    setDeleteTargetId(null);
    setDeleting(false);
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    await authFetch("/api/me", {
      method: "PATCH",
      body: JSON.stringify({ nickname }),
    });
    setProfileMsg("저장되었습니다!");
    setProfileSaving(false);
    setTimeout(() => setProfileMsg(""), 2000);
  }

  if (!user || loading)
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

  const initials = userInfo?.nickname?.[0]?.toUpperCase() ?? "?";

  return (
    <div style={{ paddingTop: 60 }}>
      <div
        style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 36px 80px" }}
      >
        {/* Profile card */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 18,
            padding: 28,
            marginBottom: 28,
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "linear-gradient(135deg,var(--accent),#ff6b35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Syne',sans-serif",
              fontSize: 28,
              fontWeight: 800,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: "'Syne',sans-serif",
                fontWeight: 800,
                fontSize: 22,
                letterSpacing: "-.5px",
                color: "var(--text)",
                marginBottom: 4,
              }}
            >
              {userInfo?.nickname}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                marginBottom: 10,
              }}
            >
              {userInfo?.email} · 가입{" "}
              {userInfo?.createdAt
                ? new Date(userInfo.createdAt).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })
                : ""}
            </div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {[
                ["프롬프트", userInfo?.promptCount ?? 0],
                ["스크랩한 글", userInfo?.scrapCount ?? 0],
              ].map(([label, num]) => (
                <div
                  key={String(label)}
                  style={{ display: "flex", flexDirection: "column", gap: 1 }}
                >
                  <span
                    style={{
                      fontFamily: "'Syne',sans-serif",
                      fontSize: 16,
                      fontWeight: 700,
                      color: "var(--text)",
                    }}
                  >
                    {num}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 4,
            marginBottom: 24,
            width: "fit-content",
          }}
        >
          {(
            [
              ["written", "📝 내가 쓴 프롬프트", userInfo?.promptCount ?? 0],
              ["scraps", "♡ 스크랩", userInfo?.scrapCount ?? 0],
              ["profile", "⚙️ 계정 설정", null],
            ] as const
          ).map(([key, label, count]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                border: "none",
                background: tab === key ? "var(--surface2)" : "none",
                color: tab === key ? "var(--text)" : "var(--text-muted)",
                fontSize: 13,
                fontWeight: tab === key ? 600 : 500,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all .15s",
              }}
            >
              {label}
              {count !== null && (
                <span
                  style={{
                    marginLeft: 4,
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    padding: "1px 7px",
                    borderRadius: 10,
                    fontSize: 11,
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab: My Prompts */}
        {tab === "written" && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                총{" "}
                <strong style={{ color: "var(--text)", fontWeight: 600 }}>
                  {myPrompts.length}
                </strong>
                개
              </span>
              <button
                className="btn-primary"
                style={{ fontSize: 12, padding: "7px 14px" }}
                onClick={() => router.push("/prompts/new")}
              >
                + 새 프롬프트
              </button>
            </div>
            {myPrompts.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: 60,
                  color: "var(--text-muted)",
                  fontSize: 14,
                }}
              >
                아직 작성한 프롬프트가 없습니다.{" "}
                <span
                  style={{ color: "var(--accent)", cursor: "pointer" }}
                  onClick={() => router.push("/prompts/new")}
                >
                  첫 프롬프트를 등록해보세요!
                </span>
              </div>
            ) : (
              myPrompts.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: 14,
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    marginBottom: 8,
                    cursor: "pointer",
                    transition: "all .15s",
                  }}
                  onClick={() => router.push(`/prompts/${p.id}`)}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "var(--accent-border)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = "var(--border)")
                  }
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                      background: "var(--surface2)",
                      flexShrink: 0,
                    }}
                  >
                    ✨
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text)",
                        marginBottom: 3,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.title}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        display: "flex",
                        gap: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      {p.category && <span>{p.category.name}</span>}
                      <span>v{p.currentVersionNo}</span>
                      <span>♡ {p.scrapCount}</span>
                      <span>🔀 {p.forkCount}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/prompts/${p.id}/edit`);
                      }}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 7,
                        border: "1px solid var(--border)",
                        background: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        fontSize: 13,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTargetId(p.id);
                      }}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 7,
                        border: "1px solid var(--red-border)",
                        background: "none",
                        color: "var(--red)",
                        cursor: "pointer",
                        fontSize: 13,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Scraps */}
        {tab === "scraps" && (() => {
          const cats = Array.from(new Set(scraps.map((s) => s.category?.name).filter(Boolean))) as string[];
          const filtered = scrapCategory ? scraps.filter((s) => s.category?.name === scrapCategory) : scraps;
          return (
            <div>
              {scraps.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)", fontSize: 14 }}>스크랩한 프롬프트가 없습니다.</div>
              ) : (
                <>
                  {/* 카테고리 필터 */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                    {[{ label: `전체 ${scraps.length}`, value: null }, ...cats.map((c) => ({ label: `${c} ${scraps.filter((s) => s.category?.name === c).length}`, value: c }))].map(({ label, value }) => (
                      <button key={String(value)} onClick={() => setScrapCategory(value)} style={{ padding: "5px 14px", borderRadius: 20, border: "1px solid", fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "all .15s", background: scrapCategory === value ? "var(--accent)" : "none", color: scrapCategory === value ? "#fff" : "var(--text-muted)", borderColor: scrapCategory === value ? "var(--accent)" : "var(--border)", fontWeight: scrapCategory === value ? 600 : 400 }}>{label}</button>
                    ))}
                  </div>
                  {/* 목록 */}
                  {filtered.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)", fontSize: 14 }}>해당 카테고리에 스크랩한 프롬프트가 없습니다.</div>
                  ) : filtered.map((s) => (
                    <div key={s.prompt.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, marginBottom: 8, cursor: "pointer", transition: "all .15s" }}
                      onClick={() => router.push(`/prompts/${s.prompt.id}`)}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent-border)")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, background: "var(--surface2)", flexShrink: 0 }}>♡</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.prompt.title}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", gap: 12, flexWrap: "wrap" }}>
                          {s.category && <span>{s.category.name}</span>}
                          <span>by {s.author.nickname}</span>
                          <span>v{s.prompt.currentVersionNo}</span>
                          <span>♡ {s.prompt.scrapCount}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          );
        })()}

        {/* Tab: Profile */}
        {tab === "profile" && (
          <div style={{ maxWidth: 600 }}>
            <form onSubmit={handleProfileSave}>
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
                  프로필 수정
                </div>
                {/* Avatar preview */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: 18,
                    background: "var(--surface2)",
                    borderRadius: 12,
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      background:
                        "linear-gradient(135deg,var(--accent),#ff6b35)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "'Syne',sans-serif",
                      fontSize: 22,
                      fontWeight: 800,
                      color: "#fff",
                    }}
                  >
                    {nickname[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text)",
                        marginBottom: 2,
                      }}
                    >
                      {nickname}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {userInfo?.email}
                    </div>
                  </div>
                </div>
                <div style={{ marginBottom: 0 }}>
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
                    닉네임
                  </label>
                  <input
                    className="form-input"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    required
                    minLength={2}
                    maxLength={20}
                  />
                </div>
              </div>
              {profileMsg && (
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--green)",
                    marginBottom: 12,
                    padding: "8px 12px",
                    background: "var(--green-dim)",
                    border: "1px solid var(--green-border)",
                    borderRadius: 8,
                  }}
                >
                  {profileMsg}
                </div>
              )}
              <button
                type="submit"
                className="btn-primary"
                disabled={profileSaving}
                style={{ fontSize: 14, padding: "9px 22px" }}
              >
                {profileSaving ? "저장 중..." : "저장하기"}
              </button>
            </form>
            <div style={{ marginTop: 20 }}>
              <button
                className="btn-danger"
                onClick={() => {
                  logout();
                  router.push("/");
                }}
                style={{ fontSize: 13 }}
              >
                로그아웃
              </button>
            </div>
          </div>
        )}
      </div>

      {deleteTargetId && (
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
          onClick={() => setDeleteTargetId(null)}
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
                onClick={() => setDeleteTargetId(null)}
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
