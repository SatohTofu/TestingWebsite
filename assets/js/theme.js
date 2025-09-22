/* ==============================================
   THEME SYSTEM
   ============================================== */

class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.themeToggleBtn = null;
        this.prefersDark = false;
        
        this.init();
    }
    
    /**
     * Initialize theme system
     */
    init() {
        this.detectSystemPreference();
        this.loadSavedTheme();
        this.setupToggleButton();
        this.applyTheme();
        this.setupMediaQueryListener();
    }
    
    /**
     * Detect system theme preference
     */
    detectSystemPreference() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.prefersDark = true;
        }
    }
    
    /**
     * Load saved theme from localStorage
     */
    loadSavedTheme() {
        const savedTheme = storage.get('theme');
        
        if (savedTheme) {
            this.currentTheme = savedTheme;
        } else {
            // Use system preference if no saved theme
            this.currentTheme = this.prefersDark ? 'dark' : 'light';
        }
    }
    
    /**
     * Setup theme toggle button
     */
    setupToggleButton() {
        this.themeToggleBtn = document.querySelector('.theme-toggle');
        
        if (this.themeToggleBtn) {
            this.themeToggleBtn.addEventListener('click', () => {
                this.toggleTheme();
            });
            
            // Update button icon
            this.updateToggleIcon();
        }
    }
    
    /**
     * Apply current theme
     */
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        
        // Update meta theme-color for mobile browsers
        this.updateMetaThemeColor();
        
        // Dispatch theme change event
        dispatchCustomEvent('themeChanged', { 
            theme: this.currentTheme,
            isDark: this.currentTheme === 'dark'
        });
        
        console.log(`Theme applied: ${this.currentTheme}`);
    }
    
    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.saveTheme();
        this.applyTheme();
        this.updateToggleIcon();
        
        // Add transition effect
        this.addTransitionEffect();
    }
    
    /**
     * Set specific theme
     * @param {string} theme - Theme name ('light' or 'dark')
     */
    setTheme(theme) {
        if (theme !== 'light' && theme !== 'dark') {
            console.warn('Invalid theme:', theme);
            return;
        }
        
        this.currentTheme = theme;
        this.saveTheme();
        this.applyTheme();
        this.updateToggleIcon();
    }
    
    /**
     * Save theme to localStorage
     */
    saveTheme() {
        storage.set('theme', this.currentTheme);
    }
    
    /**
     * Update toggle button icon
     */
    updateToggleIcon() {
        if (!this.themeToggleBtn) return;
        
        const icon = this.themeToggleBtn.querySelector('i');
        if (icon) {
            // Remove all theme-related classes
            icon.classList.remove('fa-moon', 'fa-sun');
            
            // Add appropriate icon
            const iconClass = this.currentTheme === 'light' ? 'fa-moon' : 'fa-sun';
            icon.classList.add(iconClass);
        }
        
        // Update button title
        const title = this.currentTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode';
        this.themeToggleBtn.setAttribute('title', title);
        this.themeToggleBtn.setAttribute('aria-label', title);
    }
    
    /**
     * Update meta theme-color for mobile browsers
     */
    updateMetaThemeColor() {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.setAttribute('name', 'theme-color');
            document.head.appendChild(metaThemeColor);
        }
        
        const color = this.currentTheme === 'dark' ? '#0f0f23' : '#ffffff';
        metaThemeColor.setAttribute('content', color);
    }
    
    /**
     * Add smooth transition effect when switching themes
     */
    addTransitionEffect() {
        if (prefersReducedMotion()) return;
        
        document.documentElement.classList.add('theme-transition');
        
        setTimeout(() => {
            document.documentElement.classList.remove('theme-transition');
        }, 300);
    }
    
    /**
     * Setup media query listener for system theme changes
     */
    setupMediaQueryListener() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            const handleChange = (e) => {
                // Only auto-switch if user hasn't manually set a preference
                const savedTheme = storage.get('theme');
                if (!savedTheme) {
                    this.currentTheme = e.matches ? 'dark' : 'light';
                    this.applyTheme();
                    this.updateToggleIcon();
                }
            };
            
            // Modern browsers
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', handleChange);
            } else {
                // Fallback for older browsers
                mediaQuery.addListener(handleChange);
            }
        }
    }
    
    /**
     * Get current theme
     * @returns {string} Current theme name
     */
    getCurrentTheme() {
        return this.currentTheme;
    }
    
    /**
     * Check if current theme is dark
     * @returns {boolean} True if dark theme is active
     */
    isDarkTheme() {
        return this.currentTheme === 'dark';
    }
    
    /**
     * Get system preference
     * @returns {string} System preferred theme
     */
    getSystemPreference() {
        return this.prefersDark ? 'dark' : 'light';
    }
    
    /**
     * Reset to system preference
     */
    resetToSystemPreference() {
        storage.remove('theme');
        this.currentTheme = this.getSystemPreference();
        this.applyTheme();
        this.updateToggleIcon();
    }
}

/**
 * Color scheme utilities
 */
class ColorSchemeUtils {
    /**
     * Get CSS custom property value
     * @param {string} property - CSS custom property name
     * @returns {string} Property value
     */
    static getCSSCustomProperty(property) {
        return getComputedStyle(document.documentElement)
            .getPropertyValue(property)
            .trim();
    }
    
    /**
     * Set CSS custom property
     * @param {string} property - CSS custom property name
     * @param {string} value - Property value
     */
    static setCSSCustomProperty(property, value) {
        document.documentElement.style.setProperty(property, value);
    }
    
    /**
     * Convert hex color to RGB
     * @param {string} hex - Hex color code
     * @returns {object} RGB object {r, g, b}
     */
    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    /**
     * Convert RGB to hex
     * @param {number} r - Red value (0-255)
     * @param {number} g - Green value (0-255)
     * @param {number} b - Blue value (0-255)
     * @returns {string} Hex color code
     */
    static rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    
    /**
     * Calculate relative luminance of a color
     * @param {string} color - Hex color code
     * @returns {number} Luminance value (0-1)
     */
    static getLuminance(color) {
        const rgb = this.hexToRgb(color);
        if (!rgb) return 0;
        
        const { r, g, b } = rgb;
        const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }
    
    /**
     * Calculate contrast ratio between two colors
     * @param {string} color1 - First hex color
     * @param {string} color2 - Second hex color
     * @returns {number} Contrast ratio
     */
    static getContrastRatio(color1, color2) {
        const lum1 = this.getLuminance(color1);
        const lum2 = this.getLuminance(color2);
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        
        return (brightest + 0.05) / (darkest + 0.05);
    }
    
    /**
     * Check if color meets WCAG accessibility standards
     * @param {string} foreground - Foreground color
     * @param {string} background - Background color
     * @param {string} level - WCAG level ('AA' or 'AAA')
     * @returns {boolean} Whether colors meet standards
     */
    static meetsWCAG(foreground, background, level = 'AA') {
        const ratio = this.getContrastRatio(foreground, background);
        const threshold = level === 'AAA' ? 7 : 4.5;
        return ratio >= threshold;
    }
}

// CSS for theme transition
const themeTransitionCSS = `
.theme-transition,
.theme-transition *,
.theme-transition *::before,
.theme-transition *::after {
    transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease !important;
}
`;

// Inject transition CSS
if (!document.querySelector('#theme-transition-styles')) {
    const style = document.createElement('style');
    style.id = 'theme-transition-styles';
    style.textContent = themeTransitionCSS;
    document.head.appendChild(style);
}

// Initialize theme manager when DOM is ready
let themeManager;

domReady(() => {
    themeManager = new ThemeManager();
    
    // Listen for theme change events
    document.addEventListener('themeChanged', (e) => {
        console.log('Theme changed to:', e.detail.theme);
        
        // Update other components that depend on theme
        if (window.carouselInstances) {
            window.carouselInstances.forEach(carousel => {
                // Update carousel styles if needed
            });
        }
    });
});

// Export for global access
window.ThemeManager = ThemeManager;
window.ColorSchemeUtils = ColorSchemeUtils;
window.themeManager = themeManager;
