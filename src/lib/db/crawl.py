#!/usr/bin/env python3
"""
prpt.ai API 크롤러 → PostgreSQL (promptHub 스키마)
================================================
필요 패키지:
    pip install requests psycopg2-binary

실행:
    python crawler_prpt_ai.py
"""

import time
import logging
import requests
import psycopg2

# ─────────────────────────────────────────────
# 설정
# ─────────────────────────────────────────────
DB_DSN   = "postgresql://postgres.teagtpusucaresoadgrg:L2PmpJJWRl17tnhh@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres"
API_BASE = "https://api.prpt.ai"

# 카테고리명 → (DB slug, prpt.ai categoryId)
CATEGORIES = {
    "개발":    ("development",    7),
    "고민해결": ("problem-solving", 14),
    "여행":    ("travel",         55),
    "일러스트": ("illustration",   19),
}

BOT_USER_ID    = "bot-prptai-crawler"
BOT_USER_EMAIL = "crawler@prpt.ai"
BOT_USER_NAME  = "prpt.ai Crawler"

PAGE_SIZE = 50
DELAY     = 0.2

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Referer":    "https://www.prpt.ai/",
    "Origin":     "https://www.prpt.ai",
}


# ─────────────────────────────────────────────
# DB 초기화
# ─────────────────────────────────────────────
def setup_db(conn) -> dict:
    cur = conn.cursor()

    # better-auth public."user" 테이블에 봇 유저 삽입 (id = text 타입)
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
# API 호출
# ─────────────────────────────────────────────
def fetch_all(category_id: int, cat_name: str) -> list[dict]:
    """페이지네이션으로 전체 목록 수집. 목록 API에 모든 필드 포함."""
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
        log.info(f"  [{cat_name}] {start}~{start+len(items)-1}행 ({len(items)}건) 수집")

        if len(items) < PAGE_SIZE:
            break  # 마지막 페이지

        start += PAGE_SIZE
        time.sleep(DELAY)

    log.info(f"[{cat_name}] 총 {len(all_items)}건")
    return all_items


# ─────────────────────────────────────────────
# DB 저장
# ─────────────────────────────────────────────
def save_prompt(conn, item: dict, cat_db_id: int) -> int | None:
    # 목록 API 필드명: TITLE, PROMPT, RESULT, VIEW_COUNT, COUNT_FAVORITE, POST_ID
    title   = str(item.get("TITLE") or "").strip()[:300]
    content = str(item.get("PROMPT") or "").strip()
    desc    = str(item.get("RESULT") or "").strip() or None  # RESULT를 description으로 활용
    view_count = int(item.get("VIEW_COUNT", 0) or 0)
    like_count = int(item.get("COUNT_FAVORITE", 0) or 0)
    post_id    = item.get("POST_ID")
    source_url = f"https://www.prpt.ai/prompt/{post_id}" if post_id else ""

    if not title or not content:
        log.debug(f"  ⚠ 빈 title/content 스킵 (POST_ID={post_id})")
        return None

    cur = conn.cursor()

    # 중복 체크
    cur.execute("""
        SELECT id FROM "promptHub".prompts
        WHERE author_id = %s AND title = %s
    """, (BOT_USER_ID, title))
    if cur.fetchone():
        cur.close()
        return None

    cur.execute("""
        INSERT INTO "promptHub".prompts
            (author_id, category_id, title, content, description,
             is_public, current_version_no, view_count, scrap_count, fork_count)
        VALUES (%s, %s, %s, %s, %s, TRUE, 1, %s, %s, 0)
        RETURNING id
    """, (BOT_USER_ID, cat_db_id, title, content, desc, view_count, like_count))
    prompt_id = cur.fetchone()[0]

    cur.execute("""
        INSERT INTO "promptHub".prompt_versions
            (prompt_id, version_no, title, content, change_note, edited_by)
        VALUES (%s, 1, %s, %s, %s, %s)
    """, (
        prompt_id, title, content,
        f"prpt.ai 크롤링 | 원본: {source_url}",
        BOT_USER_ID,
    ))

    conn.commit()
    cur.close()
    return prompt_id


# ─────────────────────────────────────────────
# 메인
# ─────────────────────────────────────────────
def main():
    log.info("DB 연결 중...")
    conn = psycopg2.connect(DB_DSN)
    cat_ids = setup_db(conn)

    stats = {cat: {"found": 0, "saved": 0, "skipped": 0, "error": 0} for cat in CATEGORIES}

    for cat_name, (slug, api_cat_id) in CATEGORIES.items():
        cat_db_id = cat_ids[cat_name]
        log.info(f"\n{'='*50}\n카테고리: [{cat_name}] (api_id={api_cat_id})\n{'='*50}")

        items = fetch_all(api_cat_id, cat_name)
        stats[cat_name]["found"] = len(items)

        for i, item in enumerate(items, 1):
            post_id = item.get("POST_ID")
            title_preview = str(item.get("TITLE") or "")[:45]
            log.info(f"[{cat_name}] {i}/{len(items)} id={post_id} | {title_preview}")

            try:
                pid = save_prompt(conn, item, cat_db_id)
                if pid:
                    log.info(f"  ✅ 저장 (prompt_id={pid})")
                    stats[cat_name]["saved"] += 1
                else:
                    stats[cat_name]["skipped"] += 1
            except Exception as e:
                log.error(f"  ❌ DB 오류: {e}")
                conn.rollback()
                stats[cat_name]["error"] += 1

    conn.close()

    log.info("\n" + "="*50)
    log.info("완료 리포트")
    log.info("="*50)
    total = 0
    for cat, s in stats.items():
        log.info(f"[{cat}] 발견:{s['found']} 저장:{s['saved']} 스킵:{s['skipped']} 오류:{s['error']}")
        total += s["saved"]
    log.info(f"\n총 저장: {total}건")


if __name__ == "__main__":
    main()