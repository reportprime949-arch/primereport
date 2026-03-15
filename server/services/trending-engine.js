/**
 * AI Trending Engine
 * Scores articles based on recency, category frequency, and simulated popularity.
 */

class TrendingEngine {
    constructor(store) {
        this.store = store;
    }

    calculateScores() {
        const articles = this.store.getAll();
        const now = Date.now();

        const scored = articles.map(a => {
            let score = 0;
            const ageHrs = (now - new Date(a.publishedAt || Date.now())) / (1000 * 60 * 60);

            // 1. Recency Boost (Exponential decay)
            score += Math.max(0, 100 - ageHrs * 2);

            // 2. Content Length / Richness
            if (a.content && a.content.length > 500) score += 20;
            if (a.image && !a.image.includes('placeholder')) score += 15;

            // 3. Category diversity (Boost important categories)
            const catBoosts = { 'world': 10, 'technology': 12, 'business': 10, 'politics': 15 };
            score += catBoosts[(a.category || '').toLowerCase()] || 5;

            // 4. Source weight (Example)
            if (a.source && !a.source.includes('News Source')) score += 10;

            return { ...a, trendScore: score };
        });

        // Sort by score
        const sorted = scored.sort((a, b) => b.trendScore - a.trendScore);

        // Update Store
        this.store.updateTrending(sorted.slice(0, 15));
        this.store.updateHero(sorted.filter(a => a.image).slice(0, 10));
        
        console.log(`[TrendingEngine] Scores calculated for ${articles.length} articles.`);
        return sorted;
    }
}

module.exports = TrendingEngine;
