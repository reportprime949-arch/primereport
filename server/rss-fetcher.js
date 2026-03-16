const fs = require("fs");
const path = require("path");
const Parser = require("rss-parser");
const axios = require("axios");
const crypto = require("crypto");

const { resolveGoogleNewsURL, extractArticleData } = require("./services/image-service");
const store = require("./articleStore");
const TrendingEngine = require("./services/trending-engine");
const generateHighCTRHeadline = require("./services/ai-headline-generator");
const expandArticle = require("./services/article-expander");
const generateImage = require("./ai-image");
const { updateNewsSitemap } = require("./services/news-sitemap-generator");
const seoEngine = require("./services/seo-engine");
const InternalLinkEngine = require("./services/internal-linker");

const DATA_DIR = path.join(__dirname, "data");
const FEEDS_FILE = path.join(DATA_DIR, "feeds.json");
const CACHE_DIR = path.join(DATA_DIR, "rss_cache");

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
const linkEngine = new InternalLinkEngine(store);

class NewsFetcher {
  constructor() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  async fetchWithCache(url) {
    const hash = crypto.createHash('md5').update(url).digest('hex');
    const cacheFile = path.join(CACHE_DIR, `${hash}.xml`);
    
    // Cache for 15 minutes to reduce network load
    if (fs.existsSync(cacheFile) && (Date.now() - fs.statSync(cacheFile).mtimeMs < 15 * 60 * 1000)) {
        return fs.readFileSync(cacheFile, 'utf8');
    }

    try {
        const response = await axios.get(url, {
            headers: { "User-Agent": "Mozilla/5.0" },
            timeout: 15000
        });
        fs.writeFileSync(cacheFile, response.data);
        return response.data;
    } catch (err) {
        if (fs.existsSync(cacheFile)) return fs.readFileSync(cacheFile, 'utf8');
        throw err;
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
      if (!fs.existsSync(FEEDS_FILE)) return [];
      const raw = fs.readFileSync(FEEDS_FILE, "utf8");
      const parsed = JSON.parse(raw);
      return (parsed.feeds || []).filter(f => f.enabled);
    } catch (err) {
      console.error("[RSS] Feed load error:", err.message);
      return [];
    }
  }

  async refreshAll() {
    console.log("[RSS] Starting high-frequency [ULTRA] sync...");
    const feeds = this.loadFeeds();
    if (feeds.length === 0) return [];

    const existingArticles = store.getAll();
    const existingLinks = new Set(existingArticles.map(a => a.link));
    let newCount = 0;

    for (const feed of feeds) {
      try {
        const xmlData = await this.fetchWithCache(feed.url);
        const feedData = await parser.parseString(xmlData);
        const items = feedData.items || [];

        for (const item of items.slice(0, 10)) {
          const rawLink = item.link;
          if (!rawLink) continue;

          const realLink = await resolveGoogleNewsURL(rawLink);
          if (!realLink || existingLinks.has(realLink)) continue;

          const rawTitle = this.decodeEntities(item.title || "");
          const rawSummary = this.decodeEntities((item.contentSnippet || item.content || item.summary || "").replace(/<[^>]*>/g, ""));
          const sourceName = item.publisher || feed.name || "News";
          
          // 1. AI Headline Generation
          const finalTitle = await generateHighCTRHeadline(rawTitle, feed.category);

          // 2. Article Content Expansion
          const { image: scrapedImage, content: scrapedContent } = await extractArticleData(realLink);
          let expandedContent = await expandArticle(scrapedContent || rawSummary, finalTitle, feed.category);
          
          // 3. Ultra Internal Linking
          expandedContent = linkEngine.linkify(expandedContent || scrapedContent || rawSummary, feed.category);

          // 4. Image Pipeline
          let finalImage = null;
          if (item.mediaContent && item.mediaContent.$?.url) finalImage = item.mediaContent.$.url;
          else if (item.mediaThumbnail && item.mediaThumbnail.$?.url) finalImage = item.mediaThumbnail.$.url;
          else if (scrapedImage) finalImage = scrapedImage;

          if (!finalImage || finalImage.includes('favicon') || finalImage.length < 10) {
            finalImage = await generateImage(finalTitle);
          }

          const pubDate = new Date(item.pubDate || item.isoDate || Date.now());
          const isBreaking = (Date.now() - pubDate.getTime()) < (30 * 60 * 1000);

          const article = {
            id: item.guid || item.id || `feed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: finalTitle,
            summary: rawSummary.substring(0, 240),
            content: expandedContent,
            link: realLink,
            category: feed.category || "World",
            source: sourceName,
            publishedAt: pubDate,
            image: finalImage || "/assets/image/news-placeholder.jpg",
            isBreaking: isBreaking,
            views: Math.floor(Math.random() * 200) + 50,
            seo: seoEngine.generateMeta({ 
                title: finalTitle, 
                summary: rawSummary, 
                category: feed.category, 
                image: finalImage,
                link: realLink
            })
          };

          store.saveArticle(article);
          existingLinks.add(realLink);
          newCount++;
        }
      } catch (err) {
        console.error(`[RSS] Feed error (${feed.url}):`, err.message);
      }
    }

    if (newCount > 0) {
      console.log(`[RSS] Successfully ingested ${newCount} fresh articles.`);
      trendingEngine.calculateScores();
      store.persist();
      updateNewsSitemap();
    }

    return store.getAll();
  }

  async fetchCategory(category) {
    const cat = (category || "all").toLowerCase();
    if (cat === "trending") return store.getTrending();
    if (cat === "hero") return store.getHero();
    
    let articles = cat === "all" ? store.getAll() : store.getByCategory(cat);
    if (articles.length === 0) {
      await this.refreshAll();
      articles = cat === "all" ? store.getAll() : store.getByCategory(cat);
    }
    return articles;
  }
}

const fetcher = new NewsFetcher();

setInterval(() => {
  fetcher.refreshAll().catch(err => console.error("[RSS] Interval sync failed:", err.message));
}, 5 * 60 * 1000);

module.exports = {
  fetchAndProcessNews: (cat) => fetcher.fetchCategory(cat),
  NewsFetcher: fetcher,
  ArticleStore: store,
  InternalLinkEngine: linkEngine
};