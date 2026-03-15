const API_BASE = window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://primereport-server.onrender.com";

const PLACEHOLDER = "/assets/images/news-placeholder.jpg";

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    updateDate();

    const params = new URLSearchParams(window.location.search);
    const slugOrId = params.get("id");

    if (slugOrId) {
        fetchArticle(slugOrId);
    } else {
        window.location.href = "index.html";
    }
});

async function fetchArticle(id) {
    const container = document.getElementById("article-content");
    try {
        const res = await fetch(`${API_BASE}/api/news/${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error("Article not found");
        
        const article = await res.json();
        renderArticle(article);
    } catch (e) {
        console.error("Fetch error:", e.message);
        showNotFound();
    }
}

function renderArticle(a) {
    const container = document.getElementById("article-content");
    document.title = `${a.title} – PrimeReport`;

    container.innerHTML = `
        <div class="article-breadcrumb">
            <a href="index.html">Home</a> / 
            <a href="index.html?category=${encodeURIComponent(a.category)}">${a.category || "World"}</a>
        </div>
        
        <span class="cat-badge ${catClass(a.category)}">${a.category || "News"}</span>

        <h1>${escHtml(a.title)}</h1>

        <div class="article-meta">
            <span><i class="far fa-user"></i> ${escHtml(a.author || a.source || "PrimeReport")}</span>
            <span><i class="far fa-clock"></i> ${formatDate(a.publishedAt || a.date)}</span>
            <span><i class="far fa-eye"></i> ${a.views || 0} views</span>
        </div>

        <img src="${a.image || PLACEHOLDER}" 
             alt="${escHtml(a.title)}"
             onerror="this.src='${PLACEHOLDER}'">

        <div class="article-body">
            ${buildBody(a)}
        </div>
        
        <div class="article-footer-nav">
             <a href="index.html" class="back-btn">← Back to News</a>
        </div>
    `;
    container.classList.remove("loading");
}

function buildBody(a) {
    const text = a.content || a.description || a.summary || "Full content is unavailable for this article.";
    if (text.includes('<p>')) return text;
    return text.split("\n\n").filter(Boolean).map(p => `<p>${escHtml(p.trim())}</p>`).join("");
}

function showNotFound() {
    document.getElementById("article-content").innerHTML = `
        <div style="text-align:center;padding:120px 20px; color:var(--text-muted)">
            <i class="fas fa-exclamation-triangle" style="font-size:48px; margin-bottom:20px"></i>
            <h2>Article Not Found</h2>
            <p>This article might have been moved or the URL is incorrect.</p>
            <a href="index.html" style="color:var(--primary-color); font-weight:bold; margin-top:20px; display:inline-block">← Back to Home</a>
        </div>
    `;
}

function formatDate(date) {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function initTheme() {
    const saved = localStorage.getItem('theme') || 'light';
    if (saved === 'dark') document.documentElement.classList.add('dark');
}

function updateDate() {
    const el = document.getElementById('current-date');
    if (el) el.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function catClass(cat) {
    const map = { technology:'cat-technology', tech:'cat-technology', business:'cat-business', politics:'cat-politics', sports:'cat-sports', science:'cat-science', entertainment:'cat-entertainment' };
    return map[(cat || '').toLowerCase()] || '';
}

function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}