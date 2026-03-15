const express = require("express");
const router = express.Router();

const { fetchAndProcessNews, NewsFetcher } = require("../rss-fetcher");

/* ============================= */
/* Get All News (with pagination) */
/* ============================= */
router.get("/", async (req, res) => {
  try {
    const category = (req.query.category || "world").toLowerCase();
    const page = parseInt(req.query.page || "1");
    const limit = parseInt(req.query.limit || "12");

    const articles = await fetchAndProcessNews(category);

    const start = (page - 1) * limit;
    const pagedArticles = articles.slice(start, start + limit);

    res.json({
      page,
      limit,
      total: articles.length,
      articles: pagedArticles
    });

  } catch (error) {
    console.error("Fetch news error:", error);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

/* ============================= */
/* Get Single Article */
/* ============================= */
router.get("/article/:id", async (req, res) => {
  try {
    const decodedId = decodeURIComponent(req.params.id);

    const articles = NewsFetcher.getArticlesCache();
    const article = articles.find(a => a.id === decodedId);

    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    res.json(article);

  } catch (error) {
    res.status(500).json({ error: "Failed to fetch article" });
  }
});

/* ============================= */
/* Get Single Article (Short Link) */
/* ============================= */
router.get("/:id", async (req, res) => {
  try {
    const decodedId = decodeURIComponent(req.params.id);
    const articles = NewsFetcher.getArticlesCache();
    const article = articles.find(a => a.id === decodedId);

    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    res.json(article);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch article" });
  }
});


/* ============================= */
/* Breaking News */
/* ============================= */
router.get("/breaking", async (req, res) => {
  try {
    const articles = await fetchAndProcessNews("breaking");
    res.json(articles.slice(0, 10));
  } catch (error) {
    res.status(500).json([]);
  }
});

/* ============================= */
/* Trending News */
/* ============================= */
router.get("/trending", async (req, res) => {
  try {
    const articles = await fetchAndProcessNews("trending");
    res.json(articles.slice(0, 10));
  } catch (error) {
    res.status(500).json([]);
  }
});

/* ============================= */
/* Manual RSS Refresh */
/* ============================= */
router.post("/refresh", async (req, res) => {
  try {
    const count = await NewsFetcher.refreshAll();
    res.json({
      message: "Sync complete",
      articlesFetched: count
    });
  } catch (error) {
    res.status(500).json({
      error: "Sync failed"
    });
  }
});

module.exports = router;
