/* ==============================================
   EVENT DELEGATION UTILITIES
   ============================================== */

/**
 * Advanced event delegation system for efficient event handling
 * Provides centralized event management with pattern matching and middleware
 * 
 * Usage:
 * const eventManager = new EventManager();
 * 
 * // Delegate click events on buttons
 * eventManager.delegate('click', '.btn', (event, target) => {
 *   console.log('Button clicked:', target);
 * });
 * 
 * // Add middleware for logging
 * eventManager.use((event, target, next) => {
 *   console.log('Event:', event.type, 'Target:', target);
 *   next();
 * });
 */

class EventManager {
    constructor() {
        this.delegates = new Map();
        this.middleware = [];
        this.boundEvents = new Set();
        this.debounceTimers = new Map();
        this.throttleTimers = new Map();
        
        // Bind to document by default
        this.container = document;
    }
    
    /**
     * Set event container
     * @param {HTMLElement} element - Container element
     */
    setContainer(element) {
        this.container = element;
        this.rebindEvents();
    }
    
    /**
     * Add event delegation
     * @param {string} eventType - Event type (click, change, etc.)
     * @param {string} selector - CSS selector for target elements
     * @param {Function} handler - Event handler function
     * @param {Object} options - Event options
     * @returns {string} Delegation ID for removal
     */
    delegate(eventType, selector, handler, options = {}) {
        const delegateId = `${eventType}_${selector}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        if (!this.delegates.has(eventType)) {
            this.delegates.set(eventType, new Map());
        }
        
        this.delegates.get(eventType).set(delegateId, {
            selector,
            handler,
            options: {
                once: false,
                passive: false,
                capture: false,
                preventDefault: false,
                stopPropagation: false,
                debounce: 0,
                throttle: 0,
                ...options
            }
        });
        
        // Bind event listener if not already bound
        if (!this.boundEvents.has(eventType)) {
            this.bindEvent(eventType);
        }
        
        return delegateId;
    }
    
    /**
     * Remove event delegation
     * @param {string} delegateId - Delegation ID
     * @returns {boolean} Success status
     */
    undelegate(delegateId) {
        for (const [eventType, delegates] of this.delegates.entries()) {
            if (delegates.has(delegateId)) {
                delegates.delete(delegateId);
                
                // Remove event listener if no more delegates
                if (delegates.size === 0) {
                    this.unbindEvent(eventType);
                }
                
                return true;
            }
        }
        return false;
    }
    
    /**
     * Remove all delegations for event type
     * @param {string} eventType - Event type
     */
    undelegateAll(eventType) {
        if (this.delegates.has(eventType)) {
            this.delegates.get(eventType).clear();
            this.unbindEvent(eventType);
        }
    }
    
    /**
     * Clear all delegations
     */
    clear() {
        for (const eventType of this.boundEvents) {
            this.unbindEvent(eventType);
        }
        this.delegates.clear();
        this.middleware = [];
        this.debounceTimers.clear();
        this.throttleTimers.clear();
    }
    
    /**
     * Add middleware
     * @param {Function} middleware - Middleware function
     */
    use(middleware) {
        this.middleware.push(middleware);
    }
    
    /**
     * Bind event to container
     * @param {string} eventType - Event type
     */
    bindEvent(eventType) {
        const handler = this.createEventHandler(eventType);
        this.container.addEventListener(eventType, handler, { capture: true });
        this.boundEvents.add(eventType);
    }
    
    /**
     * Unbind event from container
     * @param {string} eventType - Event type
     */
    unbindEvent(eventType) {
        // Note: We can't easily remove the specific handler without storing it
        // In production, you might want to store handlers for proper cleanup
        this.boundEvents.delete(eventType);
    }
    
    /**
     * Rebind all events (useful when container changes)
     */
    rebindEvents() {
        const eventTypes = Array.from(this.boundEvents);
        this.boundEvents.clear();
        
        eventTypes.forEach(eventType => {
            this.bindEvent(eventType);
        });
    }
    
    /**
     * Create event handler for delegation
     * @param {string} eventType - Event type
     * @returns {Function} Event handler
     */
    createEventHandler(eventType) {
        return (event) => {
            const delegates = this.delegates.get(eventType);
            if (!delegates) return;
            
            // Find matching targets
            const targets = [];
            let currentElement = event.target;
            
            while (currentElement && currentElement !== this.container) {
                for (const [delegateId, delegate] of delegates.entries()) {
                    if (currentElement.matches && currentElement.matches(delegate.selector)) {
                        targets.push({ element: currentElement, delegate, delegateId });
                    }
                }
                currentElement = currentElement.parentElement;
            }
            
            // Process targets (innermost first)
            for (const { element, delegate, delegateId } of targets) {
                const shouldContinue = this.processDelegate(event, element, delegate, delegateId);
                if (!shouldContinue) break;
            }
        };
    }
    
    /**
     * Process individual delegate
     * @param {Event} event - DOM event
     * @param {HTMLElement} target - Target element
     * @param {Object} delegate - Delegate configuration
     * @param {string} delegateId - Delegate ID
     * @returns {boolean} Should continue processing
     */
    processDelegate(event, target, delegate, delegateId) {
        const { handler, options } = delegate;
        
        // Apply event options
        if (options.preventDefault) {
            event.preventDefault();
        }
        
        if (options.stopPropagation) {
            event.stopPropagation();
        }
        
        // Create wrapper function for debounce/throttle
        const executeHandler = () => {
            try {
                // Run middleware
                let middlewareIndex = 0;
                const next = () => {
                    if (middlewareIndex < this.middleware.length) {
                        const middleware = this.middleware[middlewareIndex++];
                        middleware(event, target, next);
                    } else {
                        // Execute actual handler
                        handler(event, target);
                    }
                };
                
                next();
                
                // Remove delegation if 'once' option is set
                if (options.once) {
                    this.undelegate(delegateId);
                }
                
            } catch (error) {
                console.error('Error in event handler:', error);
            }
        };
        
        // Apply debounce/throttle
        if (options.debounce > 0) {
            this.debounceHandler(delegateId, executeHandler, options.debounce);
        } else if (options.throttle > 0) {
            this.throttleHandler(delegateId, executeHandler, options.throttle);
        } else {
            executeHandler();
        }
        
        return !options.stopPropagation;
    }
    
    /**
     * Debounce handler execution
     * @param {string} key - Unique key for timer
     * @param {Function} handler - Handler function
     * @param {number} delay - Debounce delay in ms
     */
    debounceHandler(key, handler, delay) {
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
        }
        
        const timerId = setTimeout(() => {
            handler();
            this.debounceTimers.delete(key);
        }, delay);
        
        this.debounceTimers.set(key, timerId);
    }
    
    /**
     * Throttle handler execution
     * @param {string} key - Unique key for timer
     * @param {Function} handler - Handler function
     * @param {number} delay - Throttle delay in ms
     */
    throttleHandler(key, handler, delay) {
        if (this.throttleTimers.has(key)) {
            return; // Already throttled
        }
        
        handler();
        
        const timerId = setTimeout(() => {
            this.throttleTimers.delete(key);
        }, delay);
        
        this.throttleTimers.set(key, timerId);
    }
    
    /**
     * Trigger synthetic event
     * @param {string} eventType - Event type
     * @param {HTMLElement} target - Target element
     * @param {Object} eventData - Additional event data
     */
    trigger(eventType, target, eventData = {}) {
        const event = new CustomEvent(eventType, {
            bubbles: true,
            cancelable: true,
            detail: eventData
        });
        
        // Copy properties to event object
        Object.assign(event, eventData);
        
        target.dispatchEvent(event);
    }
    
    /**
     * Get delegation statistics
     * @returns {Object} Statistics
     */
    getStats() {
        const stats = {
            totalDelegates: 0,
            eventTypes: [],
            selectors: new Set()
        };
        
        for (const [eventType, delegates] of this.delegates.entries()) {
            stats.eventTypes.push(eventType);
            stats.totalDelegates += delegates.size;
            
            for (const delegate of delegates.values()) {
                stats.selectors.add(delegate.selector);
            }
        }
        
        return {
            ...stats,
            selectors: Array.from(stats.selectors)
        };
    }
}

/**
 * Form-specific event delegation utilities
 */
class FormEventManager extends EventManager {
    constructor() {
        super();
        this.setupFormEvents();
    }
    
    /**
     * Setup common form event delegations
     */
    setupFormEvents() {
        // Input validation on change
        this.delegate('input', 'input[data-validate], textarea[data-validate]', (event, target) => {
            this.handleInputValidation(event, target);
        }, { debounce: 300 });
        
        // Input validation on blur
        this.delegate('blur', 'input[data-validate], textarea[data-validate]', (event, target) => {
            this.handleInputValidation(event, target);
        });
        
        // Form submission
        this.delegate('submit', 'form[data-validate]', (event, target) => {
            this.handleFormSubmission(event, target);
        }, { preventDefault: true });
        
        // Toggle password visibility
        this.delegate('click', '[data-toggle="password"]', (event, target) => {
            this.togglePasswordVisibility(event, target);
        });
        
        // Auto-resize textareas
        this.delegate('input', 'textarea[data-auto-resize]', (event, target) => {
            this.autoResizeTextarea(event, target);
        });
        
        // File input preview
        this.delegate('change', 'input[type="file"][data-preview]', (event, target) => {
            this.handleFilePreview(event, target);
        });
        
        // Confirm dialogs
        this.delegate('click', '[data-confirm]', (event, target) => {
            this.handleConfirmDialog(event, target);
        });
    }
    
    /**
     * Handle input validation
     * @param {Event} event - Input event
     * @param {HTMLElement} target - Input element
     */
    handleInputValidation(event, target) {
        const validateRule = target.dataset.validate;
        if (!validateRule) return;
        
        // Simple validation (can be extended)
        const rules = validateRule.split('|');
        const errors = [];
        
        for (const rule of rules) {
            const [ruleName, param] = rule.split(':');
            
            switch (ruleName) {
                case 'required':
                    if (!target.value.trim()) {
                        errors.push('This field is required');
                    }
                    break;
                case 'minLength':
                    if (target.value.length < parseInt(param)) {
                        errors.push(`Must be at least ${param} characters`);
                    }
                    break;
                case 'maxLength':
                    if (target.value.length > parseInt(param)) {
                        errors.push(`Cannot exceed ${param} characters`);
                    }
                    break;
                case 'email':
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (target.value && !emailRegex.test(target.value)) {
                        errors.push('Please enter a valid email address');
                    }
                    break;
            }
        }
        
        // Update UI
        this.updateValidationUI(target, errors);
    }
    
    /**
     * Update validation UI
     * @param {HTMLElement} input - Input element
     * @param {Array} errors - Validation errors
     */
    updateValidationUI(input, errors) {
        const container = input.closest('.form-group') || input.parentElement;
        const errorElement = container.querySelector('.error-message');
        
        // Remove existing error message
        if (errorElement) {
            errorElement.remove();
        }
        
        // Update classes
        if (errors.length > 0) {
            input.classList.add('error');
            input.classList.remove('success');
            
            // Add error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = errors[0];
            container.appendChild(errorDiv);
        } else {
            input.classList.remove('error');
            input.classList.add('success');
        }
    }
    
    /**
     * Handle form submission
     * @param {Event} event - Submit event
     * @param {HTMLElement} form - Form element
     */
    handleFormSubmission(event, form) {
        const inputs = form.querySelectorAll('[data-validate]');
        let isValid = true;
        
        // Validate all inputs
        inputs.forEach(input => {
            const validateEvent = new Event('blur');
            input.dispatchEvent(validateEvent);
            
            if (input.classList.contains('error')) {
                isValid = false;
            }
        });
        
        if (isValid) {
            // Allow form submission or trigger custom event
            form.dispatchEvent(new CustomEvent('validSubmit', {
                detail: { formData: new FormData(form) }
            }));
        } else {
            // Focus first error field
            const firstError = form.querySelector('.error');
            if (firstError) {
                firstError.focus();
            }
        }
    }
    
    /**
     * Toggle password visibility
     * @param {Event} event - Click event
     * @param {HTMLElement} button - Toggle button
     */
    togglePasswordVisibility(event, button) {
        const targetSelector = button.dataset.target;
        const passwordField = targetSelector ? 
            document.querySelector(targetSelector) : 
            button.parentElement.querySelector('input[type="password"], input[type="text"]');
        
        if (!passwordField) return;
        
        const isPassword = passwordField.type === 'password';
        passwordField.type = isPassword ? 'text' : 'password';
        
        // Update button text/icon
        const showText = button.dataset.showText || 'Show';
        const hideText = button.dataset.hideText || 'Hide';
        
        if (button.tagName === 'BUTTON') {
            button.textContent = isPassword ? hideText : showText;
        }
        
        // Toggle classes
        button.classList.toggle('showing', isPassword);
    }
    
    /**
     * Auto-resize textarea
     * @param {Event} event - Input event
     * @param {HTMLElement} textarea - Textarea element
     */
    autoResizeTextarea(event, textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }
    
    /**
     * Handle file input preview
     * @param {Event} event - Change event
     * @param {HTMLElement} input - File input
     */
    handleFilePreview(event, input) {
        const previewSelector = input.dataset.preview;
        const previewContainer = document.querySelector(previewSelector);
        
        if (!previewContainer || !input.files.length) return;
        
        const file = input.files[0];
        
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewContainer.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 100%; height: auto;">`;
            };
            reader.readAsDataURL(file);
        } else {
            previewContainer.innerHTML = `<p>Selected file: ${file.name}</p>`;
        }
    }
    
    /**
     * Handle confirm dialog
     * @param {Event} event - Click event
     * @param {HTMLElement} button - Button element
     */
    handleConfirmDialog(event, button) {
        const message = button.dataset.confirm;
        
        if (!confirm(message)) {
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
        
        return true;
    }
}

/**
 * UI interaction utilities using event delegation
 */
class UIEventManager extends EventManager {
    constructor() {
        super();
        this.setupUIEvents();
    }
    
    /**
     * Setup common UI event delegations
     */
    setupUIEvents() {
        // Modal triggers
        this.delegate('click', '[data-toggle="modal"]', (event, target) => {
            this.handleModalToggle(event, target);
        });
        
        // Dropdown toggles
        this.delegate('click', '[data-toggle="dropdown"]', (event, target) => {
            this.handleDropdownToggle(event, target);
        });
        
        // Tab switching
        this.delegate('click', '[data-toggle="tab"]', (event, target) => {
            this.handleTabSwitch(event, target);
        });
        
        // Accordion toggles
        this.delegate('click', '[data-toggle="collapse"]', (event, target) => {
            this.handleAccordionToggle(event, target);
        });
        
        // Close buttons
        this.delegate('click', '[data-dismiss]', (event, target) => {
            this.handleDismiss(event, target);
        });
        
        // Tooltip triggers
        this.delegate('mouseenter', '[data-tooltip]', (event, target) => {
            this.showTooltip(event, target);
        });
        
        this.delegate('mouseleave', '[data-tooltip]', (event, target) => {
            this.hideTooltip(event, target);
        });
        
        // Copy to clipboard
        this.delegate('click', '[data-copy]', (event, target) => {
            this.copyToClipboard(event, target);
        });
    }
    
    /**
     * Handle modal toggle
     * @param {Event} event - Click event
     * @param {HTMLElement} trigger - Trigger element
     */
    handleModalToggle(event, trigger) {
        const targetSelector = trigger.dataset.target;
        const modal = document.querySelector(targetSelector);
        
        if (modal) {
            modal.classList.toggle('show');
            document.body.classList.toggle('modal-open', modal.classList.contains('show'));
        }
    }
    
    /**
     * Handle dropdown toggle
     * @param {Event} event - Click event
     * @param {HTMLElement} trigger - Trigger element
     */
    handleDropdownToggle(event, trigger) {
        event.stopPropagation();
        
        // Close other dropdowns
        document.querySelectorAll('.dropdown.show').forEach(dropdown => {
            if (!dropdown.contains(trigger)) {
                dropdown.classList.remove('show');
            }
        });
        
        // Toggle current dropdown
        const dropdown = trigger.closest('.dropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    }
    
    /**
     * Handle tab switching
     * @param {Event} event - Click event
     * @param {HTMLElement} tab - Tab element
     */
    handleTabSwitch(event, tab) {
        event.preventDefault();
        
        const targetSelector = tab.dataset.target;
        const tabContainer = tab.closest('[role="tablist"]');
        const contentContainer = document.querySelector(tab.dataset.container || '.tab-content');
        
        if (!targetSelector || !contentContainer) return;
        
        // Update tabs
        if (tabContainer) {
            tabContainer.querySelectorAll('[data-toggle="tab"]').forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
        }
        
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        
        // Update content
        contentContainer.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active', 'show');
        });
        
        const targetPane = document.querySelector(targetSelector);
        if (targetPane) {
            targetPane.classList.add('active', 'show');
        }
    }
    
    /**
     * Handle accordion toggle
     * @param {Event} event - Click event
     * @param {HTMLElement} trigger - Trigger element
     */
    handleAccordionToggle(event, trigger) {
        const targetSelector = trigger.dataset.target;
        const target = document.querySelector(targetSelector);
        
        if (!target) return;
        
        const isExpanded = target.classList.contains('show');
        
        // Close other panels in same accordion
        const accordion = trigger.closest('.accordion');
        if (accordion) {
            accordion.querySelectorAll('.collapse.show').forEach(panel => {
                if (panel !== target) {
                    panel.classList.remove('show');
                }
            });
        }
        
        // Toggle current panel
        target.classList.toggle('show', !isExpanded);
        trigger.setAttribute('aria-expanded', !isExpanded);
    }
    
    /**
     * Handle dismiss action
     * @param {Event} event - Click event
     * @param {HTMLElement} button - Dismiss button
     */
    handleDismiss(event, button) {
        const dismissType = button.dataset.dismiss;
        const target = button.closest(`.${dismissType}`) || 
                      document.querySelector(button.dataset.target);
        
        if (target) {
            target.classList.remove('show');
            
            if (dismissType === 'modal') {
                document.body.classList.remove('modal-open');
            }
        }
    }
    
    /**
     * Show tooltip
     * @param {Event} event - Mouse event
     * @param {HTMLElement} element - Element with tooltip
     */
    showTooltip(event, element) {
        const tooltipText = element.dataset.tooltip;
        if (!tooltipText) return;
        
        let tooltip = document.getElementById('global-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'global-tooltip';
            tooltip.className = 'tooltip';
            document.body.appendChild(tooltip);
        }
        
        tooltip.textContent = tooltipText;
        tooltip.style.display = 'block';
        tooltip.style.position = 'absolute';
        tooltip.style.zIndex = '9999';
        
        // Position tooltip
        const rect = element.getBoundingClientRect();
        tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 5}px`;
    }
    
    /**
     * Hide tooltip
     * @param {Event} event - Mouse event
     * @param {HTMLElement} element - Element with tooltip
     */
    hideTooltip(event, element) {
        const tooltip = document.getElementById('global-tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    }
    
    /**
     * Copy text to clipboard
     * @param {Event} event - Click event
     * @param {HTMLElement} button - Copy button
     */
    async copyToClipboard(event, button) {
        const textToCopy = button.dataset.copy || 
                          document.querySelector(button.dataset.target)?.textContent ||
                          button.textContent;
        
        if (!textToCopy) return;
        
        try {
            await navigator.clipboard.writeText(textToCopy);
            
            // Visual feedback
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            button.classList.add('copied');
            
            setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('copied');
            }, 2000);
            
        } catch (error) {
            console.error('Failed to copy text:', error);
        }
    }
}

// Global event managers
const globalEventManager = new EventManager();
const formEventManager = new FormEventManager();
const uiEventManager = new UIEventManager();

// Close dropdowns when clicking outside
document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown.show').forEach(dropdown => {
        dropdown.classList.remove('show');
    });
});

// Export for global access
window.EventManager = EventManager;
window.FormEventManager = FormEventManager;
window.UIEventManager = UIEventManager;
window.globalEventManager = globalEventManager;
window.formEventManager = formEventManager;
window.uiEventManager = uiEventManager;
