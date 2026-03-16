const fs = require("fs");
const path = require("path");
const { XMLParser } = require("fast-xml-parser");
const fetch = require("node-fetch");

const { resolveGoogleNewsURL, extractArticleData } = require("./services/image-service");
const store = require("./articleStore");
const TrendingEngine = require("./services/trending-engine");

const DATA_DIR = path.join(__dirname, "data");
const FEEDS_FILE = path.join(DATA_DIR, "feeds.json");

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_"
});

const trendingEngine = new TrendingEngine(store);

class NewsFetcher {

  constructor() {

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

  }

  decodeEntities(str) {
    if (!str) return "";

    return String(str)
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  loadFeeds() {

    try {

      if (!fs.existsSync(FEEDS_FILE)) {
        console.warn("[RSS] feeds.json not found");
        return [];
      }

      const raw = fs.readFileSync(FEEDS_FILE, "utf8");
      const parsed = JSON.parse(raw);

      return (parsed.feeds || []).filter(f => f.enabled);

    } catch (err) {

      console.error("[RSS] Feed load error:", err.message);
      return [];

    }

  }

  async refreshAll() {

    console.log("[RSS] Refreshing feeds...");

    const feeds = this.loadFeeds();

    if (feeds.length === 0) {
      console.log("[RSS] No active feeds.");
      return [];
    }

    const existingArticles = store.getAll();
    const existingLinks = new Set(existingArticles.map(a => a.link));

    let newCount = 0;

    for (const feed of feeds) {

      try {

        console.log(`[RSS] Fetching ${feed.category}`);

        const res = await fetch(feed.url, {
          headers: { "User-Agent": "Mozilla/5.0" }
        });

        const xml = await res.text();

        const parsed = parser.parse(xml);

        let items = parsed?.rss?.channel?.item || parsed?.feed?.entry || [];

        if (!Array.isArray(items)) {
          items = [items];
        }

        for (const item of items.slice(0, 10)) {

          const rawLink = item.link || item.link?.href;

          if (!rawLink) continue;

          const realLink = await resolveGoogleNewsURL(rawLink);

          if (!realLink) continue;

          if (existingLinks.has(realLink)) continue;

          const guid = item.guid?.["#text"] || item.guid || realLink;

          const title = this.decodeEntities(item.title || "");

          const rawDescription = this.decodeEntities(
            (item.description || "").replace(/<[^>]*>/g, "")
          );

          const media = item["media:content"] || item["media:thumbnail"];

          let rssImage = null;

          if (media) {
            rssImage = media["@_url"] || media.url;
          }

          const { image, content } = await extractArticleData(realLink);

          const finalImage = rssImage || image || "/assets/images/news-placeholder.jpg";

          let sourceName = item.source?.["#text"] || item["dc:publisher"] || "";

          if (!sourceName && realLink) {
            try {
              sourceName = new URL(realLink).hostname.replace("www.", "");
            } catch {}
          }

          const article = {
            id: guid,
            title,
            summary: rawDescription.substring(0, 220),
            description: rawDescription.substring(0, 500),
            content: content || rawDescription,
            link: realLink,
            category: feed.category || "World",
            source: sourceName || "News",
            publishedAt: new Date(
              item.pubDate || item.published || item.updated || Date.now()
            ),
            image: finalImage
          };

          store.setArticle(article);

          existingLinks.add(realLink);

          newCount++;

        }

      } catch (err) {

        console.error(`[RSS] Feed error (${feed.url})`, err.message);

      }

    }

    if (newCount > 0) {

      console.log(`[RSS] Added ${newCount} new articles`);

      trendingEngine.calculateScores();

      store.persist();

    }

    return store.getAll();

  }

  async fetchCategory(category) {

    const cat = (category || "world").toLowerCase();

    if (cat === "trending") {
      return store.getTrending();
    }

    if (cat === "breaking") {
      return store.getAll().slice(0, 10);
    }

    if (cat === "hero") {
      return store.getHero();
    }

    let articles = store.getByCategory(cat);

    if (articles.length === 0) {

      console.log("[RSS] Cache miss → refreshing feeds");

      await this.refreshAll();

      articles = store.getByCategory(cat);

    }

    return articles;

  }

}

const fetcher = new NewsFetcher();

setTimeout(() => fetcher.refreshAll(), 5000);

setInterval(() => {

  fetcher.refreshAll().catch(console.error);

}, 10 * 60 * 1000);

module.exports = {
  fetchNews: (cat) => fetcher.fetchCategory(cat),
  fetchAndProcessNews: (cat) => fetcher.fetchCategory(cat),
  NewsFetcher: fetcher,
  ArticleStore: store
};