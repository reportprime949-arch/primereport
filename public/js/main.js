/* ==============================================================
   PrimeReport — Professional BBC-Style main.js
   ============================================================== */

const API = "https://primereport-server.onrender.com";
const PLACEHOLDER = 'hero.webp';

/* ─── Bootstrap ─────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    updateDate();
    initSearch();
    initMobileMenu();
    initSubCategoryTabs();

    // Data Loaders
    loadPortalTop();      // Hero + Sidebars
    loadCategoryBlocks(); // Main grids
    loadBreakingTicker(); // Ticker
});

/* ─── UI Initializers ───────────────────────────────────────── */
function updateDate() {
    const el = document.getElementById('current-date');
    if (el) el.textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
}

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

function initSearch() {
    const input = document.getElementById('search-input');
    if (!input) return;
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const q = input.value.trim();
            if (q) window.location.href = `index.html?search=${encodeURIComponent(q)}`;
        }
    });
}

/* ─── Data Fetching & Rendering ──────────────────────────────── */

// Helper: Card Renderer
function createNewsCard(a, category) {
    const link = `/article/${a.slug || a.id}`;
    return `
        <div class="news-card" onclick="openArticle('${a.slug || a.id}')">
            <div class="card-img-wrap">
                <img src="${a.image || PLACEHOLDER}" alt="${escHtml(a.title)}" loading="lazy" onerror="this.src='${PLACEHOLDER}'">
                <span class="card-cat-badge">${a.category || category || 'News'}</span>
            </div>
            <div class="card-content">
                <a href="${link}" class="card-link-seo"><h3>${escHtml(a.title)}</h3></a>
                <div class="card-footer">
                    <span>${escHtml(a.source || 'PrimeReport')}</span>
                    <span>${timeAgo(a.publishedAt)}</span>
                </div>
            </div>
        </div>
    `;
}

// Helper: Sidebar Item Renderer
function createSidebarItem(a, index) {
    const link = `/article/${a.slug || a.id}`;
    return `
        <div class="sidebar-item" onclick="openArticle('${a.slug || a.id}')">
            <div class="item-number">${String(index).padStart(2, '0')}</div>
            <div class="sidebar-item-content">
                <a href="${link}" class="card-link-seo"><h4>${escHtml(a.title)}</h4></a>
                <div class="editorial-meta-sm">${timeAgo(a.publishedAt)}</div>
            </div>
        </div>
    `;
}

// Loader: Hero + Sidebars
async function loadPortalTop() {
    try {
        const res = await fetch(`${API}/api/news`);
        const data = await res.json();
        const articles = data.articles || [];
        
        if (!articles.length) return;

        // 1. Hero (70%)
        const hero = articles[0];
        const heroContainer = document.getElementById('portal-hero');
        if (heroContainer) {
            heroContainer.innerHTML = `
                <img src="${hero.image || PLACEHOLDER}" alt="${escHtml(hero.title)}" fetchpriority="high">
                <div class="hero-overlay">
                    <span class="hero-badge">${hero.category || 'Top Story'}</span>
                    <a href="/article/${hero.slug || hero.id}" class="card-link-seo"><h1>${escHtml(hero.title)}</h1></a>
                    <div class="hero-meta">
                        <span><i class="far fa-clock"></i> ${timeAgo(hero.publishedAt)}</span>
                        <span><i class="fas fa-newspaper"></i> ${escHtml(hero.source || 'PrimeReport')}</span>
                    </div>
                </div>
            `;
            heroContainer.onclick = () => openArticle(hero.slug || hero.id);
        }

        // 2. Top Stories (Right Sidebar - items 2-4)
        const topContainer = document.getElementById('portal-top-stories');
        if (topContainer) {
            topContainer.innerHTML = articles.slice(1, 4).map((a, i) => createSidebarItem(a, i + 1)).join('');
        }

        // 3. Trending (Right Sidebar - items 5-7)
        const trendContainer = document.getElementById('portal-trending');
        if (trendContainer) {
            trendContainer.innerHTML = articles.slice(4, 7).map((a, i) => createSidebarItem(a, i + 4)).join('');
        }
    } catch (e) {
        console.warn('[Hero Load Error]', e);
    }
}

// Loader: Category Blocks
async function loadCategoryBlocks() {
    const cats = ['World', 'Technology', 'Business', 'Politics', 'Entertainment', 'Sports', 'Science'];
    cats.forEach(async (cat) => {
        const grid = document.getElementById(`block-${cat.toLowerCase()}`);
        if (!grid) return;
        
        try {
            const res = await fetch(`${API}/api/news?category=${cat}&limit=4`);
            const data = await res.json();
            const articles = data.articles || [];
            
            if (!articles.length) {
                grid.innerHTML = '<div style="padding:20px; color:var(--text-muted); font-size:13px;">No updates for this section.</div>';
                return;
            }
            
            grid.innerHTML = articles.map(a => createNewsCard(a, cat)).join('');
        } catch (e) {
            console.warn(`[Category Load Error: ${cat}]`, e);
        }
    });
}

// Loader/Handler: Sub-category Tabs
function initSubCategoryTabs() {
    const tabs = document.querySelectorAll('.sub-cat-tab');
    const grid = document.getElementById('sub-cat-grid');
    if (!tabs.length || !grid) return;

    tabs.forEach(tab => {
        tab.onclick = async () => {
            const sub = tab.dataset.sub;
            
            // Switch active state
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Show skeletons
            grid.innerHTML = Array(4).fill('<div class="skeleton" style="height:250px"></div>').join('');

            try {
                const res = await fetch(`${API}/api/news?category=${sub}&limit=4`);
                const data = await res.json();
                const articles = data.articles || [];

                if (!articles.length) {
                    grid.innerHTML = '<div style="padding:40px; text-align:center; grid-column:1/-1;">No stories found.</div>';
                    return;
                }

                grid.innerHTML = articles.map(a => createNewsCard(a, sub)).join('');
            } catch (e) {
                grid.innerHTML = '<div style="padding:40px; text-align:center; grid-column:1/-1;">Error loading data.</div>';
            }
        };
    });

    // Initial load
    tabs[0].click();
}

// Loader: Breaking Ticker
async function loadBreakingTicker() {
    const track = document.getElementById('ticker-track');
    if (!track) return;

    try {
        const res = await fetch(`${API}/api/news`);
        const data = await res.json();
        const articles = data.articles || [];
        
        if (articles.length) {
            const content = articles.slice(0, 10).map(a => `
                <span class="ticker-item" onclick="openArticle('${a.slug || a.id}')">${escHtml(a.title)}</span>
            `).join('');
            track.innerHTML = content + content; // Double for seamless loop
        } else {
            track.innerHTML = '<span class="ticker-item">No breaking news available.</span>';
        }
    } catch (e) {
        track.innerHTML = '<span class="ticker-item">Breaking news ticker unavailable.</span>';
    }
}

/* ─── Utilities ────────────────────────────────────────────────── */
function openArticle(id) { window.location.href = `/article/${encodeURIComponent(id)}`; }

function timeAgo(date) {
    if (!date) return 'Just now';
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
}

function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
