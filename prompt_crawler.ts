import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Navigating to https://www.prpt.ai/prompt/list...");
  await page.goto("https://www.prpt.ai/prompt/list", { waitUntil: "networkidle" });
  
  // Wait for at least one link
  await page.waitForSelector("a[href^='/mypage/userPage/write/']", { timeout: 10000 }).catch(() => null);

  const links = await page.$$eval("a[href^='/mypage/userPage/write/']", (els) => 
    els.map(el => (el as HTMLAnchorElement).href)
  );

  const uniqueLinks = Array.from(new Set(links)).slice(0, 5); 
  console.log(`Found ${uniqueLinks.length} unique prompt links. Fetcing details...`);

  const results = [];

  for (const link of uniqueLinks) {
    console.log(`- Fetching ${link}`);
    await page.goto(link, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000); 

    try {
      const title = await page.$eval("h2, h3, .title", el => el.textContent?.trim() || "Untitled").catch(() => "Untitled");
      
      const content = await page.evaluate(() => {
        const textElements = Array.from(document.querySelectorAll('p, div.w-e-text, .content'));
        return textElements.map(el => (el as HTMLElement).innerText).join('\n').substring(0, 1500);
      });

      results.push({
        title,
        content: content.trim() || "No content found",
        sourceUrl: link
      });
      console.log(`  -> Title: ${title}`);
    } catch (e) {
      console.log(`  -> Failed: ${e}`);
    }
  }

  await browser.close();

  fs.writeFileSync(
    path.join(__dirname, "scraped_prompts.json"), 
    JSON.stringify(results, null, 2), 
    "utf-8"
  );
  console.log("Saved to scraped_prompts.json");
}

run().catch(console.error);
