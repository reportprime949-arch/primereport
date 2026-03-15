const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');

class TrendDiscoveryService {
    constructor() {
        this.parser = new XMLParser();
        this.trends = [];
    }

    async discoverTrends() {
        console.log("[TRENDS] Discovering new trends...");
        const newTrends = new Set();

        // 1. Google Trends (Daily Trends RSS)
        try {
            const googleResponse = await axios.get('https://trends.google.com/trends/trendingsearches/daily/rss?geo=US');
            const jsonObj = this.parser.parse(googleResponse.data);
            const items = jsonObj.rss?.channel?.item || [];
            items.slice(0, 10).forEach(item => {
                newTrends.add(item.title.toLowerCase());
            });
        } catch (e) {
            console.error("[TRENDS] Google Trends failed:", e.message);
        }

        // 2. Reddit Hot Topics (Mocking/Simple API call to a popular tech subreddit)
        try {
            const redditResponse = await axios.get('https://www.reddit.com/r/technology/hot.json?limit=10', {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            const posts = redditResponse.data?.data?.children || [];
            posts.forEach(post => {
                // Extract keywords from title (simple split for now)
                const keywords = post.data.title.toLowerCase().split(/\W+/).filter(w => w.length > 5);
                keywords.forEach(kw => newTrends.add(kw));
            });
        } catch (e) {
            console.warn("[TRENDS] Reddit fetch limited or failed");
        }

        this.trends = Array.from(newTrends).slice(0, 20);
        console.log("[TRENDS] Current detected trends:", this.trends);
        return this.trends;
    }

    getTrends() {
        return this.trends;
    }
}

const trendService = new TrendDiscoveryService();
module.exports = trendService;
