const API_BASE = "https://primereport-server.onrender.com/api/news/";

function getArticleId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

async function loadArticle() {

    const id = getArticleId();

    if (!id) {
        showError("Missing article ID");
        return;
    }

    try {

        const res = await fetch(API_BASE + encodeURIComponent(id));
        const article = await res.json();

        if (!article || article.error) {
            showError("Article not found");
            return;
        }

        renderArticle(article);

    } catch (error) {

        console.error(error);
        showError("Server error");

    }
}

function renderArticle(article) {

    const loader = document.getElementById("article-loading");
    const container = document.getElementById("article-content");

    loader.style.display = "none";
    container.classList.remove("hidden");

    container.innerHTML = `
        <article class="article">

            <h1>${article.title}</h1>

            <p style="color:#666;margin-bottom:15px">
                ${article.source || "PrimeReport"} • 
                ${new Date(article.publishedAt || article.date).toLocaleString()}
            </p>

            <img src="${article.image}" style="width:100%;border-radius:10px;margin-bottom:20px">

            <p style="font-weight:600">${article.summary || ""}</p>

            <div style="margin-top:20px;line-height:1.7">
                ${article.content || article.description}
            </div>

            <p style="margin-top:30px">
                <a href="${article.link}" target="_blank">Read full article</a>
            </p>

        </article>
    `;

    document.title = article.title + " – PrimeReport";
}

function showError(message) {

    const loader = document.getElementById("article-loading");
    const container = document.getElementById("article-content");

    loader.style.display = "none";
    container.classList.remove("hidden");

    container.innerHTML = `
        <div style="text-align:center;padding:80px">

            <h2>Article Not Found</h2>

            <p>${message}</p>

            <a href="index.html">Back to Home</a>

        </div>
    `;
}

loadArticle();