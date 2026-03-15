const fs = require('fs');
const path = require('path');
const Article = require('./models/Article');

async function generateSitemap() {
    try {
        console.log("[SITEMAP] Starting generation...");
        const articles = await Article.find().select('id publishedAt');
        const baseUrl = 'https://primereport.ai'; // Replace with production URL

        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${baseUrl}/</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>hourly</changefreq>
        <priority>1.0</priority>
    </url>`;

        articles.forEach(article => {
            const date = (article.publishedAt || new Date()).toISOString().split('T')[0];
            sitemap += `
    <url>
        <loc>${baseUrl}/article.html?id=${article.id}</loc>
        <lastmod>${date}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
    </url>`;
        });

        sitemap += `\n</urlset>`;

        const outputPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
        fs.writeFileSync(outputPath, sitemap);
        console.log(`[SITEMAP] Successfully saved to ${outputPath}`);
    } catch (err) {
        console.error("[SITEMAP] Error generating sitemap:", err.message);
    }
}

module.exports = { generateSitemap };
