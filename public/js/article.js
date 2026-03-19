/* ==============================================================
   PrimeReport — Professional Article.js
   ============================================================== */

const API = "https://primereport-server.onrender.com/api/news";
const PLACEHOLDER = 'hero.webp';

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initMobileMenu();
    loadArticle();
});

/* ─── UI Helpers ────────────────────────────────────────────── */
function initTheme() {
    const root = document.documentElement;
    const btn  = document.getElementById('theme-toggle');
    const icon = btn?.querySelector('i');
    const saved = localStorage.getItem('theme') || 'light';

    if (saved === 'dark') {
        root.classList.add('dark');
        if (icon) icon.classList.replace('fa-moon', 'fa-sun');
    }

    btn?.addEventListener('click', () => {
        root.classList.toggle('dark');
        const dark = root.classList.contains('dark');
        if (icon) icon.classList.replace(dark ? 'fa-moon' : 'fa-sun', dark ? 'fa-sun' : 'fa-moon');
        localStorage.setItem('theme', dark ? 'dark' : 'light');
    });
}

function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('main-nav');
    if (btn && menu) {
        btn.onclick = () => {
            menu.classList.toggle('active');
            btn.querySelector('i').classList.toggle('fa-bars');
            btn.querySelector('i').classList.toggle('fa-times');
        };
    }
}

/* ─── Article Loading ───────────────────────────────────────── */
async function loadArticle() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) {
        window.location.href = 'index.html';
        return;
    }

    const loader = document.getElementById("article-loading");
    const content = document.getElementById("article-content");

    try {
        const res = await fetch(`${API}/${encodeURIComponent(id)}`);
        const a = await res.json();

        if (!a || a.error) throw new Error("Not found");

        loader.style.display = "none";
        content.classList.remove("hidden");

        renderArticle(a, content);
        loadRelated(a.category, id);
        updateMeta(a);

    } catch (e) {
        loader.innerHTML = `<div style="padding:100px; text-align:center;"><h2>Story Not Found</h2><p>This article may have been moved or removed.</p><a href="index.html" class="nav-link" style="display:inline-block; margin-top:20px;">Return Home</a></div>`;
    }
}

function renderArticle(a, container) {
    const date = new Date(a.publishedAt || a.date).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric'
    });

    container.innerHTML = `
        <article class="pro-article">
            <div class="article-header">
                <span class="hero-badge" style="margin-bottom:15px; display:inline-block">${a.category || 'News'}</span>
                <h1>${escHtml(a.title)}</h1>
                <div class="article-meta" style="margin-top:20px; display:flex; align-items:center; gap:15px; color:var(--text-muted); font-size:14px;">
                    <span>By <strong>${escHtml(a.author || "Prime Editorial")}</strong></span>
                    <span>&bull;</span>
                    <span>${date}</span>
                </div>
            </div>

            <div class="article-main-image" style="margin:30px 0; border-radius:12px; overflow:hidden; aspect-ratio:16/9; background:#eee;">
                <img src="${a.image || PLACEHOLDER}" alt="${escHtml(a.title)}" style="width:100%; height:100%; object-fit:cover;">
            </div>

            <div class="article-body" style="font-size:1.15rem; line-height:1.7; color:var(--text); max-width:800px;">
                <p style="font-weight:500; font-size:1.25rem; margin-bottom:25px;">${escHtml(a.summary || a.description || "")}</p>
                <div class="article-text">
                    ${a.content || a.description || "Reading mode active. Full coverage available via source link below."}
                </div>
            </div>

            <footer style="margin-top:50px; padding-top:30px; border-top:1px solid var(--border);">
                <p style="font-size:14px; color:var(--text-muted)">Source: <strong>${escHtml(a.source || "PrimeReport")}</strong></p>
                <a href="${a.link || '#'}" target="_blank" class="nav-link active" style="display:inline-block; margin-top:15px; padding:12px 24px; text-decoration:none; border-radius:6px;">
                    Read Original Story <i class="fas fa-external-link-alt" style="margin-left:8px;"></i>
                </a>
            </footer>
        </article>
    `;
}

async function loadRelated(category, currentId) {
    const section = document.getElementById("related-section");
    const grid = document.getElementById("related-grid");
    if (!category || !grid) return;

    try {
        const res = await fetch(`${API}?category=${category}&limit=5`);
        const data = await res.json();
        const articles = (data.articles || []).filter(a => (a.slug || a.id) !== currentId).slice(0, 4);

        if (articles.length) {
            section.classList.remove("hidden");
            grid.innerHTML = articles.map(a => `
                <div class="news-card" onclick="window.location.href='/article/${a.slug || a.id}'">
                    <div class="card-img-wrap">
                        <img src="${a.image || PLACEHOLDER}" alt="${escHtml(a.title)}" loading="lazy">
                    </div>
                    <div class="card-content">
                        <h3>${escHtml(a.title)}</h3>
                        <div class="card-footer">
                            <span>${timeAgo(a.publishedAt)}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (e) {
        console.warn('Related failed', e);
    }
}

/* ─── Utilities ─────────────────────────────────────────────── */
function updateMeta(a) {
    document.title = a.title + " | PrimeReport";
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