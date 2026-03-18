const fs = require('fs');
const path = require('path');

class TrendingEngine {
    constructor(store) {
        this.store = store;
        this.trendingFile = path.join(__dirname, '../data/trending.json');
    }

    calculateScores() {
        const articles = this.store.getAll();
        const now = Date.now();
        const scored = articles.map(a => {
            // formula: score = (views * 0.6) + (recencyScore * 0.3) + (categoryWeight * 0.1)
            
            // 1. Recency Score (0-100)
            const ageHrs = (now - new Date(a.publishedAt || Date.now())) / (1000 * 60 * 60);
            const recencyScore = Math.max(0, 100 - ageHrs * 1.5);

            // 2. Category Weight (0-100)
            const catWeights = { 
                'world': 100, 
                'politics': 100,
                'technology': 95, 
                'ai': 100,
                'business': 85,
                'sports': 80
            };
            const categoryWeight = catWeights[(a.category || '').toLowerCase()] || 50;

            // 3. Views
            const views = parseInt(a.views) || 0;

            const trendScore = (views * 0.6) + (recencyScore * 0.3) + (categoryWeight * 0.1);

            return { ...a, trendScore: Math.round(trendScore * 100) / 100 };
        });

        // Sort and Take Top 15
        const trending = scored.sort((a, b) => b.trendScore - a.trendScore).slice(0, 15);

        // Update Store and Persist
        this.store.updateTrending(trending.length > 0 ? trending : articles.slice(0, 15));
        
        // Ensure hero has at least 5 articles if possible, falling back to any available articles
        const heroList = trending.filter(a => a.image).slice(0, 5);
        this.store.updateHero(heroList.length > 0 ? heroList : articles.slice(0, 5));
        
        try {
            fs.writeFileSync(this.trendingFile, JSON.stringify(trending, null, 2));
            console.log(`[TrendingEngine] trending.json updated with ${trending.length} items.`);
        } catch (err) {
            console.error("[TrendingEngine] Persist error:", err.message);
        }

        return trending;
    }
}

module.exports = TrendingEngine;
