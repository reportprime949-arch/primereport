import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const API_URL = 'http://localhost:3000/api';

// == Authentication & Fetch Wrapper ==

// == Authentication & Fetch Wrapper ==
async function authFetch(url, options = {}) {
    try {
        let token = localStorage.getItem("adminToken");
        
        // If no token in local storage, wait for it from Firebase
        if (!token) {
            token = await new Promise((resolve, reject) => {
                const unsubscribe = onAuthStateChanged(auth, async (user) => {
                    unsubscribe();
                    if (user) {
                        const t = await user.getIdToken();
                        localStorage.setItem("adminToken", t);
                        resolve(t);
                    } else {
                        reject(new Error("No user"));
                    }
                });
            });
        }

        const response = await fetchWithToken(url, options, token);
        
        // Handle token expiration
        if (response.status === 401) {
            localStorage.removeItem("adminToken");
            // Retry once with a fresh token
            const freshToken = await new Promise((resolve, reject) => {
                onAuthStateChanged(auth, async (user) => {
                    if (user) resolve(await user.getIdToken());
                    else reject(new Error("Unauthorized"));
                });
            });
            return await fetchWithToken(url, options, freshToken);
        }
        
        return response;
    } catch (err) {
        console.warn("Auth fetch failed:", err);
        window.location.href = 'login.html';
        throw err;
    }
}

async function fetchWithToken(url, options, token) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(options.headers || {})
    };
    return await fetch(url.startsWith('http') ? url : `${API_URL}${url}`, { ...options, headers });
}

// == UI Utilities ==

function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position:fixed; bottom:20px; right:20px; z-index:9999; display:flex; flex-direction:column; gap:10px;';
    document.body.appendChild(container);
    return container;
}

// == Initialization Logic ==

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (!user) return;
        
        // Whitelist is already checked by auth-check.js
        
        // Initialize dashboard components once auth is confirmed
        const userProfileLabel = document.querySelector('.user-profile span strong');
        if (userProfileLabel && user.email) {
            userProfileLabel.textContent = user.email.split('@')[0];
        }

        // Feature Injection Mapping
        if (document.getElementById('articles-table-body')) loadArticles();
        if (document.getElementById('totalArticles')) loadDashboardStats();
        if (document.getElementById('categories-table-body')) loadCategories();
        if (document.getElementById('users-table-body')) loadUsers();
        if (document.getElementById('ads-container')) loadAds();
        if (document.getElementById('settings-form')) loadSettings();
        if (document.getElementById('top-articles-tbody') || document.getElementById('trafficChart')) loadAnalytics();
        if (document.getElementById('rss-table-body')) loadRssFeeds();
        if (document.getElementById('ai-settings-form')) loadAiSettings();
        if (document.getElementById('queue-container')) loadQueue();
    });

    // Event Listeners Mapping
    const articleForm = document.getElementById('article-form');
    if (articleForm) articleForm.addEventListener('submit', (e) => { e.preventDefault(); saveArticle(); });

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', (e) => { e.preventDefault(); logout(); });
    
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) settingsForm.addEventListener('submit', (e) => { e.preventDefault(); saveGlobalSettings(); });

    const catForm = document.getElementById('cat-form');
    if (catForm) catForm.addEventListener('submit', (e) => { e.preventDefault(); saveCategory(); });

    const userForm = document.getElementById('user-form');
    if (userForm) userForm.addEventListener('submit', (e) => { e.preventDefault(); saveUser(); });

    const qpForm = document.getElementById('quick-publish-form');
    if (qpForm) qpForm.addEventListener('submit', (e) => { e.preventDefault(); quickPublish(); });

    const rssForm = document.getElementById('rss-form');
    if (rssForm) rssForm.addEventListener('submit', (e) => { e.preventDefault(); saveRssFeed(); });

    const aiForm = document.getElementById('ai-settings-form');
    if (aiForm) aiForm.addEventListener('submit', (e) => { e.preventDefault(); saveAiSettings(); });
});

async function logout() {
    try {
        await signOut(auth);
        localStorage.removeItem("adminLoggedIn");
        localStorage.removeItem("adminToken");
        window.location.href = "login.html";
    } catch (e) {
        console.error("Logout failed", e);
    }
}

// == Article Management ==

let allArticles = [];
let currentPage = 1;
const itemsPerPage = 10;

async function loadArticles() {
    try {
        const tableBody = document.getElementById('articles-table-body');
        if (tableBody) tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4">Loading articles...</td></tr>';
        
        const res = await authFetch('/articles');
        allArticles = await res.json();
        
        const catFilter = document.getElementById('category-filter');
        const formCat = document.getElementById('form-category');
        
        const catRes = await authFetch('/categories');
        const categories = await catRes.json();
            
        if (catFilter && catFilter.children.length <= 1) {
            categories.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat.name; opt.textContent = cat.name;
                catFilter.appendChild(opt);
            });
        }
        if (formCat && formCat.children.length === 0) {
            formCat.innerHTML = categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        }
        
        filterArticles();
    } catch (error) {
        showToast('Failed to load articles', 'error');
    }
}

window.filterArticles = () => {
    const search = document.getElementById('search-input')?.value.toLowerCase() || '';
    const category = document.getElementById('category-filter')?.value || '';
    let filtered = allArticles.filter(a => {
        const titleMatch = (a.title || '').toLowerCase().includes(search);
        const categoryMatch = category === '' || a.category === category;
        return titleMatch && categoryMatch;
    });
    renderArticlesTable(filtered);
};

function renderArticlesTable(articles) {
    const tableBody = document.getElementById('articles-table-body');
    if (!tableBody) return;
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const currentItems = articles.slice(start, end);
    tableBody.innerHTML = currentItems.map(a => `
        <tr>
            <td><strong>${a.title}</strong></td>
            <td><span class="badge" style="background:var(--primary-color)">${a.category}</span></td>
            <td>${new Date(a.publishedAt || a.publish_date).toLocaleDateString()}</td>
            <td>${a.author || 'Admin'}</td>
            <td><span class="badge" style="background:${a.isBreaking ? '#f44336' : '#4caf50'}">${a.isBreaking ? 'Breaking' : 'Standard'}</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon" onclick="editArticle('${a.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon" onclick="deleteArticle('${a.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

window.openCreateModal = () => {
    document.getElementById('modal-title').textContent = 'Create New Article';
    document.getElementById('edit-id').value = '';
    document.getElementById('article-form').reset();
    document.getElementById('article-modal').style.display = 'flex';
};

window.editArticle = (id) => {
    const a = allArticles.find(x => String(x.id) === String(id));
    if (a) {
        document.getElementById('modal-title').textContent = 'Edit Article';
        document.getElementById('edit-id').value = a.id;
        document.getElementById('form-title').value = a.title;
        document.getElementById('form-category').value = a.category;
        document.getElementById('form-image').value = a.image || '';
        document.getElementById('form-content').value = a.content || '';
        document.getElementById('form-published').checked = !!a.isBreaking;
        document.getElementById('article-modal').style.display = 'flex';
    }
};

window.saveArticle = async () => {
    const id = document.getElementById('edit-id').value;
    const payload = {
        title: document.getElementById('form-title').value,
        category: document.getElementById('form-category').value,
        image: document.getElementById('form-image').value,
        content: document.getElementById('form-content').value,
        isBreaking: document.getElementById('form-published').checked
    };
    try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/articles/${id}` : '/articles';
        const res = await authFetch(url, { method, body: JSON.stringify(payload) });
        if (res.ok) { showToast('Article saved!'); closeModal(); loadArticles(); }
    } catch (e) { showToast('Error saving article', 'error'); }
};

window.deleteArticle = async (id) => {
    if (!confirm('Delete this article?')) return;
    try {
        const res = await authFetch(`/articles/${id}`, { method: 'DELETE' });
        if (res.ok) { showToast('Article deleted'); loadArticles(); }
    } catch (e) { showToast('Error deleting article', 'error'); }
};

window.closeModal = () => document.getElementById('article-modal').style.display = 'none';

// == Category Management ==

let allCategories = [];

async function loadCategories() {
    const tableBody = document.getElementById('categories-table-body');
    const rssCat = document.getElementById('rss-category');
    const qpCat = document.getElementById('qp-category');
    
    try {
        const res = await authFetch('/categories');
        allCategories = await res.json();
        if (tableBody) tableBody.innerHTML = allCategories.map(c => `
            <tr>
                <td><i class="${c.icon}"></i></td>
                <td><strong>${c.name}</strong></td>
                <td><code>${c.slug}</code></td>
                <td>
                    <button class="btn-icon" onclick="editCat('${c.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon" onclick="deleteCat('${c.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
        
        if (rssCat) rssCat.innerHTML = allCategories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        if (qpCat) qpCat.innerHTML = allCategories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    } catch (e) { console.error(e); }
}

window.openCatModal = () => {
    document.getElementById('cat-modal-title').textContent = 'Add Category';
    document.getElementById('cat-id').value = '';
    document.getElementById('cat-form').reset();
    document.getElementById('cat-modal').style.display = 'flex';
};

window.editCat = (id) => {
    const c = allCategories.find(x => String(x.id) === String(id));
    if (c) {
        document.getElementById('cat-modal-title').textContent = 'Edit Category';
        document.getElementById('cat-id').value = c.id;
        document.getElementById('cat-name').value = c.name;
        document.getElementById('cat-slug').value = c.slug;
        document.getElementById('cat-icon').value = c.icon;
        document.getElementById('cat-modal').style.display = 'flex';
    }
};

window.saveCategory = async () => {
    const id = document.getElementById('cat-id').value;
    const payload = {
        name: document.getElementById('cat-name').value,
        slug: document.getElementById('cat-slug').value,
        icon: document.getElementById('cat-icon').value
    };
    try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/categories/${id}` : '/categories';
        const res = await authFetch(url, { method, body: JSON.stringify(payload) });
        if (res.ok) { showToast('Category saved!'); closeCatModal(); loadCategories(); }
    } catch (e) { showToast('Error saving category', 'error'); }
};

window.deleteCat = async (id) => {
    if (!confirm('Delete category?')) return;
    try {
        const res = await authFetch('/categories/' + id, { method: 'DELETE' });
        if (res.ok) { showToast('Category deleted'); loadCategories(); }
    } catch (e) { showToast('Error deleting category', 'error'); }
};

window.closeCatModal = () => document.getElementById('cat-modal').style.display = 'none';

// == User Management ==

let allUsers = [];

async function loadUsers() {
    try {
        const res = await authFetch('/users');
        allUsers = await res.json();
        const tbody = document.getElementById('users-table-body');
        if (tbody) tbody.innerHTML = allUsers.map(u => `
            <tr>
                <td><strong>${u.name}</strong></td>
                <td>${u.email}</td>
                <td>${u.role}</td>
                <td><span class="badge" style="background:#4caf50;">${u.status}</span></td>
                <td>${u.lastLogin || 'Never'}</td>
                <td>
                    <button class="btn-icon" onclick="editUser('${u.id}')"><i class="fas fa-edit"></i></button>
                    ${u.username !== 'admin' ? `<button class="btn-icon" onclick="deleteUser('${u.id}')"><i class="fas fa-trash"></i></button>` : ''}
                </td>
            </tr>
        `).join('');
    } catch (e) { console.error(e); }
}

window.openUserModal = () => {
    document.getElementById('user-modal-title').textContent = 'Add User';
    document.getElementById('user-id').value = '';
    document.getElementById('user-form').reset();
    document.getElementById('user-modal').style.display = 'flex';
};

window.editUser = (id) => {
    const u = allUsers.find(x => String(x.id) === String(id));
    if (u) {
        document.getElementById('user-modal-title').textContent = 'Edit User';
        document.getElementById('user-id').value = u.id;
        document.getElementById('user-name').value = u.name;
        document.getElementById('user-email').value = u.email;
        document.getElementById('user-role').value = u.role;
        document.getElementById('user-modal').style.display = 'flex';
    }
};

window.saveUser = async () => {
    const id = document.getElementById('user-id').value;
    const payload = {
        name: document.getElementById('user-name').value,
        email: document.getElementById('user-email').value,
        role: document.getElementById('user-role').value
    };
    try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/users/${id}` : '/users';
        const res = await authFetch(url, { method, body: JSON.stringify(payload) });
        if (res.ok) { showToast('User saved!'); closeUserModal(); loadUsers(); }
    } catch (e) { showToast('Error saving user', 'error'); }
};

window.deleteUser = async (id) => {
    if (!confirm('Delete user?')) return;
    try {
        const res = await authFetch('/users/' + id, { method: 'DELETE' });
        if (res.ok) loadUsers();
    } catch (e) { console.error(e); }
};

window.closeUserModal = () => document.getElementById('user-modal').style.display = 'none';

// == RSS Feed Management ==

let rssFeeds = [];

async function loadRssFeeds() {
    try {
        const tbody = document.getElementById('rss-table-body');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted"><i class="fas fa-circle-notch fa-spin"></i> Loading feeds...</td></tr>';
        
        await loadCategories(); 
        const res = await authFetch('/rss');
        rssFeeds = await res.json();
        renderRss();
    } catch (e) {
        console.error('Failed to load RSS feeds', e);
        const tbody = document.getElementById('rss-table-body');
        if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4" style="color:var(--accent);"><i class="fas fa-triangle-exclamation"></i> Failed to load RSS feeds</td></tr>';
    }
}

function renderRss() {
    const tbody = document.getElementById('rss-table-body');
    if (!tbody) return;
    if (rssFeeds.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">No RSS feeds configured. Click "Add Feed" to get started.</td></tr>';
        return;
    }
    tbody.innerHTML = rssFeeds.map(f => `
        <tr>
            <td><strong>${f.name}</strong></td>
            <td style="max-width:280px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                <a href="${f.url}" target="_blank" style="color:var(--primary); font-size:0.82rem;">${f.url}</a>
            </td>
            <td><span class="badge badge-blue">${f.category}</span></td>
            <td><span class="badge ${f.enabled ? 'badge-success' : 'badge-amber'}">${f.enabled ? 'Active' : 'Paused'}</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon" onclick="editRss('${f.id}')" title="Edit"><i class="fas fa-pen"></i></button>
                    <button class="btn-icon" onclick="deleteRss('${f.id}')" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

window.openRssModal = () => {
    document.getElementById('rss-modal-title').textContent = 'Add RSS Feed';
    document.getElementById('rss-id').value = '';
    document.getElementById('rss-form').reset();
    document.getElementById('rss-enabled').checked = true;
    document.getElementById('rss-modal').style.display = 'flex';
};

window.closeRssModal = () => document.getElementById('rss-modal').style.display = 'none';

window.editRss = (id) => {
    const f = rssFeeds.find(x => String(x.id) === String(id));
    if(f) {
        document.getElementById('rss-modal-title').textContent = 'Edit RSS Feed';
        document.getElementById('rss-id').value = f.id;
        document.getElementById('rss-name').value = f.name;
        document.getElementById('rss-url').value = f.url;
        document.getElementById('rss-category').value = f.category;
        document.getElementById('rss-enabled').checked = f.enabled;
        document.getElementById('rss-modal').style.display = 'flex';
    }
};

window.saveRssFeed = async () => {
    const id = document.getElementById('rss-id').value;
    const payload = {
        name: document.getElementById('rss-name').value,
        url: document.getElementById('rss-url').value,
        category: document.getElementById('rss-category').value,
        enabled: document.getElementById('rss-enabled').checked
    };
    try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/rss/${id}` : '/rss';
        const res = await authFetch(url, { method, body: JSON.stringify(payload) });
        if (res.ok) { showToast('Feed saved!'); closeRssModal(); loadRssFeeds(); }
    } catch (e) { showToast('Error saving feed', 'error'); }
};

window.deleteRss = async (id) => {
    if (!confirm('Delete this feed?')) return;
    try {
        const res = await authFetch(`/rss/${id}`, { method: 'DELETE' });
        if (res.ok) { showToast('Feed deleted'); loadRssFeeds(); }
    } catch (e) { showToast('Error deleting feed', 'error'); }
};

// == AI Settings & Queue ==

async function loadAiSettings() {
    try {
        const res = await authFetch('/ai-settings');
        const s = await res.json();
        if (document.getElementById('ai-api-key')) document.getElementById('ai-api-key').value = s.aiApiKey || '';
        if (document.getElementById('ai-prompt')) document.getElementById('ai-prompt').value = s.aiPrompt || '';
        if (document.getElementById('auto-publish-toggle')) document.getElementById('auto-publish-toggle').checked = s.aiAutoPublish !== false;
    } catch (e) { console.error(e); }
}

window.saveAiSettings = async () => {
    const payload = {
        aiApiKey: document.getElementById('ai-api-key').value,
        aiPrompt: document.getElementById('ai-prompt').value,
        aiAutoPublish: document.getElementById('auto-publish-toggle').checked
    };
    try {
        const res = await authFetch('/api/admin/ai-settings', { method: 'POST', body: JSON.stringify(payload) });
        if (res.ok) showToast('AI settings saved!');
    } catch (e) { showToast('Error saving AI settings', 'error'); }
};

async function loadQueue() {
    const container = document.getElementById('queue-container');
    if (!container) return;
    try {
        const res = await authFetch('/queue');
        const queue = await res.json();
        if (queue.length === 0) {
            container.innerHTML = '<p class="text-center py-4">Queue is empty.</p>';
            return;
        }
        container.innerHTML = queue.map(a => `
            <div class="queue-item" style="border-bottom:1px solid #ddd; padding:15px 0;">
                <h4>${a.title}</h4>
                <p>${a.content ? a.content.substring(0, 150) : ''}...</p>
                <div class="mt-2">
                    <button class="btn btn-primary" onclick="approveQueueItem('${a.id}')">Approve</button>
                    <button class="btn btn-danger" onclick="rejectQueueItem('${a.id}')">Reject</button>
                </div>
            </div>
        `).join('');
    } catch (e) { console.error(e); }
}

window.approveQueueItem = async (id) => {
    try {
        const res = await authFetch(`/api/admin/queue/${id}/approve`, { method: 'POST' });
        if (res.ok) { showToast('Approved!'); loadQueue(); }
    } catch (e) { showToast('Error', 'error'); }
};

window.rejectQueueItem = async (id) => {
    try {
        const res = await authFetch(`/api/admin/queue/${id}`, { method: 'DELETE' });
        if (res.ok) { showToast('Rejected'); loadQueue(); }
    } catch (e) { showToast('Error', 'error'); }
};

// == Ads & Settings ==

let ads = [];

async function loadAds() {
    try {
        const container = document.getElementById('ads-container');
        if (!container) return;
        
        container.innerHTML = '<p class="text-center py-4">Loading ads...</p>';
        const res = await authFetch('/ads');
        ads = await res.json();
        
        if (!ads || ads.length === 0) {
            ads = [
                { id: 'header', name: 'Header Ad unit', enabled: false, code: '' },
                { id: 'sidebar', name: 'Sidebar Ad unit', enabled: false, code: '' },
                { id: 'article', name: 'Inside Article Ad unit', enabled: false, code: '' }
            ];
        }
        renderAds();
    } catch (e) {
        console.error('Failed to load ads', e);
    }
}

function renderAds() {
    const container = document.getElementById('ads-container');
    if (!container) return;
    
    container.innerHTML = ads.map(ad => `
        <div style="border:1px solid #ddd; border-radius:8px; padding:20px; background:#fff; box-shadow:0 2px 4px rgba(0,0,0,0.05); margin-bottom:15px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:15px; align-items:center;">
                <h4 style="margin:0;"><i class="fas fa-ad" style="color:var(--primary-color); margin-right:10px;"></i> ${ad.name}</h4>
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="font-size:0.85rem; font-weight:600; color:${ad.enabled?'#4caf50':'#9e9e9e'}">${ad.enabled ? 'ACTIVE' : 'INACTIVE'}</span>
                    <input type="checkbox" id="enable-${ad.id}" ${ad.enabled ? 'checked' : ''} onchange="toggleAd('${ad.id}')">
                </div>
            </div>
            <textarea id="code-${ad.id}" rows="5" class="form-input" style="width:100%; font-family:monospace; font-size:13px;" placeholder="Paste AdSense code here...">${ad.code}</textarea>
            <div style="text-align:right; margin-top:15px;">
                <button class="btn btn-primary" onclick="saveAdUnit('${ad.id}')"><i class="fas fa-save"></i> Save Unit</button>
            </div>
        </div>
    `).join('');
}

window.toggleAd = (id) => {
    const ad = ads.find(a => a.id === id);
    if (!ad) return;
    const checkbox = document.getElementById(`enable-${id}`);
    ad.enabled = checkbox.checked;
    saveAllAds();
};

window.saveAdUnit = (id) => {
    const ad = ads.find(a => a.id === id);
    if (!ad) return;
    ad.code = document.getElementById(`code-${id}`).value;
    saveAllAds(true);
};

async function saveAllAds(notify = false) {
    try {
        await authFetch('/ads', {
            method: 'POST',
            body: JSON.stringify(ads)
        });
        if (notify) showToast('Ad settings updated!');
        renderAds();
    } catch (e) {
        showToast('Error saving ads', 'error');
    }
}

async function loadSettings() {
    try {
        const res = await authFetch('/settings');
        const s = await res.json();
        const form = document.getElementById('settings-form');
        if (!form) return;
        
        if (document.getElementById('siteName')) document.getElementById('siteName').value = s.siteName || 'PrimeReport';
        if (document.getElementById('logoUrl')) document.getElementById('logoUrl').value = s.logoUrl || '../../logo.png';
        if (document.getElementById('contactEmail')) document.getElementById('contactEmail').value = s.contactEmail || 'admin@primereport.in';
        if (document.getElementById('defaultAuthor')) document.getElementById('defaultAuthor').value = s.defaultAuthor || 'Prime Editorial';
        if (document.getElementById('footerText')) document.getElementById('footerText').value = s.footerText || '© 2026 PrimeReport. All rights reserved.';
        if (document.getElementById('rssSyncInterval')) document.getElementById('rssSyncInterval').value = s.rssSyncInterval || 15;
        if (document.getElementById('adsEnabled')) document.getElementById('adsEnabled').checked = s.adsEnabled !== false;
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
        const res = await authFetch('/settings', { method: 'POST', body: JSON.stringify(payload) });
        if (res.ok) showToast('Settings saved successfully!');
        else showToast('Failed to save settings', 'error');
    } catch (e) {
        showToast('Error saving settings', 'error');
    }
};

// == Dashboard & Analytics ==

async function loadDashboardStats() {
    try {
        const res = await authFetch('/dashboard');
        const s = await res.json();
        
        const updateText = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = isNaN(val) ? 0 : val;
        };

        updateText('totalArticles', s.totalArticles);
        updateText('breakingNewsCount', s.breakingNews);
        updateText('totalViews', s.totalViews);
        updateText('dailyArticles', s.dailyArticles);
        
        const topList = document.getElementById('top-articles-list');
        if (topList) {
            const anaRes = await authFetch('/analytics');
            const anaData = await anaRes.json();
            if (anaData.topArticles && anaData.topArticles.length > 0) {
                topList.innerHTML = anaData.topArticles.slice(0, 5).map(a => `
                    <li style="padding: 12px; border-bottom: 1px solid #eee; display:flex; justify-content:space-between; align-items:center; background:#fff; border-radius:8px; margin-bottom:8px; box-shadow:0 2px 4px rgba(0,0,0,0.02);">
                        <span style="font-weight:600; color:#333; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:70%;">${a.title}</span>
                        <span class="badge" style="background:#fef2f2; color:#d32f2f; border:1px solid #fee2e2; padding:4px 10px; border-radius:15px; font-size:12px;"><i class="fas fa-eye"></i> ${a.views || 0}</span>
                    </li>
                `).join('');
            } else {
                topList.innerHTML = '<p class="text-center py-4 text-muted">No article data yet</p>';
            }
        }
    } catch (e) { 
        console.error("Dashboard stats error:", e);
    }
}

async function loadAnalytics() {
    try {
        const res = await authFetch('/analytics');
        const stats = await res.json();
        
        if (document.getElementById('total-articles-count')) document.getElementById('total-articles-count').textContent = stats.totalArticles || 0;
        if (document.getElementById('total-views-count')) document.getElementById('total-views-count').textContent = stats.totalViews || 0;

        const tbody = document.getElementById('top-articles-tbody');
        if (tbody) {
            if (stats.topArticles && stats.topArticles.length > 0) {
                tbody.innerHTML = stats.topArticles.map((a, i) => `
                    <tr>
                        <td>#${i + 1}</td>
                        <td><strong>${a.title}</strong></td>
                        <td><span class="badge" style="background:var(--primary-color)">${a.views || 0} Views</span></td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px;">No data available</td></tr>';
            }
        }

        if (typeof Chart !== 'undefined') {
            const trafficCanvas = document.getElementById('trafficChart');
            if (trafficCanvas) {
                new Chart(trafficCanvas.getContext('2d'), {
                    type: 'line',
                    data: {
                        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                        datasets: [{
                            label: 'Page Views',
                            data: [65, 59, 80, 81, 56, 55, 40].map(v => Math.floor(v * (stats.totalViews / 500))),
                            borderColor: '#d32f2f',
                            tension: 0.3,
                            fill: true,
                            backgroundColor: 'rgba(211, 47, 47, 0.1)'
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false }
                });
            }

            const categoryCanvas = document.getElementById('categoryChart');
            if (categoryCanvas) {
                const catLabels = Object.keys(stats.categoryCount);
                const catData = Object.values(stats.categoryCount);
                new Chart(categoryCanvas.getContext('2d'), {
                    type: 'doughnut',
                    data: {
                        labels: catLabels,
                        datasets: [{
                            data: catData,
                            backgroundColor: ['#f44336', '#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4']
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false }
                });
            }
        }
    } catch (e) {
        console.error('Failed to load analytics', e);
    }
}

window.quickPublish = async () => {
    const payload = {
        title: document.getElementById('qp-title').value,
        content: document.getElementById('qp-content').value,
        category: document.getElementById('qp-category').value,
        publish_date: new Date().toISOString()
    };
    try {
        const res = await authFetch('/articles', { method: 'POST', body: JSON.stringify(payload) });
        if (res.ok) { showToast('Published!'); document.getElementById('quick-publish-form').reset(); loadDashboardStats(); }
    } catch (e) { showToast('Error', 'error'); }
};

window.triggerManualFetch = async () => {
    try {
        showToast('Syncing...');
        const res = await authFetch('/rss-sync', { method: 'POST' });
        const data = await res.json();
        showToast(`Sync complete! ${data.count} articles.`);
        loadDashboardStats();
    } catch (e) { showToast('Sync failed', 'error'); }
};

// Sidebar Toggle
window.toggleSidebar = () => {
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) {
        sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('active', sidebar.classList.contains('open'));
    }
};

// Exports
window.authFetch = authFetch;
window.showToast = showToast;
window.loadCategories = loadCategories;
window.loadUsers = loadUsers;
window.loadAds = loadAds;
window.loadSettings = loadSettings;
window.loadAnalytics = loadAnalytics;
window.loadDashboardStats = loadDashboardStats;
window.loadRssFeeds = loadRssFeeds;
window.loadArticles = loadArticles;
window.loadAiSettings = loadAiSettings;
window.loadQueue = loadQueue;

