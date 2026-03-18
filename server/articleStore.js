const fs = require('fs');
const path = require('path');
const slugify = require('./utils/slugify');

const ARTICLES_FILE = path.join(__dirname, 'data', 'articles.json');

class ArticleStore {
    constructor() {
        this.articles = new Map(); // id -> article
        this.slugs = new Map();    // slug -> article
        this.trending = [];
        this.hero = [];
        this.init();
    }

    static toLite(a) {
        if (!a) return null;
        return {
            id: a.id,
            slug: a.slug,
            title: a.title,
            summary: a.summary ? a.summary.substring(0, 120) + '...' : '',
            image: a.image,
            category: a.category,
            source: a.source,
            publishedAt: a.publishedAt,
            isBreaking: a.isBreaking
        };
    }

    init() {
        try {
            if (fs.existsSync(ARTICLES_FILE)) {
                const data = JSON.parse(fs.readFileSync(ARTICLES_FILE, 'utf8'));
                this.saveMany(data);
                console.log(`[ArticleStore] Initialized with ${this.articles.size} articles.`);
            }
        } catch (e) {
            console.error('[ArticleStore] Init error:', e.message);
        }
    }

    saveMany(list) {
        if (!Array.isArray(list)) return;
        list.forEach(a => this.saveArticle(a));
    }

    saveArticle(a) {
        if (!a.id) return;

        const idStr = String(a.id);
        
        // Ensure slug exists for SEO engine
        if (!a.slug) {
            a.slug = `${slugify(a.title)}-${idStr.substring(0, 8)}`;
        }

        this.articles.set(idStr, a);
        this.slugs.set(String(a.slug), a);
    }

    updateArticle(id, updates) {
        const idStr = String(id);
        const existing = this.articles.get(idStr);
        if (!existing) return null;

        const updated = { ...existing, ...updates, id: idStr };
        
        // If title changed, we might want to update slug, but usually slugs should stay stable.
        // For now, let's just save.
        this.saveArticle(updated);
        return updated;
    }

    deleteArticle(id) {
        const idStr = String(id);
        const article = this.articles.get(idStr);
        if (article) {
            this.slugs.delete(article.slug);
            this.articles.delete(idStr);
            return true;
        }
        return false;
    }

    get(idOrSlug) {
        return this.articles.get(String(idOrSlug)) || this.slugs.get(String(idOrSlug));
    }

    // Aliases for compatibility with other components
    getById(id) { return this.articles.get(String(id)); }
    getBySlug(slug) { return this.slugs.get(String(slug)); }

    getAll(lite = false) {
        const all = Array.from(this.articles.values());
        return lite ? all.map(ArticleStore.toLite) : all;
    }

    getByCategory(category, lite = false) {
        const cat = String(category || 'world').toLowerCase();
        const filtered = this.getAll().filter(a => (a.category || '').toLowerCase() === cat);
        return lite ? filtered.map(ArticleStore.toLite) : filtered;
    }

    getTrending(limit = 5) { return this.trending.slice(0, limit); }
    getHero(limit = 5) { return this.hero.slice(0, limit); }

    updateTrending(list) { this.trending = list; }
    updateHero(list) { this.hero = list; }

    clear() {
        this.articles.clear();
        this.slugs.clear();
        this.trending = [];
        this.hero = [];
        this.persist();
    }

    enforceLimit(maxCount = 100) {
        if (this.articles.size <= maxCount) return;
        
        const sorted = this.getAll().sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        const toKeep = sorted.slice(0, maxCount);
        
        this.articles.clear();
        this.slugs.clear();
        toKeep.forEach(a => this.saveArticle(a));
    }

    persist() {
        try {
            const data = this.getAll().sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
            fs.writeFileSync(ARTICLES_FILE, JSON.stringify(data, null, 2), 'utf8');
        } catch (e) {
            console.error('[ArticleStore] Persist error:', e.message);
        }
    }
}

const store = new ArticleStore();
module.exports = store;
