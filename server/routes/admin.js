const express = require("express");
const router = express.Router();
const { NewsFetcher, ArticleStore } = require("../rss-fetcher");
const { readJSON, writeJSON, calculateTotalViews } = require("../utils/helpers");

/* =========================
   AUTH CHECK
========================= */

const verifyAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            error: "Unauthorized: No token provided"
        });
    }

    next();
};

/* =========================
   DASHBOARD & ANALYTICS
========================= */

router.get(["/dashboard", "/stats"], verifyAdmin, (req, res) => {
    try {
        const articles = ArticleStore.getAll();
        const today = new Date().toISOString().split("T")[0];

        const dailyArticles = articles.filter(a => {
            const dateStr = a.publishedAt instanceof Date 
                ? a.publishedAt.toISOString() 
                : String(a.publishedAt || a.date || "");
            return dateStr.startsWith(today);
        }).length;

        const breakingNews = articles.filter(a => a.isBreaking).length;
        const totalViews = articles.reduce((sum, a) => sum + (parseInt(a.views) || 0), 0);

        res.json({
            totalArticles: articles.length,
            breakingNews: breakingNews,
            totalViews: totalViews + 1200, // Matching helper logic
            dailyArticles: dailyArticles,
            rssImports: articles.filter(a => String(a.id || "").startsWith('feed_')).length
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Dashboard stats failed" });
    }
});

router.get("/analytics", verifyAdmin, (req, res) => {
    try {
        const articles = ArticleStore.getAll();
        
        // Generate last 7 days for the graph
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d.toISOString().split('T')[0]);
        }

        const graphData = days.map(day => {
            const dayArticles = articles.filter(a => (a.publishedAt || a.date || "").startsWith(day));
            return {
                date: day,
                views: dayArticles.reduce((sum, a) => sum + (a.views || 0), 0),
                articles: dayArticles.length
            };
        });

        res.json({
            totalArticles: articles.length,
            totalViews: calculateTotalViews(articles),
            graphData: graphData,
            categoryCount: articles.reduce((acc, a) => {
                const cat = a.category || 'Uncategorized';
                acc[cat] = (acc[cat] || 0) + 1;
                return acc;
            }, {}),
            topArticles: [...articles].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5)
        });
    } catch (err) {
        res.status(500).json({ error: "Analytics failed" });
    }
});

/* =========================
   ARTICLES CRUD (Plural & Singular)
========================= */

// GET ALL
router.get("/articles", verifyAdmin, (req, res) => {
    res.json(ArticleStore.getAll());
});

// CREATE
router.post(["/article", "/articles"], verifyAdmin, (req, res) => {
    const newArticle = {
        id: "manual_" + Date.now(),
        publishedAt: new Date().toISOString(),
        views: 0,
        ...req.body
    };

    ArticleStore.saveArticle(newArticle);
    ArticleStore.persist();
    res.json(newArticle);
});

// UPDATE
router.put(["/article/:id", "/articles/:id"], verifyAdmin, (req, res) => {
    const updated = ArticleStore.updateArticle(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Article not found" });
    
    ArticleStore.persist();
    res.json(updated);
});

// DELETE
router.delete(["/article/:id", "/articles/:id"], verifyAdmin, (req, res) => {
    const success = ArticleStore.deleteArticle(req.params.id);
    if (success) {
        ArticleStore.persist();
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "Article not found" });
    }
});

/* =========================
   NOTIFICATIONS
========================= */

router.get("/notifications", verifyAdmin, (req, res) => {
    res.json([
        { id: 1, text: "RSS Sync: 12 new articles added", time: "5m ago", type: "success" },
        { id: 2, text: "System maintenance scheduled for tonight", time: "2h ago", type: "info" },
        { id: 3, text: "New user registered as contributor", time: "4h ago", type: "info" }
    ]);
});

/* =========================
   RSS FEEDS
========================= */

function getFeedsArray() {
    const raw = readJSON("feeds.json", { feeds: [] });
    return Array.isArray(raw) ? raw : (raw.feeds || []);
}

function saveFeedsArray(arr) {
    writeJSON("feeds.json", { feeds: arr });
}

router.get("/rss", verifyAdmin, (req, res) => {
    res.json(getFeedsArray());
});

router.post(["/rss", "/rss/add"], verifyAdmin, (req, res) => {
    const feeds = getFeedsArray();
    const newFeed = {
        id: "rss_" + Date.now(),
        name: req.body.name,
        url: req.body.url,
        category: req.body.category,
        enabled: req.body.enabled !== false
    };
    feeds.push(newFeed);
    saveFeedsArray(feeds);
    res.json(newFeed);
});

router.put("/rss/:id", verifyAdmin, (req, res) => {
    let feeds = getFeedsArray();
    const idx = feeds.findIndex(f => f.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Feed not found" });
    feeds[idx] = { ...feeds[idx], ...req.body };
    saveFeedsArray(feeds);
    res.json(feeds[idx]);
});

router.delete("/rss/:id", verifyAdmin, (req, res) => {
    let feeds = getFeedsArray();
    feeds = feeds.filter(f => f.id !== req.params.id);
    saveFeedsArray(feeds);
    res.json({ success: true });
});

router.post(["/rss-sync", "/rss/sync", "/rss/fetch"], verifyAdmin, async (req, res) => {
    try {
        const articlesBefore = ArticleStore.getAll().length;
        await NewsFetcher.refreshAll();
        const articlesAfter = ArticleStore.getAll().length;
        res.json({ success: true, count: articlesAfter - articlesBefore });
    } catch (err) {
        res.status(500).json({ error: "RSS Sync failed" });
    }
});

/* =========================
   CATEGORIES, USERS, SETTINGS, ADS
========================= */

router.get("/categories", verifyAdmin, (req, res) => res.json(readJSON("categories.json") || []));
router.get("/users", verifyAdmin, (req, res) => res.json(readJSON("users.json") || []));
router.get("/settings", verifyAdmin, (req, res) => res.json(readJSON("settings.json") || {}));
router.post("/settings", verifyAdmin, (req, res) => {
    writeJSON("settings.json", req.body);
    res.json({ success: true });
});
router.get("/ads", verifyAdmin, (req, res) => res.json(readJSON("ads.json") || []));
router.post("/ads", verifyAdmin, (req, res) => {
    writeJSON("ads.json", req.body);
    res.json({ success: true });
});
router.get("/ai-settings", verifyAdmin, (req, res) => res.json(readJSON("ai-settings.json") || {}));
router.post("/ai-settings", verifyAdmin, (req, res) => {
    writeJSON("ai-settings.json", req.body);
    res.json({ success: true });
});

/* =========================
   QUEUE
========================= */

router.get("/queue", verifyAdmin, (req, res) => res.json(readJSON("queue.json") || []));

router.delete("/queue/:id", verifyAdmin, (req, res) => {
    let queue = readJSON("queue.json") || [];
    queue = queue.filter(q => q.id !== req.params.id);
    writeJSON("queue.json", queue);
    res.json({ success: true });
});

router.post("/queue/:id/approve", verifyAdmin, (req, res) => {
    let queue = readJSON("queue.json") || [];
    const item = queue.find(q => q.id === req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });

    // Move to ArticleStore
    ArticleStore.saveArticle({
        ...item,
        publishedAt: new Date().toISOString(),
        views: 0
    });
    ArticleStore.persist();

    // Remove from queue
    queue = queue.filter(q => q.id !== req.params.id);
    writeJSON("queue.json", queue);

    res.json({ success: true });
});

module.exports = router;

