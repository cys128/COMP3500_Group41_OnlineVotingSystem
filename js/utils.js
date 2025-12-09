function showNotification(message, type = 'info', duration = 3000) {
    const oldNotifications = document.querySelectorAll('.notification');
    oldNotifications.forEach(notification => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    });
    
    let notificationContainer = document.getElementById('notificationContainer');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notificationContainer';
        notificationContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
        `;
        document.body.appendChild(notificationContainer);
    }
    
    let icon = 'info-circle';
    let bgColor = 'linear-gradient(135deg, #4a00e0, #8e2de2)';
    
    switch(type) {
        case 'success':
            icon = 'check-circle';
            bgColor = 'linear-gradient(135deg, #00b09b, #96c93d)';
            break;
        case 'warning':
            icon = 'exclamation-triangle';
            bgColor = 'linear-gradient(135deg, #ff9500, #ff5e3a)';
            break;
        case 'error':
            icon = 'times-circle';
            bgColor = 'linear-gradient(135deg, #ff416c, #ff4b2b)';
            break;
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        background: ${bgColor};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        margin-bottom: 10px;
        animation: slideIn 0.5s ease;
        max-width: 400px;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-${icon}" style="font-size: 20px;"></i>
            <div>
                <strong>${type === 'success' ? 'Success' : type === 'warning' ? 'Warning' : type === 'error' ? 'Error' : 'Info'}</strong>
                <p style="margin-top: 5px; font-size: 14px;">${message}</p>
            </div>
        </div>
    `;
    
    notificationContainer.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }
    }, duration);
}

function checkAuthStatus() {
    return sessionStorage.getItem('username') !== null;
}

function getCurrentUser() {
    const username = sessionStorage.getItem('username');
    const isAdmin = sessionStorage.getItem('is_admin') === 'true';
    
    if (!username) return null;
    
    return {
        username,
        isAdmin,
        userId: sessionStorage.getItem('user_id'),
        remainingVotes: parseInt(sessionStorage.getItem('vote') || '10')
    };
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function debounce(func, wait) {
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

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

function loadCandidatesData() {
    try {
        const candidates = JSON.parse(localStorage.getItem('candidates') || '[]');
        if (candidates.length === 0 && window.voteList) {
            localStorage.setItem('candidates', JSON.stringify(window.voteList));
            return window.voteList;
        }
        return candidates;
    } catch (error) {
        console.error('Failed to load candidate data:', error);
        return [];
    }
}

function saveCandidatesData(candidates) {
    try {
        localStorage.setItem('candidates', JSON.stringify(candidates));
        localStorage.setItem('carts', JSON.stringify(candidates));
        return true;
    } catch (error) {
        console.error('Failed to save candidate data:', error);
        return false;
    }
}

function initializePage() {
    if (!document.querySelector('#slideInKeyframes')) {
        const style = document.createElement('style');
        style.id = 'slideInKeyframes';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    if (!localStorage.getItem('candidates')) {
        localStorage.setItem('candidates', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const hasAdmin = users.some(user => user.username === 'admin');
    if (!hasAdmin) {
        users.push({
            id: 1,
            username: 'admin',
            password: 'admin123',
            createdAt: new Date().toISOString(),
            voteCount: 0,
            lastVoteDate: null,
            isAdmin: true
        });
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('is_admin', 'true');
        localStorage.setItem('admin_username', 'admin');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
    initializePage();
}