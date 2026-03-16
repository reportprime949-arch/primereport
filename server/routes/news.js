const express = require("express");
const router = express.Router();
const { fetchAndProcessNews, ArticleStore, InternalLinkEngine } = require("../rss-fetcher");

/**
 * GET /api/news/hero
 */
router.get("/hero", (req, res) => {
    res.json(ArticleStore.getHero());
});

/**
 * GET /api/news/trending
 */
router.get("/trending", (req, res) => {
    res.json(ArticleStore.getTrending());
});

/**
 * GET /api/news/breaking
 */
router.get("/breaking", (req, res) => {
    // Return articles marked as breaking or latest 10
    const all = ArticleStore.getAll();
    const breaking = all.filter(a => a.isBreaking);
    const latest = all.sort((a, b) => new Date(b.publishedAt || b.date) - new Date(a.publishedAt || a.date)).slice(0, 10);
    
    res.json(breaking.length > 0 ? breaking : latest);
});

const NEWS_CACHE = new Map();
const CACHE_TTL = 60 * 1000; // 60 seconds

/**
 * GET /api/news
 */
router.get("/", async (req, res) => {
    try {
        const category = (req.query.category || "world").toLowerCase();
        const page = parseInt(req.query.page || "1");
        const limit = parseInt(req.query.limit || "12");
        const cacheKey = `${category}-${page}-${limit}`;

        // Check cache
        const cached = NEWS_CACHE.get(cacheKey);
        if (cached && Date.now() - cached.time < CACHE_TTL) {
            return res.json(cached.data);
        }

        let articles = category === "all" ? ArticleStore.getAll() : ArticleStore.getByCategory(category);
        
        // Greedy fallback if store is empty for this category
        if (articles.length === 0) {
            await fetchAndProcessNews(category);
            articles = ArticleStore.getByCategory(category);
        }

        articles.sort((a, b) => {
            const dateA = new Date(a.publishedAt || a.date || 0);
            const dateB = new Date(b.publishedAt || b.date || 0);
            return dateB - dateA;
        });

        const start = (page - 1) * limit;
        const result = {
            page,
            limit,
            total: articles.length,
            articles: articles.slice(start, start + limit)
        };

        // Save to cache
        NEWS_CACHE.set(cacheKey, { time: Date.now(), data: result });
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch news" });
    }
});

/**
 * GET /api/news/:id
 * Single article lookup with greedy RSS fallback
 */
router.get("/:id", async (req, res) => {
  try {
    const id = decodeURIComponent(req.params.id);
    const store = require("../articleStore");

    let article = store.get(id);

    if (!article) {
      const categories = [
        "world", "technology", "business", "politics", "science", "sports", "entertainment", "ai"
      ];

      for (const category of categories) {
        const list = await fetchAndProcessNews(category);
        store.saveMany(list);
        article = list.find(a => a.id === id);
        if (article) break;
      }
    }

    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    res.json(article);

  } catch (error) {
    console.error("Article lookup error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/news/:id/related
 */
router.get("/:id/related", async (req, res) => {
    try {
        const id = decodeURIComponent(req.params.id);
        const store = require("../articleStore");
        const article = store.get(id);
        
        if (!article) return res.status(404).json({ error: "Article not found" });

        const related = InternalLinkEngine.getRelatedArticles(article, 5);
        res.json(related);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch related articles" });
    }
});

module.exports = router;