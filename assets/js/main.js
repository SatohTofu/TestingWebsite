/* ==============================================
   GAMEVAULT MAIN JAVASCRIPT
   ============================================== */

class GameVault {
    constructor() {
        this.isLoaded = false;
        this.components = {};
        this.eventEmitter = new EventEmitter();
        
        this.init();
    }
    
    /**
     * Initialize the application
     */
    init() {
        try {
            console.log('🎮 GameVault initialization started');
            this.showLoadingScreen();
            console.log('✅ Loading screen shown');
            
            this.setupGlobalEventListeners();
            console.log('✅ Global event listeners setup');
            
            this.initializeComponents();
            console.log('✅ Components initialization completed');
            
            this.setupScrollToTop();
            this.setupNotifications();
            this.setupPerformanceMonitoring();
            console.log('✅ Additional setup completed');
            
            // Wait for all components to load (reduced time for faster experience)
            setTimeout(() => {
                this.hideLoadingScreen();
                this.startApplication();
            }, 1500);
            
            // Failsafe: Always hide loading screen after maximum wait time
            setTimeout(() => {
                const loadingScreen = document.getElementById('loading-screen');
                if (loadingScreen && loadingScreen.style.display !== 'none') {
                    console.warn('Loading screen failsafe triggered - hiding loading screen');
                    this.hideLoadingScreen();
                }
            }, 3000);
            
        } catch (error) {
            console.error('Error during initialization:', error);
            // Emergency fallback - hide loading screen and show content
            this.hideLoadingScreen();
            this.createAuthFallback();
        }
    }
    
    /**
     * Show loading screen with animation
     */
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
            
            // Animate loading progress
            const progressBar = loadingScreen.querySelector('.loading-progress');
            if (progressBar) {
                let progress = 0;
                const interval = setInterval(() => {
                    progress += Math.random() * 15;
                    if (progress >= 100) {
                        progress = 100;
                        clearInterval(interval);
                    }
                    progressBar.style.width = progress + '%';
                }, 100);
            }
        }
    }
    
    /**
     * Hide loading screen with fade out animation
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('fade-out');
            
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                this.isLoaded = true;
                this.eventEmitter.emit('appLoaded');
            }, 500);
        }
    }
    
    /**
     * Initialize all components
     */
    initializeComponents() {
        try {
            // Initialize core components with error handling
            if (typeof StateManager !== 'undefined') {
                this.components.stateManager = new StateManager();
                console.log('StateManager initialized');
            } else {
                console.warn('StateManager not available');
            }
            
            if (typeof AuthManager !== 'undefined') {
                this.components.authManager = new AuthManager();
                console.log('AuthManager initialized');
            } else {
                console.warn('AuthManager not available');
                // Create a minimal fallback to prevent crashes
                this.createAuthFallback();
            }
            
            // Initialize other components that are already loaded
            this.components.theme = window.themeManager;
            this.components.navigation = window.navigationManager;
            this.components.animation = window.animationManager;
            this.components.search = window.searchManager;
            this.components.carousels = window.carouselInstances || [];
            
            console.log('GameVault components initialized:', this.components);
        } catch (error) {
            console.error('Error initializing components:', error);
            // Continue with basic functionality even if some components fail
            this.createAuthFallback();
        }
    }
    
    /**
     * Create a fallback auth system if AuthManager fails to load
     */
    createAuthFallback() {
        console.log('Creating auth fallback...');
        
        // Hide loading screen and show original content as fallback
        const originalContent = document.getElementById('original-content');
        if (originalContent) {
            originalContent.style.display = 'block';
        }
        
        // Hide guest/user specific content that requires AuthManager
        const guestLanding = document.getElementById('guest-landing');
        const userDashboard = document.getElementById('user-dashboard');
        
        if (guestLanding) {
            guestLanding.style.display = 'none';
        }
        if (userDashboard) {
            userDashboard.style.display = 'none';
        }
    }
    
    /**
     * Start the main application
     */
    startApplication() {
        this.setupInteractiveElements();
        this.initializeGameCards();
        this.setupLazyLoading();
        this.startStatsAnimation();
        this.setupFormValidation();
        this.setupTooltips();
        
        // Dispatch app ready event
        dispatchCustomEvent('gameVaultReady', {
            timestamp: Date.now(),
            components: Object.keys(this.components)
        });
        
        console.log('🎮 GameVault application ready!');
    }
    
    /**
     * Setup global event listeners
     */
    setupGlobalEventListeners() {
        // Handle visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.eventEmitter.emit('appHidden');
            } else {
                this.eventEmitter.emit('appVisible');
            }
        });
        
        // Handle online/offline status
        window.addEventListener('online', () => {
            this.eventEmitter.emit('appOnline');
            this.showNotification('Connection restored', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.eventEmitter.emit('appOffline');
            this.showNotification('Connection lost', 'warning');
        });
        
        // Handle window resize with debouncing
        window.addEventListener('resize', debounce(() => {
            this.eventEmitter.emit('windowResize', {
                width: window.innerWidth,
                height: window.innerHeight,
                deviceType: getDeviceType()
            });
        }, 250));
        
        // Handle scroll events
        window.addEventListener('scroll', throttle(() => {
            this.eventEmitter.emit('windowScroll', {
                scrollY: window.pageYOffset,
                scrollX: window.pageXOffset
            });
        }, 16));
    }
    
    /**
     * Setup interactive elements
     */
    setupInteractiveElements() {
        // Setup all buttons with ripple effects
        document.querySelectorAll('.btn, .action-btn').forEach(button => {
            button.addEventListener('click', function(e) {
                if (!prefersReducedMotion()) {
                    createRippleEffect(e, this);
                }
            });
        });
        
        // Setup hover effects for cards
        document.querySelectorAll('.game-card, .category-card, .stat-card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                if (!prefersReducedMotion()) {
                    this.style.transform = 'translateY(-8px)';
                }
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = '';
            });
        });
        
        // Setup notification button
        const notificationBtn = document.querySelector('.notifications-btn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => {
                this.toggleNotifications();
            });
        }
    }
    
    /**
     * Initialize game card interactions
     */
    initializeGameCards() {
        document.querySelectorAll('.game-card').forEach(card => {
            // Add to favorites
            const heartBtn = card.querySelector('.action-btn[title*="Favorites"]');
            if (heartBtn) {
                heartBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleFavorite(card);
                });
            }
            
            // Add to list
            const plusBtn = card.querySelector('.action-btn[title*="List"]');
            if (plusBtn) {
                plusBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.addToList(card);
                });
            }
            
            // Quick view
            const eyeBtn = card.querySelector('.action-btn[title*="View"]');
            if (eyeBtn) {
                eyeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.quickView(card);
                });
            }
            
            // Card click for details
            card.addEventListener('click', () => {
                this.viewGameDetails(card);
            });
        });
    }
    
    /**
     * Setup lazy loading for images
     */
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        const src = img.getAttribute('data-src');
                        
                        if (src) {
                            img.src = src;
                            img.removeAttribute('data-src');
                            img.classList.add('loaded');
                            imageObserver.unobserve(img);
                        }
                    }
                });
            });
            
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }
    
    /**
     * Start statistics animation
     */
    startStatsAnimation() {
        const statsSection = document.querySelector('.stats-section');
        if (!statsSection || prefersReducedMotion()) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateStats();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(statsSection);
    }
    
    /**
     * Animate statistics counters
     */
    animateStats() {
        const statNumbers = document.querySelectorAll('.stat-number[data-target]');
        
        statNumbers.forEach((element, index) => {
            const target = parseInt(element.getAttribute('data-target'));
            
            setTimeout(() => {
                animateNumber(element, target, 2000);
            }, index * 200);
        });
    }
    
    /**
     * Setup scroll to top functionality
     */
    setupScrollToTop() {
        const scrollToTopBtn = document.getElementById('scroll-to-top');
        if (!scrollToTopBtn) return;
        
        // Show/hide button based on scroll position
        window.addEventListener('scroll', throttle(() => {
            if (window.pageYOffset > 300) {
                scrollToTopBtn.classList.add('show');
            } else {
                scrollToTopBtn.classList.remove('show');
            }
        }, 100));
        
        // Handle click
        scrollToTopBtn.addEventListener('click', () => {
            smoothScrollTo(document.body, 0);
        });
    }
    
    /**
     * Setup form validation
     */
    setupFormValidation() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                }
            });
            
            // Real-time validation
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    this.validateField(input);
                });
            });
        });
    }
    
    /**
     * Validate form
     * @param {Element} form - Form element
     * @returns {boolean} - Is form valid
     */
    validateForm(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    /**
     * Validate individual field
     * @param {Element} field - Input field
     * @returns {boolean} - Is field valid
     */
    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';
        
        // Required field check
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }
        
        // Email validation
        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
        }
        
        // Update field appearance
        this.updateFieldValidation(field, isValid, errorMessage);
        
        return isValid;
    }
    
    /**
     * Update field validation appearance
     * @param {Element} field - Input field
     * @param {boolean} isValid - Is field valid
     * @param {string} errorMessage - Error message
     */
    updateFieldValidation(field, isValid, errorMessage) {
        field.classList.remove('valid', 'invalid');
        
        if (isValid) {
            field.classList.add('valid');
        } else {
            field.classList.add('invalid');
        }
        
        // Show/hide error message
        let errorElement = field.parentNode.querySelector('.field-error');
        
        if (!isValid && errorMessage) {
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.className = 'field-error';
                field.parentNode.appendChild(errorElement);
            }
            errorElement.textContent = errorMessage;
        } else if (errorElement) {
            errorElement.remove();
        }
    }
    
    /**
     * Setup tooltips
     */
    setupTooltips() {
        const elementsWithTooltips = document.querySelectorAll('[title], [data-tooltip]');
        
        elementsWithTooltips.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e);
            });
            
            element.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        });
    }
    
    /**
     * Show tooltip
     * @param {Event} e - Mouse event
     */
    showTooltip(e) {
        const element = e.target;
        const text = element.getAttribute('data-tooltip') || element.getAttribute('title');
        
        if (!text) return;
        
        // Remove title to prevent default tooltip
        if (element.hasAttribute('title')) {
            element.setAttribute('data-original-title', element.getAttribute('title'));
            element.removeAttribute('title');
        }
        
        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'custom-tooltip';
        tooltip.textContent = text;
        tooltip.style.cssText = `
            position: absolute;
            background: #333;
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 14px;
            white-space: nowrap;
            z-index: 10000;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s ease;
        `;
        
        document.body.appendChild(tooltip);
        
        // Position tooltip
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
        
        // Show tooltip
        requestAnimationFrame(() => {
            tooltip.style.opacity = '1';
        });
        
        this.currentTooltip = tooltip;
    }
    
    /**
     * Hide tooltip
     */
    hideTooltip() {
        if (this.currentTooltip) {
            this.currentTooltip.style.opacity = '0';
            setTimeout(() => {
                if (this.currentTooltip && this.currentTooltip.parentNode) {
                    this.currentTooltip.remove();
                }
                this.currentTooltip = null;
            }, 200);
        }
    }
    
    /**
     * Setup notifications system
     */
    setupNotifications() {
        this.notifications = [];
        this.maxNotifications = 5;
        
        // Create notifications container
        if (!document.getElementById('notifications-container')) {
            const container = document.createElement('div');
            container.id = 'notifications-container';
            container.className = 'notifications-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(container);
        }
    }
    
    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, warning, info)
     * @param {number} duration - Duration in milliseconds
     */
    showNotification(message, type = 'info', duration = 5000) {
        const container = document.getElementById('notifications-container');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        notification.style.cssText = `
            background: white;
            border-left: 4px solid ${this.getNotificationColor(type)};
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            padding: 16px;
            min-width: 300px;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        
        container.appendChild(notification);
        
        // Animate in
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        });
        
        // Close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.hideNotification(notification);
        });
        
        // Auto hide
        setTimeout(() => {
            this.hideNotification(notification);
        }, duration);
        
        this.notifications.push(notification);
        
        // Limit notifications
        if (this.notifications.length > this.maxNotifications) {
            const oldest = this.notifications.shift();
            this.hideNotification(oldest);
        }
    }
    
    /**
     * Hide notification
     * @param {Element} notification - Notification element
     */
    hideNotification(notification) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
            
            const index = this.notifications.indexOf(notification);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        }, 300);
    }
    
    /**
     * Get notification icon
     * @param {string} type - Notification type
     * @returns {string} - Icon class
     */
    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || icons.info;
    }
    
    /**
     * Get notification color
     * @param {string} type - Notification type
     * @returns {string} - Color value
     */
    getNotificationColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return colors[type] || colors.info;
    }
    
    /**
     * Toggle notifications panel
     */
    toggleNotifications() {
        console.log('Notifications toggled');
        // Implementation would show a notifications panel
        this.showNotification('You have 3 new notifications', 'info');
    }
    
    /**
     * Game card interaction methods
     */
    
    toggleFavorite(card) {
        const gameTitle = card.querySelector('.card-title')?.textContent || 'Game';
        const heartBtn = card.querySelector('.action-btn[title*="Favorites"] i');
        
        if (heartBtn) {
            const isFavorited = heartBtn.classList.contains('fas');
            
            if (isFavorited) {
                heartBtn.classList.remove('fas');
                heartBtn.classList.add('far');
                this.showNotification(`${gameTitle} removed from favorites`, 'info');
            } else {
                heartBtn.classList.remove('far');
                heartBtn.classList.add('fas');
                this.showNotification(`${gameTitle} added to favorites`, 'success');
            }
        }
    }
    
    addToList(card) {
        const gameTitle = card.querySelector('.card-title')?.textContent || 'Game';
        this.showNotification(`${gameTitle} added to your list`, 'success');
    }
    
    quickView(card) {
        const gameTitle = card.querySelector('.card-title')?.textContent || 'Game';
        console.log('Quick view:', gameTitle);
        this.showNotification(`Opening ${gameTitle} quick view`, 'info');
    }
    
    viewGameDetails(card) {
        const gameTitle = card.querySelector('.card-title')?.textContent || 'Game';
        console.log('View details:', gameTitle);
        this.showNotification(`Opening ${gameTitle} details`, 'info');
    }
    
    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        if ('performance' in window) {
            // Monitor loading time
            window.addEventListener('load', () => {
                const loadTime = performance.now();
                console.log(`🚀 GameVault loaded in ${loadTime.toFixed(2)}ms`);
                
                // Log performance metrics
                if (performance.getEntriesByType) {
                    const navigationTiming = performance.getEntriesByType('navigation')[0];
                    if (navigationTiming) {
                        console.log('📊 Performance metrics:', {
                            domContentLoaded: navigationTiming.domContentLoadedEventEnd - navigationTiming.navigationStart,
                            loadComplete: navigationTiming.loadEventEnd - navigationTiming.navigationStart,
                            firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0
                        });
                    }
                }
            });
        }
    }
    
    /**
     * Get application state
     * @returns {Object} Application state
     */
    getState() {
        return {
            isLoaded: this.isLoaded,
            currentTheme: this.components.theme?.getCurrentTheme(),
            deviceType: getDeviceType(),
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
    }
    
    /**
     * Destroy application (cleanup)
     */
    destroy() {
        // Cleanup components
        Object.values(this.components).forEach(component => {
            if (component && typeof component.destroy === 'function') {
                component.destroy();
            }
        });
        
        // Remove event listeners
        this.eventEmitter.events = {};
        
        console.log('GameVault application destroyed');
    }
}

// Initialize GameVault when DOM is ready
let gameVault;

domReady(() => {
    gameVault = new GameVault();
    
    // Make it globally accessible for debugging
    window.gameVault = gameVault;
    window.GameVault = GameVault;
    
    // Development helpers
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('🎮 GameVault Development Mode');
        console.log('Available globals:', {
            gameVault: 'Main application instance',
            themeManager: 'Theme management',
            navigationManager: 'Navigation system',
            searchManager: 'Search functionality',
            animationManager: 'Animation system'
        });
    }
});

// Error handling
window.addEventListener('error', (e) => {
    console.error('GameVault Error:', e.error);
    
    if (gameVault) {
        gameVault.showNotification('An error occurred. Please refresh the page.', 'error');
    }
});

// Unhandled promise rejection
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled Promise Rejection:', e.reason);
    e.preventDefault();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameVault;
}
