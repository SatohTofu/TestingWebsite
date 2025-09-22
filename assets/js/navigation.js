/* ==============================================
   NAVIGATION SYSTEM
   ============================================== */

class NavigationManager {
    constructor() {
        this.header = null;
        this.navbar = null;
        this.mobileToggle = null;
        this.navMenu = null;
        this.navLinks = [];
        this.userDropdown = null;
        this.isMenuOpen = false;
        this.scrollThreshold = 100;
        this.lastScrollY = 0;
        
        this.init();
    }
    
    /**
     * Initialize navigation system
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.setupScrollBehavior();
        this.setupActiveNavigation();
        this.setupAccessibility();
    }
    
    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.header = document.querySelector('.header');
        this.navbar = document.querySelector('.navbar');
        this.mobileToggle = document.querySelector('.mobile-menu-toggle');
        this.navMenu = document.querySelector('.nav-menu');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.userProfile = document.querySelector('.user-profile');
        this.userDropdown = document.querySelector('.user-dropdown');
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Mobile menu toggle
        if (this.mobileToggle) {
            this.mobileToggle.addEventListener('click', () => this.toggleMobileMenu());
        }
        
        // Navigation links
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleNavClick(e));
        });
        
        // User profile dropdown
        if (this.userProfile) {
            this.setupUserDropdown();
        }
        
        // Close menu on outside click
        document.addEventListener('click', (e) => this.handleOutsideClick(e));
        
        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMobileMenu();
                this.closeUserDropdown();
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', debounce(() => this.handleResize(), 250));
    }
    
    /**
     * Setup scroll behavior for header
     */
    setupScrollBehavior() {
        if (!this.header) return;
        
        const handleScroll = throttle(() => {
            const currentScrollY = window.pageYOffset;
            
            // Add/remove scrolled class
            if (currentScrollY > this.scrollThreshold) {
                this.header.classList.add('scrolled');
            } else {
                this.header.classList.remove('scrolled');
            }
            
            // Hide/show header on scroll (optional)
            if (getDeviceType() === 'mobile') {
                if (currentScrollY > this.lastScrollY && currentScrollY > 200) {
                    this.header.classList.add('hidden');
                } else {
                    this.header.classList.remove('hidden');
                }
            }
            
            this.lastScrollY = currentScrollY;
            
            // Update active navigation based on scroll position
            this.updateActiveNavigation();
        }, 16);
        
        window.addEventListener('scroll', handleScroll);
    }
    
    /**
     * Setup active navigation highlighting
     */
    setupActiveNavigation() {
        // Get all sections with IDs that match navigation hrefs
        const sections = document.querySelectorAll('section[id]');
        
        if (sections.length === 0) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    this.setActiveNavItem(sectionId);
                }
            });
        }, {
            threshold: 0.3,
            rootMargin: '-10% 0px -70% 0px'
        });
        
        sections.forEach(section => observer.observe(section));
    }
    
    /**
     * Update active navigation item
     */
    updateActiveNavigation() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPos = window.pageYOffset + window.innerHeight / 3;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.id;
            
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                this.setActiveNavItem(sectionId);
            }
        });
    }
    
    /**
     * Set active navigation item
     * @param {string} sectionId - ID of the active section
     */
    setActiveNavItem(sectionId) {
        this.navLinks.forEach(link => {
            link.classList.remove('active');
            
            const href = link.getAttribute('href');
            if (href === `#${sectionId}`) {
                link.classList.add('active');
            }
        });
    }
    
    /**
     * Handle navigation link clicks
     * @param {Event} e - Click event
     */
    handleNavClick(e) {
        const link = e.currentTarget;
        const href = link.getAttribute('href');
        
        // Handle anchor links
        if (href && href.startsWith('#')) {
            e.preventDefault();
            
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const headerHeight = this.header ? this.header.offsetHeight : 0;
                const offset = headerHeight + 20; // Add some extra padding
                
                smoothScrollTo(targetElement, offset);
                
                // Close mobile menu if open
                this.closeMobileMenu();
                
                // Update active state immediately
                this.setActiveNavItem(targetId);
            }
        }
        
        // Dispatch navigation event
        dispatchCustomEvent('navigationClick', {
            link: link,
            href: href,
            text: link.textContent.trim()
        });
    }
    
    /**
     * Toggle mobile menu
     */
    toggleMobileMenu() {
        if (this.isMenuOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }
    
    /**
     * Open mobile menu
     */
    openMobileMenu() {
        if (!this.navMenu || !this.mobileToggle) return;
        
        this.isMenuOpen = true;
        this.navMenu.classList.add('active');
        this.mobileToggle.classList.add('active');
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Focus first nav item for accessibility
        const firstNavLink = this.navMenu.querySelector('.nav-link');
        if (firstNavLink) {
            firstNavLink.focus();
        }
        
        dispatchCustomEvent('mobileMenuOpen');
    }
    
    /**
     * Close mobile menu
     */
    closeMobileMenu() {
        if (!this.navMenu || !this.mobileToggle) return;
        
        this.isMenuOpen = false;
        this.navMenu.classList.remove('active');
        this.mobileToggle.classList.remove('active');
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        dispatchCustomEvent('mobileMenuClose');
    }
    
    /**
     * Setup user dropdown functionality
     */
    setupUserDropdown() {
        let isDropdownOpen = false;
        
        // Toggle dropdown on click
        this.userProfile.addEventListener('click', (e) => {
            e.stopPropagation();
            isDropdownOpen = !isDropdownOpen;
            
            if (isDropdownOpen) {
                this.userProfile.classList.add('active');
            } else {
                this.userProfile.classList.remove('active');
            }
        });
        
        // Handle dropdown item clicks
        if (this.userDropdown) {
            this.userDropdown.addEventListener('click', (e) => {
                const item = e.target.closest('.dropdown-item');
                if (item) {
                    // Handle dropdown item click
                    this.handleDropdownItemClick(item);
                    this.closeUserDropdown();
                }
            });
        }
    }
    
    /**
     * Close user dropdown
     */
    closeUserDropdown() {
        if (this.userProfile) {
            this.userProfile.classList.remove('active');
        }
    }
    
    /**
     * Handle dropdown item clicks
     * @param {Element} item - Clicked dropdown item
     */
    handleDropdownItemClick(item) {
        const text = item.textContent.trim();
        const href = item.getAttribute('href');
        
        dispatchCustomEvent('userDropdownClick', {
            item: item,
            text: text,
            href: href
        });
        
        console.log('Dropdown item clicked:', text);
    }
    
    /**
     * Handle clicks outside navigation elements
     * @param {Event} e - Click event
     */
    handleOutsideClick(e) {
        // Close mobile menu if clicking outside
        if (this.isMenuOpen && 
            !this.navMenu.contains(e.target) && 
            !this.mobileToggle.contains(e.target)) {
            this.closeMobileMenu();
        }
        
        // Close user dropdown if clicking outside
        if (this.userProfile && 
            !this.userProfile.contains(e.target)) {
            this.closeUserDropdown();
        }
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        // Close mobile menu on resize to desktop
        if (window.innerWidth >= 1024 && this.isMenuOpen) {
            this.closeMobileMenu();
        }
    }
    
    /**
     * Setup accessibility features
     */
    setupAccessibility() {
        // Add ARIA attributes
        if (this.mobileToggle) {
            this.mobileToggle.setAttribute('aria-label', 'Toggle navigation menu');
            this.mobileToggle.setAttribute('aria-expanded', 'false');
            this.mobileToggle.setAttribute('aria-controls', 'nav-menu');
        }
        
        if (this.navMenu) {
            this.navMenu.setAttribute('id', 'nav-menu');
        }
        
        // Update ARIA states on menu toggle
        document.addEventListener('mobileMenuOpen', () => {
            if (this.mobileToggle) {
                this.mobileToggle.setAttribute('aria-expanded', 'true');
            }
        });
        
        document.addEventListener('mobileMenuClose', () => {
            if (this.mobileToggle) {
                this.mobileToggle.setAttribute('aria-expanded', 'false');
            }
        });
        
        // Handle keyboard navigation
        this.setupKeyboardNavigation();
    }
    
    /**
     * Setup keyboard navigation
     */
    setupKeyboardNavigation() {
        this.navLinks.forEach((link, index) => {
            link.addEventListener('keydown', (e) => {
                switch (e.key) {
                    case 'ArrowDown':
                    case 'ArrowRight':
                        e.preventDefault();
                        const nextIndex = (index + 1) % this.navLinks.length;
                        this.navLinks[nextIndex].focus();
                        break;
                    
                    case 'ArrowUp':
                    case 'ArrowLeft':
                        e.preventDefault();
                        const prevIndex = (index - 1 + this.navLinks.length) % this.navLinks.length;
                        this.navLinks[prevIndex].focus();
                        break;
                    
                    case 'Home':
                        e.preventDefault();
                        this.navLinks[0].focus();
                        break;
                    
                    case 'End':
                        e.preventDefault();
                        this.navLinks[this.navLinks.length - 1].focus();
                        break;
                }
            });
        });
    }
    
    /**
     * Get current active navigation item
     * @returns {Element|null} Active navigation element
     */
    getActiveNavItem() {
        return document.querySelector('.nav-link.active');
    }
    
    /**
     * Check if mobile menu is open
     * @returns {boolean} Whether mobile menu is open
     */
    isMobileMenuOpen() {
        return this.isMenuOpen;
    }
}

/**
 * Breadcrumb navigation helper
 */
class BreadcrumbManager {
    constructor(container) {
        this.container = container;
        this.breadcrumbs = [];
    }
    
    /**
     * Add breadcrumb item
     * @param {string} text - Breadcrumb text
     * @param {string} href - Breadcrumb link
     */
    add(text, href = null) {
        this.breadcrumbs.push({ text, href });
        this.render();
    }
    
    /**
     * Remove last breadcrumb
     */
    pop() {
        this.breadcrumbs.pop();
        this.render();
    }
    
    /**
     * Clear all breadcrumbs
     */
    clear() {
        this.breadcrumbs = [];
        this.render();
    }
    
    /**
     * Render breadcrumbs
     */
    render() {
        if (!this.container) return;
        
        this.container.innerHTML = this.breadcrumbs.map((crumb, index) => {
            const isLast = index === this.breadcrumbs.length - 1;
            
            if (crumb.href && !isLast) {
                return `<a href="${crumb.href}" class="breadcrumb-link">${crumb.text}</a>`;
            } else {
                return `<span class="breadcrumb-current">${crumb.text}</span>`;
            }
        }).join('<span class="breadcrumb-separator">/</span>');
    }
}

// Initialize navigation when DOM is ready
let navigationManager;

domReady(() => {
    navigationManager = new NavigationManager();
    
    // Listen for navigation events
    document.addEventListener('navigationClick', (e) => {
        console.log('Navigation clicked:', e.detail);
    });
});

// Export for global access
window.NavigationManager = NavigationManager;
window.BreadcrumbManager = BreadcrumbManager;
window.navigationManager = navigationManager;
