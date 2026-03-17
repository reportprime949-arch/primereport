/**
 * PrimeReport Sidebar Navigation System
 * Centralized logic for active state, navigation feedback, and mobile sidebar toggle.
 */

document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
});

function initSidebar() {
    let currentPath = window.location.pathname.split('/').pop();
    // Default to index.html if path is empty or ends with a slash (directory access)
    if (!currentPath || currentPath === 'admin' || currentPath.indexOf('.') === -1) {
        currentPath = 'index.html';
    }
    
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    
    // 1. Highlight Active Menu Item
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath === currentPath || (currentPath === '' && linkPath === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }

        // 2. Add Loading Feedback on Click
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && href !== '#' && !this.classList.contains('active')) {
                showSidebarLoading(this);
            }
        });
    });

    // 3. Mobile Sidebar Toggle Logic
    window.toggleSidebar = function() {
        const sidebar = document.getElementById('admin-sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar) {
            sidebar.classList.toggle('open');
            if (overlay) overlay.classList.toggle('active', sidebar.classList.contains('open'));
        }
    };
}

function showSidebarLoading(clickedLink) {
    // Add a small spinner next to the icon
    const icon = clickedLink.querySelector('i');
    if (icon) {
        const originalClass = icon.className;
        icon.className = 'fas fa-spinner fa-spin';
        
        // Prevent multiple clicks
        clickedLink.style.pointerEvents = 'none';
        clickedLink.style.opacity = '0.7';
    }
}
