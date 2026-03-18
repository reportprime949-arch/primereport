const API_BASE = "https://primereport-server.onrender.com";

const API = `${API_BASE}/api/news/`;
const PLACEHOLDER = "/images/default.jpg";

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

function getId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

async function loadArticle() {

    const id = getId();

    if (!id) {
        showError();
        return;
    }

    try {
        ProgressBar.start();

        const res = await fetch(API + encodeURIComponent(id));
        if (!res.ok) throw new Error(`Article API failed: ${res.status}`);
        const article = await res.json();

        if (!article || article.error) {
            showError();
            return;
        }

        displayArticle(article);

    } catch (e) {
        ProgressBar.finish();
        console.error(e);
        showError();
    }
}

function displayArticle(a) {
    const loader = document.getElementById("article-loading");
    const container = document.getElementById("article-content");

    if (loader) loader.style.display = "none";
    if (!container) return;
    
    ProgressBar.finish();
    container.classList.remove("hidden");
    container.classList.add("fade-in");
    container.style.opacity = '0';

    const publishDate = new Date(a.publishedAt || a.date);
    const dateStr = !isNaN(publishDate) ? publishDate.toLocaleString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : "Recently Published";

    container.innerHTML = `
        <article class="article-viewer">
            <nav class="article-nav-breadcrumb">
                <a href="index.html">Home</a> <i class="fas fa-chevron-right"></i> 
                <a href="index.html?category=${a.category || 'world'}">${a.category || 'World'}</a>
            </nav>

            <header class="article-header">
                <div class="cat-badge" style="background:var(--red); margin-bottom:15px;">${a.category || 'World'}</div>
                <h1>${escHtml(a.title)}</h1>
                <div class="article-meta">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(a.author || 'P')}&background=e11d48&color=fff" class="author-avatar" alt="Author">
                    <span>By <strong>${escHtml(a.author || "Prime Editorial")}</strong></span>
                    <span class="meta-divider"></span>
                    <span><i class="far fa-calendar-alt"></i> ${dateStr}</span>
                </div>
            </header>

            <div class="article-featured-image">
                <img src="${a.image || PLACEHOLDER}" 
                     alt="${escHtml(a.title)}"
                     loading="eager"
                     onerror="this.onerror=null;this.src='/images/default.jpg'">
            </div>

            <div class="article-body">
                <p class="article-lead">${escHtml(a.summary || a.description || "")}</p>
                <div class="article-main-text">
                    ${a.content || a.description || "Full content is being processed. Please check the original source for more details."}
                </div>
            </div>

            <footer class="article-footer">
                <p>Source: <strong>${escHtml(a.source || "PrimeReport")}</strong></p>
                <a href="${a.link || '#'}" target="_blank" class="btn-read-original">
                    Read Original Article <i class="fas fa-external-link-alt"></i>
                </a>
            </footer>
        </article>
    `;

    requestAnimationFrame(() => container.style.opacity = '1');
    document.title = a.title + " | PrimeReport";
    
    // Update metadata and schema
    if (typeof updateMeta === 'function') updateMeta(a);
    if (typeof addSchema === 'function') addSchema(a);
}

function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showError() {

    const loader = document.getElementById("article-loading");
    const container = document.getElementById("article-content");

    loader.style.display = "none";

    container.innerHTML = `
        <div style="text-align:center;padding:80px">
            <h2>Article Not Found</h2>
            <p>The article may have expired.</p>
            <a href="index.html">Back to Home</a>
        </div>
    `;
}

loadArticle();

function updateMeta(article) {
    const title = article.title || "PrimeReport";
    const desc = article.summary || article.description || "";
    const img = article.image || PLACEHOLDER;

    document.title = title;

    const setMeta = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.content = val;
    };

    setMeta("page-title", title);
    setMeta("page-desc", desc);
    setMeta("og-title", title);
    setMeta("og-desc", desc);
    setMeta("og-image", img);
    setMeta("og-url", window.location.href);
    setMeta("tw-title", title);
    setMeta("tw-desc", desc);
    setMeta("tw-image", img);

    const canon = document.getElementById("canonical-url");
    if (canon) canon.href = window.location.href;
}

function addSchema(article) {
    const schemaEl = document.getElementById("article-schema");
    if (!schemaEl) return;

    const schema = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": article.title,
        "image": [article.image || PLACEHOLDER],
        "datePublished": article.publishedAt || article.date,
        "dateModified": article.publishedAt || article.date,
        "author": {
            "@type": "Person",
            "name": article.author || "Prime Editorial"
        },
        "publisher": {
            "@type": "Organization",
            "name": "PrimeReport",
            "logo": {
                "@type": "ImageObject",
                "url": window.location.origin + "/logo.png"
            }
        }
    };

    schemaEl.textContent = JSON.stringify(schema);
}