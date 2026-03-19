require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const axios = require("axios");

const app = express();

/* middleware */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* serve static files */
app.use(express.static(path.join(__dirname, "../public")));
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

/* API routes */
const articleStore = require("./articleStore");
const { generateSitemap } = require("./sitemap-generator");

// RESTORED ROUTES
const newsRoutes = require("./routes/news");
app.use("/api/news", newsRoutes);

// NEW CATEGORY API (Standardized)
app.get("/api/category/:name", (req, res) => {
    try {
        const cat = req.params.name.toLowerCase();
        const articles = articleStore.getByCategory(cat, true);
        res.json({ success: true, count: articles.length, articles });
    } catch (err) {
        res.status(500).json({ success: false, error: "Category fetch failed" });
    }
});

// NEW ARTICLE API (Slug based)
app.get("/api/article/:slug", (req, res) => {
    try {
        const slug = req.params.slug;
        const article = articleStore.get(slug);
        if (!article) return res.status(404).json({ error: "Article not found" });
        res.json(article);
    } catch (err) {
        res.status(500).json({ error: "Article fetch failed" });
    }
});

/* --- SEO CLEAN URLS & SSR-LITE --- */
app.get("/article/:id", (req, res) => {
    try {
        const id = decodeURIComponent(req.params.id);
        const article = articleStore.get(id);
        const filePath = path.join(__dirname, "../public/article.html");

        if (!article) {
            return res.sendFile(filePath); // Let frontend 404
        }

        fs.readFile(filePath, "utf8", (err, html) => {
            if (err) return res.sendFile(filePath);

            const title = `${article.title.replace(/"/g, '&quot;')} | PrimeReport`;
            const desc = (article.summary || article.description || "").substring(0, 160).replace(/"/g, '&quot;');
            const image = article.image || "https://primereport-news.netlify.app/hero.webp";
            const url = `https://primereport-news.netlify.app/article/${article.slug || article.id}`;
            const date = article.publishedAt || article.date || new Date().toISOString();

            const jsonLd = {
                "@context": "https://schema.org",
                "@type": "NewsArticle",
                "headline": article.title,
                "image": [image],
                "datePublished": date,
                "author": [{"@type": "Person", "name": article.author || "Prime Editorial"}]
            };

            const injectedHtml = html
                .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
                .replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${desc}">`)
                // Simplified injection for performance
                .replace(/<meta property="og:title" content=".*?">/, `<meta property="og:title" content="${title}">`)
                .replace(/<meta property="og:image" content=".*?">/, `<meta property="og:image" content="${image}">`)
                .replace('<script type="application/ld+json" id="article-schema"></script>', `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`);

            res.send(injectedHtml);
        });
    } catch (e) {
        res.sendFile(path.join(__dirname, "../public/article.html"));
    }
});

/* health check */
app.get("/", (req, res) => {
  res.send("PrimeReport API is running Check ✅");
});

// Global Error Handler (Prevents 502)
app.use((err, req, res, next) => {
    console.error(`[FATAL] ${req.method} ${req.url}:`, err.stack);
    res.status(500).json({ success: false, error: "Internal Server Error" });
});

// Run sitemap on startup
generateSitemap().catch(e => console.error("Sitemap error:", e.message));

/* server port */
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});