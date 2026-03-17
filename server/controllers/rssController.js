const { NewsFetcher, ArticleStore } = require("../rss-fetcher");
const { readJSON, writeJSON } = require("../utils/helpers");
const notifService = require("../services/notif-service");

function getFeeds() {
    return readJSON("feeds.json", { feeds: [] }).feeds || [];
}

function saveFeeds(feeds) {
    writeJSON("feeds.json", { feeds });
}

exports.list = (req, res) => res.json(getFeeds());

exports.add = (req, res) => {
    const feeds = getFeeds();
    const newFeed = {
        id: "rss_" + Date.now(),
        ...req.body,
        enabled: req.body.enabled !== false
    };
    feeds.push(newFeed);
    saveFeeds(feeds);
    res.json(newFeed);
};

exports.update = (req, res) => {
    let feeds = getFeeds();
    const idx = feeds.findIndex(f => f.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Feed not found" });
    feeds[idx] = { ...feeds[idx], ...req.body };
    saveFeeds(feeds);
    res.json(feeds[idx]);
};

exports.delete = (req, res) => {
    let feeds = getFeeds();
    feeds = feeds.filter(f => f.id !== req.params.id);
    saveFeeds(feeds);
    res.json({ success: true });
};

exports.sync = async (req, res) => {
    try {
        const articlesBefore = ArticleStore.getAll().length;
        await NewsFetcher.refreshAll();
        const articlesAfter = ArticleStore.getAll().length;
        const diff = articlesAfter - articlesBefore;
        
        if (diff > 0) {
            notifService.addNotif(`RSS Sync complete: ${diff} new articles added.`, "success");
        }
        
        res.json({ success: true, count: diff });
    } catch (err) {
        res.status(500).json({ error: "Sync failed" });
    }
};
