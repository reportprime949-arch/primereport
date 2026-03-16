const express = require("express");
const router = express.Router();
const { fetchAndProcessNews, ArticleStore } = require("../rss-fetcher");

/**
 * GET /api/news/hero
 * Top 5 high-score articles for hero section
 */
router.get("/hero", async (req, res) => {
    try {
        const items = ArticleStore.getHero();
        res.json(items);
    } catch (e) {
        res.status(500).json([]);
    }
});

/**
 * GET /api/news/trending
 * Top 5 trending articles
 */
router.get("/trending", async (req, res) => {
    try {
        const items = ArticleStore.getTrending();
        res.json(items);
    } catch (e) {
        res.status(500).json([]);
    }
});

/**
 * GET /api/news/breaking
 * Top 10 latest articles
 */
router.get("/breaking", async (req, res) => {
    try {
        const articles = await fetchAndProcessNews("breaking");
        res.json(articles);
    } catch (error) {
        res.status(500).json([]);
    }
});

/**
 * GET /api/news
 * Paginated news from cache
 */
router.get("/", async (req, res) => {
    try {
        const category = (req.query.category || "world").toLowerCase();
        const page = parseInt(req.query.page || "1");
        const limit = parseInt(req.query.limit || "12");

        const articles = await fetchAndProcessNews(category);
        const start = (page - 1) * limit;
        
        res.json({
            page,
            limit,
            total: articles.length,
            articles: articles.slice(start, start + limit)
        });
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
        "world",
        "technology",
        "business",
        "politics",
        "science",
        "sports",
        "entertainment"
      ];

      for (const category of categories) {

        const list = await fetchAndProcessNews(category);

        store.saveMany(list);

        article = list.find(a => a.id === id);

        if (article) break;
      }
    }

    if (!article) {
      return res.status(404).json({
        error: "Article not found"
      });
    }

    res.json(article);

  } catch (error) {
    console.error("Article lookup error:", error);

    res.status(500).json({
      error: "Server error"
    });
  }
});

module.exports = router;