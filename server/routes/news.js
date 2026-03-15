router.get("/:id", async (req, res) => {
  try {
    const id = decodeURIComponent(req.params.id);

    let articles = NewsFetcher.getArticlesCache();

    // If cache empty, fetch fresh news
    if (!articles || articles.length === 0) {
      articles = await fetchAndProcessNews("world");
    }

    let article = articles.find(a => a.id === id);

    // If still not found, search other categories
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
        article = list.find(a => a.id === id);
        if (article) break;
      }
    }

    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    res.json(article);

  } catch (error) {
    console.error("Single article error:", error);
    res.status(500).json({ error: "Server error" });
  }
});