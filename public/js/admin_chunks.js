
// == Article Management ==

let allArticles = [];
let currentPage = 1;
const itemsPerPage = 10;

async function loadArticles() {
    try {
        const tableBody = document.getElementById('articles-table-body');
        if (tableBody) tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4">Loading articles...</td></tr>';
        
        const res = await authFetch('/api/admin/articles');
        allArticles = await res.json();
        
        // Populate category filter if present
        const catFilter = document.getElementById('category-filter');
        if (catFilter && catFilter.children.length <= 1) {
            const categories = [...new Set(allArticles.map(a => a.category).filter(Boolean))];
            categories.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat;
                opt.textContent = cat;
                catFilter.appendChild(opt);
            });
        }

        renderArticlesTable(allArticles);
    } catch (error) {
        console.error('Error fetching articles:', error);
        showToast('Failed to load articles from server', 'error');
    }
}

window.filterArticles = () => {
    const search = document.getElementById('search-input')?.value.toLowerCase() || '';
    const category = document.getElementById('category-filter')?.value || '';
    const dateStr = document.getElementById('date-filter')?.value || '';

    let filtered = allArticles.filter(a => {
        const titleMatch = (a.title || '').toLowerCase().includes(search);
        const categoryMatch = category === '' || a.category === category;
        const articleDate = a.publishedAt || a.publish_date || '';
        const dateMatch = dateStr === '' || articleDate.startsWith(dateStr);
        return titleMatch && categoryMatch && dateMatch;
    });

    renderArticlesTable(filtered);
};

function renderArticlesTable(articles) {
    const tableBody = document.getElementById('articles-table-body');
    const pagination = document.getElementById('pagination-controls');
    if (!tableBody) return;

    if (!articles || articles.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4">No articles found</td></tr>';
        if (pagination) pagination.innerHTML = '';
        return;
    }

    const totalPages = Math.ceil(articles.length / itemsPerPage);
    if (currentPage > totalPages) currentPage = totalPages || 1;

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const currentItems = articles.slice(start, end);

    tableBody.innerHTML = currentItems.map(article => `
        <tr>
            <td>
                <div class="d-flex flex-column">
                    <span class="fw-bold text-dark">${article.title.length > 60 ? article.title.substring(0, 60) + '...' : article.title}</span>
                    <small class="text-muted" style="font-size: 0.75rem;">Source: ${article.source || 'Unknown'}</small>
                </div>
            </td>
            <td><span class="badge" style="background:var(--primary-color)">${article.category || 'World'}</span></td>
            <td>${new Date(article.publishedAt || article.publish_date).toLocaleDateString()}</td>
            <td>${article.author || 'Admin'}</td>
            <td>
                <span class="badge" style="background:${(article.isBreaking || article.category === 'Breaking') ? '#f44336' : '#4caf50'}">
                    ${(article.isBreaking || article.category === 'Breaking') ? 'Breaking' : 'Standard'}
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
                    <a href="${article.link}" target="_blank" class="btn-icon" title="View"><i class="fas fa-external-link-alt"></i></a>
                </div>
            </td>
        </tr>
    `).join('');

    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const pagination = document.getElementById('pagination-controls');
    if (!pagination || totalPages <= 1) {
        if (pagination) pagination.innerHTML = '';
        return;
    }
    
    let html = `<button class="btn btn-sm btn-light" ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">Prev</button>`;
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `<button class="btn btn-sm ${currentPage === i ? 'btn-primary' : 'btn-light'}" onclick="goToPage(${i})">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<span class="px-1 text-muted">...</span>`;
        }
    }
    
    html += `<button class="btn btn-sm btn-light" ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">Next</button>`;
    pagination.innerHTML = html;
}

window.goToPage = (page) => {
    currentPage = page;
    filterArticles();
};

window.editArticle = async (id) => {
    const article = allArticles.find(a => String(a.id) === String(id));
    if (article) {
        document.getElementById('modal-title').textContent = 'Edit Article';
        document.getElementById('edit-id').value = article.id;
        document.getElementById('form-title').value = article.title;
        document.getElementById('form-category').value = article.category;
        document.getElementById('form-image').value = article.image || '';
        document.getElementById('form-content').value = article.content || article.summary || '';
        document.getElementById('form-published').checked = !!article.isBreaking;
        document.getElementById('article-modal').style.display = 'flex';
    }
};

window.saveArticle = async () => {
    const id = document.getElementById('edit-id').value;
    const articleData = {
        title: document.getElementById('form-title').value,
        category: document.getElementById('form-category').value,
        image: document.getElementById('form-image').value,
        content: document.getElementById('form-content').value,
        summary: document.getElementById('form-content').value.substring(0, 150) + '...',
        isBreaking: document.getElementById('form-published').checked,
        author: 'Admin',
        source: 'Admin',
        publish_date: new Date().toISOString()
    };

    try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/admin/articles/${id}` : '/api/admin/articles';
        const res = await authFetch(url, { method, body: JSON.stringify(articleData) });
        
        if (res.ok) {
            showToast(`Article ${id ? 'updated' : 'published'} successfully!`);
            closeModal();
            loadArticles();
        } else {
            showToast('Failed to save article', 'error');
        }
    } catch (error) {
        console.error('Save error:', error);
        showToast('Network error while saving article', 'error');
    }
};

window.deleteArticle = async (id) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    try {
        const res = await authFetch(`/api/admin/articles/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Article deleted successfully');
            loadArticles();
        } else {
            showToast('Failed to delete article', 'error');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Network error during deletion', 'error');
    }
};

// == Categories Management ==

let allCategories = [];

async function loadCategories() {
    const tableBody = document.getElementById('categories-table-body');
    if (tableBody) tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4">Loading categories...</td></tr>';

    try {
        const res = await authFetch('/api/admin/categories');
        allCategories = await res.json();
        
        // Sync with local fallback if needed
        localStorage.setItem('prime_categories', JSON.stringify(allCategories));
        
        renderCategoriesTable(allCategories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        showToast('Failed to load categories', 'error');
    }
}

function renderCategoriesTable(categories) {
    const tableBody = document.getElementById('categories-table-body');
    if (!tableBody) return;

    if (categories.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4">No categories found</td></tr>';
        return;
    }

    tableBody.innerHTML = categories.map(cat => `
        <tr>
            <td><div class="stat-icon" style="width:40px; height:40px; display:flex; align-items:center; justify-content:center; background:rgba(211,47,47,0.1); color:var(--primary-color); border-radius:50%;"><i class="${cat.icon || 'fas fa-folder'}"></i></div></td>
            <td><strong>${cat.name}</strong></td>
            <td><code>${cat.slug}</code></td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon btn-edit" title="Edit" onclick="editCat('${cat.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" title="Delete" onclick="deleteCat('${cat.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

window.editCat = (id) => {
    const cat = allCategories.find(c => String(c.id) === String(id));
    if (cat) {
        document.getElementById('cat-modal-title').textContent = 'Edit Category';
        document.getElementById('cat-id').value = cat.id;
        document.getElementById('cat-name').value = cat.name;
        document.getElementById('cat-slug').value = cat.slug;
        document.getElementById('cat-description').value = cat.description || '';
        document.getElementById('cat-icon').value = cat.icon || 'fas fa-folder';
        document.getElementById('cat-modal').style.display = 'flex';
    }
};

window.saveCategory = async () => {
    const id = document.getElementById('cat-id').value;
    const payload = {
        name: document.getElementById('cat-name').value,
        slug: document.getElementById('cat-slug').value,
        description: document.getElementById('cat-description').value,
        icon: document.getElementById('cat-icon').value || 'fas fa-folder'
    };

    try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/admin/categories/${id}` : '/api/admin/categories';
        const res = await authFetch(url, { method, body: JSON.stringify(payload) });
        
        if (res.ok) {
            showToast(`Category ${id ? 'updated' : 'created'} successfully`);
            closeCatModal();
            loadCategories();
        } else {
            showToast('Failed to save category', 'error');
        }
    } catch (e) {
        showToast('Network error while saving category', 'error');
    }
};

window.deleteCat = async (id) => {
    if (!confirm('Delete this category? This might affect articles in this category.')) return;
    try {
        const res = await authFetch('/api/admin/categories/' + id, { method: 'DELETE' });
        if (res.ok) {
            showToast('Category deleted successfully');
            loadCategories();
        } else {
            showToast('Failed to delete category', 'error');
        }
    } catch (e) {
        showToast('Network error during deletion', 'error');
    }
};

window.openCatModal = () => {
    document.getElementById('cat-modal-title').textContent = 'Add Category';
    document.getElementById('cat-id').value = '';
    const form = document.getElementById('cat-form');
    if (form) form.reset();
    document.getElementById('cat-modal').style.display = 'flex';
};

window.closeCatModal = () => {
    document.getElementById('cat-modal').style.display = 'none';
};

window.updateCatSlug = () => {
    const nameEl = document.getElementById('cat-name');
    const slugEl = document.getElementById('cat-slug');
    if (nameEl && slugEl) {
        slugEl.value = nameEl.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
};

// == User Management ==

let allUsers = [];

async function loadUsers() {
    const tableBody = document.getElementById('users-table-body');
    if (tableBody) tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4">Loading users...</td></tr>';

    try {
        const res = await authFetch('/api/admin/users');
        allUsers = await res.json();
        renderUsersTable(allUsers);
    } catch (error) {
        console.error('Error fetching users:', error);
        showToast('Failed to load users', 'error');
    }
}

function renderUsersTable(users) {
    const tableBody = document.getElementById('users-table-body');
    if (!tableBody) return;

    if (users.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4">No users found</td></tr>';
        return;
    }

    tableBody.innerHTML = users.map(u => `
        <tr>
            <td><strong>${u.name}</strong></td>
            <td>${u.email}<br><small class="text-muted">@${u.username}</small></td>
            <td><span class="badge" style="background:#1976d2;">${u.role}</span></td>
            <td><span class="badge" style="background:${u.status === 'Active' ? '#4caf50' : '#9e9e9e'};">${u.status}</span></td>
            <td><small>${u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}</small></td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon btn-edit" title="Edit" onclick="editUser('${u.id}')"><i class="fas fa-edit"></i></button>
                    ${u.username !== 'admin' ? `<button class="btn-icon btn-delete" title="Delete" onclick="deleteUser('${u.id}')"><i class="fas fa-trash"></i></button>` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

window.editUser = (id) => {
    const u = allUsers.find(x => String(x.id) === String(id));
    if (u) {
        document.getElementById('user-modal-title').textContent = 'Edit User';
        document.getElementById('user-id').value = u.id;
        document.getElementById('user-name').value = u.name;
        document.getElementById('user-email').value = u.email;
        document.getElementById('user-username').value = u.username;
        document.getElementById('user-password').value = u.password;
        document.getElementById('user-role').value = u.role;
        document.getElementById('user-status').value = u.status;
        document.getElementById('user-modal').style.display = 'flex';
    }
};

window.saveUser = async () => {
    const id = document.getElementById('user-id').value;
    const payload = {
        name: document.getElementById('user-name').value,
        email: document.getElementById('user-email').value,
        username: document.getElementById('user-username').value,
        password: document.getElementById('user-password').value,
        role: document.getElementById('user-role').value,
        status: document.getElementById('user-status').value
    };

    try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/admin/users/${id}` : '/api/admin/users';
        const res = await authFetch(url, { method, body: JSON.stringify(payload) });
        
        if (res.ok) {
            showToast(`User ${id ? 'updated' : 'created'} successfully`);
            closeUserModal();
            loadUsers();
        } else {
            showToast('Failed to save user', 'error');
        }
    } catch (e) {
        showToast('Network error while saving user', 'error');
    }
};

window.deleteUser = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
        const res = await authFetch('/api/admin/users/' + id, { method: 'DELETE' });
        if (res.ok) {
            showToast('User deleted successfully');
            loadUsers();
        } else {
            showToast('Failed to delete user', 'error');
        }
    } catch (e) {
        showToast('Network error during deletion', 'error');
    }
};

window.openUserModal = () => {
    document.getElementById('user-modal-title').textContent = 'Add User';
    document.getElementById('user-id').value = '';
    const form = document.getElementById('user-form');
    if (form) form.reset();
    document.getElementById('user-modal').style.display = 'flex';
};

window.closeUserModal = () => {
    document.getElementById('user-modal').style.display = 'none';
};

// == Ads Management ==

let allAds = [];

async function loadAds() {
    const container = document.getElementById('ads-container');
    if (container) container.innerHTML = '<div class="text-center py-4">Loading ads configuration...</div>';

    try {
        const res = await authFetch('/api/admin/ads');
        allAds = await res.json();
        
        if (!allAds || allAds.length === 0) {
            allAds = [
                { id: 'header', name: 'Header Banner Ad', enabled: false, code: '' },
                { id: 'sidebar', name: 'Sidebar Ad', enabled: false, code: '' },
                { id: 'in-feed', name: 'In-Feed Ad', enabled: false, code: '' },
                { id: 'article-top', name: 'Article Top Ad', enabled: false, code: '' },
                { id: 'article-mid', name: 'Article Middle Ad', enabled: false, code: '' },
                { id: 'article-bot', name: 'Article Bottom Ad', enabled: false, code: '' },
                { id: 'footer', name: 'Footer Ad', enabled: false, code: '' }
            ];
        }
        renderAdsList();
    } catch (e) {
        console.error('Failed to load ads', e);
        showToast('Error loading ads', 'error');
    }
}

function renderAdsList() {
    const container = document.getElementById('ads-container');
    if (!container) return;

    container.innerHTML = allAds.map(ad => `
        <div class="content-card mb-4" style="padding:20px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:15px; align-items:center;">
                <h4 style="margin:0;"><i class="fas fa-ad" style="color:#2196f3; margin-right:10px;"></i> ${ad.name}</h4>
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="font-size:0.85rem; font-weight:600; color:${ad.enabled?'#4caf50':'#9e9e9e'}">${ad.enabled ? 'ACTIVE' : 'INACTIVE'}</span>
                    <label class="switch" style="position:relative; display:inline-block; width:50px; height:24px;">
                        <input type="checkbox" id="enable-${ad.id}" ${ad.enabled ? 'checked' : ''} onchange="toggleAdState('${ad.id}')">
                        <span class="slider round"></span>
                    </label>
                </div>
            </div>
            <textarea id="code-${ad.id}" rows="5" class="form-input" style="width:100%; padding:15px; border-radius:8px; border:1px solid #ddd; font-family:monospace; background:#f8f9fa; font-size:13px;" placeholder="<!-- Paste AdSense Script Here -->">${ad.code || ''}</textarea>
            <div style="text-align:right; margin-top:15px;">
                <button class="btn btn-primary" onclick="saveAdUnit('${ad.id}')"><i class="fas fa-save"></i> Update Unit</button>
            </div>
        </div>
    `).join('');
}

window.toggleAdState = async (id) => {
    const ad = allAds.find(a => a.id === id);
    if (!ad) return;
    const checkbox = document.getElementById(`enable-${id}`);
    ad.enabled = checkbox.checked;
    await persistAds();
};

window.saveAdUnit = async (id) => {
    const ad = allAds.find(a => a.id === id);
    if (!ad) return;
    const code = document.getElementById(`code-${id}`).value;
    ad.code = code;
    await persistAds();
    showToast(`${ad.name} updated successfully!`);
};

async function persistAds() {
    try {
        await authFetch('/api/admin/ads', {
            method: 'POST',
            body: JSON.stringify(allAds)
        });
        renderAdsList();
    } catch (e) {
        showToast('Server error saving Ads', 'error');
    }
}

// == Settings Management ==

async function loadSettings() {
    const form = document.getElementById('settings-form');
    if (!form) return;

    try {
        const res = await authFetch('/api/admin/settings');
        const settings = await res.json();
        
        if (settings) {
            if (document.getElementById('siteName')) document.getElementById('siteName').value = settings.siteName || 'PrimeReport';
            if (document.getElementById('logoUrl')) document.getElementById('logoUrl').value = settings.logoUrl || '../../logo.png';
            if (document.getElementById('contactEmail')) document.getElementById('contactEmail').value = settings.contactEmail || 'admin@primereport.in';
            if (document.getElementById('defaultAuthor')) document.getElementById('defaultAuthor').value = settings.defaultAuthor || 'Prime Editorial';
            if (document.getElementById('footerText')) document.getElementById('footerText').value = settings.footerText || '© 2026 PrimeReport. All rights reserved.';
            if (document.getElementById('rssSyncInterval')) document.getElementById('rssSyncInterval').value = settings.rssSyncInterval || 15;
            if (document.getElementById('adsEnabled')) document.getElementById('adsEnabled').checked = settings.adsEnabled !== false;
        }
    } catch (e) {
        console.error('Failed to load settings', e);
    }
}

window.saveGlobalSettings = async () => {
    const payload = {
        siteName: document.getElementById('siteName').value,
        logoUrl: document.getElementById('logoUrl').value,
        contactEmail: document.getElementById('contactEmail').value,
        defaultAuthor: document.getElementById('defaultAuthor').value,
        footerText: document.getElementById('footerText').value,
        rssSyncInterval: parseInt(document.getElementById('rssSyncInterval').value),
        adsEnabled: document.getElementById('adsEnabled').checked
    };

    try {
        const res = await authFetch('/api/admin/settings', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        if (res.ok) {
            showToast('Settings saved successfully!');
        } else {
            showToast('Failed to save settings', 'error');
        }
    } catch (e) {
        showToast('Network error while saving settings', 'error');
    }
};

// == Analytics ==

async function loadAnalytics() {
    const tbody = document.getElementById('top-articles-tbody');
    if (!tbody) return;

    try {
        const res = await authFetch('/api/admin/analytics');
        const stats = await res.json();
        
        const articlesCountEl = document.getElementById('total-articles-count');
        const viewsCountEl = document.getElementById('total-views-count');
        
        if (articlesCountEl) articlesCountEl.textContent = stats.totalArticles || 0;
        if (viewsCountEl) viewsCountEl.textContent = stats.totalViews || 0;
        
        // Initialize Charts if Chart.js is loaded
        if (window.Chart) {
            initAnalyticsCharts(stats);
        }

        // Render Top Articles
        if (stats.topArticles && stats.topArticles.length > 0) {
            tbody.innerHTML = stats.topArticles.map((a, i) => `
                <tr>
                    <td>#${i + 1}</td>
                    <td><strong>${a.title}</strong></td>
                    <td><span class="badge" style="background:#2196f3;">${a.views || 0} Views</span></td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center py-4">No data available</td></tr>';
        }
    } catch (e) {
        console.error('Failed to load analytics', e);
        showToast('Failed to load analytics data', 'error');
    }
}

function initAnalyticsCharts(stats) {
    const trafficCtx = document.getElementById('trafficChart')?.getContext('2d');
    if (trafficCtx) {
        new Chart(trafficCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Page Views',
                    data: [65, 59, 80, 81, 56, 55, 40].map(v => Math.floor(v * (stats.totalViews / 500))),
                    borderColor: '#2196f3',
                    tension: 0.3,
                    fill: true,
                    backgroundColor: 'rgba(33, 150, 243, 0.1)'
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    const catCtx = document.getElementById('categoryChart')?.getContext('2d');
    if (catCtx) {
        const catLabels = Object.keys(stats.categoryCount);
        const catData = Object.values(stats.categoryCount);
        new Chart(catCtx, {
            type: 'doughnut',
            data: {
                labels: catLabels,
                datasets: [{
                    data: catData,
                    backgroundColor: ['#f44336', '#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4', '#795548', '#607d8b']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
}

// == Dashboard & Stats ==

async function loadDashboardStats() {
    try {
        const res = await authFetch('/api/admin/dashboard');
        const stats = await res.json();

        const totalArticlesElement = document.querySelector("#totalArticles");
        const breakingCountElement = document.querySelector("#breakingNewsCount");
        const dailyArticlesElement = document.getElementById("dailyArticles");
        const totalViewsElement = document.querySelector(".stat-card:nth-child(3) h3");

        if (totalArticlesElement) totalArticlesElement.textContent = stats.totalArticles;
        if (breakingCountElement) breakingCountElement.textContent = stats.breakingNewsCount;
        if (dailyArticlesElement) dailyArticlesElement.textContent = stats.dailyArticles;
        if (totalViewsElement) {
            const views = stats.totalViews || 0;
            totalViewsElement.textContent = views >= 1000 ? (views / 1000).toFixed(1) + 'k' : views;
        }

    } catch (e) { 
        console.error('Error loading stats:', e);
        showToast('Failed to load dashboard stats', 'error');
    }
}

// helper modal functions
window.openCreateModal = () => {
    document.getElementById('modal-title').textContent = 'Create New Article';
    document.getElementById('edit-id').value = '';
    const form = document.getElementById('article-form');
    if (form) form.reset();
    document.getElementById('article-modal').style.display = 'flex';
};

window.closeModal = () => {
    document.getElementById('article-modal').style.display = 'none';
};

window.triggerManualFetch = async () => {
    const btnIcon = document.querySelector('.fa-sync-alt');
    if (btnIcon) btnIcon.classList.add('fa-spin');
    try {
        showToast('Syncing RSS feeds...', 'info');
        const response = await authFetch('/api/admin/rss-sync', { method: 'POST' });
        const data = await response.json();
        if (btnIcon) btnIcon.classList.remove('fa-spin');
        if (data.success) {
            showToast(`Sync Complete! Fetched ${data.count} articles.`);
            if (document.getElementById('articles-table-body')) loadArticles();
            if (document.getElementById('totalArticles')) loadDashboardStats();
        } else {
            showToast('Sync failed: ' + (data.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        if (btnIcon) btnIcon.classList.remove('fa-spin');
        console.error('Manual fetch error:', error);
    }
};
