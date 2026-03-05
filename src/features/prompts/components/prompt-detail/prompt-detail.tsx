// src/features/prompts/components/prompt-detail/prompt-detail.tsx
// Server Component: 프롬프트 상세 데이터 fetch 후 Client에 전달

import PromptDetailClient from "./prompt-detail.client";
import { notFound } from "next/navigation";

export default async function PromptDetail({ id }: { id: string }) {
  // SSR 내부 호출은 항상 http://127.0.0.1:3000 사용
  const baseUrl = "http://127.0.0.1:3000";

  const [promptRes, versionsRes] = await Promise.all([
    fetch(`${baseUrl}/api/prompts/${id}`, { cache: "no-store" }),
    fetch(`${baseUrl}/api/prompts/${id}/versions`, { cache: "no-store" }),
  ]);

  if (!promptRes.ok) notFound();

  const prompt = await promptRes.json();
  if (prompt.error) notFound();

  const { data: versions } = await versionsRes.json();

  return <PromptDetailClient prompt={prompt} versions={versions ?? []} />;
}
