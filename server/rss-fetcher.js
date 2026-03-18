const fs = require("fs");
const path = require("path");
const Parser = require("rss-parser");
const axios = require("axios");
const crypto = require("crypto");
const cron = require("node-cron");

const { resolveGoogleNewsURL, extractArticleData, optimizeAndStoreImage } = require("./services/image-service");
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
const FALLBACK_IMAGE = "https://via.placeholder.com/600x400?text=PrimeReport";

/**
 * Validates if an image URL is working by sending a HEAD request.
 * Returns true if status is 200, false otherwise.
 */
async function validateImageUrl(url) {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) return false;
    try {
        const response = await axios.head(url, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
            timeout: 5000
        });
        return response.status === 200;
    } catch (err) {
        // Fallback to GET if HEAD fails (some servers block HEAD)
        try {
            const response = await axios.get(url, {
                headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
                timeout: 5000,
                maxContentLength: 1024 * 1024 // Limit to 1MB
            });
            return response.status === 200;
        } catch (getErr) {
            console.warn(`[RSS] Image validation failed for ${url}: ${getErr.message}`);
            return false;
        }
    }
}

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
      ["enclosure", "enclosure"],
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
    this.isSyncing = false;
  }

  async fetchWithCache(url) {
    const hash = crypto.createHash('md5').update(url).digest('hex');
    const cacheFile = path.join(CACHE_DIR, `${hash}.xml`);
    
    // Cache for 8 minutes (slightly less than the 10-min cron to ensure fresh data)
    if (fs.existsSync(cacheFile) && (Date.now() - fs.statSync(cacheFile).mtimeMs < 8 * 60 * 1000)) {
        return fs.readFileSync(cacheFile, 'utf8');
    }

    try {
        const response = await axios.get(url, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
            timeout: 20000
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
    if (this.isSyncing) {
        console.log("[RSS] Sync already in progress, skipping...");
        return store.getAll();
    }

    this.isSyncing = true;
    console.log("[RSS] Starting production-grade sync process...");
    
    const feeds = this.loadFeeds();
    if (feeds.length === 0) {
        this.isSyncing = false;
        return store.getAll();
    }

    const existingArticles = store.getAll();
    const existingLinks = new Set(existingArticles.map(a => a.link));
    let newCount = 0;

    for (const feed of feeds) {
      try {
        console.log(`[RSS] Processing feed: ${feed.name} (${feed.url})`);
        const xmlData = await this.fetchWithCache(feed.url);
        const feedData = await parser.parseString(xmlData);
        const items = feedData.items || [];

        for (const item of items.slice(0, 15)) {
          try {
            const rawLink = item.link;
            if (!rawLink) continue;

            const realLink = await resolveGoogleNewsURL(rawLink);
            if (!realLink || existingLinks.has(realLink)) continue;

            const rawTitle = this.decodeEntities(item.title || "");
            const rawSummary = this.decodeEntities((item.contentSnippet || item.content || item.summary || "").replace(/<[^>]*>/g, ""));
            const sourceName = item.publisher || feed.name || "News";
            
            // 1. AI Headline Generation
            const finalTitle = await generateHighCTRHeadline(rawTitle, feed.category);

            // 2. Article Content Extraction & Expansion
            const { image: scrapedImage, content: scrapedContent } = await extractArticleData(realLink);
            let expandedContent = await expandArticle(scrapedContent || rawSummary, finalTitle, feed.category);
            
            // 3. Internal Linking
            expandedContent = linkEngine.linkify(expandedContent || scrapedContent || rawSummary, feed.category);

            // 4. Image Guarantee Pipeline (The Priority Chain)
            let finalImage = null;

            // Priority 1: RSS media:content, media:thumbnail or enclosure
            if (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) {
                finalImage = item.mediaContent.$.url;
            } else if (item.mediaThumbnail && item.mediaThumbnail.$ && item.mediaThumbnail.$.url) {
                finalImage = item.mediaThumbnail.$.url;
            } else if (item.enclosure && item.enclosure.url) {
                finalImage = item.enclosure.url;
            }
            
            // Priority 2: Scraped og:image / meta image
            if (!finalImage || isLogoUrl(finalImage)) {
                finalImage = scrapedImage;
            }

            // Priority 3: AI Generated Image (Fallback if scraping yielded nothing)
            if (!finalImage || isLogoUrl(finalImage) || finalImage.length < 10) {
                try {
                    finalImage = await generateImage(finalTitle);
                } catch (aiImgErr) {
                    console.warn(`[RSS] AI Image generation failed: ${aiImgErr.message}`);
                }
            }

            // --- STRICT IMAGE VALIDATION ---
            // Requirement 5: Skip any article that does NOT have a valid image URL
            if (!finalImage || isLogoUrl(finalImage) || finalImage.trim() === "") {
                console.log(`[RSS] Skipping article (No image): ${finalTitle}`);
                continue;
            }

            const isValid = await validateImageUrl(finalImage);
            if (!isValid) {
                console.log(`[RSS] Skipping article (Invalid/Unreachable image): ${finalTitle} - ${finalImage}`);
                continue;
            }
            // -------------------------------

            // Phase 6: Localize and Optimize Image
            const optimizedImage = await optimizeAndStoreImage(finalImage);
            if (!optimizedImage || optimizedImage === finalImage && !finalImage.startsWith('/')) {
                 // If optimization failed and we still have a remote URL, 
                 // we can either keep it or skip it based on strictness.
                 // For now, let's keep it if validated, but update finalImage.
                 finalImage = optimizedImage || finalImage;
            } else {
                 finalImage = optimizedImage;
            }

            const pubDate = new Date(item.pubDate || item.isoDate || Date.now());
            const isBreaking = (Date.now() - pubDate.getTime()) < (45 * 60 * 1000);

            const article = {
              id: item.guid || item.id || crypto.createHash('md5').update(realLink).digest('hex'),
              title: finalTitle,
              summary: rawSummary.substring(0, 300),
              content: expandedContent,
              link: realLink,
              category: feed.category || "World",
              source: sourceName,
              publishedAt: pubDate,
              image: finalImage,
              isBreaking: isBreaking,
              views: Math.floor(Math.random() * 500) + 100,
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
          } catch (itemErr) {
            console.error(`[RSS] Item processing error:`, itemErr.message);
          }
        }
      } catch (feedErr) {
        console.error(`[RSS] Feed failure (${feed.url}):`, feedErr.message);
      }
    }

    if (newCount > 0 || this.isForced) {
      console.log(`[RSS] Sync complete. Ingested ${newCount} new items.`);
      trendingEngine.calculateScores();
      store.enforceLimit(100);
      store.persist();
      updateNewsSitemap();
    }

    this.isSyncing = false;
    this.isForced = false;
    return store.getAll();
  }

  async deepReset() {
    console.log("[RSS] Initiating deep system reset...");
    
    // 1. Clear Article Store
    store.clear();

    // 2. Wipe RSS Cache folder
    if (fs.existsSync(CACHE_DIR)) {
        const files = fs.readdirSync(CACHE_DIR);
        files.forEach(file => {
            try { fs.unlinkSync(path.join(CACHE_DIR, file)); } catch(e) {}
        });
    }

    // 3. Trigger Fresh Fetch immediately
    this.isForced = true;
    return await this.refreshAll();
  }

  async fetchCategory(category) {
    const cat = (category || "all").toLowerCase();
    if (cat === "trending") return store.getTrending();
    if (cat === "hero") return store.getHero();
    
    let articles = cat === "all" ? store.getAll() : store.getByCategory(cat);
    return articles;
  }

  initSchedule() {
    // Run every 10 minutes
    cron.schedule("*/10 * * * *", () => {
      console.log("[Cron] Starting scheduled news update...");
      this.refreshAll().catch(err => console.error("[Cron] Sync failed:", err.message));
    });
    console.log("[RSS] Scheduled task initialized (every 10 minutes)");
  }
}

// Helper to check for logo/bad domains (duplicated here for safety or import properly)
function isLogoUrl(url) {
    if (!url) return true;
    const l = url.toLowerCase();
    const BAD_DOMAINS = ['gstatic.com', 'google.com/images', 'lh3.googleusercontent', 'googlelogo', 'favicon', '1x1', 'blank.gif', 'pixel.gif'];
    return BAD_DOMAINS.some(b => l.includes(b));
}

const fetcher = new NewsFetcher();

// Initialize cron
fetcher.initSchedule();

// Initial sync on startup
setTimeout(() => {
    fetcher.refreshAll().catch(err => console.error("[RSS] Initial sync failed:", err.message));
}, 5000);

module.exports = {
  fetchAndProcessNews: (cat) => fetcher.fetchCategory(cat),
  NewsFetcher: fetcher,
  ArticleStore: store,
  InternalLinkEngine: linkEngine
};