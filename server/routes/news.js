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

    for (const cat of categories) {

      const articles = await fetchAndProcessNews(cat);

      const article = articles.find(a =>
        a.id === id ||
        decodeURIComponent(a.id || "") === id ||
        (a.id || "").includes(id.substring(0,30))
      );

      if (article) {
        return res.json(article);
      }

    }

    res.status(404).json({ error: "Article not found" });

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: "Server error" });

  }

});