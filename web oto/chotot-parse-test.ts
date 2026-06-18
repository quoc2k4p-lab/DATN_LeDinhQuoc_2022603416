import * as cheerio from "cheerio";

async function test() {
  console.log("Fetching from xe.chotot.com HTML for analysis...");
  try {
    const res = await fetch("https://xe.chotot.com/mua-ban-oto", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
      }
    });
    if (!res.ok) throw new Error("HTTP failed: " + res.status);
    const html = await res.text();
    const $ = cheerio.load(html);
    
    console.log("--- Printing first 100 non-empty hrefs ---");
    const hrefs: string[] = [];
    $("a").each((i, el) => {
      const href = $(el).attr("href") || "";
      if (href && !hrefs.includes(href)) {
        hrefs.push(href);
      }
    });
    console.log("Total unique hrefs:", hrefs.length);
    console.log(hrefs.slice(0, 100));

  } catch (err) {
    console.error("Fetch failed:", err);
  }
}
test();
