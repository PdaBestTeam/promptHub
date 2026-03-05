"use client";

import { useState, useRef, useEffect } from "react";

type AIItem = { name: string; subtitle: string; url: string; emoji: string };

const GROUP_1: AIItem[] = [
  { name: "ChatGPT", subtitle: "OpenAI 텍스트 생성", url: "https://chat.openai.com", emoji: "🤖" },
  { name: "Claude", subtitle: "Anthropic AI 어시스턴트", url: "https://claude.ai", emoji: "🧠" },
  { name: "Gemini", subtitle: "Google AI 모델", url: "https://gemini.google.com", emoji: "✨" },
  { name: "Perplexity", subtitle: "AI 검색 엔진", url: "https://perplexity.ai", emoji: "🔍" },
];

const GROUP_2: AIItem[] = [
  { name: "Midjourney", subtitle: "AI 이미지 생성", url: "https://www.midjourney.com", emoji: "🎨" },
  { name: "DALL-E 3", subtitle: "OpenAI 이미지 생성", url: "https://chat.openai.com", emoji: "🖼️" },
  { name: "Stable Diffusion", subtitle: "오픈소스 이미지 AI", url: "https://stability.ai", emoji: "⚡" },
];

const GROUP_3: AIItem[] = [
  { name: "Copilot", subtitle: "Microsoft AI", url: "https://copilot.microsoft.com", emoji: "🪟" },
  { name: "Notion AI", subtitle: "문서·정리 자동화", url: "https://notion.so", emoji: "📝" },
];

function ItemRow({ item }: { item: AIItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        borderRadius: 10,
        textDecoration: "none",
        color: "inherit",
        fontFamily: "inherit",
        transition: "background .15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--surface2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: "var(--surface2)",
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          flexShrink: 0,
        }}
      >
        {item.emoji}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>
          {item.name}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
          {item.subtitle}
        </div>
      </div>
    </a>
  );
}

export default function GenerativeAIModal() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="btn-ghost"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "9px 16px",
          borderRadius: 9,
          border: "1px solid var(--border)",
          background: open ? "var(--surface2)" : "var(--surface)",
          color: "var(--text-dim)",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "inherit",
          transition: "all .15s",
        }}
        onMouseEnter={(e) => {
          if (!open) {
            e.currentTarget.style.borderColor = "var(--border-hover)";
            e.currentTarget.style.color = "var(--text)";
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--text-dim)";
          }
        }}
      >
        ✨ 생성형 AI
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: 6,
            width: 320,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: "8px 0",
            boxShadow: "0 12px 40px rgba(0,0,0,.15)",
            zIndex: 500,
          }}
        >
          {GROUP_1.map((item) => (
            <ItemRow key={item.url} item={item} />
          ))}
          <div
            style={{
              height: 1,
              background: "var(--border)",
              margin: "4px 12px",
            }}
          />
          {GROUP_2.map((item) => (
            <ItemRow key={item.url} item={item} />
          ))}
          <div
            style={{
              height: 1,
              background: "var(--border)",
              margin: "4px 12px",
            }}
          />
          {GROUP_3.map((item) => (
            <ItemRow key={item.url} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
