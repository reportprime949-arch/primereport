/* ==============================================================
   PrimeReport – article.js (Premium Article Page Engine)
   ============================================================== */

const API_BASE =
    window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : 'https://primereport-server.onrender.com';
const PLACEHOLDER = '/assets/images/news-placeholder.jpg';

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initHeader();
    initMobileMenu();
    updateDate();

    const id = new URLSearchParams(window.location.search).get('id');
    if (id) {
        fetchArticle(decodeURIComponent(id));
    } else {
        window.location.href = 'index.html';
    }
});

/* ─── Date ─────────────────────────────────────────────────── */
function updateDate() {
    const el = document.getElementById('current-date');
    if (el) el.textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
}

/* ─── Theme ────────────────────────────────────────────────── */
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

/* ─── Header scroll shadow ──────────────────────────────────── */
function initHeader() {
    const header = document.getElementById('site-header');
    if (!header) return;
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
}

/* ─── Mobile Menu ───────────────────────────────────────────── */
function initMobileMenu() {
    const overlay = document.getElementById('mobile-menu');
    const openBtn  = document.getElementById('mobile-menu-btn');
    const closeBtn = document.getElementById('close-menu');
    const close = () => overlay?.classList.add('hidden');
    openBtn?.addEventListener('click', () => overlay?.classList.remove('hidden'));
    closeBtn?.addEventListener('click', close);
    overlay?.addEventListener('click', e => { if (e.target === overlay) close(); });
}

/* ─── Fetch Article ─────────────────────────────────────────── */
async function fetchArticle(id) {
    const loading = document.getElementById('article-loading');
    const content = document.getElementById('article-content');

    try {
        // Try fetching by ID first
        let article = null;
        try {
            const res = await fetch(`${API_BASE}/api/news/${encodeURIComponent(id)}`);
            if (res.ok) {
                const data = await res.json();
                if (!data.error) article = data;
            }
        } catch (_) {}

        // Fallback: search in world articles
        if (!article) {
            const cats = ['world', 'technology', 'business', 'politics', 'sports', 'science', 'entertainment'];
            for (const cat of cats) {
                try {
                    const res = await fetch(`${API_BASE}/api/news?category=${cat}&page=1&limit=30`);
                    const data = await res.json();
                    const articles = Array.isArray(data) ? data : (data.articles || []);
                    article = articles.find(a => a.id === id || decodeURIComponent(a.id || '') === id);
                    if (article) break;
                } catch (_) {}
            }
        }

        if (!article) throw new Error('Article not found');

        renderArticle(article);
        loadRelated(article.category, article.id);

    } catch (e) {
        if (loading) loading.innerHTML = `
            <div style="text-align:center;padding:80px 20px;color:var(--text-muted)">
                <i class="fas fa-exclamation-circle" style="font-size:48px;margin-bottom:20px;color:var(--red)"></i>
                <h2 style="font-family:var(--font-head);margin-bottom:10px">Article Not Found</h2>
                <p style="margin-bottom:20px">This article might have been removed or the server is offline.</p>
                <a href="index.html" style="color:var(--red);font-weight:700">← Back to Home</a>
            </div>`;
    }
}

/* ─── Render Article ────────────────────────────────────────── */
function renderArticle(a) {
    const loading = document.getElementById('article-loading');
    const content = document.getElementById('article-content');

    // Page title & meta
    document.title = `${a.title} – PrimeReport`;
    document.getElementById('page-title').textContent = `${a.title} – PrimeReport`;
    document.getElementById('page-desc')?.setAttribute('content', a.summary || a.title);

    // JSON-LD schema
    const schema = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": a.title,
        "image": a.image || '',
        "datePublished": a.date || new Date().toISOString(),
        "author": { "@type": "Organization", "name": a.source || "PrimeReport" },
        "publisher": {
            "@type": "Organization",
            "name": "PrimeReport",
            "logo": { "@type": "ImageObject", "url": window.location.origin + "/logo.png" }
        }
    };
    document.getElementById('article-schema').textContent = JSON.stringify(schema);

    const articleUrl  = window.location.href;
    const twitterText = encodeURIComponent(a.title);

    content.innerHTML = `
        <!-- Breadcrumb -->
        <nav class="article-breadcrumb">
            <a href="index.html">Home</a>
            <i class="fas fa-chevron-right" style="font-size:10px"></i>
            <a href="index.html?category=${encodeURIComponent(a.category || 'World')}">${a.category || 'World'}</a>
            <i class="fas fa-chevron-right" style="font-size:10px"></i>
            <span style="color:var(--text-muted)">Article</span>
        </nav>

        <!-- Category Badge -->
        <div style="margin-bottom:14px">
            <span class="cat-badge ${catClass(a.category)}">${a.category || 'News'}</span>
        </div>

        <!-- Headline -->
        <h1 class="article-headline">${escHtml(a.title)}</h1>

        <!-- Meta -->
        <div class="article-meta">
            <span class="source-badge">${escHtml(a.source || 'PrimeReport')}</span>
            <span><i class="far fa-clock"></i> ${formatDate(a.date)}</span>
            <span><i class="far fa-clock"></i> ${timeAgo(a.date)}</span>
        </div>

        <!-- Hero Image -->
        <img class="article-hero-img"
             src="${a.image || PLACEHOLDER}"
             alt="${escHtml(a.title)}"
             loading="lazy"
             onerror="this.src='/assets/images/news-placeholder.jpg'">

        <!-- Article Body -->
        <div class="article-body">
            ${buildArticleBody(a)}
        </div>

        <!-- Share Bar -->
        <div class="share-bar">
            <span><i class="fas fa-share-nodes"></i> Share this story:</span>
            <a class="share-btn twitter"
               href="https://twitter.com/intent/tweet?text=${twitterText}&url=${encodeURIComponent(articleUrl)}"
               target="_blank" rel="noopener">
                <i class="fab fa-twitter"></i> Twitter
            </a>
            <a class="share-btn facebook"
               href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}"
               target="_blank" rel="noopener">
                <i class="fab fa-facebook-f"></i> Facebook
            </a>
            <button class="share-btn copy" onclick="copyLink()">
                <i class="fas fa-link"></i> Copy Link
            </button>
        </div>

    `;

    // Show content, hide loader
    loading?.classList.add('hidden');
    content.classList.remove('hidden');
}

/* ─── Article Body Builder ──────────────────────────────────── */
function buildArticleBody(a) {
    const body = (a.content || a.description || a.summary || '').trim();
    if (!body) return `<p>${escHtml(a.summary || 'Full article content is currently unavailable.')}</p>`;

    // If it's already HTML, return it (sanitized)
    if (body.includes('<p>') || body.includes('<h') || body.includes('<div') || body.includes('<figure')) return sanitize(body);

    // Plain text: wrap paragraphs
    return body.split('\n\n').filter(Boolean).map(p => `<p>${escHtml(p.trim())}</p>`).join('');
}

function sanitize(html) {
    // Remove dangerous tags but allow basic formatting
    return html.replace(/<script[\s\S]*?<\/script>/gi, '')
               .replace(/<style[\s\S]*?<\/style>/gi, '')
               .replace(/on\w+="[^"]*"/gi, '');
}

/* ─── Related Articles ──────────────────────────────────────── */
async function loadRelated(category, currentId) {
    if (!category) return;
    const section = document.getElementById('related-section');
    if (!section) return;

    try {
        const res = await fetch(`${API_BASE}/api/news?category=${category.toLowerCase()}&page=1&limit=8`);
        const data = await res.json();
        const articles = (Array.isArray(data) ? data : (data.articles || []))
            .filter(a => a.id !== currentId)
            .slice(0, 3);

        if (!articles.length) return;

        section.classList.remove('hidden');
        section.innerHTML = `
            <h2><span class="title-accent"></span> You Might Also Like</h2>
            <div class="related-grid">
                ${articles.map(a => `
                <div class="news-card" onclick="window.location.href='article.html?id=${encodeURIComponent(a.id)}'" style="cursor:pointer">
                    <div class="card-img">
                        <img class="card-img-inner" src="${a.image || PLACEHOLDER}" alt="${escHtml(a.title)}" loading="lazy" onerror="this.src='${PLACEHOLDER}'">
                    </div>
                    <div class="card-body">
                        <span class="cat-badge ${catClass(a.category)}">${a.category || 'News'}</span>
                        <h3>${escHtml(a.title)}</h3>
                        <div class="card-footer">
                            <span class="card-time">${timeAgo(a.date)}</span>
                            <span class="read-btn">Read <i class="fas fa-arrow-right"></i></span>
                        </div>
                    </div>
                </div>`).join('')}
            </div>`;
    } catch (e) {
        console.warn('[Related] failed:', e.message);
    }
}

/* ─── Actions ───────────────────────────────────────────────── */
function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        alert('Link copied to clipboard!');
    });
}

/* ─── Helpers ───────────────────────────────────────────────── */
function catClass(cat) {
    const map = {
        technology: 'cat-technology', tech: 'cat-technology',
        business: 'cat-business', politics: 'cat-politics',
        sports: 'cat-sports', science: 'cat-science',
        entertainment: 'cat-entertainment',
    };
    return map[(cat || '').toLowerCase()] || '';
}

function timeAgo(date) {
    if (!date) return 'Just now';
    const d = new Date(date);
    if (isNaN(d)) return 'Just now';
    const diff = (Date.now() - d) / 1000;
    if (diff < 60)    return 'Just now';
    if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
}

function formatDate(date) {
    if (!date) return '';
    try {
        return new Date(date).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
    } catch (_) { return ''; }
}

function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
