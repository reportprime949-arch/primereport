router.get("/:id", async (req, res) => {
  try {
    const id = decodeURIComponent(req.params.id);

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

  } catch (err) {
    console.error("Article fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});