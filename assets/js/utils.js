/* ==============================================
   UTILITY FUNCTIONS
   ============================================== */

/**
 * Debounce function to limit the rate of function execution
 * @param {Function} func - The function to debounce
 * @param {number} wait - The delay in milliseconds
 * @returns {Function} - The debounced function
 */
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

/**
 * Throttle function to limit function calls to once per specified time period
 * @param {Function} func - The function to throttle
 * @param {number} limit - The time limit in milliseconds
 * @returns {Function} - The throttled function
 */
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

/**
 * Check if element is in viewport
 * @param {Element} element - The DOM element to check
 * @param {number} threshold - The threshold percentage (0-1)
 * @returns {boolean} - Whether element is in viewport
 */
function isInViewport(element, threshold = 0.1) {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    
    const vertInView = (rect.top <= windowHeight * (1 - threshold)) && ((rect.top + rect.height) >= windowHeight * threshold);
    const horInView = (rect.left <= windowWidth * (1 - threshold)) && ((rect.left + rect.width) >= windowWidth * threshold);
    
    return vertInView && horInView;
}

/**
 * Animate number counter from 0 to target
 * @param {Element} element - The element containing the number
 * @param {number} target - The target number
 * @param {number} duration - Animation duration in milliseconds
 * @param {Function} callback - Optional callback function
 */
function animateNumber(element, target, duration = 2000, callback = null) {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = formatNumber(target);
            clearInterval(timer);
            if (callback) callback();
        } else {
            element.textContent = formatNumber(Math.floor(start));
        }
    }, 16);
}

/**
 * Format number with appropriate suffixes (K, M, B)
 * @param {number} num - The number to format
 * @returns {string} - The formatted number string
 */
function formatNumber(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + 'B';
    } else if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    } else {
        return num.toString();
    }
}

/**
 * Create ripple effect on button click
 * @param {Event} event - The click event
 * @param {Element} element - The button element
 */
function createRippleEffect(event, element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.classList.add('ripple');
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    element.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

/**
 * Generate random particles for background effect
 * @param {Element} container - The container element
 * @param {number} count - Number of particles to create
 */
function createParticles(container, count = 50) {
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 10 + 's';
        particle.style.animationDuration = (Math.random() * 5 + 8) + 's';
        container.appendChild(particle);
    }
}

/**
 * Smooth scroll to element
 * @param {Element|string} target - The target element or selector
 * @param {number} offset - Offset from top in pixels
 */
function smoothScrollTo(target, offset = 0) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!element) return;
    
    const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;
    
    window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
    });
}

/**
 * Get device type based on viewport width
 * @returns {string} - Device type: 'mobile', 'tablet', or 'desktop'
 */
function getDeviceType() {
    const width = window.innerWidth;
    if (width <= 767) return 'mobile';
    if (width <= 1023) return 'tablet';
    return 'desktop';
}

/**
 * Check if user prefers reduced motion
 * @returns {boolean} - Whether user prefers reduced motion
 */
function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Local storage helper functions
 */
const storage = {
    /**
     * Set item in localStorage with JSON serialization
     * @param {string} key - The storage key
     * @param {*} value - The value to store
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn('Failed to save to localStorage:', e);
        }
    },
    
    /**
     * Get item from localStorage with JSON parsing
     * @param {string} key - The storage key
     * @param {*} defaultValue - Default value if key doesn't exist
     * @returns {*} - The stored value or default
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.warn('Failed to read from localStorage:', e);
            return defaultValue;
        }
    },
    
    /**
     * Remove item from localStorage
     * @param {string} key - The storage key
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn('Failed to remove from localStorage:', e);
        }
    }
};

/**
 * Cookie helper functions
 */
const cookies = {
    /**
     * Set cookie
     * @param {string} name - Cookie name
     * @param {string} value - Cookie value
     * @param {number} days - Days until expiration
     */
    set(name, value, days = 30) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
    },
    
    /**
     * Get cookie
     * @param {string} name - Cookie name
     * @returns {string|null} - Cookie value or null
     */
    get(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    },
    
    /**
     * Delete cookie
     * @param {string} name - Cookie name
     */
    delete(name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    }
};

/**
 * Event emitter class for custom events
 */
class EventEmitter {
    constructor() {
        this.events = {};
    }
    
    /**
     * Add event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }
    
    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    off(event, callback) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
    
    /**
     * Emit event
     * @param {string} event - Event name
     * @param {*} data - Data to pass to listeners
     */
    emit(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(callback => callback(data));
    }
}

/**
 * DOM ready helper
 * @param {Function} callback - Function to execute when DOM is ready
 */
function domReady(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        callback();
    }
}

/**
 * Add multiple event listeners to element
 * @param {Element} element - The DOM element
 * @param {Array} events - Array of event names
 * @param {Function} handler - Event handler function
 */
function addMultipleEventListeners(element, events, handler) {
    events.forEach(event => {
        element.addEventListener(event, handler);
    });
}

/**
 * Create and dispatch custom event
 * @param {string} eventName - Event name
 * @param {*} detail - Event detail data
 * @param {Element} target - Target element (defaults to document)
 */
function dispatchCustomEvent(eventName, detail = null, target = document) {
    const event = new CustomEvent(eventName, {
        detail,
        bubbles: true,
        cancelable: true
    });
    target.dispatchEvent(event);
}

/**
 * Wait for a specified time
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} - Promise that resolves after specified time
 */
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Clamp number between min and max values
 * @param {number} num - Number to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Clamped number
 */
function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
}

/**
 * Linear interpolation between two values
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} progress - Progress (0-1)
 * @returns {number} - Interpolated value
 */
function lerp(start, end, progress) {
    return start + (end - start) * progress;
}

/**
 * Random number between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Random number
 */
function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Generate unique ID
 * @returns {string} - Unique identifier
 */
function generateId() {
    return 'id-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
}

// Export utilities for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        debounce,
        throttle,
        isInViewport,
        animateNumber,
        formatNumber,
        createRippleEffect,
        createParticles,
        smoothScrollTo,
        getDeviceType,
        prefersReducedMotion,
        storage,
        cookies,
        EventEmitter,
        domReady,
        addMultipleEventListeners,
        dispatchCustomEvent,
        wait,
        clamp,
        lerp,
        randomBetween,
        generateId
    };
}
