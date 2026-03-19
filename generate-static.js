const fs = require("fs");
const path = require("path");
const axios = require("axios");

const API = "https://primereport-server.onrender.com/api/news";
const OUTPUT_DIR = path.join(__dirname, "public/articles");

// create folder if not exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function createHTML(article) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<title>${article.title}</title>
<meta name="description" content="${article.description || ""}" />

<meta property="og:title" content="${article.title}" />
<meta property="og:description" content="${article.description || ""}" />
<meta property="og:image" content="${article.image}" />

<script type="application/ld+json">
{
 "@context": "https://schema.org",
 "@type": "NewsArticle",
 "headline": "${article.title}",
 "image": "${article.image}",
 "datePublished": "${article.pubDate}"
}
</script>

<link rel="stylesheet" href="/css/prime.css" />
</head>

<body>
  <main style="max-width:900px;margin:auto;padding:20px;">
    <h1>${article.title}</h1>
    <img src="${article.image}" style="width:100%;border-radius:10px;" />
    <p>${article.description || "No description available."}</p>

    <a href="${article.link}" target="_blank">Read full article →</a>
  </main>
</body>
</html>
`;
}

async function generate() {
  try {
    const res = await axios.get(API);
    const articles = res.data.articles;

    const sitemapLinks = [];

    for (const article of articles) {
      const slug = slugify(article.title);
      const fileName = `${slug}.html`;
      const filePath = path.join(OUTPUT_DIR, fileName);

      const html = createHTML(article);
      fs.writeFileSync(filePath, html);

      sitemapLinks.push(`
<url>
  <loc>https://primereport-news.netlify.app/articles/${fileName}</loc>
  <lastmod>${new Date().toISOString()}</lastmod>
</url>`);
    }

    // generate sitemap
    const sitemap = `
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapLinks.join("\n")}
</urlset>
`;

    fs.writeFileSync(path.join(__dirname, "public/sitemap.xml"), sitemap);

    console.log("✅ Static pages generated!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

generate();