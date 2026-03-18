const { NewsFetcher, ArticleStore } = require("../rss-fetcher");

exports.getAll = (req, res) => {
    const articles = ArticleStore.getAll();
    console.log("Articles count:", articles.length);
    res.json({ success: true, articles });
};

exports.create = (req, res) => {
    const newArticle = {
        id: "manual_" + Date.now(),
        publishedAt: new Date().toISOString(),
        views: 0,
        ...req.body
    };
    ArticleStore.saveArticle(newArticle);
    ArticleStore.persist();
    res.json(newArticle);
};

exports.update = (req, res) => {
    const updated = ArticleStore.updateArticle(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Article not found" });
    ArticleStore.persist();
    res.json(updated);
};

exports.delete = (req, res) => {
    const success = ArticleStore.deleteArticle(req.params.id);
    if (success) {
        ArticleStore.persist();
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "Article not found" });
    }
};

exports.reset = async (req, res) => {
    try {
        const freshArticles = await NewsFetcher.deepReset();
        res.json({ 
            success: true, 
            message: "Deep reset successful.",
            count: freshArticles.length 
        });
    } catch (err) {
        res.status(500).json({ error: "Reset failed" });
    }
};
