// src/app/(main)/page.tsx
import PromptList from "@/features/prompts/components/prompt-list";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}) {
  const { q = "", category = "", sort = "latest" } = await searchParams;
  return (
    <div style={{ paddingTop: 80, paddingBottom: 80 }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 36px 28px" }}>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(28px,3.5vw,42px)", letterSpacing: "-1.5px", color: "#fff", marginBottom: 6 }}>
          프롬프트 탐색
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 0 }}>
          검증된 프롬프트를 찾고, Fork하고, 발전시키세요.
        </p>
      </div>
      <PromptList q={q} category={category} sort={sort} />
    </div>
  );
}
