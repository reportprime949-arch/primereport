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

        // Ensure slug exists for SEO engine
        if (!a.slug) {
            a.slug = `${slugify(a.title)}-${String(a.id).substring(0, 8)}`;
        }

        this.articles.set(String(a.id), a);
        this.slugs.set(String(a.slug), a);
    }

    get(idOrSlug) {
        return this.articles.get(String(idOrSlug)) || this.slugs.get(String(idOrSlug));
    }

    // Aliases for compatibility with other components
    getById(id) { return this.articles.get(String(id)); }
    getBySlug(slug) { return this.slugs.get(String(slug)); }

    getAll() {
        return Array.from(this.articles.values());
    }

    getByCategory(category) {
        const cat = String(category || 'world').toLowerCase();
        return this.getAll().filter(a => (a.category || '').toLowerCase() === cat);
    }

    getTrending(limit = 5) { return this.trending.slice(0, limit); }
    getHero(limit = 5) { return this.hero.slice(0, limit); }

    updateTrending(list) { this.trending = list; }
    updateHero(list) { this.hero = list; }

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
