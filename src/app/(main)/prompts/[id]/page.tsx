// src/app/(main)/prompts/[id]/page.tsx
import PromptDetail from "@/features/prompts/components/prompt-detail";

export default async function PromptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PromptDetail id={id} />;
}
