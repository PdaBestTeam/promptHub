// src/features/prompts/components/prompt-detail/prompt-detail.tsx
// Server Component: 프롬프트 상세 데이터 fetch 후 Client에 전달

import { headers } from "next/headers";
import PromptDetailClient from "./prompt-detail.client";
import { notFound } from "next/navigation";

export default async function PromptDetail({ id }: { id: string }) {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const baseUrl = `${protocol}://${host}`;

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
