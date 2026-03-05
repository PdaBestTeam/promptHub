"use client";
// src/components/ui/OnboardingModal.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "ph_onboarded";

const slides = [
  {
    emoji: "✨",
    title: "PromptHub에 오신 것을 환영해요!",
    desc: "다양한 AI 프롬프트를 탐색하고, 원하는 프롬프트를 찾아 즉시 사용해보세요. 개발, 일러스트, 고민해결, 여행 등 다양한 카테고리의 검증된 프롬프트가 준비되어 있어요.",
    color: "linear-gradient(135deg, #ff9154 0%, #ffb347 100%)",
  },
  {
    emoji: "🔖",
    title: "프롬프트 탐색 & 스크랩",
    desc: "카테고리별·정렬 순서로 원하는 프롬프트를 빠르게 찾아보세요. 마음에 드는 프롬프트는 ♡ 버튼으로 스크랩해두면 마이페이지에서 언제든 확인할 수 있어요.",
    color: "linear-gradient(135deg, #9c4dcc 0%, #c880ff 100%)",
  },
  {
    emoji: "🔀",
    title: "Fork로 나만의 프롬프트 만들기",
    desc: "마음에 드는 프롬프트를 Fork하여 나만의 방식으로 개선해보세요. 버전 관리 기능으로 수정 이력도 체계적으로 관리할 수 있어요.",
    color: "linear-gradient(135deg, #0e9272 0%, #34d399 100%)",
  },
];

export default function OnboardingModal() {
  const router = useRouter();
  const [visible, setVisible] = useState(() => !localStorage.getItem(STORAGE_KEY));
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);

  function handleClose() {
    setExiting(true);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, "1");
      setVisible(false);
      setExiting(false);
    }, 300);
  }

  function handleNext() {
    if (step < slides.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleClose();
    }
  }

  function handleGoAbout() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
    router.push("/about");
  }

  if (!visible) return null;

  const s = slides[step];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(6px)",
        animation: exiting
          ? "pgOut .3s ease forwards"
          : "pgIn .3s ease forwards",
      }}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 24,
          maxWidth: 480,
          width: "calc(100% - 40px)",
          overflow: "hidden",
          boxShadow: "0 40px 100px rgba(0,0,0,0.5)",
          animation: exiting
            ? "slideDown .3s ease forwards"
            : "slideUp .3s ease forwards",
        }}
      >
        {/* Hero area */}
        <div
          style={{
            background: s.color,
            height: 180,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 80,
            transition: "background 0.4s ease",
          }}
        >
          <span
            style={{
              filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.2))",
              animation: "heroFloat 2.5s ease-in-out infinite",
            }}
          >
            {s.emoji}
          </span>
        </div>

        {/* Content */}
        <div style={{ padding: "28px 32px 32px" }}>
          <h2
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: 20,
              letterSpacing: "-0.5px",
              color: "var(--text)",
              marginBottom: 10,
              lineHeight: 1.3,
            }}
          >
            {s.title}
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-dim)",
              lineHeight: 1.75,
              marginBottom: 28,
            }}
          >
            {s.desc}
          </p>

          {/* Step dots */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 24,
            }}
          >
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                style={{
                  width: i === step ? 22 : 7,
                  height: 7,
                  borderRadius: 4,
                  border: "none",
                  background: i === step ? "var(--accent)" : "var(--border)",
                  cursor: "pointer",
                  padding: 0,
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleGoAbout}
              className="btn-ghost"
              style={{ flex: 1, padding: "12px 0", fontSize: 14 }}
            >
              소개 보기
            </button>
            <button
              onClick={handleClose}
              className="btn-ghost"
              style={{ flex: 1, padding: "12px 0", fontSize: 14 }}
            >
              건너뛰기
            </button>
            <button
              onClick={handleNext}
              className="btn-primary"
              style={{ flex: 2, padding: "12px 0", fontSize: 14 }}
            >
              {step < slides.length - 1 ? "다음 →" : "🚀 시작하기"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideDown {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(10px) scale(0.97); }
        }
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes pgOut {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
