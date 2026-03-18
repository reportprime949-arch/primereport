/* ==============================================================
   PrimeReport — main.js  (Ultra-Fast Performance Edition)
   ============================================================== */

const API_BASE = window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://primereport-server.onrender.com";

const PLACEHOLDER = 'hero.webp';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

let allArticles   = [];
let currentPage   = 1;
let currentCat    = 'all';
let isLoadingMore = false;
let hasMore       = true;

/* ─── Cache Engine ─────────────────────────────────────────── */
const Cache = {
    get(key) {
        try {
            const raw = sessionStorage.getItem(key);
            if (!raw) return null;
            const { data, ts } = JSON.parse(raw);
            if (Date.now() - ts > CACHE_TTL) {
                sessionStorage.removeItem(key);
                return null;
            }
            return data;
        } catch { return null; }
    },
    set(key, data) {
        try {
            sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
        } catch { /* storage full */ }
    }
};

/* ─── Bootstrap ─────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initMobileMenu();
    updateDate();
    detectActiveCat();
    initSearch();
    initCategoryTabs();
    initEventDelegation();
    initInfiniteScroll();

    // Fire data fetches async
    loadPortalTop();
    loadCategoryBlocks();
    loadPortalTrending();
    loadBreakingTicker();
});

/* ─── Infinite Scroll (Disabled for Editorial View) ────────── */
/* ─── Infinite Scroll (Disabled) ────────────────────────────── */
function initInfiniteScroll() {}

/* ─── Event Delegation ──────────────────────────────────────── */
function initEventDelegation() {
    // Relying on inline onclick="openArticle('slug')" for now.
}

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

/* ─── Mobile Menu ───────────────────────────────────────────── */
function initMobileMenu() {
    const overlay = document.getElementById('mobile-menu');
    const openBtn  = document.getElementById('mobile-menu-btn');
    const closeBtn = document.getElementById('close-menu');
    const bottomNavCategories = document.getElementById('bottom-nav-categories');
    
    const close = () => overlay?.classList.add('hidden');
    const open = (e) => { e.preventDefault(); overlay?.classList.remove('hidden'); };

    openBtn?.addEventListener('click', open);
    bottomNavCategories?.addEventListener('click', open);
    closeBtn?.addEventListener('click', close);
}

/* ─── Active nav link ───────────────────────────────────────── */
function detectActiveCat() {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category') || 'all';
    currentCat = cat.toLowerCase();

    document.querySelectorAll('[data-cat]').forEach(el => {
        const matched = el.dataset.cat.toLowerCase() === currentCat;
        el.classList.toggle('active', matched);
    });
}

/* ─── Search ────────────────────────────────────────────────── */
function initSearch() {
    const input = document.getElementById('search-input');
    if (!input) return;
    let debounce;
    input.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
            const q = input.value.trim().toLowerCase();
            if (q.length > 2) {
                renderFilteredCards(allArticles.filter(a => a.title?.toLowerCase().includes(q)));
            } else if (!q) {
                renderFilteredCards(allArticles);
            }
        }, 300);
    });
}

/* ─── Category Tabs ─────────────────────────────────────────── */
function initCategoryTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const cat = btn.dataset.cat;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPage = 1;
            hasMore = true;
            allArticles = [];
            loadNewsGrid(cat);
        });
    });
}

/* ─── EDITORIAL PORTAL LOADERS ───────────────────────────────── */
async function loadPortalTop() {
    try {
        const res = await fetch(`${API_BASE}/api/news/hero`);
        const articles = await res.json();
        if (!articles?.length) return;
        
        // 1. Hero
        const hero = articles[0];
        const heroContainer = document.getElementById('portal-hero');
        if (heroContainer) {
            heroContainer.innerHTML = `
                <div class="editorial-hero-card" onclick="openArticle('${hero.slug || hero.id}')">
                    <img src="${hero.image || hero.urlToImage || PLACEHOLDER}" alt="${escHtml(hero.title)}" 
                         class="editorial-hero-img" width="800" height="500" loading="eager" fetchpriority="high">
                    <div class="editorial-hero-overlay"></div>
                    <div class="editorial-hero-content">
                        <span class="cat-badge">${hero.category || 'Breaking'}</span>
                        <h2>${escHtml(hero.title)}</h2>
                        <div class="editorial-meta">
                            <span><i class="far fa-clock"></i> ${timeAgo(hero.publishedAt)}</span>
                            <span><i class="fas fa-newspaper"></i> ${escHtml(hero.source || 'PrimeReport')}</span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // 2. Top Stories (Right Col)
        const topStories = articles.slice(1, 5);
        const topContainer = document.getElementById('portal-top-stories');
        if (topContainer) {
            topContainer.innerHTML = topStories.map(a => `
                <div class="editorial-top-story" onclick="openArticle('${a.slug || a.id}')">
                    <img src="${a.image || a.urlToImage || PLACEHOLDER}" class="top-story-img" loading="lazy">
                    <div class="top-story-content">
                        <h4>${escHtml(a.title)}</h4>
                        <div class="editorial-meta-sm">${timeAgo(a.publishedAt)} &bull; ${escHtml(a.source || 'Prime')}</div>
                    </div>
                </div>
            `).join('');
        }
    } catch (e) {
        console.warn('[Portal Top] Failed', e);
    }
}

async function loadCategoryBlock(category, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    try {
        const res = await fetch(`${API_BASE}/api/news?category=${category}&limit=4`);
        const data = await res.json();
        const articles = data.articles || [];
        container.innerHTML = articles.map(a => `
            <div class="editorial-card" onclick="openArticle('${a.slug || a.id}')">
                <div class="card-img-wrap">
                    <img src="${a.image || PLACEHOLDER}" alt="${escHtml(a.title)}" class="editorial-card-img" loading="lazy">
                </div>
                <div class="editorial-card-body">
                    <div class="editorial-cat-label">${a.category || category}</div>
                    <h3>${escHtml(a.title)}</h3>
                    <p class="editorial-excerpt">${escHtml(a.excerpt || a.description || 'No description available for this story. Read full coverage inside.')}</p>
                    <div class="editorial-meta-sm editorial-time"><i class="far fa-clock"></i> ${timeAgo(a.publishedAt)}</div>
                </div>
            </div>
        `).join('');
    } catch(e) {}
}

async function loadCategoryBlocks() {
    await Promise.all([
        loadCategoryBlock('World', 'block-world'),
        loadCategoryBlock('Technology', 'block-technology'),
        loadCategoryBlock('Business', 'block-business')
    ]);
}

/* ─── TICKER / TRENDING ─────────────────────────────────────── */
async function loadBreakingTicker() {
    const track = document.getElementById('ticker-track');
    if (!track) return;
    try {
        const res = await fetch(`${API_BASE}/api/news/breaking`);
        const articles = await res.json();
        if (articles?.length) {
            const html = articles.map(a => `<span class="ticker-item" onclick="openArticle('${a.slug || a.id}')">${escHtml(a.title)}</span>`).join('');
            track.innerHTML = html + html;
        }
    } catch (e) {}
}

async function loadPortalTrending() {
    const list = document.getElementById('portal-trending');
    if (!list) return;
    try {
        const res = await fetch(`${API_BASE}/api/news/trending`);
        const items = await res.json();
        if (items?.length) {
            list.innerHTML = items.slice(0, 5).map((a, i) => `
                <div class="editorial-trend-item" onclick="openArticle('${a.slug || a.id}')">
                    <div class="trend-number">${String(i + 1).padStart(2, '0')}</div>
                    <div class="trend-content">
                        <h4>${escHtml(a.title)}</h4>
                        <div class="editorial-meta-sm">${timeAgo(a.publishedAt)}</div>
                    </div>
                </div>`).join('');
        }
    } catch (e) {}
}

/* ─── HELPERS ───────────────────────────────────────────────── */
function openArticle(id) { window.location.href = `article.html?id=${encodeURIComponent(id)}`; }

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
