/* ==============================================================
   PRIME REPORT – Premium Article.js
   ============================================================== */

const API = "https://primereport-server.onrender.com/api";
const PLACEHOLDER = 'hero.webp';

/**
 * Robust Fetch with Retry & Timeout
 */
async function fetchWithRetry(url, options = {}, retries = 3, backoff = 2000) {
    const controller = new AbortController();
    const idTimeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(idTimeout);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (err) {
        clearTimeout(idTimeout);
        if (retries > 0) {
            console.warn(`[Fetch Retry] ${url} - Attempts left: ${retries}`);
            await new Promise(r => setTimeout(r, backoff));
            return fetchWithRetry(url, options, retries - 1, backoff * 1.5);
        }
        throw err;
    }
}

/* ─── Initialization ────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initMobileMenu();
    loadArticle();
});

function initTheme() {
    const root = document.documentElement;
    const btn = document.getElementById('theme-toggle');
    const icon = btn?.querySelector('i');
    const saved = localStorage.getItem('theme') || 'light';
    if (saved === 'dark') {
        root.classList.add('dark');
        if (icon) icon.className = 'fas fa-sun';
    }
    btn?.addEventListener('click', () => {
        root.classList.toggle('dark');
        const isDark = root.classList.contains('dark');
        if (icon) icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}

function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const nav = document.getElementById('main-nav');
    if (btn && nav) {
        btn.onclick = () => {
            nav.classList.toggle('active');
            btn.innerHTML = nav.classList.contains('active') ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
        };
    }
}

/* ─── Core Logic ────────────────────────────────────────────── */

async function loadArticle() {
    const pathParts = window.location.pathname.split('/');
    const slug = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
    
    if (!slug || slug === 'article.html') {
        const params = new URLSearchParams(window.location.search);
        const id = params.get("id");
        if (!id) { window.location.href = '/'; return; }
        var fetchId = id;
    } else {
        var fetchId = slug;
    }

    const loader = document.getElementById("article-loading");
    const content = document.getElementById("article-content");

    try {
        const a = await fetchWithRetry(`${API}/article/${encodeURIComponent(fetchId)}`);
        if (!a || a.error) throw new Error("Not found");

        loader.style.display = "none";
        content.classList.remove("hidden");

        renderArticle(a, content);
        loadRelated(a.category, fetchId);
        updateSEO(a);

    } catch (e) {
        loader.innerHTML = `<div style="padding:100px; text-align:center;"><h2>Story Not Found</h2><p>This article may have been moved or removed.</p><a href="/" class="view-all" style="display:inline-block; margin-top:20px;">Return Home</a></div>`;
    }
}

function renderArticle(a, container) {
    const date = new Date(a.publishedAt || a.date).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric'
    });

    container.innerHTML = `
        <div class="article-header">
            <span class="hero-badge">${a.category || 'Global News'}</span>
            <h1>${escHtml(a.title)}</h1>
            <div class="article-meta-pro">
                <span>By <strong>${escHtml(a.author || "Prime Editorial")}</strong></span>
                <span>&bull;</span>
                <span>${date}</span>
                <span>&bull;</span>
                <span>${escHtml(a.source || "PrimeReport")}</span>
            </div>
        </div>

        <div class="article-hero-img-wrap">
            <img src="${a.image || PLACEHOLDER}" alt="${escHtml(a.title)}" style="width:100%; height:100%; object-fit:cover;">
        </div>

        <div class="article-body-content">
            <p style="font-weight:700; font-size:1.4rem; line-height:1.5; margin-bottom:40px; border-left:4px solid var(--primary); padding-left:20px;">
                ${escHtml(a.summary || a.description || "")}
            </p>
            <div class="article-text-main">
                ${a.content || a.description || "Reading mode active. PrimeReport brings you the latest updates on this developing story."}
            </div>
        </div>

        <footer style="margin:60px 0; padding-top:40px; border-top:1px solid var(--border);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span class="card-meta">Full Coverage on ${escHtml(a.source || "PrimeReport")}</span>
                <a href="${a.link || '#'}" target="_blank" class="view-all">Read Original Story <i class="fas fa-external-link-alt"></i></a>
            </div>
        </footer>
    `;
}

async function loadRelated(cat, currentId) {
    const section = document.getElementById("related-section");
    const grid = document.getElementById("related-grid");
    if (!cat || !grid) return;

    try {
        const data = await fetchWithRetry(`${API}/category/${cat.toLowerCase()}?limit=5`);
        const articles = (data.articles || []).filter(a => (a.slug || a.id) !== currentId).slice(0, 4);

        if (articles.length) {
            section.classList.remove("hidden");
            grid.innerHTML = articles.map(a => `
                <div class="news-card" onclick="window.location.href='/article/${a.slug || a.id}'">
                    <div class="card-img-wrap">
                        <img src="${a.image || PLACEHOLDER}" alt="${escHtml(a.title)}" loading="lazy">
                    </div>
                    <h3>${escHtml(a.title)}</h3>
                    <div class="card-meta">
                        <span>${timeAgo(a.publishedAt)}</span>
                    </div>
                </div>
            `).join('');
        }
    } catch (e) { console.warn('Related failed', e); }
}

/* ─── SEO & Utilities ────────────────────────────────────────── */

function updateSEO(a) {
    document.title = a.title + " | PrimeReport";
    
    // OG Tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = a.title;
    
    const ogImg = document.querySelector('meta[property="og:image"]');
    if (ogImg) ogImg.content = a.image || "";

    const canon = document.querySelector('link[rel="canonical"]');
    if (canon) canon.href = `https://primereport-news.netlify.app/article/${a.slug || a.id}`;
}

function timeAgo(date) {
    if (!date) return 'Just now';
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 3600) return `${Math.floor(diff/60) || 1}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
}

function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}