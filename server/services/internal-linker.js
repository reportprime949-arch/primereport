/**
 * Internal Link Engine [ULTRA]
 * Automatically inserts links to categories and discovers related articles.
 */
class InternalLinkEngine {
    constructor(store) {
        this.store = store;
        this.categories = ['world', 'politics', 'technology', 'business', 'ai', 'sports', 'science', 'entertainment'];
    }

    /**
     * Inserts links to category pages into the HTML content.
     */
    linkify(html, currentCategory) {
        if (!html) return html;
        let enhanced = html;

        this.categories.forEach(cat => {
            if (cat.toLowerCase() === (currentCategory || '').toLowerCase()) return;

            // Simple regex to find mentions and link them once
            const regex = new RegExp(`\\b(${cat})\\b`, 'i');
            const match = enhanced.match(regex);
            
            if (match) {
                const link = `<a href="/category/${cat.toLowerCase()}" class="text-prime-accent hover:underline font-bold">${match[0]}</a>`;
                // Only replace the first occurrence to avoid over-linking
                enhanced = enhanced.replace(regex, link);
            }
        });

        return enhanced;
    }

    /**
     * Finds 5 related articles from the same category.
     */
    getRelatedArticles(article, limit = 5) {
        const all = this.store.getAll();
        return all
            .filter(a => a.id !== article.id && a.category === article.category)
            .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
            .slice(0, limit);
    }
}

module.exports = InternalLinkEngine;
