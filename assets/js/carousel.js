/* ==============================================
   CAROUSEL SYSTEM
   ============================================== */

class Carousel {
    constructor(container, options = {}) {
        this.container = container;
        this.track = container.querySelector('.carousel-track');
        this.prevBtn = container.querySelector('.carousel-prev');
        this.nextBtn = container.querySelector('.carousel-next');
        
        // Options
        this.options = {
            itemsPerView: options.itemsPerView || this.getItemsPerView(),
            gap: options.gap || 24,
            autoPlay: options.autoPlay || false,
            autoPlayInterval: options.autoPlayInterval || 5000,
            loop: options.loop !== false,
            touchEnabled: options.touchEnabled !== false,
            keyboardEnabled: options.keyboardEnabled !== false,
            ...options
        };
        
        // State
        this.currentIndex = 0;
        this.items = [];
        this.isAnimating = false;
        this.autoPlayTimer = null;
        this.startX = 0;
        this.currentX = 0;
        this.isDragging = false;
        
        this.init();
    }
    
    /**
     * Initialize carousel
     */
    init() {
        if (!this.track) return;
        
        this.items = Array.from(this.track.children);
        this.setupLayout();
        this.bindEvents();
        this.updateButtons();
        
        if (this.options.autoPlay) {
            this.startAutoPlay();
        }
        
        // Setup responsive behavior
        this.setupResponsive();
        
        dispatchCustomEvent('carouselInit', { carousel: this }, this.container);
    }
    
    /**
     * Get items per view based on screen size
     */
    getItemsPerView() {
        const deviceType = getDeviceType();
        switch (deviceType) {
            case 'mobile': return 1;
            case 'tablet': return 2;
            case 'desktop': return 3;
            default: return 3;
        }
    }
    
    /**
     * Setup carousel layout
     */
    setupLayout() {
        if (this.items.length === 0) return;
        
        // Clone items for infinite loop
        if (this.options.loop && this.items.length > this.options.itemsPerView) {
            this.cloneItems();
        }
        
        // Set initial position
        this.updatePosition(false);
    }
    
    /**
     * Clone items for infinite scrolling
     */
    cloneItems() {
        const itemsToClone = Math.min(this.options.itemsPerView, this.items.length);
        
        // Clone items at the beginning
        for (let i = this.items.length - itemsToClone; i < this.items.length; i++) {
            const clone = this.items[i].cloneNode(true);
            clone.classList.add('carousel-clone');
            this.track.insertBefore(clone, this.track.firstChild);
        }
        
        // Clone items at the end
        for (let i = 0; i < itemsToClone; i++) {
            const clone = this.items[i].cloneNode(true);
            clone.classList.add('carousel-clone');
            this.track.appendChild(clone);
        }
        
        // Update current index for cloned items
        this.currentIndex = itemsToClone;
        this.items = Array.from(this.track.children);
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Navigation buttons
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.prev());
        }
        
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.next());
        }
        
        // Touch/Mouse events
        if (this.options.touchEnabled) {
            this.bindTouchEvents();
        }
        
        // Keyboard navigation
        if (this.options.keyboardEnabled) {
            this.bindKeyboardEvents();
        }
        
        // Pause auto-play on hover
        if (this.options.autoPlay) {
            this.container.addEventListener('mouseenter', () => this.pauseAutoPlay());
            this.container.addEventListener('mouseleave', () => this.startAutoPlay());
        }
        
        // Visibility API for auto-play
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAutoPlay();
            } else if (this.options.autoPlay) {
                this.startAutoPlay();
            }
        });
    }
    
    /**
     * Bind touch and mouse events
     */
    bindTouchEvents() {
        // Mouse events
        this.track.addEventListener('mousedown', (e) => this.startDrag(e));
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.endDrag());
        
        // Touch events
        this.track.addEventListener('touchstart', (e) => this.startDrag(e), { passive: true });
        this.track.addEventListener('touchmove', (e) => this.drag(e), { passive: false });
        this.track.addEventListener('touchend', () => this.endDrag());
        
        // Prevent drag on links and buttons
        this.track.addEventListener('dragstart', (e) => e.preventDefault());
    }
    
    /**
     * Bind keyboard events
     */
    bindKeyboardEvents() {
        this.container.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.prev();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.next();
                    break;
                case 'Home':
                    e.preventDefault();
                    this.goTo(0);
                    break;
                case 'End':
                    e.preventDefault();
                    this.goTo(this.getMaxIndex());
                    break;
            }
        });
        
        // Make container focusable
        if (!this.container.hasAttribute('tabindex')) {
            this.container.setAttribute('tabindex', '0');
        }
    }
    
    /**
     * Start drag operation
     */
    startDrag(e) {
        if (this.isAnimating) return;
        
        this.isDragging = true;
        this.startX = this.getEventX(e);
        this.track.style.cursor = 'grabbing';
        
        // Disable text selection
        document.body.style.userSelect = 'none';
        
        this.pauseAutoPlay();
    }
    
    /**
     * Handle drag movement
     */
    drag(e) {
        if (!this.isDragging) return;
        
        e.preventDefault();
        this.currentX = this.getEventX(e);
        const deltaX = this.currentX - this.startX;
        
        // Apply drag resistance at boundaries
        const resistance = this.getDragResistance(deltaX);
        const adjustedDelta = deltaX * resistance;
        
        // Update track position
        const currentTransform = this.getCurrentTransform();
        this.track.style.transform = `translateX(${currentTransform + adjustedDelta}px)`;
    }
    
    /**
     * End drag operation
     */
    endDrag() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.track.style.cursor = '';
        document.body.style.userSelect = '';
        
        const deltaX = this.currentX - this.startX;
        const threshold = 50; // Minimum drag distance to trigger slide
        
        if (Math.abs(deltaX) > threshold) {
            if (deltaX > 0) {
                this.prev();
            } else {
                this.next();
            }
        } else {
            // Snap back to current position
            this.updatePosition();
        }
        
        this.startAutoPlay();
    }
    
    /**
     * Get X coordinate from event (mouse or touch)
     */
    getEventX(e) {
        return e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    }
    
    /**
     * Calculate drag resistance at boundaries
     */
    getDragResistance(deltaX) {
        const maxIndex = this.getMaxIndex();
        
        if ((this.currentIndex <= 0 && deltaX > 0) || 
            (this.currentIndex >= maxIndex && deltaX < 0)) {
            return 0.3; // Reduced movement at boundaries
        }
        
        return 1;
    }
    
    /**
     * Get current transform value
     */
    getCurrentTransform() {
        const style = getComputedStyle(this.track);
        const matrix = style.transform;
        
        if (matrix === 'none') return 0;
        
        const values = matrix.split('(')[1].split(')')[0].split(',');
        return parseFloat(values[4]) || 0;
    }
    
    /**
     * Navigate to previous item
     */
    prev() {
        if (this.isAnimating) return;
        
        const newIndex = this.currentIndex - 1;
        this.goTo(newIndex);
    }
    
    /**
     * Navigate to next item
     */
    next() {
        if (this.isAnimating) return;
        
        const newIndex = this.currentIndex + 1;
        this.goTo(newIndex);
    }
    
    /**
     * Go to specific index
     */
    goTo(index, smooth = true) {
        if (this.isAnimating) return;
        
        const maxIndex = this.getMaxIndex();
        
        // Handle loop boundaries
        if (this.options.loop) {
            if (index < 0) {
                this.currentIndex = maxIndex;
                this.updatePosition(false);
                requestAnimationFrame(() => this.goTo(maxIndex - 1));
                return;
            } else if (index > maxIndex) {
                this.currentIndex = 0;
                this.updatePosition(false);
                requestAnimationFrame(() => this.goTo(1));
                return;
            }
        } else {
            index = clamp(index, 0, maxIndex);
        }
        
        this.currentIndex = index;
        this.updatePosition(smooth);
        this.updateButtons();
        
        dispatchCustomEvent('carouselChange', { 
            index: this.currentIndex, 
            carousel: this 
        }, this.container);
    }
    
    /**
     * Update carousel position
     */
    updatePosition(smooth = true) {
        if (!this.track) return;
        
        this.isAnimating = smooth;
        
        const itemWidth = this.getItemWidth();
        const offset = -this.currentIndex * itemWidth;
        
        if (smooth && !prefersReducedMotion()) {
            this.track.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            this.track.style.transform = `translateX(${offset}px)`;
            
            setTimeout(() => {
                this.isAnimating = false;
                this.track.style.transition = '';
            }, 400);
        } else {
            this.track.style.transition = '';
            this.track.style.transform = `translateX(${offset}px)`;
            this.isAnimating = false;
        }
    }
    
    /**
     * Get item width including gap
     */
    getItemWidth() {
        if (this.items.length === 0) return 0;
        
        const containerWidth = this.container.offsetWidth;
        const gap = this.options.gap;
        const itemsPerView = this.options.itemsPerView;
        
        return (containerWidth + gap) / itemsPerView;
    }
    
    /**
     * Get maximum index
     */
    getMaxIndex() {
        const realItems = this.items.filter(item => !item.classList.contains('carousel-clone'));
        return Math.max(0, realItems.length - this.options.itemsPerView);
    }
    
    /**
     * Update navigation buttons state
     */
    updateButtons() {
        if (!this.options.loop) {
            if (this.prevBtn) {
                this.prevBtn.disabled = this.currentIndex <= 0;
                this.prevBtn.style.opacity = this.currentIndex <= 0 ? '0.5' : '1';
            }
            
            if (this.nextBtn) {
                const maxIndex = this.getMaxIndex();
                this.nextBtn.disabled = this.currentIndex >= maxIndex;
                this.nextBtn.style.opacity = this.currentIndex >= maxIndex ? '0.5' : '1';
            }
        }
    }
    
    /**
     * Start auto-play
     */
    startAutoPlay() {
        if (!this.options.autoPlay || this.autoPlayTimer) return;
        
        this.autoPlayTimer = setInterval(() => {
            this.next();
        }, this.options.autoPlayInterval);
    }
    
    /**
     * Pause auto-play
     */
    pauseAutoPlay() {
        if (this.autoPlayTimer) {
            clearInterval(this.autoPlayTimer);
            this.autoPlayTimer = null;
        }
    }
    
    /**
     * Setup responsive behavior
     */
    setupResponsive() {
        const handleResize = debounce(() => {
            const newItemsPerView = this.getItemsPerView();
            
            if (newItemsPerView !== this.options.itemsPerView) {
                this.options.itemsPerView = newItemsPerView;
                this.updatePosition(false);
                this.updateButtons();
            }
        }, 250);
        
        window.addEventListener('resize', handleResize);
    }
    
    /**
     * Destroy carousel instance
     */
    destroy() {
        this.pauseAutoPlay();
        
        // Remove event listeners
        // (Note: In a real implementation, you'd store references to the bound functions)
        
        // Remove cloned items
        this.track.querySelectorAll('.carousel-clone').forEach(clone => {
            clone.remove();
        });
        
        // Reset styles
        this.track.style.transform = '';
        this.track.style.transition = '';
        
        dispatchCustomEvent('carouselDestroy', { carousel: this }, this.container);
    }
}

/**
 * Initialize all carousels on the page
 */
function initCarousels() {
    const carousels = document.querySelectorAll('.games-carousel');
    const instances = [];
    
    carousels.forEach(container => {
        const carousel = new Carousel(container, {
            autoPlay: true,
            autoPlayInterval: 6000,
            loop: true,
            touchEnabled: true,
            keyboardEnabled: true
        });
        
        instances.push(carousel);
    });
    
    return instances;
}

// Initialize carousels when DOM is ready
domReady(() => {
    window.carouselInstances = initCarousels();
});

// Export Carousel class
window.Carousel = Carousel;
