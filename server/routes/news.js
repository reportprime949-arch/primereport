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
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * GET /api/news
 */
router.get("/", (req, res) => {
    try {
        let category = req.query.category;
        let articles = ArticleStore.getAll();
        
        // Normalize Category
        if (category) {
            category = category.toLowerCase();
            if (category === "tech") category = "technology";
        }

        if (category && category !== "all") {
            articles = articles.filter(a => {
                if (!a.category) return false;
                const aCat = a.category.toLowerCase();
                // Exact match or includes for flexibility, but normalized
                return aCat === category || aCat.includes(category);
            });
        }

        console.log("API RESPONSE:", articles.length);
        res.json({ success: true, articles });
    } catch (error) {
        console.error("API Error:", error);
        res.json({ success: false, articles: [] });
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