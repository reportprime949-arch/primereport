const fs = require("fs");
const path = require("path");
const Parser = require("rss-parser");
const axios = require("axios");

const { resolveGoogleNewsURL, extractArticleData } = require("./services/image-service");
const store = require("./articleStore");
const TrendingEngine = require("./services/trending-engine");

const DATA_DIR = path.join(__dirname, "data");
const FEEDS_FILE = path.join(DATA_DIR, "feeds.json");

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
      ["dc:publisher", "publisher"]
    ]
  }
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
        console.log(`[RSS] Fetching ${feed.category}: ${feed.name}`);

        const response = await axios.get(feed.url, {
          headers: { "User-Agent": "Mozilla/5.0" },
          timeout: 15000
        });

        const feedData = await parser.parseString(response.data);
        const items = feedData.items || [];

        for (const item of items.slice(0, 15)) {
          const rawLink = item.link;
          if (!rawLink) continue;

          // Universal De-duplication check by link
          const realLink = await resolveGoogleNewsURL(rawLink);
          if (!realLink || existingLinks.has(realLink)) continue;

          const title = this.decodeEntities(item.title || "");
          const summary = this.decodeEntities((item.contentSnippet || item.content || item.summary || "").replace(/<[^>]*>/g, ""));
          
          // Image Extraction
          let rssImage = null;
          if (item.mediaContent) rssImage = item.mediaContent.$?.url;
          if (!rssImage && item.mediaThumbnail) rssImage = item.mediaThumbnail.$?.url;
          
          const { image, content } = await extractArticleData(realLink);
          const finalImage = rssImage || image || "/assets/image/news-placeholder.jpg";

          let sourceName = item.publisher || item.source?.["#text"] || feedData.title || "";
          if (!sourceName && realLink) {
            try { sourceName = new URL(realLink).hostname.replace("www.", ""); } catch {}
          }

          const article = {
            id: item.guid || item.id || `feed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title,
            summary: summary.substring(0, 240),
            description: summary.substring(0, 500),
            content: content || summary,
            link: realLink,
            category: feed.category || "World",
            source: sourceName || "News",
            publishedAt: new Date(item.pubDate || item.isoDate || Date.now()),
            image: finalImage,
            views: Math.floor(Math.random() * 50) // Initial randomized views for engagement
          };

          store.saveArticle(article);
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

    } else {
      console.log(`[RSS] No new articles found during fetch.`);
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

setTimeout(() => { // Initial refresh
  fetcher.refreshAll();
}, 5000);

// Set interval for regular updates (5 minutes for ultra-fresh news)
const UPDATE_INTERVAL = 5 * 60 * 1000;
setInterval(() => {
  console.log("[RSS] High-frequency sync triggered (5m cycle)...");
  fetcher.refreshAll().catch(err => {
    console.error("[RSS] Auto-sync failed:", err.message);
  });
}, UPDATE_INTERVAL);

module.exports = {
  fetchAndProcessNews: (cat) => fetcher.fetchCategory(cat),
  NewsFetcher: fetcher,
  ArticleStore: store
};