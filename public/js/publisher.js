/**
 * PrimeReport Automated Publisher Engine
 * Handles RSS fetching, scraping, deduplication, and storage.
 */

const PUBLISHER_CONFIG = {
    FETCH_INTERVAL: 300000, // 5 minutes
    BATCH_SIZE: 15,         // Articles per feed per run
    MAX_REQUESTS: 50,       // Global safety limit per cycle
    STORAGE_KEY: 'primeReportArticles'
};

const RSS_PROXY = "https://api.allorigins.win/raw?url=";
const CONTENT_PROXY = "https://api.allorigins.win/raw?url="; // Keeping raw for now but will monitor

class PublisherEngine {
    // ... constructor and init preserved ...
    constructor() {
        this.sources = [];
        this.isProcessing = false;
        this.init();
    }

    async init() {
        console.log("Publisher Engine initializing...");
        try {
            const res = await fetch('../data/rss-sources.json');
            this.sources = await res.json();
            console.log(`Loaded ${this.sources.length} RSS sources.`);
            
            // Start the scheduler
            this.startScheduler();
            
            // Immediate first run
            this.runCycle();
        } catch (error) {
            console.error("Publisher Init Failed:", error);
        }
    }

    startScheduler() {
        setInterval(() => this.runCycle(), PUBLISHER_CONFIG.FETCH_INTERVAL);
    }

    async runCycle() {
        if (this.isProcessing) return;
        this.isProcessing = true;
        console.log("Starting publishing cycle...");

        let totalNew = 0;
        let globalProcessedCount = 0;

        for (const source of this.sources) {
            if (globalProcessedCount >= PUBLISHER_CONFIG.MAX_REQUESTS) break;

            try {
                const items = await this.fetchFeed(source);
                const newArticles = await this.processItems(items, source);
                
                if (newArticles.length > 0) {
                    this.saveArticles(newArticles);
                    totalNew += newArticles.length;
                    globalProcessedCount += newArticles.length;
                }
                
                // Small delay between sources to avoid rate limits
                await new Promise(r => setTimeout(r, 1000));
            } catch (error) {
                console.error(`Error processing source ${source.name}:`, error);
            }
        }

        console.log(`Cycle complete. Published ${totalNew} new articles.`);
        this.isProcessing = false;
        
        // Notify admin dashboard if active
        if (window.loadDashboardStats) window.loadDashboardStats();
    }

    async fetchFeed(source) {
        try {
            const proxyUrl = RSS_PROXY + encodeURIComponent(source.url);
            const res = await fetch(proxyUrl);
            const xmlContent = await res.text();
            
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
            const items = xmlDoc.querySelectorAll("item");
            
            return Array.from(items).slice(0, PUBLISHER_CONFIG.BATCH_SIZE).map(item => {
                let image = "";
                const mediaContent = item.getElementsByTagName("media:content")[0];
                const mediaThumbnail = item.getElementsByTagName("media:thumbnail")[0];
                const enclosure = item.querySelector("enclosure[type^='image']");
                
                if (mediaContent) image = mediaContent.getAttribute("url");
                else if (mediaThumbnail) image = mediaThumbnail.getAttribute("url");
                else if (enclosure) image = enclosure.getAttribute("url");
                
                if (!image) {
                    const description = item.querySelector("description")?.textContent || "";
                    const imgMatch = description.match(/<img.*?src="(.*?)"/);
                    if (imgMatch) image = imgMatch[1];
                }

                if (!image) {
                    image = "assets/image/news-placeholder.jpg";
                }

                return {
                    title: item.querySelector("title")?.textContent || "Untitled",
                    link: item.querySelector("link")?.textContent || "",
                    description: item.querySelector("description")?.textContent || "",
                    pubDate: item.querySelector("pubDate")?.textContent || new Date().toISOString(),
                    image: image
                };
            });
        } catch (error) {
            console.warn(`Fetch failed for ${source.name}:`, error);
            return [];
        }
    }

    async processItems(items, source) {
        const stored = JSON.parse(localStorage.getItem(PUBLISHER_CONFIG.STORAGE_KEY) || "[]");
        const newArticles = [];

        for (const item of items) {
            // Deduplication
            if (stored.some(a => a.link === item.link) || newArticles.some(a => a.link === item.link)) {
                continue;
            }

            try {
                // Scrape full content (Optional rewrite logic can go here)
                const fullContent = await this.scrapeContent(item.link) || item.description;
                
                const article = {
                    id: 'article_' + Date.now() + Math.random().toString(36).substring(7),
                    title: item.title,
                    content: fullContent,
                    summary: item.description?.replace(/<[^>]*>?/gm, '').substring(0, 200),
                    image: item.image || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800",
                    category: source.category,
                    source: source.name.split(' ')[0], // BBC, NYT, etc.
                    link: item.link,
                    date: item.pubDate || new Date().toISOString(),
                    published_at: new Date().toISOString()
                };

                newArticles.push(article);
                
                // Throttle requests
                await new Promise(r => setTimeout(r, 500));
            } catch (error) {
                console.warn(`Processing item failed: ${item.link}`, error);
            }
        }

        return newArticles;
    }

    async scrapeContent(url) {
        try {
            const res = await fetch(CONTENT_PROXY + encodeURIComponent(url));
            const html = await res.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            
            // Basic cleanup: find main article text
            // Professional sites often use <article> or specific classes
            const articleBody = doc.querySelector("article, .article-body, .article-content, .story-body");
            if (articleBody) {
                // Remove scripts, ads, etc.
                const clean = articleBody.cloneNode(true);
                clean.querySelectorAll("script, style, iframe, .ad, .social-share").forEach(el => el.remove());
                return clean.innerHTML;
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    saveArticles(newArticles) {
        const stored = JSON.parse(localStorage.getItem(PUBLISHER_CONFIG.STORAGE_KEY) || "[]");
        const updated = [...newArticles, ...stored].slice(0, 1000); // Keep last 1000
        localStorage.setItem(PUBLISHER_CONFIG.STORAGE_KEY, JSON.stringify(updated));
    }

    extractImageFromDesc(desc) {
        if (!desc) return null;
        const match = desc.match(/<img[^>]+src="([^">]+)"/);
        return match ? match[1] : null;
    }
}

// Global instance
window.publisher = new PublisherEngine();
