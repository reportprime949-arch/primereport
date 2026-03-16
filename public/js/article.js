const API_BASE = "https://primereport-server.onrender.com/api/news/";

function getArticleId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

async function loadArticle() {

    const id = getArticleId();

    if (!id) {
        showError();
        return;
    }

    try {

        const res = await fetch(API_BASE + encodeURIComponent(id));
        const article = await res.json();

        if (!article || article.error) {
            showError();
            return;
        }

        renderArticle(article);

    } catch (err) {
        console.error(err);
        showError();
    }
}

function renderArticle(article) {

    const container = document.getElementById("article-content");
    const loader = document.getElementById("article-loading");

    loader.style.display = "none";
    container.classList.remove("hidden");

    container.innerHTML = `
        <article class="article-main">

            <h1 class="article-title">${article.title}</h1>

            <div class="article-meta">
                <span>${article.source || "PrimeReport"}</span>
                •
                <span>${new Date(article.publishedAt || article.date).toLocaleString()}</span>
            </div>

            <img class="article-image"
                 src="${article.image || "/assets/images/news-placeholder.jpg"}"
                 alt="${article.title}">

            <p class="article-summary">${article.summary || ""}</p>

            <div class="article-body">
                ${article.content || article.description || ""}
            </div>

            <a class="read-original"
               href="${article.link}"
               target="_blank">
               Read full story at ${article.source}
            </a>

        </article>
    `;

    document.title = article.title + " – PrimeReport";
}

function showError() {

    const loader = document.getElementById("article-loading");
    const container = document.getElementById("article-content");

    loader.style.display = "none";

    container.classList.remove("hidden");
    container.innerHTML = `
        <div style="text-align:center;padding:80px 20px">
            <h2>Article Not Found</h2>
            <p>This article may have expired from the feed.</p>
            <a href="/" style="color:#e11d48">Back to Home</a>
        </div>
    `;
}

loadArticle();