/* ==============================================
   API SERVICE LAYER
   ============================================== */

/**
 * Centralized API service for handling all HTTP requests
 * Implements caching, retry logic, and error handling
 * 
 * Usage:
 * const apiService = new ApiService('https://api.gamevault.com');
 * const games = await apiService.get('/games', { cache: true });
 * const newGame = await apiService.post('/games', gameData);
 */

class ApiService extends EventEmitter {
    constructor(baseURL = '', options = {}) {
        super();
        
        this.baseURL = baseURL.replace(/\/$/, ''); // Remove trailing slash
        this.defaultOptions = {
            timeout: 10000,
            retries: 3,
            retryDelay: 1000,
            cache: false,
            cacheExpiry: 5 * 60 * 1000, // 5 minutes
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            ...options
        };
        
        // Request/response interceptors
        this.requestInterceptors = [];
        this.responseInterceptors = [];
        
        // Cache and request tracking
        this.cache = new Map();
        this.pendingRequests = new Map();
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize API service
     */
    init() {
        this.setupDefaultInterceptors();
        this.setupNetworkMonitoring();
        
        console.log('ApiService initialized with baseURL:', this.baseURL);
    }
    
    /**
     * Setup default request/response interceptors
     */
    setupDefaultInterceptors() {
        // Default request interceptor
        this.addRequestInterceptor((config) => {
            // Add timestamp to prevent caching
            if (config.method === 'GET' && !config.cache) {
                const separator = config.url.includes('?') ? '&' : '?';
                config.url += `${separator}_t=${Date.now()}`;
            }
            
            // Add authentication header if available
            const token = this.getAuthToken();
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
            
            return config;
        });
        
        // Default response interceptor
        this.addResponseInterceptor(
            (response) => {
                // Success response
                this.emit('response', { response, success: true });
                return response;
            },
            (error) => {
                // Error response
                this.emit('response', { error, success: false });
                return Promise.reject(error);
            }
        );
    }
    
    /**
     * Setup network monitoring
     */
    setupNetworkMonitoring() {
        window.addEventListener('online', () => {
            this.emit('networkStatusChange', { online: true });
        });
        
        window.addEventListener('offline', () => {
            this.emit('networkStatusChange', { online: false });
        });
    }
    
    /**
     * Add request interceptor
     * @param {Function} interceptor - Request interceptor function
     */
    addRequestInterceptor(interceptor) {
        this.requestInterceptors.push(interceptor);
    }
    
    /**
     * Add response interceptor
     * @param {Function} successInterceptor - Success response interceptor
     * @param {Function} errorInterceptor - Error response interceptor
     */
    addResponseInterceptor(successInterceptor, errorInterceptor) {
        this.responseInterceptors.push({
            success: successInterceptor,
            error: errorInterceptor
        });
    }
    
    /**
     * Apply request interceptors
     * @param {Object} config - Request configuration
     * @returns {Object} Modified configuration
     */
    applyRequestInterceptors(config) {
        return this.requestInterceptors.reduce((cfg, interceptor) => {
            return interceptor(cfg) || cfg;
        }, config);
    }
    
    /**
     * Apply response interceptors
     * @param {*} response - Response or error
     * @param {boolean} isError - Whether this is an error response
     * @returns {*} Modified response
     */
    applyResponseInterceptors(response, isError = false) {
        return this.responseInterceptors.reduce((res, interceptor) => {
            try {
                if (isError && interceptor.error) {
                    return interceptor.error(res) || res;
                } else if (!isError && interceptor.success) {
                    return interceptor.success(res) || res;
                }
                return res;
            } catch (error) {
                console.error('Response interceptor error:', error);
                return res;
            }
        }, response);
    }
    
    /**
     * Make HTTP request
     * @param {string} url - Request URL
     * @param {Object} options - Request options
     * @returns {Promise} Request promise
     */
    async request(url, options = {}) {
        const config = {
            url: this.buildURL(url),
            method: 'GET',
            ...this.defaultOptions,
            ...options,
            headers: {
                ...this.defaultOptions.headers,
                ...options.headers
            }
        };
        
        // Apply request interceptors
        const finalConfig = this.applyRequestInterceptors(config);
        
        // Check cache first
        if (finalConfig.cache && finalConfig.method === 'GET') {
            const cached = this.getFromCache(finalConfig.url);
            if (cached) {
                this.emit('cacheHit', { url: finalConfig.url });
                return cached;
            }
        }
        
        // Check for pending identical requests
        const requestKey = this.getRequestKey(finalConfig);
        if (this.pendingRequests.has(requestKey)) {
            return this.pendingRequests.get(requestKey);
        }
        
        // Create request promise
        const requestPromise = this.executeRequest(finalConfig);
        
        // Store pending request
        this.pendingRequests.set(requestKey, requestPromise);
        
        try {
            const response = await requestPromise;
            
            // Cache successful GET requests
            if (finalConfig.cache && finalConfig.method === 'GET' && response.ok) {
                this.setCache(finalConfig.url, response.data, finalConfig.cacheExpiry);
            }
            
            return response;
        } finally {
            // Clean up pending request
            this.pendingRequests.delete(requestKey);
        }
    }
    
    /**
     * Execute HTTP request with retry logic
     * @param {Object} config - Request configuration
     * @returns {Promise} Request promise
     */
    async executeRequest(config) {
        let lastError;
        
        for (let attempt = 0; attempt <= config.retries; attempt++) {
            try {
                this.emit('requestStart', { config, attempt });
                
                const response = await this.fetchWithTimeout(config);
                const processedResponse = await this.processResponse(response, config);
                
                this.emit('requestSuccess', { config, response: processedResponse, attempt });
                
                return this.applyResponseInterceptors(processedResponse);
            } catch (error) {
                lastError = error;
                
                this.emit('requestError', { config, error, attempt });
                
                // Don't retry on client errors (4xx) except 408, 429
                if (error.status >= 400 && error.status < 500 && 
                    error.status !== 408 && error.status !== 429) {
                    break;
                }
                
                // Don't retry on last attempt
                if (attempt === config.retries) {
                    break;
                }
                
                // Wait before retry
                await this.delay(config.retryDelay * Math.pow(2, attempt));
            }
        }
        
        const finalError = this.createErrorResponse(lastError, config);
        return this.applyResponseInterceptors(finalError, true);
    }
    
    /**
     * Fetch with timeout support
     * @param {Object} config - Request configuration
     * @returns {Promise} Fetch promise
     */
    fetchWithTimeout(config) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);
        
        const fetchOptions = {
            method: config.method,
            headers: config.headers,
            signal: controller.signal
        };
        
        // Add body for non-GET requests
        if (config.method !== 'GET' && config.data) {
            if (config.headers['Content-Type'] === 'application/json') {
                fetchOptions.body = JSON.stringify(config.data);
            } else {
                fetchOptions.body = config.data;
            }
        }
        
        return fetch(config.url, fetchOptions)
            .finally(() => clearTimeout(timeoutId));
    }
    
    /**
     * Process fetch response
     * @param {Response} response - Fetch response
     * @param {Object} config - Request configuration
     * @returns {Object} Processed response
     */
    async processResponse(response, config) {
        const result = {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            headers: this.responseHeadersToObject(response.headers),
            url: response.url,
            config
        };
        
        // Parse response body
        try {
            const contentType = response.headers.get('content-type') || '';
            
            if (contentType.includes('application/json')) {
                result.data = await response.json();
            } else if (contentType.includes('text/')) {
                result.data = await response.text();
            } else {
                result.data = await response.blob();
            }
        } catch (error) {
            result.data = null;
            result.parseError = error;
        }
        
        // Throw error for non-2xx responses
        if (!response.ok) {
            const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
            error.response = result;
            error.status = response.status;
            throw error;
        }
        
        return result;
    }
    
    /**
     * Create error response object
     * @param {Error} error - Original error
     * @param {Object} config - Request configuration
     * @returns {Object} Error response
     */
    createErrorResponse(error, config) {
        return {
            ok: false,
            status: error.status || 0,
            statusText: error.message || 'Network Error',
            data: null,
            error: error,
            config
        };
    }
    
    /**
     * Convert response headers to object
     * @param {Headers} headers - Response headers
     * @returns {Object} Headers object
     */
    responseHeadersToObject(headers) {
        const obj = {};
        for (const [key, value] of headers.entries()) {
            obj[key] = value;
        }
        return obj;
    }
    
    /**
     * Build full URL
     * @param {string} url - Relative or absolute URL
     * @returns {string} Full URL
     */
    buildURL(url) {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        
        const cleanUrl = url.startsWith('/') ? url : `/${url}`;
        return `${this.baseURL}${cleanUrl}`;
    }
    
    /**
     * Generate request key for deduplication
     * @param {Object} config - Request configuration
     * @returns {string} Request key
     */
    getRequestKey(config) {
        const { method, url, data } = config;
        const dataHash = data ? JSON.stringify(data) : '';
        return `${method}:${url}:${dataHash}`;
    }
    
    /**
     * Get data from cache
     * @param {string} key - Cache key
     * @returns {*} Cached data or null
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && cached.expiry > Date.now()) {
            return cached.data;
        }
        
        // Remove expired cache
        if (cached) {
            this.cache.delete(key);
        }
        
        return null;
    }
    
    /**
     * Set data in cache
     * @param {string} key - Cache key
     * @param {*} data - Data to cache
     * @param {number} expiry - Cache expiry in milliseconds
     */
    setCache(key, data, expiry) {
        this.cache.set(key, {
            data,
            expiry: Date.now() + expiry,
            timestamp: Date.now()
        });
    }
    
    /**
     * Clear cache
     * @param {string} pattern - Optional pattern to match keys
     */
    clearCache(pattern = null) {
        if (pattern) {
            const regex = new RegExp(pattern);
            for (const key of this.cache.keys()) {
                if (regex.test(key)) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.clear();
        }
    }
    
    /**
     * Get authentication token
     * @returns {string|null} Auth token
     */
    getAuthToken() {
        return localStorage.getItem('gameVault_auth_token') || 
               sessionStorage.getItem('gameVault_auth_token');
    }
    
    /**
     * Set authentication token
     * @param {string} token - Auth token
     * @param {boolean} persistent - Whether to store in localStorage
     */
    setAuthToken(token, persistent = false) {
        if (persistent) {
            localStorage.setItem('gameVault_auth_token', token);
        } else {
            sessionStorage.setItem('gameVault_auth_token', token);
        }
    }
    
    /**
     * Remove authentication token
     */
    removeAuthToken() {
        localStorage.removeItem('gameVault_auth_token');
        sessionStorage.removeItem('gameVault_auth_token');
    }
    
    /**
     * Utility delay function
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Delay promise
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // HTTP method shortcuts
    
    /**
     * GET request
     * @param {string} url - Request URL
     * @param {Object} options - Request options
     * @returns {Promise} Request promise
     */
    get(url, options = {}) {
        return this.request(url, { ...options, method: 'GET' });
    }
    
    /**
     * POST request
     * @param {string} url - Request URL
     * @param {*} data - Request data
     * @param {Object} options - Request options
     * @returns {Promise} Request promise
     */
    post(url, data = null, options = {}) {
        return this.request(url, { ...options, method: 'POST', data });
    }
    
    /**
     * PUT request
     * @param {string} url - Request URL
     * @param {*} data - Request data
     * @param {Object} options - Request options
     * @returns {Promise} Request promise
     */
    put(url, data = null, options = {}) {
        return this.request(url, { ...options, method: 'PUT', data });
    }
    
    /**
     * PATCH request
     * @param {string} url - Request URL
     * @param {*} data - Request data
     * @param {Object} options - Request options
     * @returns {Promise} Request promise
     */
    patch(url, data = null, options = {}) {
        return this.request(url, { ...options, method: 'PATCH', data });
    }
    
    /**
     * DELETE request
     * @param {string} url - Request URL
     * @param {Object} options - Request options
     * @returns {Promise} Request promise
     */
    delete(url, options = {}) {
        return this.request(url, { ...options, method: 'DELETE' });
    }
    
    /**
     * Get service statistics
     * @returns {Object} Service statistics
     */
    getStats() {
        return {
            cacheSize: this.cache.size,
            pendingRequests: this.pendingRequests.size,
            interceptors: {
                request: this.requestInterceptors.length,
                response: this.responseInterceptors.length
            }
        };
    }
    
    /**
     * Cleanup resources
     */
    destroy() {
        this.cache.clear();
        this.pendingRequests.clear();
        this.requestInterceptors = [];
        this.responseInterceptors = [];
        this.removeAllListeners();
        
        console.log('ApiService destroyed');
    }
}

// Export for global access
window.ApiService = ApiService;
