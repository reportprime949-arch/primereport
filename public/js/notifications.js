import { auth } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const API_URL = 'https://primereport-server.onrender.com/api/admin';
let allNotifs = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (!user) return;
        initNotificationsPage();
    });
});

async function authFetch(url, options = {}) {
    let user = auth.currentUser;
    if (!user) {
        // Wait for auth if not ready
        user = await new Promise((resolve) => {
            const unsub = onAuthStateChanged(auth, u => {
                unsub();
                resolve(u);
            });
        });
    }
    if (!user) throw new Error("Not authenticated");
    const token = await user.getIdToken();
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
    };
    return await fetch(`${API_URL}${url}`, { ...options, headers });
}

function initNotificationsPage() {
    loadNotifications();

    // Tab Filtering
    document.querySelectorAll('#notif-tabs .tab-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('#notif-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderNotifications();
        };
    });
}

async function loadNotifications() {
    const list = document.getElementById('notifications-list');
    try {
        const res = await authFetch('/notifications');
        if (!res.ok) throw new Error("Failed to fetch notifications");
        allNotifs = await res.json();
        renderNotifications();
        updateGlobalBadge();
    } catch (e) {
        console.error(e);
        if (list) {
            list.innerHTML = `
                <div class="empty-state" style="padding: 40px; text-align: center;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #ef4444; margin-bottom: 10px;"></i>
                    <p>Failed to load notifications. Please check your connection.</p>
                </div>
            `;
        }
    }
}

function renderNotifications() {
    const list = document.getElementById('notifications-list');
    let filtered = allNotifs;
    
    if (currentFilter === 'unread') filtered = allNotifs.filter(n => !n.read);
    if (currentFilter === 'read') filtered = allNotifs.filter(n => n.read);

    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="empty-state" style="padding: 60px 20px; text-align: center; color: #64748b;">
                <i class="fas fa-bell-slash" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.2;"></i>
                <p>No ${currentFilter === 'all' ? '' : currentFilter} notifications found.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = filtered.map(n => `
        <div class="notif-card ${n.read ? 'read' : 'unread'}" onclick="markAsRead('${n.id}')">
            <div class="notif-icon ${n.type || 'info'}">
                <i class="fas ${getIcon(n.type)}"></i>
            </div>
            <div class="notif-content">
                <div class="notif-meta">
                    <h4>${n.title || 'System Alert'}</h4>
                    <span>${formatTime(n.time)}</span>
                </div>
                <p>${n.message || n.text || ''}</p>
            </div>
            ${!n.read ? '<div class="unread-dot"></div>' : ''}
        </div>
    `).join('');
}

function getIcon(type) {
    if (type === 'success') return 'fa-check-circle';
    if (type === 'error') return 'fa-exclamation-circle';
    if (type === 'warning') return 'fa-triangle-exclamation';
    return 'fa-info-circle';
}

function formatTime(isoStr) {
    const date = new Date(isoStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
}

window.markAsRead = async (id) => {
    try {
        await authFetch(`/notifications/${id}/read`, { method: 'POST' });
        const n = allNotifs.find(x => x.id == id);
        if (n) n.read = true;
        renderNotifications();
        updateGlobalBadge();
    } catch (e) {
        console.error(e);
    }
};

window.markAllRead = async () => {
    try {
        await authFetch('/notifications/read-all', { method: 'POST' });
        allNotifs.forEach(n => n.read = true);
        renderNotifications();
        updateGlobalBadge();
    } catch (e) {
        console.error(e);
    }
};

function updateGlobalBadge() {
    const unreadCount = allNotifs.filter(n => !n.read).length;
    const badge = document.getElementById('global-notif-badge');
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}
