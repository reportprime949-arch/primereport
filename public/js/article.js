const PLACEHOLDER = "/assets/images/news-placeholder.jpg";

document.addEventListener("DOMContentLoaded", () => {

  const stored = sessionStorage.getItem("selectedArticle");

  if (!stored) {
    showNotFound();
    return;
  }

  const article = JSON.parse(stored);

  renderArticle(article);
});

function renderArticle(a) {

  const container = document.getElementById("article-content");

  document.title = `${a.title} – PrimeReport`;

  container.innerHTML = `
    <span class="cat-badge">${a.category || "News"}</span>

    <h1>${a.title}</h1>

    <div class="article-meta">
      ${a.source || "PrimeReport"} • ${formatDate(a.publishedAt || a.date)}
    </div>

    <img src="${a.image || PLACEHOLDER}" 
         onerror="this.src='${PLACEHOLDER}'">

    <div class="article-body">
      ${buildBody(a)}
    </div>
  `;
}

function buildBody(a) {
  const text = a.content || a.description || a.summary || "";
  return text.split("\n\n").map(p => `<p>${p}</p>`).join("");
}

function showNotFound() {
  document.getElementById("article-content").innerHTML = `
    <div style="text-align:center;padding:80px">
      <h2>Article Not Found</h2>
      <a href="index.html">← Back to Home</a>
    </div>
  `;
}

function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});
}