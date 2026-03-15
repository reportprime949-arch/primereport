const express = require("express");
const router = express.Router();

const fs = require("fs");
const path = require("path");

const { readJSON, writeJSON, calculateTotalViews } = require("../utils/helpers");
const { NewsFetcher } = require("../rss-fetcher");

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
   DASHBOARD
========================= */

router.get("/dashboard", verifyAdmin, (req, res) => {
    try {

        const articles = readJSON("articles.json") || [];

        const today = new Date().toISOString().split("T")[0];

        const dailyArticles = articles.filter(a =>
            (a.publishedAt || "").startsWith(today)
        ).length;

        const breakingNews = articles.filter(a =>
            a.isBreaking === true
        ).length;

        const totalViews = calculateTotalViews(articles);

        res.json({
            totalArticles: articles.length,
            breakingNews: breakingNews,
            totalViews: totalViews,
            dailyArticles: dailyArticles
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Dashboard failed" });
    }
});

// Alias for stats
router.get("/stats", verifyAdmin, (req, res) => {
    const articles = readJSON("articles.json") || [];
    res.json({
        totalArticles: articles.length,
        totalViews: calculateTotalViews(articles)
    });
});



/* =========================
   ARTICLES
========================= */

router.get("/articles", verifyAdmin, (req, res) => {
    res.json(readJSON("articles.json") || []);
});

router.post("/articles", verifyAdmin, (req, res) => {

    const articles = readJSON("articles.json") || [];

    const newArticle = {
        id: "manual_" + Date.now(),
        publishedAt: new Date().toISOString(),
        views: 0,
        ...req.body
    };

    articles.unshift(newArticle);

    writeJSON("articles.json", articles);

    res.json(newArticle);
});

router.delete("/articles/:id", verifyAdmin, (req, res) => {

    let articles = readJSON("articles.json") || [];

    articles = articles.filter(a => a.id !== req.params.id);

    writeJSON("articles.json", articles);

    res.json({ success: true });
});


/* =========================
   CATEGORIES
========================= */

router.get("/categories", verifyAdmin, (req, res) => {
    res.json(readJSON("categories.json") || []);
});


/* =========================
   RSS FEEDS
========================= */

// Helper: read feeds array from the {feeds:[...]} wrapper in feeds.json
function getFeedsArray() {
    const raw = readJSON("feeds.json", { feeds: [] });
    return Array.isArray(raw) ? raw : (raw.feeds || []);
}

// Helper: write feeds array back in the {feeds:[...]} wrapper
function saveFeedsArray(arr) {
    writeJSON("feeds.json", { feeds: arr });
}

router.get("/rss", verifyAdmin, (req, res) => {
    try {
        res.json(getFeedsArray());
    } catch (err) {
        console.error("Failed to load RSS feeds:", err);
        res.status(500).json({ error: "Failed to load RSS feeds" });
    }
});

router.get("/rss/feeds", verifyAdmin, (req, res) => {
    try {
        res.json(getFeedsArray());
    } catch (err) {
        console.error("Failed to load RSS feeds:", err);
        res.status(500).json({ error: "Failed to load RSS feeds" });
    }
});

router.post("/rss", verifyAdmin, (req, res) => {
    try {
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
    } catch (err) {
        console.error("Failed to add RSS feed:", err);
        res.status(500).json({ error: "Failed to add feed" });
    }
});

router.post("/rss/add", verifyAdmin, (req, res) => {
    try {
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
    } catch (err) {
        console.error("Failed to add RSS feed:", err);
        res.status(500).json({ error: "Failed to add feed" });
    }
});

router.put("/rss/:id", verifyAdmin, (req, res) => {
    try {
        let feeds = getFeedsArray();
        const idx = feeds.findIndex(f => f.id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: "Feed not found" });
        feeds[idx] = { ...feeds[idx], ...req.body };
        saveFeedsArray(feeds);
        res.json(feeds[idx]);
    } catch (err) {
        res.status(500).json({ error: "Failed to update feed" });
    }
});

router.delete("/rss/:id", verifyAdmin, (req, res) => {
    try {
        let feeds = getFeedsArray();
        feeds = feeds.filter(f => f.id !== req.params.id);
        saveFeedsArray(feeds);
        res.json({ success: true });
    } catch (err) {
        console.error("Failed to delete RSS feed:", err);
        res.status(500).json({ error: "Failed to delete feed" });
    }
});

router.post("/rss-sync", verifyAdmin, async (req, res) => {
    try {
        const articles = await NewsFetcher.refreshAll();
        res.json({ success: true, count: articles.length });
    } catch (err) {
        res.status(500).json({ error: "RSS Sync failed" });
    }
});

router.post("/rss/sync", verifyAdmin, async (req, res) => {
    try {
        const articles = await NewsFetcher.refreshAll();
        res.json({ success: true, count: articles.length });
    } catch (err) {
        res.status(500).json({ error: "RSS Sync failed" });
    }
});


/* =========================
   ANALYTICS
========================= */

router.get("/analytics", verifyAdmin, (req, res) => {
    try {
        const articles = readJSON("articles.json") || [];
        const totalViews = calculateTotalViews(articles);

        res.json({
            totalArticles: articles.length,
            totalViews: totalViews,
            categoryCount: articles.reduce((acc, a) => {
                const cat = a.category || 'Uncategorized';
                acc[cat] = (acc[cat] || 0) + 1;
                return acc;
            }, {}),
            topArticles: [...articles].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 10)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Analytics failed" });
    }
});


/* =========================
   USERS
========================= */

router.get("/users", verifyAdmin, (req, res) => {
    res.json(readJSON("users.json") || []);
});


/* =========================
   SETTINGS
========================= */

router.get("/settings", verifyAdmin, (req, res) => {
    res.json(readJSON("settings.json") || {});
});

router.post("/settings", verifyAdmin, (req, res) => {

    writeJSON("settings.json", req.body);

    res.json({ success: true });

});


/* =========================
   ADS
========================= */

router.get("/ads", verifyAdmin, (req, res) => {
    res.json(readJSON("ads.json") || []);
});

router.post("/ads", verifyAdmin, (req, res) => {
    writeJSON("ads.json", req.body);
    res.json({ success: true });
});


/* =========================
   AI SETTINGS
========================= */

router.get("/ai-settings", verifyAdmin, (req, res) => {
    res.json(readJSON("ai-settings.json") || {});
});

router.post("/ai-settings", verifyAdmin, (req, res) => {
    writeJSON("ai-settings.json", req.body);
    res.json({ success: true });
});


/* =========================
   QUEUE
========================= */

router.get("/queue", verifyAdmin, (req, res) => {
    res.json(readJSON("queue.json") || []);
});

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

    // Move to articles
    const articles = readJSON("articles.json") || [];
    articles.unshift({
        ...item,
        publishedAt: new Date().toISOString(),
        views: 0
    });
    writeJSON("articles.json", articles);

    // Remove from queue
    queue = queue.filter(q => q.id !== req.params.id);
    writeJSON("queue.json", queue);

    res.json({ success: true });
});


module.exports = router;

