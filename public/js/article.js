/* ==============================================================
   PrimeReport – article.js (Stable Article Loader)
   ============================================================== */

document.addEventListener("DOMContentLoaded", () => {

  const stored = sessionStorage.getItem("selectedArticle");

  if (!stored) {
    showNotFound();
    return;
  }

  const article = JSON.parse(stored);

  renderArticle(article);
  loadRelated(article.category, article.id);

});
/* ==============================================================
   Fetch Article
   ============================================================== */

async function fetchArticle(id) {

  try {

    /* 1️⃣ Try direct article endpoint */
    const res = await fetch(`${API_BASE}/api/news/${encodeURIComponent(id)}`);

    if (res.ok) {
      const article = await res.json();

      if (!article.error) {
        renderArticle(article);
        loadRelated(article.category, article.id);
        return;
      }
    }

  } catch(e) {}

  /* 2️⃣ Fallback: search categories */

  const categories = [
    "world",
    "technology",
    "business",
    "politics",
    "sports",
    "science",
    "entertainment"
  ];

  for (const cat of categories) {

    try {

      const res = await fetch(`${API_BASE}/api/news?category=${cat}&page=1&limit=30`);
      const data = await res.json();

      const articles = data.articles || [];

      const article = articles.find(a =>
        a.id === id ||
        decodeURIComponent(a.id || "") === id
      );

      if (article) {
        renderArticle(article);
        loadRelated(article.category, article.id);
        return;
      }

    } catch(e){}
  }

  showNotFound();
}


/* ==============================================================
   Render Article
   ============================================================== */

function renderArticle(a) {

  const container = document.getElementById("article-content");

  document.title = `${a.title} – PrimeReport`;

  container.innerHTML = `
  
  <div class="article-header">

    <span class="cat-badge">${a.category || "News"}</span>

    <h1 class="article-title">${escapeHTML(a.title)}</h1>

    <div class="article-meta">
      <span>${a.source || "PrimeReport"}</span>
      <span>${formatDate(a.publishedAt || a.date)}</span>
    </div>

  </div>

  <img class="article-image"
       src="${a.image || PLACEHOLDER}"
       alt="${escapeHTML(a.title)}"
       onerror="this.src='${PLACEHOLDER}'">

  <div class="article-body">
    ${buildBody(a)}
  </div>

  <div class="article-share">
    <button onclick="copyLink()">Copy Link</button>
  </div>

  `;

}


/* ==============================================================
   Build Article Body
   ============================================================== */

function buildBody(a){

  const text = a.content || a.description || a.summary || "";

  if(!text) return "<p>Full article content unavailable.</p>";

  return text
    .split("\n\n")
    .map(p=>`<p>${escapeHTML(p)}</p>`)
    .join("");

}


/* ==============================================================
   Related Articles
   ============================================================== */

async function loadRelated(category,currentId){

  if(!category) return;

  const section = document.getElementById("related-section");

  try{

    const res = await fetch(`${API_BASE}/api/news?category=${category}&page=1&limit=6`);
    const data = await res.json();

    const articles = (data.articles || [])
      .filter(a=>a.id !== currentId)
      .slice(0,3);

    if(!articles.length) return;

    section.innerHTML = articles.map(a=>`

      <div class="related-card"
           onclick="window.location='article.html?id=${encodeURIComponent(a.id)}'">

        <img src="${a.image || PLACEHOLDER}" 
             onerror="this.src='${PLACEHOLDER}'">

        <h3>${escapeHTML(a.title)}</h3>

      </div>

    `).join("");

  }catch(e){}
}


/* ==============================================================
   Not Found Screen
   ============================================================== */

function showNotFound(){

  const container = document.getElementById("article-content");

  container.innerHTML = `
    <div style="text-align:center;padding:80px">
      <h2>Article Not Found</h2>
      <p>This article may have expired from the RSS feed.</p>
      <a href="index.html">← Back to Home</a>
    </div>
  `;

}


/* ==============================================================
   Helpers
   ============================================================== */

function escapeHTML(str){
  return String(str||"")
  .replace(/&/g,"&amp;")
  .replace(/</g,"&lt;")
  .replace(/>/g,"&gt;");
}

function formatDate(date){
  if(!date) return "";
  return new Date(date).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});
}

function copyLink(){
  navigator.clipboard.writeText(window.location.href);
  alert("Link copied!");
}