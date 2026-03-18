/* ==============================================================
   PrimeReport — main.js  (Ultra-Fast Performance Edition)
   ============================================================== */

const API_BASE = "https://primereport-server.onrender.com";

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
    // Phase 2 Fix: Add listeners to nav-links for category clicks
    const CAT_MAP = {
        'tech': 'technology',
        'world news': 'world',
        'breaking news': 'all',
        'home': 'all'
    };

    document.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", (e) => {
            let category = e.target.innerText.trim().toLowerCase();
            category = CAT_MAP[category] || category;
            detectActiveCat(); // Update active states
            loadCategory(category);
        });
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const cat = btn.dataset.cat;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPage = 1;
            hasMore = true;
            allArticles = [];
            loadCategory(cat);
        });
    });
}

async function loadCategory(category) {
    try {
        console.log(`[Diagnostic] Fetching category: ${category}`);
        const res = await fetch(`${API_BASE}/api/news?category=${category}`);
        const data = await res.json();
        
        console.log(`Fetched Articles [${category}]:`, data.articles);

        if (!data.articles || !data.articles.length) {
            console.warn("No articles for", category);
            // Replace error boxes with "No articles available"
            renderNoArticles(category);
            return;
        }

        renderFilteredCards(data.articles || []);

    } catch (err) {
        console.error("Category load failed:", err);
    }
}

function renderNoArticles(category) {
    const grid = document.getElementById('news-grid');
    if (grid) grid.innerHTML = `<div class="no-data">No articles available for ${category} at this time.</div>`;
}

// Map loadNewsGrid to the new loadCategory for compatibility if needed
const loadNewsGrid = loadCategory;

/* ─── EDITORIAL PORTAL LOADERS ───────────────────────────────── */
async function loadPortalTop() {
    try {
        const res = await fetch(`${API_BASE}/api/news/hero`);
        let articles = await res.json();
        
        // Fallback: Slice from general news if hero is empty
        if (!articles || articles.length === 0) {
            console.warn('[Portal Top] Hero API empty, falling back to general news slice');
            const genRes = await fetch(`${API_BASE}/api/news`);
            const genData = await genRes.json();
            articles = (genData.articles || []).slice(0, 5);
        }

        console.log("Fetched Articles [Top Stories]:", articles);
        if (!articles?.length) throw new Error('No articles found');
        
        // 1. Hero
        const hero = articles[0];
        const heroContainer = document.getElementById('portal-hero');
        if (heroContainer) {
            heroContainer.innerHTML = `
                <div class="editorial-hero-card" onclick="openArticle('${hero.slug || hero.id}')">
                    <img src="${hero.image || hero.urlToImage || PLACEHOLDER}" alt="${escHtml(hero.title)}" 
                         class="editorial-hero-img" width="800" height="500" loading="eager" fetchpriority="high" 
                         onerror="this.src='https://via.placeholder.com/400x250?text=PrimeReport'">
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
        // User request: Top Stories -> first 5 articles (excluding hero usually, but let's take 1-5 as per layout)
        const topStories = articles.slice(1, 5);
        const topContainer = document.getElementById('portal-top-stories');
        if (topContainer) {
            topContainer.innerHTML = topStories.map(a => `
                <div class="editorial-top-story" onclick="openArticle('${a.slug || a.id}')">
                    <img src="${a.image || a.urlToImage || PLACEHOLDER}" class="top-story-img" loading="lazy" onerror="this.src='https://via.placeholder.com/400x250?text=PrimeReport'">
                    <div class="top-story-content">
                        <h4>${escHtml(a.title)}</h4>
                        <div class="editorial-meta-sm">${timeAgo(a.publishedAt)} &bull; ${escHtml(a.source || 'Prime')}</div>
                    </div>
                </div>
            `).join('');
        }
    } catch (e) {
        console.warn('[Portal Top] Failed to load data', e);
    }
}

async function loadCategoryBlock(category, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    try {
        const res = await fetch(`${API_BASE}/api/news?category=${category}&limit=4`);
        const data = await res.json();
        console.log(`Fetched Articles [${category}]:`, data.articles);
        const articles = (data.articles || []).slice(0, 4);
        if (!articles.length) {
            container.innerHTML = `<div style="padding:20px; color:var(--text-muted); font-size:13px;">No ${category} updates available.</div>`;
            return;
        }
        container.innerHTML = articles.map(a => `
            <div class="editorial-card" onclick="openArticle('${a.slug || a.id}')">
                <div class="card-img-wrap">
                    <img src="${a.image || PLACEHOLDER}" alt="${escHtml(a.title)}" class="editorial-card-img" loading="lazy" 
                         onerror="this.src='https://via.placeholder.com/400x250?text=PrimeReport'">
                </div>
                <div class="editorial-card-body">
                    <div class="editorial-cat-label">${a.category || category}</div>
                    <h3>${escHtml(a.title)}</h3>
                    <p class="editorial-excerpt">${escHtml(a.excerpt || a.description || 'No description available for this story. Read full coverage inside.')}</p>
                    <div class="editorial-meta-sm editorial-time"><i class="far fa-clock"></i> ${timeAgo(a.publishedAt)}</div>
                </div>
            </div>
        `).join('');
    } catch(e) {
        console.warn(`[Category] Failed to load ${category}`, e);
    }
}

async function loadCategoryBlocks() {
    await Promise.all([
        loadCategoryBlock('World', 'block-world'),
        loadCategoryBlock('Technology', 'block-technology'),
        loadCategoryBlock('Business', 'block-business'),
        loadCategoryBlock('Politics', 'block-politics'),
        loadCategoryBlock('Entertainment', 'block-entertainment'),
        loadCategoryBlock('Sports', 'block-sports'),
        loadCategoryBlock('Science', 'block-science')
    ]);
}

/* ─── TICKER / TRENDING ─────────────────────────────────────── */
async function loadBreakingTicker() {
    const track = document.getElementById('ticker-track');
    if (!track) return;
    try {
        const res = await fetch(`${API_BASE}/api/news/breaking`);
        if (!res.ok) throw new Error('API Error');
        const articles = await res.json();
        if (articles?.length) {
            const html = articles.map(a => `<span class="ticker-item" onclick="openArticle('${a.slug || a.id}')">${escHtml(a.title)}</span>`).join('');
            track.innerHTML = html + html;
        }
    } catch (e) {
        console.warn('[Ticker] Failed to load', e);
    }
}

async function loadPortalTrending() {
    const list = document.getElementById('portal-trending');
    if (!list) return;
    try {
        const res = await fetch(`${API_BASE}/api/news/trending`);
        let items = await res.json();
        
        // Fallback: Slice from general news if trending is empty
        if (!items || items.length === 0) {
            console.warn('[Portal Trending] Trending API empty, falling back to general news slice');
            const genRes = await fetch(`${API_BASE}/api/news`);
            const genData = await genRes.json();
            // User requirement: Trending -> load next 5 articles (e.g., 5-10)
            items = (genData.articles || []).slice(5, 10);
        }

        console.log("Fetched Articles [Trending]:", items);
        if (items?.length) {
            list.innerHTML = items.slice(0, 5).map((a, i) => `
                <div class="editorial-trend-item" onclick="openArticle('${a.slug || a.id}')">
                    <div class="trend-number">${String(i + 1).padStart(2, '0')}</div>
                    <div class="trend-content">
                        <h4>${escHtml(a.title)}</h4>
                        <div class="editorial-meta-sm">${timeAgo(a.publishedAt)}</div>
                    </div>
                </div>`).join('');
        } else {
            list.innerHTML = `<div style="padding:10px; color:var(--text-muted); font-size:13px;">No trending news at the moment.</div>`;
        }
    } catch (e) {
        console.warn('[Trending] Failed to load', e);
    }
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
