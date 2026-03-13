import axios from "axios";
import * as cheerio from "cheerio";

export async function scrapeWebsiteText(url) {
  const response = await axios.get(url, {
    timeout: 15000,
    headers: { "User-Agent": "Mozilla/5.0 ProductionAI/1.0" }
  });

  const $ = cheerio.load(response.data);
  $("script, style, noscript").remove();
  return $("body").text().replace(/\s+/g, " ").trim();
}