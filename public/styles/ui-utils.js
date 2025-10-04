/**
 * Campaign AI Editor - UI Utilities
 * Reusable UI functions for consistent behavior across all interfaces
 */

/**
 * Initialize resizable panel functionality
 * Usage: Call initPanelResizers() after DOM is loaded
 */
function initPanelResizers() {
    document.addEventListener('mousedown', (e) => {
        if (!e.target.classList.contains('panel-resizer')) return;

        const resizer = e.target;
        const parent = resizer.closest('.split-view') || resizer.parentElement;
        const leftPanel = parent.querySelector('.split-panel-left, .review-left-panel');

        if (!leftPanel) return;

        const startX = e.clientX;
        const startWidth = leftPanel.offsetWidth;
        const parentWidth = parent.offsetWidth;

        function onMouseMove(e) {
            const deltaX = e.clientX - startX;
            const newWidth = startWidth + deltaX;
            const newWidthPercent = (newWidth / parentWidth) * 100;

            // Limit between 20% and 80%
            if (newWidthPercent >= 20 && newWidthPercent <= 80) {
                leftPanel.style.flex = `0 0 ${newWidthPercent}%`;
                localStorage.setItem('panelSplitPercent', newWidthPercent);
            }
        }

        function onMouseUp() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}

/**
 * Apply saved panel split from localStorage
 * Call after panels are rendered to the DOM
 */
function applySavedPanelSplit() {
    const savedPercent = localStorage.getItem('panelSplitPercent');
    if (savedPercent) {
        document.querySelectorAll('.split-panel-left, .review-left-panel').forEach(panel => {
            panel.style.flex = `0 0 ${savedPercent}%`;
        });
    }
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duration in ms (default: 3000)
 */
function showToast(message, type = 'info', duration = 3000) {
    // Create toast container if it doesn't exist
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 12px;
        `;
        document.body.appendChild(container);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };

    toast.style.cssText = `
        background: white;
        padding: 12px 16px;
        border-radius: 6px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        border-left: 4px solid ${colors[type] || colors.info};
        font-size: 14px;
        max-width: 350px;
        animation: slideIn 0.3s ease-out;
    `;

    toast.textContent = message;
    container.appendChild(toast);

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
    `;
    if (!document.getElementById('toast-animations')) {
        style.id = 'toast-animations';
        document.head.appendChild(style);
    }

    // Remove after duration
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Debounce function for input handlers
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 */
function formatDate(date) {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard', 'success', 2000);
    } catch (err) {
        showToast('Failed to copy', 'error', 2000);
    }
}

/**
 * Confirm dialog with promise
 * @param {string} message - Message to display
 */
function confirmDialog(message) {
    return new Promise((resolve) => {
        const result = window.confirm(message);
        resolve(result);
    });
}
