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

    document.getElementById("article-title").innerText = article.title;
    document.getElementById("article-image").src = article.image;
    document.getElementById("article-content").innerText = article.content;
    document.getElementById("article-source").innerText = article.source;
}

function showError() {
    document.getElementById("article-container").innerHTML =
        "<h2>Article Not Found</h2>";
}

loadArticle();
