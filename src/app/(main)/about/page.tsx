"use client";

type Section = {
  id: string;
  title: string;
  body: string[];
  bullets?: string[];
};

const sections: Section[] = [
  {
    id: "intro",
    title: "PromptHub란?",
    body: [
      "최근 ChatGPT, Claude, Gemini와 같은 생성형 AI 서비스의 사용이 빠르게 증가하면서, 좋은 프롬프트(prompt)를 찾고 이를 자신의 상황에 맞게 수정하여 활용하려는 수요도 함께 늘어나고 있습니다.",
      "하지만 실제로는 프롬프트가 여러 웹사이트와 커뮤니티에 흩어져 있어 찾기 어렵고, 복사해서 사용하다 보면 원본을 알기 어렵고, 여러 번 수정하다 보면 어떤 버전이 가장 좋은지 관리하기 어렵습니다.",
      "PromptHub는 이러한 문제를 해결하기 위해 만들어진 프롬프트 공유 및 버전 관리 플랫폼입니다.",
      "사용자는 PromptHub에서 다양한 프롬프트를 탐색하고, 마음에 드는 프롬프트를 Fork하여 자신의 버전으로 수정하고 발전시킬 수 있습니다. 또한 프롬프트의 수정 과정은 버전 히스토리로 관리되어 어떤 과정으로 발전했는지 쉽게 확인할 수 있습니다.",
      "PromptHub는 단순히 프롬프트를 저장하는 공간이 아니라, 프롬프트를 공유하고 발전시키는 협업 공간을 목표로 합니다.",
    ],
  },
  {
    id: "why",
    title: "왜 PromptHub가 필요한가?",
    body: [
      "프롬프트는 일반적인 글이나 게시물과 달리 계속 수정되고 발전하는 데이터입니다.",
      "예를 들어 하나의 프롬프트는 다음처럼 발전할 수 있습니다.",
    ],
    bullets: [
      'v1: "친절한 톤으로 설명해줘"',
      'v2: "중학생도 이해할 수 있도록 예시를 포함해서 설명해줘"',
      'v3: "표와 예시를 함께 사용해서 단계별로 설명해줘"',
      "기존 방식에서는 수정할 때마다 이전 버전이 사라지고, 변경 기록이 남지 않으며, 다른 사람의 개선 내용을 활용하기 어렵습니다.",
      "PromptHub는 이러한 문제를 해결하기 위해 Git과 유사한 방식의 버전 관리 개념을 프롬프트에 적용했습니다.",
    ],
  },
  {
    id: "features",
    title: "주요 기능",
    body: [
      "PromptHub에서는 카테고리 탐색(일러스트, 개발, 고민해결, 여행 등), 검색, 정렬 기능을 통해 원하는 프롬프트를 쉽게 찾을 수 있습니다.",
      "프롬프트 목록은 카드 형태로 표시되며 최신순, 조회순, 스크랩순, Fork순으로 정렬할 수 있습니다. 카드를 클릭하면 상세 페이지에서 더 많은 정보를 확인할 수 있습니다.",
      "핵심 기능은 Fork와 버전 히스토리입니다. 다른 사람이 만든 프롬프트를 Fork해 내 프롬프트로 복사한 뒤 수정할 때마다 버전 번호가 자동으로 증가합니다.",
      "버전 히스토리에서는 어떤 프롬프트에서 시작되었는지, 어떤 과정으로 수정되었는지, 이전 버전의 내용을 확인할 수 있어 발전 과정을 체계적으로 관리할 수 있습니다.",
      "또한 PromptHub에서 복사한 프롬프트를 ChatGPT, Claude, Gemini 같은 생성형 AI 서비스에서 바로 활용할 수 있습니다.",
      "마음에 드는 프롬프트는 스크랩해 마이페이지에서 다시 확인할 수 있고, 직접 작성한 프롬프트를 등록해 다른 사용자와 공유할 수도 있습니다.",
      "마이페이지에서는 내가 작성한 프롬프트, 스크랩한 프롬프트, 계정 정보를 한 곳에서 관리할 수 있습니다.",
    ],
  },
  {
    id: "goal",
    title: "PromptHub의 목표",
    body: [
      "PromptHub의 목표는 단순한 프롬프트 저장 서비스가 아니라, 프롬프트를 공유하고 발전시키는 플랫폼이 되는 것입니다.",
      "사용자들이 만든 프롬프트가 다른 사용자에게 영감을 주고, Fork와 수정 과정을 통해 더 좋은 프롬프트로 발전하는 생태계를 만드는 것이 궁극적인 목표입니다.",
    ],
  },
];

export default function AboutPage() {
  return (
    <main
      style={{
        paddingTop: 60,
        background:
          "radial-gradient(circle at 10% 10%, var(--accent-dim), transparent 36%), radial-gradient(circle at 90% 20%, var(--green-dim), transparent 28%), var(--bg)",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 60,
          zIndex: 30,
          background: "color-mix(in oklab, var(--bg) 82%, transparent)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <nav
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            display: "flex",
            gap: 10,
            overflowX: "auto",
            padding: "14px 16px",
          }}
        >
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              style={{
                whiteSpace: "nowrap",
                textDecoration: "none",
                border: "1px solid var(--border)",
                borderRadius: 999,
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: ".2px",
                color: "var(--text-dim)",
                background: "var(--surface)",
                boxShadow: "0 4px 14px color-mix(in oklab, var(--accent) 12%, transparent)",
              }}
            >
              {section.title}
            </a>
          ))}
        </nav>
      </div>

      <div className="h-[calc(100vh-112px)] overflow-y-auto scroll-smooth snap-y snap-proximity md:snap-mandatory">
        {sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="snap-start min-h-[calc(100vh-112px)] px-6 py-10 md:px-10"
          >
            <div
              style={{
                maxWidth: 1080,
                margin: "0 auto",
                border: "1px solid var(--border)",
                borderRadius: 22,
                background: "color-mix(in oklab, var(--surface) 88%, transparent)",
                backdropFilter: "blur(6px)",
                boxShadow: "0 16px 42px color-mix(in oklab, #000 14%, transparent)",
                padding: "30px 26px",
              }}
              className="md:p-11"
            >
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18, gap: 16 }}>
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--accent)",
                      textTransform: "uppercase",
                      letterSpacing: "1.1px",
                      marginBottom: 8,
                    }}
                  >
                    PromptHub About
                  </div>
                  <h2
                    style={{
                      fontFamily: "'Syne',sans-serif",
                      fontSize: "clamp(1.9rem, 3.8vw, 3.2rem)",
                      fontWeight: 800,
                      color: "var(--text)",
                      letterSpacing: "-1px",
                      lineHeight: 1.05,
                    }}
                  >
                    {section.title}
                  </h2>
                </div>
                <span
                  style={{
                    fontFamily: "'Syne',sans-serif",
                    fontSize: "clamp(1.8rem, 4vw, 3.1rem)",
                    fontWeight: 800,
                    color: "color-mix(in oklab, var(--accent) 62%, var(--text-muted))",
                    lineHeight: 1,
                    letterSpacing: "-1px",
                  }}
                >
                  {(sections.findIndex((s) => s.id === section.id) + 1).toString().padStart(2, "0")}
                </span>
              </div>
              <div
                style={{
                  height: 1,
                  width: "100%",
                  background:
                    "linear-gradient(90deg, color-mix(in oklab, var(--accent) 44%, transparent), transparent)",
                  marginBottom: 18,
                }}
              />
              <div style={{ display: "grid", gap: 14 }}>
                {section.body.map((paragraph, idx) => (
                  <p
                    key={`${section.id}-p-${idx}`}
                    style={{
                      color: "var(--text-dim)",
                      fontSize: "clamp(1rem, 1.35vw, 1.12rem)",
                      lineHeight: 1.95,
                      letterSpacing: "-0.1px",
                      whiteSpace: "pre-line",
                    }}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
              {section.bullets && (
                <ul
                  style={{
                    marginTop: 18,
                    paddingLeft: 18,
                    color: "var(--text-dim)",
                    display: "grid",
                    gap: 11,
                    fontSize: "clamp(.95rem, 1.1vw, 1.04rem)",
                    lineHeight: 1.9,
                  }}
                >
                  {section.bullets.map((bullet, idx) => (
                    <li key={`${section.id}-b-${idx}`} style={{ paddingLeft: 2 }}>
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
