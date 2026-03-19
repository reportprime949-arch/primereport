require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();

/* middleware */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* serve static files */
app.use(express.static(path.join(__dirname, "../public")));
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

/* API routes */
const newsRoutes = require("./routes/news");
const adminRoutes = require("./routes/admin");
const articleStore = require("./articleStore");
const { generateSitemap } = require("./sitemap-generator");

app.use("/api/news", newsRoutes);
app.use("/api", adminRoutes);

/* --- SEO CLEAN URLS & SSR-LITE --- */
app.get("/article/:id", (req, res) => {
    const id = req.params.id;
    const article = articleStore.get(id);
    const filePath = path.join(__dirname, "../public/article.html");

    if (!article) {
        return res.sendFile(filePath); // Let frontend handle 404
    }

    // SSR-lite: Inject meta tags directly into HTML
    fs.readFile(filePath, "utf8", (err, html) => {
        if (err) return res.sendFile(filePath);

        const title = `${article.title.replace(/"/g, '&quot;')} | PrimeReport`;
        const desc = (article.summary || article.description || "").substring(0, 160).replace(/"/g, '&quot;');
        const image = article.image || "https://primereport-news.netlify.app/hero.webp";
        const url = `https://primereport-news.netlify.app/article/${article.slug || article.id}`;
        const date = article.publishedAt || article.date || new Date().toISOString();

        // 1. Static Fallback Content
        const staticContent = `
            <h1>${article.title}</h1>
            <p>${article.summary || article.description}</p>
            <img src="${image}" alt="${article.title}">
        `;

        // 2. Structured Data (JSON-LD)
        const jsonLd = {
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            "headline": article.title,
            "image": [image],
            "datePublished": date,
            "dateModified": date,
            "author": [{
                "@type": "Person",
                "name": article.author || "Prime Editorial",
                "url": "https://primereport-news.netlify.app/"
            }]
        };

        const injectedHtml = html
            // Standard Tags
            .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
            .replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${desc}">`)
            // Open Graph
            .replace(/<meta property="og:title" content=".*?">/, `<meta property="og:title" content="${title}">`)
            .replace(/<meta property="og:description" content=".*?">/, `<meta property="og:description" content="${desc}">`)
            .replace(/<meta property="og:image" content=".*?">/, `<meta property="og:image" content="${image}">`)
            .replace(/<meta property="og:url" content=".*?">/, `<meta property="og:url" content="${url}">`)
            // Twitter
            .replace(/<meta name="twitter:title" content=".*?">/, `<meta name="twitter:title" content="${title}">`)
            .replace(/<meta name="twitter:description" content=".*?">/, `<meta name="twitter:description" content="${desc}">`)
            .replace(/<meta name="twitter:image" content=".*?">/, `<meta name="twitter:image" content="${image}">`)
            // Canonical
            .replace(/<link rel="canonical" href="">/, `<link rel="canonical" href="${url}">`)
            // Full Content Fallback
            .replace('<div id="article-static-fallback" style="display:none"></div>', `<div id="article-static-fallback" style="display:none">${staticContent}</div>`)
            // Structured Data
            .replace('<script type="application/ld+json" id="article-schema"></script>', `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`);

        res.send(injectedHtml);
    });
});

/* health check */
app.get("/", (req, res) => {
  res.send("PrimeReport API is running 🚀");
});

// Run sitemap generator on startup
generateSitemap();

/* server port */
const PORT = process.env.PORT || 3000;

/* start server */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});