const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');
const fetch = require('node-fetch');
const { resolveGoogleNewsURL, extractArticleData } = require('./services/image-service');
const store = require('./articleStore');
const TrendingEngine = require('./services/trending-engine');

const FEEDS_FILE = path.join(__dirname, 'data', 'feeds.json');
const ARTICLES_FILE = path.join(__dirname, 'data', 'articles.json');

const trendingEngine = new TrendingEngine(store);

class NewsFetcher {
    constructor() {
        this.parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_"
        });
        
        if (!fs.existsSync(path.join(__dirname, 'data'))) {
            fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
        }
    }

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

    async refreshAll() {
        console.log("[RSS] Starting background sync engine...");
        const activeFeeds = this.loadFeeds();
        if (activeFeeds.length === 0) return [];

        let newCount = 0;
        const currentArticles = store.getAll();
        const existingLinks = new Set(currentArticles.map(a => a.link));

        for (const feed of activeFeeds) {
            try {
                console.log(`[RSS] Fetching category: ${feed.category || feed.name}...`);
                const response = await fetch(feed.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                const xml = await response.text();
                const parsed = this.parser.parse(xml);
                
                let arr = parsed.rss?.channel?.item || parsed.feed?.entry || [];
                const items = Array.isArray(arr) ? arr : [arr];
                
                // Process only top items for speed and rate limits
                for (const item of items.slice(0, 8)) {
                    const rawLink = item.link || '';
                    if (!rawLink) continue;
                    
                    // Resolve Google News redirect (Optimized)
                    const realLink = await resolveGoogleNewsURL(rawLink);
                    if (!realLink || existingLinks.has(realLink)) continue;
                    
                    const guid = item.guid?.['#text'] || item.guid || realLink;
                    const rawTitle = this.decodeEntities(item.title || '');
                    
                    let rssImage = null;
                    const mediaContent = item['media:content'] || item['media:thumbnail'];
                    if (mediaContent) {
                        rssImage = mediaContent['@_url'] || mediaContent.url;
                    } else if (item.enclosure) {
                        rssImage = item.enclosure['@_url'] || item.enclosure.url;
                    }
                    
                    const rawDescription = this.decodeEntities(
                        (item.description || '').replace(/<[^>]*>?/gm, '').trim()
                    );
                    
                    // Parallel metadata extraction
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
                    
                    store.setArticle(article);
                    existingLinks.add(realLink);
                    newCount++;
                }

            } catch (err) {
                console.error(`[RSS] Error [${feed.name}]:`, err.message);
            }
        }
        
        if (newCount > 0) {
            console.log(`[RSS] Sync complete. Added ${newCount} new articles.`);
            trendingEngine.calculateScores();
            store.persist();
        }
        
        return store.getAll();
    }
    
    async fetchCategory(category) {
        const cat = (category || 'world').toLowerCase();
        
        if (cat === 'trending') return store.getTrending();
        if (cat === 'breaking') return store.getAll().slice(0, 10);
        if (cat === 'hero') return store.getHero();
        
        let articles = store.getByCategory(cat);

        // Fallback fetch if store is cold
        if (articles.length === 0) {
            console.log(`[RSS] Cache miss for ${cat}, triggering refresh...`);
            await this.refreshAll();
            articles = store.getByCategory(cat);
        }
        
        return articles;
    }
}

const fetcher = new NewsFetcher();

// Boot delay to let system stabilize, then periodic refresh
setTimeout(() => fetcher.refreshAll(), 5000);
setInterval(() => fetcher.refreshAll().catch(console.error), 10 * 60 * 1000);

module.exports = {
    fetchNews:           (cat) => fetcher.fetchCategory(cat),
    fetchAndProcessNews: (cat) => fetcher.fetchCategory(cat),
    NewsFetcher: fetcher,
    ArticleStore: store
};
