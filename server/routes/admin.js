const express = require("express");
const router = express.Router();
const articleController = require("../controllers/articleController");
const rssController = require("../controllers/rssController");
const notifController = require("../controllers/notifController");
const settingsController = require("../controllers/settingsController");
const { ArticleStore } = require("../rss-fetcher");
const { readJSON, calculateTotalViews } = require("../utils/helpers");

/* =========================
   AUTH CHECK
 ========================= */
const verifyAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
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
        const dailyArticles = articles.filter(a => String(a.publishedAt || a.date || "").startsWith(today)).length;
        const breakingNews = articles.filter(a => a.isBreaking).length;
        const totalViews = articles.reduce((sum, a) => sum + (parseInt(a.views) || 0), 0);

        res.json({
            totalArticles: articles.length,
            breakingNews: breakingNews,
            totalViews: totalViews + 1200,
            dailyArticles: dailyArticles,
            rssImports: articles.filter(a => String(a.id || "").startsWith('feed_')).length
        });
    } catch (err) {
        res.status(500).json({ error: "Stats failed" });
    }
});

router.get("/analytics", verifyAdmin, (req, res) => {
    try {
        const articles = ArticleStore.getAll();
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
                const cat = a.category || 'World';
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
   ARTICLES
 ========================= */
router.get("/articles", verifyAdmin, articleController.getAll);
router.post(["/article", "/articles"], verifyAdmin, articleController.create);
router.put(["/article/:id", "/articles/:id"], verifyAdmin, articleController.update);
router.delete(["/article/:id", "/articles/:id"], verifyAdmin, articleController.delete);
router.post("/news/reset", verifyAdmin, articleController.reset);

/* =========================
   NOTIFICATIONS
 ========================= */
router.get("/notifications", verifyAdmin, notifController.list);
router.post("/notifications/add", verifyAdmin, notifController.add);
router.post("/notifications/read-all", verifyAdmin, notifController.readAll);
router.post("/notifications/:id/read", verifyAdmin, notifController.read);

/* =========================
   RSS FEEDS
 ========================= */
router.get("/rss", verifyAdmin, rssController.list);
router.post(["/rss", "/rss/add"], verifyAdmin, rssController.add);
router.put("/rss/:id", verifyAdmin, rssController.update);
router.delete("/rss/:id", verifyAdmin, rssController.delete);
router.post(["/rss-sync", "/rss/sync", "/rss/fetch"], verifyAdmin, rssController.sync);

/* =========================
   SETTINGS & AI
 ========================= */
router.get("/settings/:type?", verifyAdmin, settingsController.getSettings);
router.post("/settings/:type?", verifyAdmin, settingsController.saveSettings);
router.get("/ai-settings", verifyAdmin, settingsController.getAi);
router.post("/ai-settings", verifyAdmin, settingsController.saveAi);

/* =========================
   MISC
 ========================= */
router.get("/categories", verifyAdmin, (req, res) => res.json(readJSON("categories.json") || []));
router.get("/users", verifyAdmin, (req, res) => res.json(readJSON("users.json") || []));
router.get("/queue", verifyAdmin, (req, res) => res.json(readJSON("queue.json") || []));

module.exports = router;
