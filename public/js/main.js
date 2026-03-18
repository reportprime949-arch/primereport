/* ==============================================================
   PrimeReport — main.js  (Premium UI Engine)
   Powers: Hero, News Grid, Breaking Ticker, Trending, Dark Mode
   ============================================================== */


const API_BASE = window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://primereport-server.onrender.com";

const PLACEHOLDER = 'https://via.placeholder.com/600x400?text=PrimeReport';

let allArticles   = [];
let currentPage   = 1;
let currentCat    = 'all';
let isLoadingMore = false;
let hasMore       = true;

/* ─── Progress Bar ─────────────────────────────────────────── */
const ProgressBar = {
    el: document.getElementById('top-progress-bar'),
    start() {
        if (!this.el) return;
        this.el.style.width = '30%';
        this.el.classList.add('loading');
    },
    set(percent) {
        if (!this.el) return;
        this.el.style.width = percent + '%';
    },
    finish() {
        if (!this.el) return;
        this.el.style.width = '100%';
        this.el.classList.remove('loading');
        setTimeout(() => {
            this.el.style.width = '0%';
        }, 500);
    }
};

/* ─── Bootstrap ─────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initHeader();
    initMobileMenu();
    updateDate();
    detectActiveCat();
    initSearch();
    loadHero();
    loadNewsGrid();
    loadBreakingTicker();
    loadTrending();
    initLoadMore();
    initCategoryTabs();
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
        if (icon) { icon.classList.replace('fa-moon', 'fa-sun'); }
    }

    btn?.addEventListener('click', () => {
        root.classList.toggle('dark');
        const dark = root.classList.contains('dark');
        if (icon) {
            icon.classList.replace(dark ? 'fa-moon' : 'fa-sun', dark ? 'fa-sun' : 'fa-moon');
        }
        localStorage.setItem('theme', dark ? 'dark' : 'light');
    });
}

/* ─── Header scroll shadow ──────────────────────────────────── */
function initHeader() {
    // Header is now solid sticky via CSS
    return;
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

/* ─── Active nav link ───────────────────────────────────────── */
function detectActiveCat() {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category') || 'all';
    currentCat = cat.toLowerCase();

    document.querySelectorAll('[data-cat]').forEach(el => {
        const matched = el.dataset.cat.toLowerCase() === currentCat
            || (currentCat === 'all' && el.dataset.cat.toLowerCase() === 'all');
        el.classList.toggle('active', matched);
    });

    const title = document.getElementById('section-title');
    if (title) {
        const name = currentCat === 'all' ? 'Latest News' : capitalize(currentCat);
        title.innerHTML = `<span class="title-accent"></span> ${name}`;
    }
}

/* ─── Search ────────────────────────────────────────────────── */
function initSearch() {
    const input = document.getElementById('search-input');
    if (!input) return;
    let debounce;
    input.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
            const q = input.value.trim();
            if (q.length > 2) {
                renderFilteredCards(allArticles.filter(a =>
                    a.title?.toLowerCase().includes(q.toLowerCase())
                ));
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

async function loadHero() {
    const container = document.getElementById('hero-container');
    if (!container) return;

    ProgressBar.start();

    try {
        const res = await fetch(`${API_BASE}/api/news/hero`);
        if (!res.ok) throw new Error("Hero fetch failed");
        let articles = await res.json();

        if (!articles || articles.length === 0) {
            const br = await fetch(`${API_BASE}/api/news/breaking`);
            articles = await br.json();
        }

        if (!articles || articles.length === 0) {
            container.innerHTML = `<p style="padding:40px;text-align:center;opacity:.6">No featured stories available.</p>`;
            return;
        }

        const [main, ...sides] = articles.slice(0, 5);
        const catCls = catClass(main.category);

        container.innerHTML = `
        <div class="hero-layout">
            <div class="hero-main" onclick="openArticle('${main.slug || main.id}')">
                <img src="${main.image || main.urlToImage || PLACEHOLDER}"
                     alt="${escHtml(main.title)}"
                     class="hero-main-img"
                     loading="eager"
                     onerror="this.onerror=null;this.src='${PLACEHOLDER}'">
                <div class="hero-main-overlay"></div>
                <div class="hero-main-content">
                    <div class="cat-badge ${catCls}">${main.category || 'World'}</div>
                    <h2>${escHtml(main.title)}</h2>
                    <p class="excerpt">${escHtml(main.summary || main.description || '')}</p>
                    <div class="hero-meta">
                        <span><i class="far fa-clock"></i> ${timeAgo(main.publishedAt || main.date)}</span>
                        <span><i class="fas fa-newspaper"></i> ${escHtml(main.source || 'PrimeReport')}</span>
                    </div>
                </div>
            </div>
            <div class="hero-side">
                ${sides.map(a => {
                    const cls = catClass(a.category);
                    return `
                    <div class="hero-side-card" onclick="openArticle('${a.slug || a.id}')">
                        <img src="${a.image || a.urlToImage || PLACEHOLDER}"
                             alt="${escHtml(a.title)}"
                             class="side-img"
                             loading="lazy"
                             onerror="this.onerror=null;this.src='${PLACEHOLDER}'">
                        <div class="hero-side-content">
                            <div class="cat-badge ${cls}">${a.category || 'News'}</div>
                            <h3>${escHtml(a.title)}</h3>
                            <div class="side-meta">${timeAgo(a.publishedAt || a.date)}</div>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
        ProgressBar.finish();
    } catch (e) {
        ProgressBar.finish();
        console.warn('[Hero] Error:', e);
        container.innerHTML = `<p style="padding:40px;text-align:center;opacity:.6">Featured section temporarily unavailable.</p>`;
    }
}


/* ─── NEWS GRID ─────────────────────────────────────────────── */
async function loadNewsGrid(cat) {
    const grid = document.getElementById('news-grid');
    if (!grid) return;

    cat = cat || (currentCat === 'all' ? 'world' : currentCat);
    
    // Initial load skeletons
    if (currentPage === 1) {
        grid.innerHTML = generateSkeletons(8);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (isLoadingMore || (!hasMore && currentPage > 1)) return;
    isLoadingMore = true;
    ProgressBar.start();

    try {
        // Optimized fetch with cache busting and better error handling
        const res = await fetch(`${API_BASE}/api/news?category=${cat}&page=${currentPage}&limit=12&_t=${Date.now()}`);
        if (!res.ok) throw new Error(`NewsGrid API failed: ${res.status}`);
        
        const data = await res.json();
        const articles = Array.isArray(data) ? data : (data.articles || []);
        
        // Handle empty results
        if (currentPage === 1 && articles.length === 0) {
            grid.innerHTML = `<div class="col-span-full py-20 text-center">
                <i class="fas fa-newspaper opacity-20" style="font-size:4rem; margin-bottom:15px; display:block;"></i>
                <p class="opacity-60">No articles found in this category.</p>
            </div>`;
            hasMore = false;
            return;
        }

        if (articles.length < 12) hasMore = false;

        const btn = document.getElementById('load-more-btn');
        if (btn) btn.style.display = hasMore ? 'flex' : 'none';

        if (currentPage === 1) {
            allArticles = articles;
            grid.innerHTML = '';
            renderCards(articles, false);
        } else {
            allArticles = [...allArticles, ...articles];
            renderCards(articles, true);
        }
        currentPage++;
    } catch (e) {
        console.error('[NewsGrid] Error:', e.message);
        if (currentPage === 1) {
            grid.innerHTML = `<div class="col-span-full text-center py-20">
                <p class="opacity-60">Connection error. Please refresh the page.</p>
                <button class="btn btn-primary mt-4" onclick="location.reload()">Retry Connection</button>
            </div>`;
        }
    } finally {
        isLoadingMore = false;
        ProgressBar.finish();
        const btn = document.getElementById('load-more-btn');
        btn?.classList.remove('loading');
    }
}

function renderCards(articles, append) {
    const grid = document.getElementById('news-grid');
    if (!grid) return;
    if (!append) grid.innerHTML = '';

    const fragment = document.createDocumentFragment();

    articles.forEach((article, i) => {
        const card = document.createElement('div');
        card.className = 'news-card';
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.05}s`;
        
        const slugOrId = article.slug || article.id;
        card.innerHTML = `
            <div class="card-img" onclick="openArticle('${slugOrId}')">
                <img src="${article.image || article.urlToImage || PLACEHOLDER}"
                     alt="${escHtml(article.title)}"
                     class="card-img-inner"
                     loading="lazy"
                     onerror="this.onerror=null;this.src='${PLACEHOLDER}'">
            </div>
            <div class="card-body">
                <div class="cat-badge ${catClass(article.category)}">${article.category || 'News'}</div>
                <h3 onclick="openArticle('${slugOrId}')">${escHtml(article.title)}</h3>
                <p class="card-excerpt">${escHtml(article.summary || article.description || '')}</p>
                <div class="card-footer">
                    <span class="card-time"><i class="far fa-clock"></i> ${timeAgo(article.publishedAt || article.date)}</span>
                    <span class="read-btn">Read <i class="fas fa-arrow-right"></i></span>
                </div>
            </div>`;
        
        fragment.appendChild(card);
        
        // Trigger animation
        requestAnimationFrame(() => {
            card.classList.add('fade-in');
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        });
    });

    grid.appendChild(fragment);
}

function renderFilteredCards(articles) {
    const grid = document.getElementById('news-grid');
    if (!grid) return;
    grid.innerHTML = '';
    if (!articles.length) {
        grid.innerHTML = `<p style="color:var(--text-muted);padding:40px 0;text-align:center;grid-column:1/-1">No results found.</p>`;
        return;
    }
    renderCards(articles, false);
}

/* ─── LOAD MORE ─────────────────────────────────────────────── */
function initLoadMore() {
    const btn = document.getElementById('load-more-btn');
    btn?.addEventListener('click', () => {
        btn.classList.add('loading');
        const cat = currentCat === 'all' ? 'world' : currentCat;
        loadNewsGrid(cat);
    });
}

/* ─── BREAKING TICKER ───────────────────────────────────────── */
async function loadBreakingTicker() {
    const track = document.getElementById('ticker-track');
    if (!track) return;

    try {
        const res = await fetch(`${API_BASE}/api/news/breaking`);
        if (!res.ok) throw new Error(`Breaking API failed: ${res.status}`);
        const articles = await res.json();

        if (articles?.length) {
            const spans = articles
                .map(a => `<span class="ticker-item" onclick="openArticle('${a.slug || a.id}')" style="cursor:pointer">${escHtml(a.title)}</span>`)
                .join('');
            track.innerHTML = spans + spans; // duplicate for loop
        }
    } catch (e) {
        track.textContent = 'Latest global news loading…';
    }
}

/* ─── TRENDING ──────────────────────────────────────────────── */
async function loadTrending() {
    const list = document.getElementById('trending-list');
    if (!list) return;

    // Show skeletons
    list.innerHTML = Array.from({ length: 5 }, () => `
        <div class="trend-item shimmer" style="height:80px; margin-bottom:10px; border-radius:8px; border:1px solid var(--border);"></div>
    `).join('');

    try {
        const res = await fetch(`${API_BASE}/api/news/trending?_t=${Date.now()}`);
        if (!res.ok) throw new Error(`Trending API failed: ${res.status}`);
        let items = await res.json();

        // Fallback to latest news if trending is empty
        if (!items || !items.length) {
            const latestRes = await fetch(`${API_BASE}/api/news?limit=5`);
            const data = await latestRes.json();
            items = Array.isArray(data) ? data : (data.articles || []);
        }

        if (!items || !items.length) {
            list.innerHTML = `<p style="padding:20px;color:var(--text-muted);font-size:13px;text-align:center;">No trends found.</p>`;
            return;
        }

        list.innerHTML = items.slice(0, 5).map((article, i) => {
            const slugOrId = article.slug || article.id;
            const cls = catClass(article.category);
            return `
            <div class="trend-item" onclick="openArticle('${slugOrId}')">
                <div class="trend-num">0${i + 1}</div>
                <div class="trend-thumb">
                    <img src="${article.image || article.urlToImage || PLACEHOLDER}"
                         alt="${escHtml(article.title)}"
                         onerror="this.onerror=null;this.src='${PLACEHOLDER}'">
                </div>
                <div class="trend-content">
                    <h4>${escHtml(article.title)}</h4>
                    <div class="trend-cat ${cls}">${escHtml(article.category || 'Trending')}</div>
                </div>
            </div>`;
        }).join('');
    } catch (e) {
        console.warn('[Trending] Error:', e.message);
        list.innerHTML = `<p style="padding:20px;color:var(--text-muted);font-size:13px;text-align:center;">Trends temporarily unavailable.</p>`;
    }
}

/* ─── NEWSLETTER ────────────────────────────────────────────── */
function handleSubscribe(e) {
    e.preventDefault();
    const form    = e.target;
    const success = document.getElementById('subscribe-success');
    form.style.display = 'none';
    success?.classList.remove('hidden');
}

/* ─── NAVIGATION ────────────────────────────────────────────── */
function openArticle(slugOrId) {
    if (!slugOrId) return;
    window.location.href = `article.html?id=${encodeId(slugOrId)}`;
}

/* ─── SKELETONS ─────────────────────────────────────────────── */
function generateSkeletons(count) {
    return Array.from({ length: count }, () => `
        <div class="skeleton-card">
            <div class="skeleton-img shimmer"></div>
            <div class="skeleton-content">
                <div class="skeleton-badge shimmer"></div>
                <div class="skeleton-title shimmer"></div>
                <div class="skeleton-desc shimmer"></div>
                <div class="skeleton-footer">
                    <div class="skeleton-meta shimmer"></div>
                    <div class="skeleton-meta shimmer"></div>
                </div>
            </div>
        </div>
    `).join('');
}

/* ─── HELPERS ───────────────────────────────────────────────── */
function catClass(cat) {
    const map = {
        technology: 'cat-technology', tech: 'cat-technology',
        business: 'cat-business',
        politics: 'cat-politics',
        sports: 'cat-sports',
        science: 'cat-science',
        entertainment: 'cat-entertainment',
    };
    return map[(cat || '').toLowerCase()] || '';
}

function timeAgo(date) {
    if (!date) return 'Just now';
    const d = new Date(date);
    if (isNaN(d)) return 'Just now';
    const diff = (Date.now() - d) / 1000;
    if (diff <    60) return 'Just now';
    if (diff <  3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function encodeId(id) { return encodeURIComponent(id || ''); }
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
