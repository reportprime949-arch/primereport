const Parser = require('rss-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const Article = require('../models/Article');
const { rewriteArticleAI } = require('../ai-rewrite');

const parser = new Parser({
    customFields: {
        item: [
            ['media:content', 'mediaContent'],
            ['enclosure', 'enclosure'],
            ['content:encoded', 'contentEncoded']
        ]
    }
});

class RSSService {
    constructor() {
        this.cache = new Map();
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
        this.feederActive = false;
    }

    async getRSSFeed(url) {
        const now = Date.now();
        if (this.cache.has(url)) {
            const { data, timestamp } = this.cache.get(url);
            if (now - timestamp < this.CACHE_DURATION) {
                console.log(`[RSS] Returning cached data for ${url}`);
                return data;
            }
        }

        try {
            const response = await axios.get(url, { 
                timeout: 30000,
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            const feed = await parser.parseString(response.data);
            this.cache.set(url, { data: feed, timestamp: now });
            return feed;
        } catch (error) {
            console.error(`[RSS] Error fetching feed ${url}:`, error.message);
            throw error;
        }
    }

    async extractImage(item) {
        // 1. Check media:content
        if (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) {
            return item.mediaContent.$.url;
        }
        
        // 2. Check enclosure
        if (item.enclosure && item.enclosure.url) {
            return item.enclosure.url;
        }

        // 3. Extract image from description HTML
        const desc = item.content || item.description || "";
        const descMatch = desc.match(/<img[^>]+src="([^">]+)"/);
        if (descMatch) return descMatch[1];

        // 4. Extract image from contentEncoded (RSS 2.0 extension)
        if (item.contentEncoded) {
            const contentMatch = item.contentEncoded.match(/<img[^>]+src="([^">]+)"/);
            if (contentMatch) return contentMatch[1];
        }

        // 5. Extract image from OpenGraph (Scraping)
        try {
            const response = await axios.get(item.link, { 
                timeout: 3000, 
                headers: { 'User-Agent': 'Mozilla/5.0' } 
            });
            const $ = cheerio.load(response.data);
            const ogImage = $('meta[property="og:image"]').attr('content') || 
                           $('meta[name="twitter:image"]').attr('content') ||
                           $('link[rel="image_src"]').attr('href');
            if (ogImage && !ogImage.includes('gstatic')) return ogImage;
        } catch (e) {}

        // 6. Fallback placeholder
        return "/assets/image/news-placeholder.jpg";
    }

    async seedDummyArticles() {
        console.log("[SEED] Injecting premium dummy articles for demonstration...");
        const demoArticles = [
            {
                title: "Artificial Intelligence vs Human Intuition: The Next Frontier in Global Decision Making",
                category: "AI",
                image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80",
                summary: "As AI models advance at an unprecedented rate, experts debate the delicate balance between algorithmic precision and the irreplaceable nature of human emotional intelligence in leadership."
            },
            {
                title: "Quantum Breakthrough: Scientists Achieve Stable Quantum Teleportation Across Fiber Networks",
                category: "Science",
                image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80",
                summary: "A milestone in quantum computing has been reached, potentially paving the way for a perfectly secure and ultra-fast future internet powered by quantum entanglement."
            }
        ];

        for (const a of demoArticles) {
            const exists = await Article.findOne({ title: a.title });
            if (!exists) {
                await new Article({
                    ...a,
                    id: 'seed-' + Date.now() + Math.random(),
                    content: a.summary + " Full analysis coming soon in our special weekend edition of PrimeReport.",
                    date: new Date(),
                    publishedAt: new Date(),
                    author: "Senior AI Editor",
                    source: "PrimeReport Exclusive"
                }).save();
            }
        }
    }

    async processFeed(category, url) {
        try {
            const feed = await this.getRSSFeed(url);
            for (const item of feed.items.slice(0, 10)) {
                // De-duplication check by Title
                const existing = await Article.findOne({ title: item.title });
                if (existing) continue;

                console.log(`[RSS] Processing new article: ${item.title}`);
                const imageUrl = await this.extractImage(item);
                const fullContent = (item.contentEncoded || item.content || item.description || "").replace(/<[^>]*>?/gm, '');

                // AI Rewrite (Async background)
                this.generateAIArticle(item, imageUrl, category, fullContent);
            }
        } catch (error) {
            console.error(`[RSS] Failed to process ${category} feed:`, error.message);
        }
    }

    async generateAIArticle(item, imageUrl, category, rawContent) {
        try {
            const aiData = await rewriteArticleAI(rawContent, item.title, category);
            
            const newArticle = new Article({
                id: item.guid || Date.now().toString(),
                title: aiData.headline || item.title,
                headline_variations: aiData.headline_variations || [item.title],
                summary: aiData.summary || rawContent.substring(0, 200),
                content: aiData.article_body || rawContent,
                category: category.charAt(0).toUpperCase() + category.slice(1),
                image: imageUrl,
                link: item.link,
                date: new Date(item.pubDate),
                publishedAt: new Date(),
                source: "RSS Feed",
                author: "PrimeReport AI",
                key_points: aiData.key_points || [],
                faqs: aiData.faqs || [],
                explainer: aiData.explainer || "",
                seo_title: aiData.seo_title,
                seo_description: aiData.seo_description,
                schema_data: aiData.schema_data
            });

            await newArticle.save();
            console.log(`[RSS] AI Article saved: ${newArticle.title}`);
        } catch (error) {
            console.error(`[RSS] AI Generation failed for ${item.title}:`, error.message);
        }
    }
}

module.exports = new RSSService();
