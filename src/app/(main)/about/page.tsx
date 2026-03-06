"use client";

import { GitFork } from "lucide-react";

const versions = [
  { v: "v1", text: "친절한 톤으로 설명해줘", note: "초안" },
  {
    v: "v2",
    text: "중학생도 이해할 수 있도록 예시를 포함해서 설명해줘",
    note: "개선",
  },
  {
    v: "v3",
    text: "표와 예시를 함께 사용해서 단계별로 설명해줘",
    note: "완성",
  },
];

export default function AboutPage() {
  return (
    <main
      style={{ paddingTop: 60, background: "var(--bg)", overflow: "hidden" }}
    >
      <style>{`
        @media (max-width: 860px) {
          .about-hero    { padding: 50px 24px 40px !important; min-height: 70vh !important; }
          .about-section { padding: 60px 24px !important; }
          .about-goal    { padding: 60px 24px 80px !important; }
          .about-why-grid {
            grid-template-columns: 1fr !important;
            gap: 36px !important;
          }
          .about-features-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .about-fork-card {
            grid-row: span 1 !important;
            grid-column: span 2 !important;
            min-height: auto !important;
          }
        }
        @media (max-width: 520px) {
          .about-hero    { padding: 40px 18px 32px !important; }
          .about-section { padding: 48px 18px !important; }
          .about-goal    { padding: 48px 18px 60px !important; }
          .about-features-grid {
            grid-template-columns: 1fr !important;
          }
          .about-fork-card {
            grid-column: span 1 !important;
          }
        }
      `}</style>

      <section
        className="about-hero"
        style={{
          position: "relative",
          minHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 36px 60px",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "60%",
            width: 480,
            height: 480,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, var(--accent-dim) 0%, transparent 70%)",
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            left: "5%",
            width: 320,
            height: 320,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, var(--green-dim) 0%, transparent 70%)",
            filter: "blur(36px)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              border: "1px solid var(--accent-border)",
              background: "var(--accent-dim)",
              borderRadius: 999,
              padding: "5px 14px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "1.2px",
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: 36,
            }}
          >
            PromptHub — About
          </div>

          <h1
            style={{
              fontFamily: "'Syne',sans-serif",
              fontWeight: 800,
              fontSize: "clamp(2.6rem, 8vw, 7.5rem)",
              letterSpacing: "-3px",
              lineHeight: 0.95,
              color: "var(--text)",
              marginBottom: 40,
            }}
          >
            프롬프트를
            <br />
            <span style={{ color: "var(--accent)" }}>발전시키는</span>
            <br />
            협업 플랫폼.
          </h1>

          <p
            style={{
              fontSize: "clamp(1rem, 1.4vw, 1.15rem)",
              color: "var(--text-dim)",
              lineHeight: 1.85,
              maxWidth: 600,
            }}
          >
            생성형 AI 시대, 좋은 프롬프트 하나가 결과를 바꿉니다.
            <br />
            PromptHub는 프롬프트를 찾고, 공유하고, Git처럼 버전 관리하는
            플랫폼입니다.
          </p>
        </div>
      </section>

      <section
        className="about-section"
        style={{ padding: "100px 36px", borderTop: "1px solid var(--border)" }}
      >
        <div
          className="about-why-grid"
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 60,
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "1.2px",
                color: "var(--accent)",
                marginBottom: 20,
              }}
            >
              The Problem
            </div>
            <h2
              style={{
                fontFamily: "'Syne',sans-serif",
                fontWeight: 800,
                fontSize: "clamp(2rem, 3.5vw, 3.2rem)",
                letterSpacing: "-1.5px",
                lineHeight: 1.1,
                color: "var(--text)",
                marginBottom: 28,
              }}
            >
              왜 PromptHub가
              <br />
              필요한가?
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                {
                  icon: "⚠️",
                  text: "프롬프트가 웹사이트와 커뮤니티에 흩어져 찾기 어렵습니다.",
                },
                {
                  icon: "⚠️",
                  text: "복사해서 쓰다 보면 원본을 알기 어려워집니다.",
                },
                {
                  icon: "⚠️",
                  text: "수정하다 보면 어떤 버전이 가장 좋은지 관리하기 어렵습니다.",
                },
              ].map(({ icon, text }, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 14,
                    alignItems: "flex-start",
                    padding: "14px 18px",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                >
                  <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>
                    {icon}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      color: "var(--text-dim)",
                      lineHeight: 1.7,
                    }}
                  >
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "1.2px",
                color: "var(--text-muted)",
                marginBottom: 20,
              }}
            >
              PromptHub Solution
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {versions.map(({ v, text, note }, i) => (
                <div
                  key={v}
                  style={{
                    position: "relative",
                    display: "flex",
                    gap: 16,
                    alignItems: "stretch",
                  }}
                >
                  {i < versions.length - 1 && (
                    <div
                      style={{
                        position: "absolute",
                        left: 19,
                        top: "100%",
                        width: 2,
                        height: 10,
                        background: "var(--accent-border)",
                        marginTop: -2,
                      }}
                    />
                  )}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 0,
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background:
                          i === versions.length - 1
                            ? "var(--accent)"
                            : "var(--accent-dim)",
                        border: `1px solid var(--accent-border)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "'Syne',sans-serif",
                        fontWeight: 800,
                        fontSize: 11,
                        color:
                          i === versions.length - 1 ? "#fff" : "var(--accent)",
                      }}
                    >
                      {v}
                    </div>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      padding: "10px 16px",
                      background:
                        i === versions.length - 1
                          ? "var(--accent-dim)"
                          : "var(--surface)",
                      border: `1px solid ${i === versions.length - 1 ? "var(--accent-border)" : "var(--border)"}`,
                      borderRadius: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: ".6px",
                        marginBottom: 4,
                      }}
                    >
                      {note}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color:
                          i === versions.length - 1
                            ? "var(--accent)"
                            : "var(--text-dim)",
                        lineHeight: 1.6,
                        fontStyle: "italic",
                      }}
                    >
                      &ldquo;{text}&rdquo;
                    </div>
                  </div>
                </div>
              ))}
              <div
                style={{
                  marginTop: 8,
                  padding: "12px 16px",
                  background: "var(--surface2)",
                  border: "1px dashed var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                  color: "var(--text-muted)",
                  lineHeight: 1.6,
                }}
              >
                PromptHub는 Git과 유사한 방식의 버전 관리 개념을 프롬프트에
                적용했습니다.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="about-section"
        style={{ padding: "100px 36px", borderTop: "1px solid var(--border)" }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: 48,
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "1.2px",
                  color: "var(--accent)",
                  marginBottom: 16,
                }}
              >
                Features
              </div>
              <h2
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontWeight: 800,
                  fontSize: "clamp(2rem, 3.5vw, 3.2rem)",
                  letterSpacing: "-1.5px",
                  lineHeight: 1.1,
                  color: "var(--text)",
                }}
              >
                주요 기능
              </h2>
            </div>
            <p
              style={{
                maxWidth: 600,
                fontSize: 14,
                color: "var(--text-muted)",
                lineHeight: 1.7,
              }}
            >
              탐색부터 Fork, 버전 관리까지 — 프롬프트 생애 주기 전체를 하나의
              플랫폼에서.
            </p>
          </div>

          <div
            className="about-features-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr 1fr",
              gridTemplateRows: "auto auto",
              gap: 14,
            }}
          >
            <div
              className="about-fork-card"
              style={{
                gridRow: "span 2",
                padding: "36px 32px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 24,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                overflow: "hidden",
                minHeight: 320,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  bottom: -40,
                  right: -40,
                  width: 200,
                  height: 200,
                  borderRadius: "50%",
                  background: "var(--accent-dim)",
                  filter: "blur(40px)",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 16,
                  background: "var(--accent-dim)",
                  border: "1px solid var(--accent-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 26,
                }}
              >
                <GitFork size={26} style={{ color: "var(--accent)" }} />
              </div>
              <div style={{ position: "relative", zIndex: 1 }}>
                <div
                  style={{
                    fontFamily: "'Syne',sans-serif",
                    fontWeight: 800,
                    fontSize: 26,
                    letterSpacing: "-.8px",
                    color: "var(--text)",
                    marginBottom: 12,
                  }}
                >
                  Fork
                </div>
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--text-dim)",
                    lineHeight: 1.75,
                  }}
                >
                  다른 사람의 프롬프트를 Fork해 나만의 버전으로 발전시키세요.
                  수정할 때마다 버전이 자동으로 기록됩니다.
                </p>
              </div>
            </div>

            <div
              style={{
                padding: "28px 24px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 20,
              }}
            >
              <div style={{ fontSize: 26, marginBottom: 14 }}>📋</div>
              <div
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontWeight: 800,
                  fontSize: 17,
                  letterSpacing: "-.4px",
                  color: "var(--text)",
                  marginBottom: 8,
                }}
              >
                버전 히스토리
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-dim)",
                  lineHeight: 1.7,
                }}
              >
                수정 과정을 버전별로 확인하고 언제든 되돌아볼 수 있습니다.
              </p>
            </div>

            <div
              style={{
                padding: "28px 24px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 20,
              }}
            >
              <div style={{ fontSize: 26, marginBottom: 14 }}>🔍</div>
              <div
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontWeight: 800,
                  fontSize: 17,
                  letterSpacing: "-.4px",
                  color: "var(--text)",
                  marginBottom: 8,
                }}
              >
                카테고리 탐색
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-dim)",
                  lineHeight: 1.7,
                }}
              >
                일러스트, 개발, 고민해결, 여행 — 카테고리별로 빠르게 찾아보세요.
              </p>
            </div>

            <div
              style={{
                padding: "28px 24px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 20,
              }}
            >
              <div style={{ fontSize: 26, marginBottom: 14 }}>♡</div>
              <div
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontWeight: 800,
                  fontSize: 17,
                  letterSpacing: "-.4px",
                  color: "var(--text)",
                  marginBottom: 8,
                }}
              >
                스크랩
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-dim)",
                  lineHeight: 1.7,
                }}
              >
                마음에 드는 프롬프트를 저장해 마이페이지에서 카테고리별로
                관리하세요.
              </p>
            </div>

            <div
              style={{
                padding: "28px 24px",
                background:
                  "linear-gradient(135deg, var(--accent-dim), var(--surface))",
                border: "1px solid var(--accent-border)",
                borderRadius: 20,
              }}
            >
              <div style={{ fontSize: 26, marginBottom: 14 }}>✏️</div>
              <div
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontWeight: 800,
                  fontSize: 17,
                  letterSpacing: "-.4px",
                  color: "var(--text)",
                  marginBottom: 8,
                }}
              >
                프롬프트 공유
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-dim)",
                  lineHeight: 1.7,
                }}
              >
                내 프롬프트를 PromptHub에 공유하고 함께 발전시켜 보세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        className="about-goal"
        style={{
          padding: "100px 36px 120px",
          borderTop: "1px solid var(--border)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 50% 100%, var(--accent-dim), transparent 60%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "1.2px",
              color: "var(--accent)",
              marginBottom: 24,
              textAlign: "center",
            }}
          >
            Our Goal
          </div>
          <h2
            style={{
              fontFamily: "'Syne',sans-serif",
              fontWeight: 800,
              fontSize: "clamp(2.4rem, 6vw, 5.5rem)",
              letterSpacing: "-2.5px",
              lineHeight: 1.05,
              color: "var(--text)",
              textAlign: "center",
              marginBottom: 36,
            }}
          >
            프롬프트가
            <br />
            <span style={{ color: "var(--accent)" }}>함께 발전하는</span>
            <br />
            생태계를 만든다.
          </h2>
          <p
            style={{
              textAlign: "center",
              fontSize: "clamp(1rem, 1.3vw, 1.1rem)",
              color: "var(--text-muted)",
              lineHeight: 1.85,
              maxWidth: 560,
              margin: "0 auto",
            }}
          >
            PromptHub는 단순한 저장 공간이 아닙니다. 사용자들의 프롬프트가
            서로에게 영감을 주고, Fork와 수정을 통해 더 좋은 프롬프트로 진화하는
            협업 생태계를 목표로 합니다.
          </p>
        </div>
      </section>
    </main>
  );
}
