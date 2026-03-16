const API = "https://primereport-server.onrender.com/api/news/";

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

        const res = await fetch(API + encodeURIComponent(id));
        const article = await res.json();

        if (!article || article.error) {
            showError();
            return;
        }

        displayArticle(article);

    } catch (e) {
        console.error(e);
        showError();
    }
}

function displayArticle(a) {

    const loader = document.getElementById("article-loading");
    const container = document.getElementById("article-content");

    loader.style.display = "none";
    container.classList.remove("hidden");

    container.innerHTML = `
        <article class="article">

            <h1>${a.title}</h1>

            <p style="color:#666;margin-bottom:15px">
                ${a.source || "PrimeReport"} • 
                ${new Date(a.publishedAt || a.date).toLocaleString()}
            </p>

            <img src="${a.image}" 
                 style="width:100%;border-radius:10px;margin-bottom:20px">

            <p style="font-weight:600">${a.summary || ""}</p>

            <div style="margin-top:20px;line-height:1.7">
                ${a.content || a.description}
            </div>

            <p style="margin-top:30px">
                <a href="${a.link}" target="_blank">
                Read original source
                </a>
            </p>

        </article>
    `;

    document.title = a.title + " - PrimeReport";
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