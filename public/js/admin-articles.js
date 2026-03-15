let allArticles = [];
let currentPage = 1;
const itemsPerPage = 10;

document.addEventListener('DOMContentLoaded', async () => {
    await loadCategoriesForFilter();
    await fetchAllArticles();
});

async function loadCategoriesForFilter() {
    try {
        const response = await authFetch('/api/admin/categories');
        const categories = await response.json();
        
        const filterSelect = document.getElementById('category-filter');
        const formSelect = document.getElementById('form-category');
        const optionsHtml = categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        
        if (filterSelect) filterSelect.innerHTML = '<option value="">All Categories</option>' + optionsHtml;
        if (formSelect) formSelect.innerHTML = optionsHtml;
    } catch (e) {
        console.error('Failed to load categories:', e);
    }
}

async function fetchAllArticles() {
    try {
        const response = await authFetch('/api/admin/articles');
        allArticles = await response.json();
        filterArticles();
    } catch (e) {
        console.error('Failed to fetch articles:', e);
        showToast('Failed to load articles', 'error');
    }
}

function filterArticles() {
    const search = document.getElementById('search-input')?.value.toLowerCase() || '';
    const category = document.getElementById('category-filter')?.value || '';
    const dateStr = document.getElementById('date-filter')?.value || '';

    let filtered = allArticles.filter(a => {
        const titleMatch = (a.title || '').toLowerCase().includes(search);
        const categoryMatch = category === '' || a.category === category;
        const dateMatch = dateStr === '' || (a.publishedAt && a.publishedAt.startsWith(dateStr));
        return titleMatch && categoryMatch && dateMatch;
    });

    renderArticlesTablePaginated(filtered);
}

function renderArticlesTablePaginated(articles) {
    const tableBody = document.getElementById('articles-table-body');
    const pagination = document.getElementById('pagination-controls');
    if (!tableBody || !pagination) return;

    if (articles.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">No articles found</td></tr>';
        pagination.innerHTML = '';
        return;
    }

    const totalPages = Math.ceil(articles.length / itemsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const currentItems = articles.slice(start, end);

    tableBody.innerHTML = currentItems.map(article => `
        <tr>
            <td>
                <strong>${article.title.length > 50 ? article.title.substring(0, 50) + '...' : article.title}</strong>
            </td>
            <td><span class="badge badge-info">${article.category}</span></td>
            <td>${new Date(article.publishedAt).toLocaleDateString()}</td>
            <td>${article.source || 'Admin'}</td>
            <td>
                <span class="badge" style="background:${article.isBreaking ? '#f44336' : '#4caf50'}">
                    ${article.isBreaking ? 'Breaking' : 'Standard'}
                </span>
            </td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon btn-edit" title="Edit" onclick="editArticle('${article.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" title="Delete" onclick="deleteArticle('${article.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const pagination = document.getElementById('pagination-controls');
    if (!pagination) return;
    
    let html = `<button class="btn btn-secondary" ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">Prev</button>`;
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `<button class="btn ${currentPage === i ? 'btn-primary' : 'btn-secondary'}" onclick="goToPage(${i})">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += `<span>...</span>`;
        }
    }
    
    html += `<button class="btn btn-secondary" ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">Next</button>`;
    pagination.innerHTML = html;
}

window.goToPage = (page) => {
    currentPage = page;
    filterArticles();
};

window.saveArticle = async () => {
    const id = document.getElementById('edit-id').value;
    const articleData = {
        title: document.getElementById('form-title').value,
        category: document.getElementById('form-category').value,
        image: document.getElementById('form-image').value,
        content: document.getElementById('form-content').value,
        isBreaking: document.getElementById('form-published').checked, // Using as breaking for now
        source: 'Admin'
    };

    try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/admin/articles/${id}` : '/api/admin/articles';
        const response = await authFetch(url, {
            method,
            body: JSON.stringify(articleData)
        });

        if (response.ok) {
            showToast('Article saved successfully');
            closeModal();
            fetchAllArticles();
        } else {
            showToast('Failed to save article', 'error');
        }
    } catch (e) {
        console.error('Save error:', e);
    }
};

window.editArticle = async (id) => {
    const article = allArticles.find(a => String(a.id) === String(id));
    if (article) {
        document.getElementById('modal-title').textContent = 'Edit Article';
        document.getElementById('edit-id').value = article.id;
        document.getElementById('form-title').value = article.title;
        document.getElementById('form-category').value = article.category;
        document.getElementById('form-image').value = article.image || '';
        document.getElementById('form-content').value = article.content || '';
        document.getElementById('form-published').checked = !!article.isBreaking;
        document.getElementById('article-modal').style.display = 'flex';
    }
};

window.deleteArticle = async (id) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    try {
        const response = await authFetch(`/api/admin/articles/${id}`, { method: 'DELETE' });
        if (response.ok) {
            showToast('Article deleted');
            fetchAllArticles();
        }
    } catch (e) {
        console.error('Delete error:', e);
    }
};
