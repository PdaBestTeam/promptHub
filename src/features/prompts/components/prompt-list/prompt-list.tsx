// src/features/prompts/components/prompt-list/prompt-list.tsx
// Server Component: 데이터 fetch 후 Client Component에 전달

import PromptListClient from "./prompt-list.client";
import { cookies, headers } from "next/headers";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface SearchProps {
  q?: string;
  category?: string;
  sort?: string;
}

export default async function PromptList({ q = "", category = "", sort = "latest" }: SearchProps) {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const baseUrl = `${protocol}://${host}`;

  const params = new URLSearchParams({ sort, limit: "12" });
  if (q) params.set("q", q);
  if (category) params.set("category", category);

  // Fetch prompts (public, no auth token needed for initial SSR)
  const [promptsRes, catsRes] = await Promise.all([
    fetch(`${baseUrl}/api/prompts?${params}`, { cache: "no-store" }),
    fetch(`${baseUrl}/api/categories`, { cache: "force-cache" }),
  ]);

  const promptsData = await promptsRes.json();
  const catsData = await catsRes.json();

  return (
    <PromptListClient
      initialPrompts={promptsData.data ?? []}
      initialTotal={promptsData.total ?? 0}
      categories={catsData.data ?? []}
      initialQ={q}
      initialCategory={category}
      initialSort={sort}
    />
  );
}
