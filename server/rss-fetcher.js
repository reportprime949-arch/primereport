const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');
const fetch = require('node-fetch');
const { resolveGoogleNewsURL, extractArticleData } = require('./services/image-service');

const FEEDS_FILE = path.join(__dirname, 'data', 'feeds.json');
const ARTICLES_FILE = path.join(__dirname, 'data', 'articles.json');

// Safely require social-publisher (non-fatal if missing)
let publishToSocialMedia = async () => {};
try { ({ publishToSocialMedia } = require('./social-publisher')); } catch(_) {}

class NewsFetcher {
    constructor() {
        this.parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_"
        });
        
        // Ensure data directory exists
        if (!fs.existsSync(path.join(__dirname, 'data'))) {
            fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
        }
    }

    // ── Decode HTML entities from RSS text ───────────────────────────────────────
    decodeEntities(str) {
        if (!str) return '';
        return String(str)
            .replace(/&amp;/g,  '&')
            .replace(/&lt;/g,   '<')
            .replace(/&gt;/g,   '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g,  "'")
            .replace(/&nbsp;/g, ' ')
            .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
            .replace(/\s+/g, ' ')
            .trim();
    }

    loadFeeds() {
        try {
            if (fs.existsSync(FEEDS_FILE)) {
                const data = fs.readFileSync(FEEDS_FILE, 'utf8');
                const parsed = JSON.parse(data);
                return (parsed.feeds || []).filter(f => f.enabled);
            }
            return [];
        } catch (err) {
            console.error('Error loading feeds.json:', err.message);
            return [];
        }
    }

    saveArticles(articles) {
        try {
            fs.writeFileSync(ARTICLES_FILE, JSON.stringify(articles, null, 2), 'utf8');
        } catch (err) {
            console.error('Error saving articles.json:', err.message);
        }
    }
    
    getArticlesCache() {
        try {
            if (fs.existsSync(ARTICLES_FILE)) {
                return JSON.parse(fs.readFileSync(ARTICLES_FILE, 'utf8'));
            }
        } catch(e) {}
        return [];
    }

    async refreshAll() {
        console.log("Starting global RSS sync...");
        const activeFeeds = this.loadFeeds();
        if (activeFeeds.length === 0) {
            console.log("No active feeds found.");
            return [];
        }

        let allArticles = this.getArticlesCache();
        const existingLinks = new Set(allArticles.map(a => a.link));
        let newCount = 0;

        for (const feed of activeFeeds) {
            try {
                console.log(`[RSS] Fetching ${feed.name}...`);
                const response = await fetch(feed.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                const xml = await response.text();
                const parsed = this.parser.parse(xml);
                
                let arr = parsed.rss?.channel?.item || parsed.feed?.entry || [];
                const items = Array.isArray(arr) ? arr : [arr];
                
                // Process only top items to avoid hitting rate limits
                const topItems = items.slice(0, 5);
                
                for (const item of topItems) {
                    const rawLink = item.link || '';
                    if (!rawLink) continue;
                    
                    const guid = item.guid?.['#text'] || item.guid || rawLink;
                    const rawTitle = this.decodeEntities(item.title || '');
                    
                    // Resolve Google News redirect
                    const realLink = await resolveGoogleNewsURL(rawLink);
                    if (!realLink || existingLinks.has(realLink)) continue;
                    
                    // Extract image from RSS if available
                    let rssImage = null;
                    const mediaContent = item['media:content'] || item['media:thumbnail'];
                    if (mediaContent) {
                        rssImage = mediaContent['@_url'] || mediaContent.url;
                    } else if (item.enclosure) {
                        rssImage = item.enclosure['@_url'] || item.enclosure.url;
                    }
                    
                    // Decode HTML entities in description for clean extraction
                    const rawDescription = this.decodeEntities(
                        (item.description || '').replace(/<[^>]*>?/gm, '').trim()
                    );
                    
                    // Extract extra article data using our service
                    const { image: extractedImage, content } = await extractArticleData(realLink);
                    
                    const finalImage = rssImage || extractedImage || '/assets/images/news-placeholder.jpg';
                    
                    let sourceName = item.source?.['#text'] || item['dc:publisher'] || '';
                    if (!sourceName && realLink) {
                        try { sourceName = new URL(realLink).hostname.replace('www.', ''); } catch (_) {}
                    }

                    const article = {
                        id: guid,
                        title: rawTitle,
                        summary: rawDescription.substring(0, 220),
                        description: rawDescription.substring(0, 500),
                        content: content || item['content:encoded'] || item.content || rawDescription,
                        link: realLink,
                        category: feed.category || 'World',
                        source: sourceName || 'News Source',
                        publishedAt: new Date(item.pubDate || item.published || item.updated || Date.now()),
                        image: finalImage
                    };
                    
                    allArticles.unshift(article);
                    existingLinks.add(realLink);
                    newCount++;
                }

            } catch (err) {
                console.error(`RSS Fetch Error [${feed.name}]:`, err.message);
            }
        }
        
        if (newCount > 0) {
            // Keep max 500 articles
            if (allArticles.length > 500) allArticles = allArticles.slice(0, 500);
            this.saveArticles(allArticles);
            console.log(`Global sync complete. Saved ${newCount} new articles.`);
        } else {
            console.log("Global sync complete. No new articles.");
        }
        
        return allArticles;
    }
    
    // Fallback getter memory layer (mostly useful if cached file gets somehow deleted while running)
    async fetchCategory(category) {
        const cat = (category || 'world').toLowerCase();
        const articles = this.getArticlesCache();
        
        if (articles.length === 0) {
            // First run logic
            return await this.refreshAll();
        }
        
        if (cat === 'trending') return articles.slice(0, 5);
        if (cat === 'breaking') return articles.slice(0, 10);
        
        return articles.filter(a => (a.category || '').toLowerCase() === cat);
    }
}

const fetcher = new NewsFetcher();

// Auto-run every 10 minutes
setInterval(() => {
    fetcher.refreshAll().catch(console.error);
}, 10 * 60 * 1000);

module.exports = {
    fetchNews:           (cat) => fetcher.fetchCategory(cat),
    fetchAndProcessNews: (cat) => fetcher.fetchCategory(cat),
    NewsFetcher: fetcher
};
