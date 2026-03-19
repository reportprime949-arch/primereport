const fs = require("fs");
const path = require("path");
const axios = require("axios");

const API = "https://primereport-server.onrender.com/api/news";
const PUBLIC_DIR = path.join(__dirname, "public");
const ARTICLES_DIR = path.join(__dirname, "public/articles");

// Ensure directories exist
[PUBLIC_DIR, ARTICLES_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function createHTML(article, allArticles) {
  const latestNews = allArticles.slice(0, 5);
  const moreStories = allArticles.slice(5, 11);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${article.title} | Prime News</title>
    <meta name="description" content="${(article.description || "").substring(0, 160)}" />
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
    </style>
    
    <!-- SEO Meta Tags -->
    <meta property="og:title" content="${article.title}" />
    <meta property="og:description" content="${(article.description || "").substring(0, 160)}" />
    <meta property="og:image" content="${article.image}" />
    <meta property="og:type" content="article" />
    
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": "${article.title}",
      "image": ["${article.image}"],
      "datePublished": "${article.publishedAt || article.pubDate || new Date().toISOString()}",
      "author": [{
          "@type": "Person",
          "name": "${article.author || "Prime Editorial"}"
      }]
    }
    </script>
</head>
<body class="bg-gray-50 text-gray-900 leading-relaxed">

    <!-- Navigation Bar -->
    <nav class="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex-shrink-0 flex items-center">
                    <a href="/" class="text-2xl font-black text-red-600 tracking-tighter uppercase italic">Prime<span class="text-gray-900">News</span></a>
                </div>
                <div class="hidden md:flex space-x-8 text-sm font-bold uppercase tracking-widest">
                    <a href="/?cat=World" class="hover:text-red-600 transition">World</a>
                    <a href="/?cat=Tech" class="hover:text-red-600 transition">Tech</a>
                    <a href="/?cat=Business" class="hover:text-red-600 transition">Business</a>
                    <a href="/?cat=Sports" class="hover:text-red-600 transition">Sports</a>
                </div>
                <div class="flex items-center space-x-4">
                    <button class="bg-red-600 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition">Subscribe</button>
                </div>
            </div>
        </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            <!-- Main Content Area (75%) -->
            <main class="lg:col-span-8">
                <article class="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                    <div class="p-8">
                        <nav class="text-xs font-bold text-red-600 uppercase tracking-widest mb-4">
                            Home &nbsp; / &nbsp; ${article.category || 'General'}
                        </nav>
                        <h1 class="text-3xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">${article.title}</h1>
                        
                        <div class="flex items-center space-x-4 mb-8 text-sm text-gray-500 border-b border-t border-gray-100 py-4">
                            <span class="font-bold text-gray-900">By ${article.author || "Prime Editorial"}</span>
                            <span>&bull;</span>
                            <span>${new Date(article.publishedAt || article.pubDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                        </div>

                        <img src="${article.image}" alt="${article.title}" class="w-full h-auto rounded-lg mb-8 shadow-md" />

                        <div class="prose prose-lg max-w-none text-gray-700 space-y-6">
                            <p class="text-xl font-medium text-gray-900 leading-snug">${article.description || ""}</p>
                            <p>${article.content || "Content is being processed. Please check back shortly for the full story."}</p>
                        </div>

                        <div class="mt-12 pt-8 border-t border-gray-100">
                            <a href="${article.link}" target="_blank" class="inline-flex items-center text-red-600 font-bold hover:underline">
                                Read original source on ${article.source || "External Media"} 
                                <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                            </a>
                        </div>
                    </div>
                </article>

                <!-- Bottom Grid: More Stories -->
                <section class="mt-16">
                    <h2 class="text-2xl font-black uppercase tracking-tighter mb-8 border-b-4 border-red-600 inline-block">More Stories</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${moreStories.map(a => `
                            <a href="/articles/${slugify(a.title)}.html" class="group">
                                <div class="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 h-full transition transform hover:-translate-y-1 hover:shadow-md">
                                    <img src="${a.image}" class="w-full h-40 object-cover" alt="${a.title}">
                                    <div class="p-4">
                                        <h3 class="font-bold text-sm group-hover:text-red-600 transition">${a.title}</h3>
                                    </div>
                                </div>
                            </a>
                        `).join('')}
                    </div>
                </section>
            </main>

            <!-- Sidebar (25%): Latest News -->
            <aside class="lg:col-span-4 space-y-12">
                <div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h2 class="text-lg font-black uppercase tracking-widest text-red-600 mb-6 flex items-center">
                        <span class="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
                        Latest News
                    </h2>
                    <div class="space-y-6">
                        ${latestNews.map((a, i) => `
                            <a href="/articles/${slugify(a.title)}.html" class="flex space-x-4 group">
                                <span class="text-3xl font-black text-gray-200 group-hover:text-red-200 transition">${i + 1}</span>
                                <div class="flex-1">
                                    <h3 class="text-sm font-bold leading-snug group-hover:text-red-600 transition line-clamp-2">${a.title}</h3>
                                    <span class="text-xs text-gray-400 mt-1 block">${timeAgo(a.publishedAt || a.pubDate)}</span>
                                </div>
                            </a>
                        `).join('')}
                    </div>
                </div>

                <div class="sticky top-24">
                    <div class="bg-gray-900 text-white p-8 rounded-xl">
                        <h3 class="text-xl font-bold mb-4">Prime News Daily</h3>
                        <p class="text-gray-400 text-sm mb-6">Get the most important stories in your inbox every morning.</p>
                        <input type="email" placeholder="email@example.com" class="w-full bg-gray-800 border-none rounded p-3 text-sm mb-4 focus:ring-2 focus:ring-red-600">
                        <button class="w-full bg-red-600 p-3 rounded font-bold uppercase text-xs tracking-widest hover:bg-red-700 transition">Sign Up Free</button>
                    </div>
                </div>
            </aside>
        </div>
    </div>

    <footer class="bg-white border-t border-gray-200 py-12 mt-24">
        <div class="max-w-7xl mx-auto px-4 text-center">
            <div class="text-2xl font-black text-red-600 italic mb-4">PRIME<span class="text-gray-900">NEWS</span></div>
            <p class="text-gray-500 text-sm">&copy; 2026 Prime News Portal. All rights reserved.</p>
        </div>
    </footer>

</body>
</html>
`;
}

function timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) return interval + " years ago";
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) return interval + " months ago";
    interval = Math.floor(seconds / 86400);
    if (interval > 1) return interval + " days ago";
    interval = Math.floor(seconds / 3600);
    if (interval > 1) return interval + " hours ago";
    interval = Math.floor(seconds / 60);
    if (interval > 1) return interval + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

async function generate() {
  try {
    console.log("🚀 Starting static site generation...");
    const res = await axios.get(API);
    const articles = res.data.articles;

    console.log(`📦 Found ${articles.length} articles. Processing...`);

    const sitemapLinks = [];
    const baseUrl = "https://primereport-news.netlify.app";

    for (const article of articles) {
      const slug = slugify(article.title);
      const fileName = `${slug}.html`;
      const filePath = path.join(ARTICLES_DIR, fileName);

      const html = createHTML(article, articles);
      fs.writeFileSync(filePath, html);

      sitemapLinks.push(`
    <url>
        <loc>${baseUrl}/articles/${fileName}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
    </url>`);
    }

    // Generate Sitemap with full XML header
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${baseUrl}/</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>always</changefreq>
        <priority>1.0</priority>
    </url>
${sitemapLinks.join("")}
</urlset>`;

    fs.writeFileSync(path.join(PUBLIC_DIR, "sitemap.xml"), sitemap);

    console.log("✅ Static pages generated successfully!");
    console.log(`🔗 Sitemap created at: ${path.join(PUBLIC_DIR, "sitemap.xml")}`);
  } catch (err) {
    console.error("❌ Error during generation:", err.message);
  }
}

generate();