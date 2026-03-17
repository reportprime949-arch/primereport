/**
 * ToastManager - Professional Glassmorphism Notification System
 */
import { soundManager } from './soundManager.js';

class ToastManager {
    constructor() {
        this.container = this.createContainer();
        this.toasts = [];
    }

    createContainer() {
        const container = document.createElement('div');
        container.id = 'admin-toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }

    show(message, type = 'info', duration = 4000) {
        const toast = document.createElement('div');
        toast.className = `admin-toast toast-${type} animate-slide-in`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-triangle-exclamation',
            info: 'fa-circle-info'
        };

        toast.innerHTML = `
            <div class="toast-glass"></div>
            <div class="toast-content">
                <div class="toast-icon">
                    <i class="fas ${icons[type]}"></i>
                </div>
                <div class="toast-body">
                    <p>${message}</p>
                </div>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">
                    &times;
                </button>
            </div>
            <div class="toast-progress"></div>
        `;

        this.container.appendChild(toast);
        
        // Play corresponding sound
        soundManager.play(type);

        // Auto dismiss
        const timer = setTimeout(() => {
            this.hide(toast);
        }, duration);

        toast.onmouseenter = () => clearTimeout(timer);
        toast.onmouseleave = () => {
             setTimeout(() => this.hide(toast), 2000);
        };
    }

    hide(toast) {
        toast.classList.replace('animate-slide-in', 'animate-slide-out');
        setTimeout(() => {
            if (toast.parentElement) toast.remove();
        }, 400);
    }
}

export const toastManager = new ToastManager();
window.showToast = (msg, type) => toastManager.show(msg, type);
