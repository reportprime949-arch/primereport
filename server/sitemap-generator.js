const fs = require('fs');
const path = require('path');
const store = require('./articleStore');

async function generateSitemap() {
    try {
        console.log("[SEO] Starting sitemap generation...");
        const articles = store.getAll().sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        const baseUrl = 'https://primereport-news.netlify.app'; // Production URL

        // 1. Standard Sitemap
        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${baseUrl}/</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>always</changefreq>
        <priority>1.0</priority>
    </url>`;

        // 2. Google News Sitemap
        let newsSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">`;

        let newsCount = 0;
        articles.forEach((article) => {
            const date = new Date(article.publishedAt || Date.now()).toISOString();
            const dateOnly = date.split('T')[0];
            const url = `${baseUrl}/article/${article.slug || article.id}`;

            // Standard Sitemap Entry
            sitemap += `
    <url>
        <loc>${url}</loc>
        <lastmod>${dateOnly}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
    </url>`;

            // News sitemaps: last 48 hours AND limit to 1000
            const ageDays = (Date.now() - new Date(date)) / (1000 * 60 * 60 * 24);
            if (ageDays <= 2 && newsCount < 1000) {
                newsCount++;
                newsSitemap += `
    <url>
        <loc>${url}</loc>
        <news:news>
            <news:publication>
                <news:name>PrimeReport</news:name>
                <news:language>en</news:language>
            </news:publication>
            <news:publication_date>${date}</news:publication_date>
            <news:title>${article.title.substring(0, 110).replace(/&/g, '&amp;')}</news:title>
        </news:news>
    </url>`;
            }
        });

        sitemap += `\n</urlset>`;
        newsSitemap += `\n</urlset>`;

        fs.writeFileSync(path.join(__dirname, '../public/sitemap.xml'), sitemap);
        fs.writeFileSync(path.join(__dirname, '../public/news-sitemap.xml'), newsSitemap);
        
        console.log(`[SEO] Sitemaps updated successfully: ${articles.length} articles.`);
    } catch (err) {
        console.error("[SEO] Error generating sitemaps:", err.message);
    }
}

module.exports = { generateSitemap };

if (require.main === module) {
    generateSitemap();
}
