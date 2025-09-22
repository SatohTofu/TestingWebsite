/* ==============================================
   ANIMATION SYSTEM
   ============================================== */

class AnimationManager {
    constructor() {
        this.observers = new Map();
        this.animations = new Map();
        this.init();
    }
    
    init() {
        this.setupScrollAnimations();
        this.setupCounterAnimations();
        this.setupParticleSystem();
        this.setupRippleEffects();
    }
    
    /**
     * Setup scroll-triggered animations using Intersection Observer
     */
    setupScrollAnimations() {
        if ('IntersectionObserver' in window && !prefersReducedMotion()) {
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -10% 0px'
            };
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animateElement(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, observerOptions);
            
            // Observe all scroll-animate elements
            document.querySelectorAll('.scroll-animate').forEach(el => {
                observer.observe(el);
            });
            
            // Observe stagger children containers
            document.querySelectorAll('.stagger-children').forEach(el => {
                observer.observe(el);
            });
            
            this.observers.set('scroll', observer);
        } else {
            // Fallback: animate all elements immediately
            document.querySelectorAll('.scroll-animate, .stagger-children').forEach(el => {
                this.animateElement(el);
            });
        }
    }
    
    /**
     * Animate element with appropriate class
     * @param {Element} element - Element to animate
     */
    animateElement(element) {
        if (element.classList.contains('stagger-children')) {
            element.classList.add('animate');
        } else {
            element.classList.add('animate');
        }
        
        // Dispatch custom event
        dispatchCustomEvent('elementAnimated', { element }, element);
    }
    
    /**
     * Setup counter animations for statistics
     */
    setupCounterAnimations() {
        const counters = document.querySelectorAll('.stat-number[data-target]');
        
        if (counters.length > 0 && 'IntersectionObserver' in window) {
            const counterObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const element = entry.target;
                        const target = parseInt(element.getAttribute('data-target'));
                        
                        if (!element.classList.contains('counted')) {
                            element.classList.add('counted');
                            this.animateCounter(element, target);
                            counterObserver.unobserve(element);
                        }
                    }
                });
            }, { threshold: 0.5 });
            
            counters.forEach(counter => {
                counterObserver.observe(counter);
            });
            
            this.observers.set('counter', counterObserver);
        }
    }
    
    /**
     * Animate counter from 0 to target value
     * @param {Element} element - Counter element
     * @param {number} target - Target number
     */
    animateCounter(element, target) {
        let current = 0;
        const duration = 2000;
        const steps = 60;
        const increment = target / steps;
        const stepDuration = duration / steps;
        
        const animate = () => {
            current += increment;
            if (current >= target) {
                element.textContent = formatNumber(target);
            } else {
                element.textContent = formatNumber(Math.floor(current));
                setTimeout(animate, stepDuration);
            }
        };
        
        animate();
    }
    
    /**
     * Setup particle system for hero section
     */
    setupParticleSystem() {
        const particleContainer = document.querySelector('.hero-particles');
        if (particleContainer && !prefersReducedMotion()) {
            this.createParticleSystem(particleContainer);
        }
    }
    
    /**
     * Create floating particle system
     * @param {Element} container - Particle container
     */
    createParticleSystem(container) {
        const particleCount = getDeviceType() === 'mobile' ? 20 : 50;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            
            // Random positioning and animation
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 10 + 's';
            particle.style.animationDuration = (Math.random() * 10 + 15) + 's';
            
            // Random particle color
            const colors = ['#667eea', '#f093fb', '#4facfe', '#fbbf24'];
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            
            container.appendChild(particle);
        }
    }
    
    /**
     * Setup ripple effects for buttons
     */
    setupRippleEffects() {
        document.addEventListener('click', (e) => {
            const button = e.target.closest('.btn, .action-btn, .carousel-btn');
            if (button && !prefersReducedMotion()) {
                this.createRipple(e, button);
            }
        });
    }
    
    /**
     * Create ripple effect on element
     * @param {Event} event - Click event
     * @param {Element} element - Target element
     */
    createRipple(event, element) {
        const existingRipple = element.querySelector('.ripple');
        if (existingRipple) {
            existingRipple.remove();
        }
        
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.classList.add('ripple-effect');
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
        `;
        
        // Ensure button has relative positioning
        const computedStyle = getComputedStyle(element);
        if (computedStyle.position === 'static') {
            element.style.position = 'relative';
        }
        
        element.appendChild(ripple);
        
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.remove();
            }
        }, 600);
    }
    
    /**
     * Floating animation for hero cards
     */
    setupFloatingCards() {
        const heroCards = document.querySelectorAll('.hero-card');
        
        if (heroCards.length > 0 && !prefersReducedMotion()) {
            heroCards.forEach((card, index) => {
                this.animateFloat(card, index);
            });
        }
    }
    
    /**
     * Apply floating animation to element
     * @param {Element} element - Element to animate
     * @param {number} index - Index for stagger effect
     */
    animateFloat(element, index) {
        const baseDelay = index * 2; // Stagger by 2 seconds
        const duration = 6 + Math.random() * 2; // Random duration between 6-8s
        
        element.style.animation = `float ${duration}s ease-in-out infinite ${baseDelay}s`;
    }
    
    /**
     * Parallax effect for scroll
     */
    setupParallax() {
        if (prefersReducedMotion()) return;
        
        const parallaxElements = document.querySelectorAll('[data-parallax]');
        
        if (parallaxElements.length > 0) {
            const handleScroll = throttle(() => {
                const scrollY = window.pageYOffset;
                
                parallaxElements.forEach(element => {
                    const speed = parseFloat(element.getAttribute('data-parallax')) || 0.5;
                    const yPos = -(scrollY * speed);
                    element.style.transform = `translateY(${yPos}px)`;
                });
            }, 16);
            
            window.addEventListener('scroll', handleScroll);
        }
    }
    
    /**
     * Typewriter effect for text
     * @param {Element} element - Text element
     * @param {string} text - Text to type
     * @param {number} speed - Typing speed in ms
     */
    typeWriter(element, text, speed = 50) {
        if (prefersReducedMotion()) {
            element.textContent = text;
            return Promise.resolve();
        }
        
        return new Promise(resolve => {
            let i = 0;
            element.textContent = '';
            
            const timer = setInterval(() => {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                } else {
                    clearInterval(timer);
                    resolve();
                }
            }, speed);
        });
    }
    
    /**
     * Fade transition between elements
     * @param {Element} elementOut - Element to fade out
     * @param {Element} elementIn - Element to fade in
     * @param {number} duration - Transition duration in ms
     */
    fadeTransition(elementOut, elementIn, duration = 300) {
        return new Promise(resolve => {
            if (prefersReducedMotion()) {
                elementOut.style.display = 'none';
                elementIn.style.display = 'block';
                resolve();
                return;
            }
            
            elementOut.style.transition = `opacity ${duration}ms ease-out`;
            elementOut.style.opacity = '0';
            
            setTimeout(() => {
                elementOut.style.display = 'none';
                elementIn.style.display = 'block';
                elementIn.style.opacity = '0';
                elementIn.style.transition = `opacity ${duration}ms ease-in`;
                
                requestAnimationFrame(() => {
                    elementIn.style.opacity = '1';
                });
                
                setTimeout(resolve, duration);
            }, duration);
        });
    }
    
    /**
     * Slide animation
     * @param {Element} element - Element to slide
     * @param {string} direction - Direction: 'up', 'down', 'left', 'right'
     * @param {number} distance - Distance in pixels
     * @param {number} duration - Animation duration in ms
     */
    slide(element, direction = 'up', distance = 50, duration = 300) {
        if (prefersReducedMotion()) return Promise.resolve();
        
        return new Promise(resolve => {
            const transforms = {
                up: `translateY(-${distance}px)`,
                down: `translateY(${distance}px)`,
                left: `translateX(-${distance}px)`,
                right: `translateX(${distance}px)`
            };
            
            element.style.transition = `transform ${duration}ms ease-out`;
            element.style.transform = transforms[direction];
            
            setTimeout(() => {
                element.style.transform = 'translateY(0)';
                setTimeout(resolve, duration);
            }, 50);
        });
    }
    
    /**
     * Cleanup animations and observers
     */
    destroy() {
        this.observers.forEach(observer => {
            observer.disconnect();
        });
        this.observers.clear();
        this.animations.clear();
    }
}

// CSS for ripple animation
const rippleCSS = `
@keyframes ripple {
    to {
        transform: scale(4);
        opacity: 0;
    }
}
`;

// Inject CSS if not already present
if (!document.querySelector('#ripple-styles')) {
    const style = document.createElement('style');
    style.id = 'ripple-styles';
    style.textContent = rippleCSS;
    document.head.appendChild(style);
}

// Initialize animation manager when DOM is ready
let animationManager;

domReady(() => {
    animationManager = new AnimationManager();
    animationManager.setupFloatingCards();
    animationManager.setupParallax();
});

// Export for global access
window.AnimationManager = AnimationManager;
window.animationManager = animationManager;
