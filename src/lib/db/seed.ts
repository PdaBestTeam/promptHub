import { config } from "dotenv";
config({ path: ".env" });

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { randomUUID } from "crypto";
import * as schema from "@/lib/db/schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const db = drizzle(pool, { schema });

const CATEGORIES = [
  { name: "일러스트", slug: "illustration" },
  { name: "개발", slug: "dev" },
  { name: "고민해결", slug: "advice" },
  { name: "여행", slug: "travel" },
];

const SAMPLE_PROMPTS = [
  {
    title: "캐릭터 일러스트 스타일 가이드 생성기",
    description:
      "원하는 스타일의 캐릭터 일러스트 프롬프트를 자동으로 생성합니다.",
    content: `당신은 전문 일러스트레이터입니다.\n\n아래 정보를 바탕으로 캐릭터 일러스트 프롬프트를 생성해주세요.\n\n[캐릭터 설명]\n{{캐릭터 설명}}\n\n[원하는 스타일]\n{{스타일}}\n\n[분위기]\n{{분위기}}\n\n위 정보를 반영하여 상세하고 전문적인 일러스트 프롬프트를 영문으로 작성해주세요.`,
    categorySlug: "illustration",
  },
  {
    title: "코드 리뷰어 — 시니어 개발자 관점",
    description: "시니어 개발자 시각에서 코드를 분석하고 개선점을 제시합니다.",
    content: `당신은 10년 경력의 시니어 풀스택 개발자입니다.\n\n아래 코드를 리뷰해주세요.\n\n[코드]\n{{코드}}\n\n[사용 언어/프레임워크]\n{{언어_프레임워크}}\n\n다음 항목으로 리뷰해주세요:\n1. 버그 및 잠재적 문제\n2. 성능 개선 포인트\n3. 가독성/유지보수성\n4. 보안 취약점\n5. 최종 개선 코드 제안`,
    categorySlug: "dev",
  },
  {
    title: "인생 고민 해결사 — 5단계 분석",
    description: "복잡한 인생 고민을 체계적으로 분석하고 해결책을 제시합니다.",
    content: `당신은 공감 능력이 뛰어난 인생 상담사입니다.\n\n[고민 내용]\n{{고민 내용}}\n\n다음 5단계로 분석해주세요:\n1단계: 핵심 문제 파악\n2단계: 감정 공감\n3단계: 상황 분석\n4단계: 해결 방안 3가지\n5단계: 실행 계획`,
    categorySlug: "advice",
  },
  {
    title: "여행 완벽 플래너 — 일정표 자동 생성",
    description: "목적지와 기간을 입력하면 완벽한 여행 일정표를 생성합니다.",
    content: `당신은 10년 경력의 전문 여행 플래너입니다.\n\n[여행지]\n{{여행지}}\n\n[기간]\n{{여행 기간}}\n\n[예산]\n{{예산}}\n\n[동행]\n{{동행 인원}}\n\n위 정보를 바탕으로 다음을 포함한 완벽한 여행 계획을 작성해주세요:\n- 일자별 상세 일정\n- 추천 숙소\n- 맛집 리스트\n- 예상 비용 내역\n- 꿀팁 & 주의사항`,
    categorySlug: "travel",
  },
  {
    title: "SQL 쿼리 최적화 전문가",
    description: "느린 SQL 쿼리를 분석하고 최적화 방안을 제시합니다.",
    content: `당신은 DB 성능 최적화 전문가입니다.\n\n[현재 쿼리]\n{{SQL 쿼리}}\n\n[테이블 구조]\n{{테이블 스키마}}\n\n[문제 상황]\n{{성능 문제}}\n\n다음을 분석해주세요:\n1. 현재 쿼리의 문제점\n2. 인덱스 추천\n3. 최적화된 쿼리\n4. 실행 계획 설명`,
    categorySlug: "dev",
  },
  {
    title: "SNS 여행기 작성기 — 감성 가득",
    description: "여행 사진과 경험을 감성적인 SNS 포스트로 변환합니다.",
    content: `당신은 감성적인 글쓰기 전문가입니다.\n\n[여행지]\n{{여행지}}\n\n[경험/느낌]\n{{여행 경험}}\n\n위 내용을 바탕으로 인스타그램 스타일의 감성 여행기를 작성해주세요.\n- 첫 문장은 강렬하게\n- 이모지 적절히 사용\n- 해시태그 10개 포함\n- 300자 이내`,
    categorySlug: "travel",
  },
];

async function seed() {
  console.log("🌱 Seeding database...");

  // 1. Insert categories
  const insertedCats = await db
    .insert(schema.categoriesTable)
    .values(CATEGORIES)
    .onConflictDoNothing()
    .returning();

  console.log(`✅ Categories: ${insertedCats.length} inserted`);

  // 2. Insert demo user
  const [demoUser] = await db
    .insert(schema.usersTable)
    .values({
      id: randomUUID(),
      name: "PromptHub",
      email: "demo@prompthub.kr",
      emailVerified: true,
      image: null,
    })
    .onConflictDoNothing()
    .returning();

  if (!demoUser) {
    console.log("ℹ️  Demo user already exists, skipping prompts seed");
    return;
  }

  // Get all categories for lookups
  const cats = await db.select().from(schema.categoriesTable);
  const catBySlug = Object.fromEntries(cats.map((c) => [c.slug, c]));

  // 3. Insert sample prompts
  for (const sp of SAMPLE_PROMPTS) {
    const cat = catBySlug[sp.categorySlug];
    const [prompt] = await db
      .insert(schema.promptsTable)
      .values({
        authorId: demoUser.id,
        categoryId: cat?.id ?? null,
        title: sp.title,
        description: sp.description,
        content: sp.content,
        isPublic: true,
        currentVersionNo: 1,
      })
      .returning();

    await db.insert(schema.promptVersionsTable).values({
      promptId: prompt.id,
      versionNo: 1,
      title: sp.title,
      content: sp.content,
      changeNote: "최초 작성",
      editedBy: demoUser.id,
    });
  }

  console.log(`✅ Prompts: ${SAMPLE_PROMPTS.length} inserted`);
  console.log("🎉 Seeding complete!");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
