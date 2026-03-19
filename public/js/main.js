/* ==============================================================
   PRIME REPORT – Premium BBC-Style main.js
   ============================================================== */

const API = "https://primereport-server.onrender.com";
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
    updateDate();
    initSearch();
    initMobileMenu();
    initCategoryTabs();

    // Core Content Loading
    loadPortalTop();      // Hero + Sidebars
    loadCategoryBlocks(); // Main grids
    loadBreakingTicker(); // Ticker
});

/* ─── UI Actions ───────────────────────────────────────────── */
function updateDate() {
    const el = document.getElementById('current-date');
    if (el) el.textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
}

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
    if (!btn || !nav) return;

    btn.onclick = () => {
        nav.classList.toggle('active');
        btn.innerHTML = nav.classList.contains('active') ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    };
}

function initSearch() {
    const input = document.getElementById('search-input');
    if (!input) return;
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const val = input.value.trim();
            if (val) window.location.href = `index.html?search=${encodeURIComponent(val)}`;
        }
    });
}

/* ─── Component Renderers ───────────────────────────────────── */

/**
 * Premium Article Card
 */
function createNewsCard(a, catOverride) {
    const slug = a.slug || a.id;
    return `
        <div class="news-card" onclick="openArticle('${slug}')">
            <span class="card-cat-badge">${a.category || catOverride || 'News'}</span>
            <div class="card-img-wrap">
                <img src="${a.image || PLACEHOLDER}" alt="${escHtml(a.title)}" loading="lazy" onerror="this.src='${PLACEHOLDER}'">
            </div>
            <h3>${escHtml(a.title)}</h3>
            <div class="card-meta">
                <span>${escHtml(a.source || 'PrimeReport')}</span>
                <span>${timeAgo(a.publishedAt)}</span>
            </div>
        </div>
    `;
}

/**
 * Numbered Sidebar Item
 */
function createSidebarItem(a, index) {
    return `
        <div class="sidebar-item" onclick="openArticle('${a.slug || a.id}')">
            <div class="item-number">${String(index).padStart(2, '0')}</div>
            <div class="sidebar-item-content">
                <h4>${escHtml(a.title)}</h4>
                <div class="card-meta">${timeAgo(a.publishedAt)}</div>
            </div>
        </div>
    `;
}

/**
 * Compact Trending Widget Item
 */
function createTrendingItem(a) {
    return `
        <div class="trending-side-item" onclick="openArticle('${a.slug || a.id}')">
            <div class="trending-img">
                <img src="${a.image || PLACEHOLDER}" alt="${escHtml(a.title)}" loading="lazy">
            </div>
            <div class="trending-text">
                <h5>${escHtml(a.title)}</h5>
                <div class="card-meta" style="font-size:10px">${timeAgo(a.publishedAt)}</div>
            </div>
        </div>
    `;
}

/* ─── Content Loading Logic ──────────────────────────────────── */

/**
 * Load Hero (70%) and Sidebars (30%)
 */
async function loadPortalTop() {
    try {
        const data = await fetchWithRetry(`${API}/api/news?limit=15`);
        const articles = data.articles || [];
        if (!articles.length) return;

        // 1. Hero (Main)
        const hero = articles[0];
        const heroEl = document.getElementById('portal-hero');
        if (heroEl) {
            heroEl.innerHTML = `
                <img src="${hero.image || PLACEHOLDER}" alt="${escHtml(hero.title)}" fetchpriority="high">
                <div class="hero-overlay">
                    <span class="hero-badge">${hero.category || 'Featured'}</span>
                    <h1>${escHtml(hero.title)}</h1>
                    <div class="hero-meta">
                        <span><i class="far fa-clock"></i> ${timeAgo(hero.publishedAt)}</span>
                        <span><i class="fas fa-globe"></i> ${escHtml(hero.source || 'PrimeReport')}</span>
                    </div>
                </div>
            `;
            heroEl.onclick = () => openArticle(hero.slug || hero.id);
        }

        // 2. Top Stories Sidebar (Right Top 2-6)
        const topEl = document.getElementById('portal-top-stories');
        if (topEl) {
            topEl.innerHTML = articles.slice(1, 6).map((a, i) => createSidebarItem(a, i + 1)).join('');
        }

        // 3. Trending Now Sidebar (Right Bottom 7-10)
        const trendEl = document.getElementById('portal-trending');
        if (trendEl) {
            trendEl.innerHTML = articles.slice(6, 10).map(a => createTrendingItem(a)).join('');
        }

    } catch (err) {
        console.error('[loadPortalTop Error]', err);
    }
}

/**
 * Load Main Category Grids
 */
async function loadCategoryBlocks() {
    const cats = ['World', 'Technology', 'Business'];
    cats.forEach(async (cat) => {
        const grid = document.getElementById(`block-${cat.toLowerCase()}`);
        if (!grid) return;

        try {
            const data = await fetchWithRetry(`${API}/api/category/${cat.toLowerCase()}?limit=4`);
            const articles = data.articles || [];
            if (!articles.length) {
                grid.innerHTML = '<div style="padding:40px; color:var(--text-muted);">No recent updates in this category.</div>';
                return;
            }
            grid.innerHTML = articles.map(a => createNewsCard(a, cat)).join('');
        } catch (err) {
            console.warn(`[loadCategory Error: ${cat}]`, err);
        }
    });
}

/**
 * Editor's Picks (Sub-category Tabs)
 */
function initCategoryTabs() {
    const tabs = document.querySelectorAll('.tab-item');
    const grid = document.getElementById('block-sub-grid');
    if (!tabs.length || !grid) return;

    tabs.forEach(tab => {
        tab.onclick = async () => {
            const sub = tab.dataset.sub;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Loading state
            grid.innerHTML = Array(4).fill('<div class="skeleton" style="height:280px"></div>').join('');

            try {
                const data = await fetchWithRetry(`${API}/api/category/${sub.toLowerCase()}?limit=4`);
                const articles = data.articles || [];
                if (!articles.length) {
                    grid.innerHTML = '<div style="grid-column:1/-1; padding:60px; text-align:center;">No stories found in this section.</div>';
                    return;
                }
                grid.innerHTML = articles.map(a => createNewsCard(a, sub)).join('');
            } catch (err) {
                grid.innerHTML = '<div style="grid-column:1/-1; padding:60px; text-align:center; color:var(--primary);">Failed to load section.</div>';
            }
        };
    });

    // Initial load
    tabs[0].click();
}

/**
 * Breaking News Ticker
 */
async function loadBreakingTicker() {
    const track = document.getElementById('ticker-track');
    if (!track) return;

    try {
        const data = await fetchWithRetry(`${API}/api/news?limit=10`);
        const articles = data.articles || [];
        if (articles.length) {
            const txt = articles.map(a => `<span class="ticker-item" onclick="openArticle('${a.slug || a.id}')">${escHtml(a.title)}</span>`).join('');
            track.innerHTML = txt + txt; // Seamless loop
        }
    } catch (err) {
        track.innerHTML = '<span class="ticker-item">Breaking news ticker temporarily unavailable.</span>';
    }
}

/* ─── Global Helpers ────────────────────────────────────────── */

function openArticle(slug) {
    if (!slug) return;
    window.location.href = `/article/${slug}`;
}

function timeAgo(date) {
    if (!date) return 'Just now';
    const d = new Date(date);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 3600) return `${Math.floor(diff/60) || 1}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
}

function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
