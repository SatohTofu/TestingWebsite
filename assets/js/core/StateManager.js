/* ==============================================
   CORE APPLICATION STATE MANAGER
   ============================================== */

/**
 * Centralized state management system for GameVault
 * Implements Observer pattern for reactive state updates
 * 
 * Usage:
 * const stateManager = new StateManager();
 * stateManager.subscribe('user', (newState, oldState) => {
 *   console.log('User state changed:', newState);
 * });
 * stateManager.setState('user', { name: 'John', level: 5 });
 */

class StateManager extends EventEmitter {
    constructor() {
        super();
        this.state = new Map();
        this.subscribers = new Map();
        this.history = [];
        this.maxHistorySize = 50;
        
        // Bind methods to maintain context
        this.setState = this.setState.bind(this);
        this.getState = this.getState.bind(this);
        this.subscribe = this.subscribe.bind(this);
        this.unsubscribe = this.unsubscribe.bind(this);
        
        this.init();
    }
    
    /**
     * Initialize state manager
     */
    init() {
        this.setupDefaultState();
        this.loadPersistedState();
        this.setupStorageListener();
        
        console.log('StateManager initialized with state:', this.getAllState());
    }
    
    /**
     * Setup default application state
     */
    setupDefaultState() {
        this.state.set('app', {
            isLoaded: false,
            theme: 'system',
            language: 'en',
            notifications: true,
            lastActivity: Date.now()
        });
        
        this.state.set('user', {
            id: null,
            username: null,
            email: null,
            avatar: null,
            preferences: {
                theme: 'system',
                language: 'en',
                notifications: true,
                privacy: 'public'
            },
            stats: {
                gamesPlayed: 0,
                reviewsWritten: 0,
                hoursPlayed: 0,
                achievements: 0
            }
        });
        
        this.state.set('games', {
            featured: [],
            popular: [],
            recent: [],
            favorites: [],
            library: [],
            currentGame: null,
            filters: {
                genre: 'all',
                platform: 'all',
                rating: 'all',
                year: 'all'
            },
            sortBy: 'popularity',
            viewMode: 'grid'
        });
        
        this.state.set('ui', {
            sidebar: {
                isOpen: false,
                activeSection: 'home'
            },
            modal: {
                isOpen: false,
                type: null,
                data: null
            },
            notifications: {
                queue: [],
                unreadCount: 0
            },
            search: {
                query: '',
                results: [],
                isActive: false,
                history: []
            },
            loading: {
                global: false,
                partial: new Set()
            }
        });
        
        this.state.set('network', {
            isOnline: navigator.onLine,
            lastSyncTime: null,
            pendingRequests: new Set(),
            retryQueue: []
        });
    }
    
    /**
     * Set state for a specific key
     * @param {string} key - State key
     * @param {*} value - New state value
     * @param {boolean} persist - Whether to persist to localStorage
     * @param {boolean} merge - Whether to merge with existing state
     */
    setState(key, value, persist = false, merge = true) {
        const oldState = this.state.get(key);
        let newState;
        
        if (merge && oldState && typeof oldState === 'object' && typeof value === 'object') {
            newState = this.deepMerge(oldState, value);
        } else {
            newState = value;
        }
        
        // Add to history
        this.addToHistory(key, oldState, newState);
        
        // Update state
        this.state.set(key, newState);
        
        // Persist if requested
        if (persist) {
            this.persistState(key, newState);
        }
        
        // Notify subscribers
        this.notifySubscribers(key, newState, oldState);
        
        // Emit global state change event
        this.emit('stateChange', {
            key,
            newState,
            oldState,
            timestamp: Date.now()
        });
        
        console.log(`State updated [${key}]:`, newState);
        
        return newState;
    }
    
    /**
     * Get state for a specific key
     * @param {string} key - State key
     * @param {*} defaultValue - Default value if key doesn't exist
     * @returns {*} State value
     */
    getState(key, defaultValue = null) {
        return this.state.has(key) ? this.state.get(key) : defaultValue;
    }
    
    /**
     * Get all state
     * @returns {Object} All state as object
     */
    getAllState() {
        const stateObj = {};
        for (const [key, value] of this.state.entries()) {
            stateObj[key] = value;
        }
        return stateObj;
    }
    
    /**
     * Subscribe to state changes
     * @param {string} key - State key to watch
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(key, callback) {
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());
        }
        
        this.subscribers.get(key).add(callback);
        
        // Return unsubscribe function
        return () => this.unsubscribe(key, callback);
    }
    
    /**
     * Unsubscribe from state changes
     * @param {string} key - State key
     * @param {Function} callback - Callback function to remove
     */
    unsubscribe(key, callback) {
        if (this.subscribers.has(key)) {
            this.subscribers.get(key).delete(callback);
            
            // Clean up empty sets
            if (this.subscribers.get(key).size === 0) {
                this.subscribers.delete(key);
            }
        }
    }
    
    /**
     * Clear all subscribers for a key
     * @param {string} key - State key
     */
    clearSubscribers(key) {
        this.subscribers.delete(key);
    }
    
    /**
     * Notify subscribers of state changes
     * @param {string} key - State key
     * @param {*} newState - New state value
     * @param {*} oldState - Previous state value
     */
    notifySubscribers(key, newState, oldState) {
        if (this.subscribers.has(key)) {
            const callbacks = this.subscribers.get(key);
            callbacks.forEach(callback => {
                try {
                    callback(newState, oldState, key);
                } catch (error) {
                    console.error(`Error in state subscriber for ${key}:`, error);
                }
            });
        }
    }
    
    /**
     * Deep merge two objects
     * @param {Object} target - Target object
     * @param {Object} source - Source object
     * @returns {Object} Merged object
     */
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (
                    typeof source[key] === 'object' && 
                    source[key] !== null && 
                    !Array.isArray(source[key]) &&
                    typeof target[key] === 'object' &&
                    target[key] !== null &&
                    !Array.isArray(target[key])
                ) {
                    result[key] = this.deepMerge(target[key], source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }
        
        return result;
    }
    
    /**
     * Add state change to history
     * @param {string} key - State key
     * @param {*} oldState - Previous state
     * @param {*} newState - New state
     */
    addToHistory(key, oldState, newState) {
        this.history.push({
            key,
            oldState: JSON.parse(JSON.stringify(oldState || {})),
            newState: JSON.parse(JSON.stringify(newState)),
            timestamp: Date.now()
        });
        
        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history = this.history.slice(-this.maxHistorySize);
        }
    }
    
    /**
     * Get state change history
     * @param {string} key - Optional key to filter by
     * @returns {Array} History entries
     */
    getHistory(key = null) {
        if (key) {
            return this.history.filter(entry => entry.key === key);
        }
        return [...this.history];
    }
    
    /**
     * Undo last state change for a key
     * @param {string} key - State key
     * @returns {boolean} Success status
     */
    undo(key) {
        const keyHistory = this.getHistory(key);
        if (keyHistory.length < 2) {
            return false;
        }
        
        const previousEntry = keyHistory[keyHistory.length - 2];
        this.setState(key, previousEntry.newState, false, false);
        
        return true;
    }
    
    /**
     * Reset state to default
     * @param {string} key - Optional key to reset, or reset all if not provided
     */
    reset(key = null) {
        if (key) {
            this.state.delete(key);
            this.setupDefaultState();
            this.notifySubscribers(key, this.state.get(key), null);
        } else {
            this.state.clear();
            this.setupDefaultState();
            this.emit('stateReset', { timestamp: Date.now() });
        }
    }
    
    /**
     * Persist state to localStorage
     * @param {string} key - State key
     * @param {*} value - State value
     */
    persistState(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(`gameVault_state_${key}`, serialized);
        } catch (error) {
            console.error(`Failed to persist state for ${key}:`, error);
        }
    }
    
    /**
     * Load persisted state from localStorage
     */
    loadPersistedState() {
        const persistentKeys = ['user', 'app'];
        
        persistentKeys.forEach(key => {
            try {
                const stored = localStorage.getItem(`gameVault_state_${key}`);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    this.setState(key, parsed, false, true);
                }
            } catch (error) {
                console.error(`Failed to load persisted state for ${key}:`, error);
            }
        });
    }
    
    /**
     * Setup storage event listener for cross-tab synchronization
     */
    setupStorageListener() {
        window.addEventListener('storage', (event) => {
            if (event.key && event.key.startsWith('gameVault_state_')) {
                const key = event.key.replace('gameVault_state_', '');
                try {
                    const newValue = event.newValue ? JSON.parse(event.newValue) : null;
                    if (newValue) {
                        this.setState(key, newValue, false, false);
                        this.emit('stateSync', { key, value: newValue });
                    }
                } catch (error) {
                    console.error(`Failed to sync state for ${key}:`, error);
                }
            }
        });
    }
    
    /**
     * Batch state updates
     * @param {Object} updates - Object with key-value pairs to update
     * @param {boolean} persist - Whether to persist updates
     */
    batchUpdate(updates, persist = false) {
        const changes = [];
        
        Object.entries(updates).forEach(([key, value]) => {
            const oldState = this.state.get(key);
            const newState = typeof oldState === 'object' && typeof value === 'object' 
                ? this.deepMerge(oldState, value) 
                : value;
            
            this.state.set(key, newState);
            changes.push({ key, newState, oldState });
            
            if (persist) {
                this.persistState(key, newState);
            }
        });
        
        // Notify all subscribers after batch update
        changes.forEach(({ key, newState, oldState }) => {
            this.notifySubscribers(key, newState, oldState);
        });
        
        this.emit('batchUpdate', { changes, timestamp: Date.now() });
    }
    
    /**
     * Create a computed state that derives from other states
     * @param {string} key - Computed state key
     * @param {Array} dependencies - Keys this computed state depends on
     * @param {Function} computeFn - Function to compute the value
     */
    createComputed(key, dependencies, computeFn) {
        const compute = () => {
            const values = dependencies.map(dep => this.getState(dep));
            const computed = computeFn(...values);
            this.setState(key, computed, false, false);
        };
        
        // Initial computation
        compute();
        
        // Subscribe to dependencies
        dependencies.forEach(dep => {
            this.subscribe(dep, compute);
        });
    }
    
    /**
     * Get debug information
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        return {
            stateKeys: Array.from(this.state.keys()),
            subscriberCount: Array.from(this.subscribers.entries()).reduce((total, [key, callbacks]) => {
                return total + callbacks.size;
            }, 0),
            historyLength: this.history.length,
            memoryUsage: this.calculateMemoryUsage()
        };
    }
    
    /**
     * Calculate approximate memory usage
     * @returns {number} Memory usage in bytes (approximate)
     */
    calculateMemoryUsage() {
        try {
            const stateStr = JSON.stringify(this.getAllState());
            const historyStr = JSON.stringify(this.history);
            return (stateStr.length + historyStr.length) * 2; // Rough estimate (UTF-16)
        } catch (error) {
            return 0;
        }
    }
    
    /**
     * Cleanup resources
     */
    destroy() {
        this.state.clear();
        this.subscribers.clear();
        this.history = [];
        this.removeAllListeners();
        
        console.log('StateManager destroyed');
    }
}

// Export for global access
window.StateManager = StateManager;
