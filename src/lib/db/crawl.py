#!/usr/bin/env python3
"""
prpt.ai 크롤러 → PostgreSQL (promptHub 스키마)
================================================
필요 패키지:
    pip install requests psycopg2-binary playwright
    playwright install chromium

실행:
    cd src/lib/db
    pip install requests psycopg2-binary playwright
    playwright install chromium
    python crawl.py
"""

import time
import logging
import asyncio
import requests
import psycopg2
from playwright.async_api import async_playwright, Page, TimeoutError as PwTimeout

# ─────────────────────────────────────────────
# 설정
# ─────────────────────────────────────────────
DB_DSN   = "postgresql://postgres.teagtpusucaresoadgrg:L2PmpJJWRl17tnhh@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres"
API_BASE  = "https://api.prpt.ai"
SITE_BASE = "https://www.prpt.ai"

# (slug, prpt.ai API category_id)
CATEGORIES = {
    "개발":    ("development",    7),
    "고민해결": ("problem-solving", 14),
    "여행":    ("travel",         55),
    "일러스트": ("illustration",   19),
    "글쓰기":  ("writing",        6),
    "교육":    ("education",      8),
    "마케팅":  ("marketing",      9),
    "연구":    ("research",      10),
    "업무":    ("work",          11),
    "콘텐츠":  ("contents",      12),
    "기타":    ("etc",           15),
    "재미":    ("fun",           16),
    "생활":    ("life",          17),
}

BOT_USER_ID    = "bot-prptai-crawler"
BOT_USER_EMAIL = "crawler@prpt.ai"
BOT_USER_NAME  = "prpt.ai Crawler"

PAGE_SIZE    = 50
API_DELAY    = 0.2   # requests 딜레이
DETAIL_DELAY = 0.5   # Playwright 딜레이

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Referer": "https://www.prpt.ai/",
}


# ─────────────────────────────────────────────
# DB 초기화
# ─────────────────────────────────────────────
def setup_db(conn) -> dict:
    cur = conn.cursor()

    # model_name 컬럼이 없으면 추가
    cur.execute("""
        ALTER TABLE "promptHub".prompts
        ADD COLUMN IF NOT EXISTS model_name varchar(200)
    """)
    log.info("model_name 컬럼 확인/추가 완료")

    cur.execute("""
        INSERT INTO public."user" (id, name, email, email_verified, created_at, updated_at)
        VALUES (%s, %s, %s, TRUE, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
    """, (BOT_USER_ID, BOT_USER_NAME, BOT_USER_EMAIL))
    log.info(f"봇 유저 준비: {BOT_USER_ID}")

    cat_ids = {}
    for name, (slug, _) in CATEGORIES.items():
        cur.execute("""
            INSERT INTO "promptHub".categories (name, slug)
            VALUES (%s, %s)
            ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
            RETURNING id
        """, (name, slug))
        cat_ids[name] = cur.fetchone()[0]
        log.info(f"카테고리: {name} → db_id={cat_ids[name]}")

    conn.commit()
    cur.close()
    return cat_ids


# ─────────────────────────────────────────────
# API로 목록 수집 (requests)
# ─────────────────────────────────────────────
def fetch_all(category_id: int, cat_name: str) -> list[dict]:
    all_items = []
    start = 1

    while True:
        end = start + PAGE_SIZE - 1
        url = (
            f"{API_BASE}/post/prompt/list/load"
            f"?startRow={start}&endRow={end}"
            f"&sortOrder=FRDT+DESC&categoryIdList={category_id}"
            f"&modelIdList&platformType"
        )
        try:
            res = requests.get(url, headers=HEADERS, timeout=15)
            res.raise_for_status()
            data = res.json()
            items = data.get("data", []) if data.get("code") == "response.ok" else []
        except Exception as e:
            log.warning(f"API 실패: {e}")
            break

        if not items:
            break

        all_items.extend(items)
        log.info(f"  [{cat_name}] {start}~{start+len(items)-1}행 ({len(items)}건)")

        if len(items) < PAGE_SIZE:
            break

        start += PAGE_SIZE
        time.sleep(API_DELAY)

    log.info(f"[{cat_name}] 총 {len(all_items)}건 수집")
    return all_items


# ─────────────────────────────────────────────
# 상세 페이지에서 description 수집 (Playwright)
# ─────────────────────────────────────────────
def detail_url(post_id: int, platform_type: str) -> str:
    """PLATFORM_TYPE: 'D'=텍스트형, 그 외=이미지형"""
    if platform_type == "D":
        return f"{SITE_BASE}/prompt/textDetail/{post_id}"
    else:
        return f"{SITE_BASE}/prompt/imageDetail/{post_id}"


async def fetch_description_and_result(page: Page, post_id: int, platform_type: str) -> tuple[str | None, str | None]:
    """상세 페이지에서 description, RESULT(결과) 수집. (description, result) 반환."""
    url = detail_url(post_id, platform_type)
    desc, result = None, None
    try:
        await page.goto(url, wait_until="networkidle", timeout=20000)
        await page.wait_for_timeout(800)
        # 소개 텍스트: .info-cont 안의 첫 번째 .txt
        desc = await page.locator(".info-cont .txt").first.inner_text(timeout=3000)
        desc = desc.strip() if desc else None
        # 결과: .result-cont .txt 등 (있으면 수집)
        try:
            result = await page.locator(".result-cont .txt").first.inner_text(timeout=2000)
            result = result.strip() if result else None
        except Exception:
            result = None
        return (desc or None, result or None)
    except PwTimeout:
        log.warning(f"  타임아웃: {url}")
        return (None, None)
    except Exception as e:
        log.warning(f"  description 수집 실패 (id={post_id}): {e}")
        return (None, None)


# ─────────────────────────────────────────────
# DB 저장
# ─────────────────────────────────────────────
def save_prompt(conn, item: dict, description: str | None, cat_db_id: int, result_from_page: str | None = None) -> int | None:
    title      = str(item.get("TITLE") or "").strip()[:300]
    content    = str(item.get("PROMPT") or "").strip()
    result     = (result_from_page or str(item.get("RESULT") or "")).strip()
    view_count = int(item.get("VIEW_COUNT", 0) or 0)
    like_count = int(item.get("COUNT_FAVORITE", 0) or 0)
    model_name = str(item.get("MODEL_NAME") or "").strip()[:200] or None  # ← 추가
    post_id    = item.get("POST_ID")
    platform   = item.get("PLATFORM_TYPE", "D")
    source_url = detail_url(post_id, platform)

    if not title or not content:
        return None

    cur = conn.cursor()
    cur.execute("""
        SELECT id FROM "promptHub".prompts
        WHERE author_id = %s AND title = %s
    """, (BOT_USER_ID, title))
    if cur.fetchone():
        cur.close()
        return None

    cur.execute("""
        INSERT INTO "promptHub".prompts
            (author_id, category_id, title, content, description, result,
             model_name, is_public, current_version_no, view_count, scrap_count, fork_count)
        VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE, 1, %s, %s, 0)
        RETURNING id
    """, (BOT_USER_ID, cat_db_id, title, content, description, result or None,
          model_name, view_count, like_count))
    prompt_id = cur.fetchone()[0]

    cur.execute("""
        INSERT INTO "promptHub".prompt_versions
            (prompt_id, version_no, title, content, change_note, edited_by)
        VALUES (%s, 1, %s, %s, %s, %s)
    """, (
        prompt_id, title, content,
        f"prpt.ai 크롤링 | 원본: {source_url}" + (f" | 모델: {model_name}" if model_name else ""),
        BOT_USER_ID,
    ))

    conn.commit()
    cur.close()
    return prompt_id


# ─────────────────────────────────────────────
# 메인
# ─────────────────────────────────────────────
async def main():
    log.info("DB 연결 중...")
    conn = psycopg2.connect(DB_DSN)
    cat_ids = setup_db(conn)

    stats = {cat: {"found": 0, "saved": 0, "skipped": 0, "error": 0} for cat in CATEGORIES}

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        ctx = await browser.new_context(
            user_agent=HEADERS["User-Agent"],
            locale="ko-KR",
        )
        detail_page = await ctx.new_page()

        for cat_name, (slug, api_cat_id) in CATEGORIES.items():
            cat_db_id = cat_ids[cat_name]
            log.info(f"\n{'='*55}\n카테고리: [{cat_name}] (api_id={api_cat_id})\n{'='*55}")

            items = fetch_all(api_cat_id, cat_name)
            stats[cat_name]["found"] = len(items)

            for i, item in enumerate(items, 1):
                post_id   = item.get("POST_ID")
                platform  = item.get("PLATFORM_TYPE", "D")
                model_name = str(item.get("MODEL_NAME") or "")[:30]
                title_preview = str(item.get("TITLE") or "")[:40]
                log.info(f"[{cat_name}] {i}/{len(items)} id={post_id} ({platform}) [{model_name}] | {title_preview}")

                # 상세 페이지에서 description, RESULT(결과) 수집
                description, result_from_page = await fetch_description_and_result(detail_page, post_id, platform)
                if description:
                    log.info(f"  📝 description: {description[:60]}")
                if result_from_page:
                    log.info(f"  📄 result: {result_from_page[:60]}…")
                await asyncio.sleep(DETAIL_DELAY)

                try:
                    pid = save_prompt(conn, item, description, cat_db_id, result_from_page)
                    if pid:
                        log.info(f"  ✅ 저장 (prompt_id={pid})")
                        stats[cat_name]["saved"] += 1
                    else:
                        log.info(f"  ⏭  스킵 (중복/빈값)")
                        stats[cat_name]["skipped"] += 1
                except Exception as e:
                    log.error(f"  ❌ DB 오류: {e}")
                    conn.rollback()
                    stats[cat_name]["error"] += 1

        await browser.close()

    conn.close()

    log.info("\n" + "="*55)
    log.info("완료 리포트")
    log.info("="*55)
    total = 0
    for cat, s in stats.items():
        log.info(f"[{cat}] 발견:{s['found']} 저장:{s['saved']} 스킵:{s['skipped']} 오류:{s['error']}")
        total += s["saved"]
    log.info(f"\n총 저장: {total}건")


if __name__ == "__main__":
    asyncio.run(main())