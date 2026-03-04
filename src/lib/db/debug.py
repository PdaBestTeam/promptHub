#!/usr/bin/env python3
"""텍스트형 상세 URL 패턴 + description 셀렉터 확인"""
import asyncio, requests

HEADERS = {"User-Agent": "Mozilla/5.0", "Referer": "https://www.prpt.ai/"}

# 텍스트형(ChatGPT) POST_ID=1441 URL 패턴 시도
POST_ID = 1441
print("[1] 텍스트형 상세 URL 패턴 시도...")
for url in [
    f"https://www.prpt.ai/prompt/detail/{POST_ID}",
    f"https://www.prpt.ai/prompt/textDetail/{POST_ID}",
    f"https://www.prpt.ai/prompt/promptDetail/{POST_ID}",
    f"https://www.prpt.ai/prompt/view/{POST_ID}",
    f"https://www.prpt.ai/prompt/imageDetail/{POST_ID}",
]:
    r = requests.get(url, headers=HEADERS, timeout=10)
    title_hint = "info-title" in r.text or "detail prompt" in r.text
    print(f"  [{r.status_code}] {'✅ 상세페이지!' if title_hint else ''} {url}")

async def check_playwright():
    from playwright.async_api import async_playwright
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        ctx = await browser.new_context(locale="ko-KR")
        page = await ctx.new_page()

        print("\n[2] imageDetail/1425 description 셀렉터 확인...")
        await page.goto("https://www.prpt.ai/prompt/imageDetail/1425", wait_until="networkidle")
        await page.wait_for_timeout(1500)

        # 소개 텍스트
        try:
            desc = await page.locator(".info-cont .txt").first.inner_text(timeout=3000)
            print(f"  .info-cont .txt → '{desc}'")
        except:
            print("  .info-cont .txt → 없음")

        # 다른 후보
        for sel in [".title.intro + .txt", ".info-cont div.txt", "p.title.intro ~ div.txt"]:
            try:
                t = await page.locator(sel).first.inner_text(timeout=1500)
                print(f"  {sel} → '{t}'")
            except:
                pass

        print("\n[3] 텍스트형(ChatGPT) 상세 페이지 시도...")
        for url in [
            f"https://www.prpt.ai/prompt/detail/1441",
            f"https://www.prpt.ai/prompt/textDetail/1441",
        ]:
            await page.goto(url, wait_until="networkidle")
            await page.wait_for_timeout(1000)
            cur = page.url
            has_detail = await page.locator(".info-title").count() > 0
            print(f"  {url} → 최종URL: {cur}, 상세페이지여부: {has_detail}")
            if has_detail:
                try:
                    desc = await page.locator(".info-cont .txt").first.inner_text(timeout=2000)
                    print(f"    description: '{desc}'")
                except:
                    pass
                break

        await browser.close()

asyncio.run(check_playwright())