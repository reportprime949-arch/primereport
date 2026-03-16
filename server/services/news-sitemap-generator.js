const fs = require('fs');
const path = require('path');
const store = require('../articleStore');

const SITEMAP_PATH = path.join(__dirname, '../public/news-sitemap.xml');
const BASE_URL = 'https://primereport-news.netlify.app';

/**
 * News Sitemap Generator
 * Automatically updates the Google News sitemap with the latest 1000 articles.
 */
function updateNewsSitemap() {
    try {
        const articles = store.getAll()
            .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
            .filter(a => {
                const ageDays = (Date.now() - new Date(a.publishedAt)) / (1000 * 60 * 60 * 24);
                return ageDays <= 2; // Google News sitemap only allows last 2 days
            })
            .slice(0, 1000); // Hard limit of 1000

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">`;

        articles.forEach(article => {
            const date = new Date(article.publishedAt || Date.now()).toISOString();
            const title = (article.title || "").substring(0, 110).replace(/&/g, '&amp;');
            const url = `${BASE_URL}/article/${article.slug || article.id}`;

            xml += `
    <url>
        <loc>${url}</loc>
        <news:news>
            <news:publication>
                <news:name>PrimeReport</news:name>
                <news:language>en</news:language>
            </news:publication>
            <news:publication_date>${date}</news:publication_date>
            <news:title>${title}</news:title>
        </news:news>
    </url>`;
        });

        xml += `\n</urlset>`;

        fs.writeFileSync(SITEMAP_PATH, xml);
        console.log(`[SEO] News sitemap automated update completed: ${articles.length} URLs.`);
    } catch (err) {
        console.error("[SEO] Sitemap Auto-Update Error:", err.message);
    }
}

module.exports = { updateNewsSitemap };

if (require.main === module) {
    updateNewsSitemap();
}
