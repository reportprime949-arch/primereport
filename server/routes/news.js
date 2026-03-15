const express = require("express");
const router = express.Router();

const { fetchAndProcessNews, NewsFetcher } = require("../rss-fetcher");

/* ============================= */
/* Breaking News */
/* ============================= */
router.get("/breaking", async (req, res) => {
  try {
    const articles = await fetchAndProcessNews("breaking");
    res.json(articles.slice(0, 10));
  } catch (error) {
    console.error("Breaking news error:", error);
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
    console.error("Trending news error:", error);
    res.status(500).json([]);
  }
});

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
router.get("/:id", async (req, res) => {
  try {
    const id = decodeURIComponent(req.params.id);

    // Get all categories to search
    const categories = [
      "world",
      "technology",
      "business",
      "politics",
      "sports",
      "science",
      "entertainment"
    ];

    let article = null;

    for (const cat of categories) {
      const articles = await fetchAndProcessNews(cat);
      article = articles.find(a => a.id === id);
      if (article) break;
    }

    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    res.json(article);

  } catch (error) {
    console.error("Article fetch error:", error);
    res.status(500).json({ error: "Server error" });
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
    console.error("Refresh error:", error);

    res.status(500).json({
      error: "Sync failed"
    });
  }
});

module.exports = router;