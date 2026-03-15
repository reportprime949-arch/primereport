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
 * GET /api/article/:slugOrId
 * High-performance slug/id lookup with greedy fallback fetch
 */
router.get("/:slugOrId", async (req, res) => {
    try {
        const id = decodeURIComponent(req.params.slugOrId);
        
        // 1. Try instant cache lookup (O(1))
        let article = ArticleStore.get(id);
        
        // 2. Greedy fallback: Search across all categories
        if (!article) {
            console.log(`[Cache Miss] Sweeping categories for: ${id}`);
            const categories = [
                "world", "technology", "business", 
                "politics", "science", "sports", "entertainment"
            ];

            for (const cat of categories) {
                // fetchAndProcessNews already populates ArticleStore internally
                const list = await fetchAndProcessNews(cat);
                
                // Re-check store (could be found by slug or id now)
                article = ArticleStore.get(id);
                if (!article) {
                    // Manual find in the returned list as a safety measure
                    article = list.find(a => a.id === id || a.slug === id);
                }

                if (article) {
                    console.log(`[Cache Hit] Found article in ${cat} after sweep.`);
                    break;
                }
            }
        }

        if (!article) {
            return res.status(404).json({ error: "Article not found" });
        }

        res.json(article);
    } catch (error) {
        console.error("Lookup error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;