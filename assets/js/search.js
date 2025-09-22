/* ==============================================
   SEARCH SYSTEM
   ============================================== */

class SearchManager {
    constructor() {
        this.searchInput = null;
        this.searchButton = null;
        this.searchResults = null;
        this.searchOverlay = null;
        this.searchData = [];
        this.currentQuery = '';
        this.isSearching = false;
        this.searchHistory = [];
        this.maxHistoryItems = 10;
        this.searchDelay = 300;
        this.minQueryLength = 2;
        
        this.init();
    }
    
    /**
     * Initialize search system
     */
    init() {
        this.cacheElements();
        this.loadSearchData();
        this.bindEvents();
        this.loadSearchHistory();
        this.setupKeyboardShortcuts();
    }
    
    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.searchInput = document.querySelector('.search-input');
        this.searchButton = document.querySelector('.search-btn');
        
        // Create search results overlay if it doesn't exist
        this.createSearchOverlay();
    }
    
    /**
     * Create search results overlay
     */
    createSearchOverlay() {
        // Check if overlay already exists
        this.searchOverlay = document.getElementById('search-overlay');
        
        if (!this.searchOverlay) {
            this.searchOverlay = document.createElement('div');
            this.searchOverlay.id = 'search-overlay';
            this.searchOverlay.className = 'search-overlay';
            this.searchOverlay.innerHTML = `
                <div class="search-overlay-content">
                    <div class="search-overlay-header">
                        <div class="search-overlay-input-wrapper">
                            <input type="text" class="search-overlay-input" placeholder="Search games, genres, developers...">
                            <button class="search-overlay-close" aria-label="Close search">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    <div class="search-overlay-body">
                        <div class="search-suggestions">
                            <h3>Popular Searches</h3>
                            <div class="suggestion-tags"></div>
                        </div>
                        <div class="search-results"></div>
                        <div class="search-history">
                            <h3>Recent Searches</h3>
                            <div class="history-items"></div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(this.searchOverlay);
            
            // Cache new elements
            this.searchResults = this.searchOverlay.querySelector('.search-results');
            this.overlayInput = this.searchOverlay.querySelector('.search-overlay-input');
            this.overlayClose = this.searchOverlay.querySelector('.search-overlay-close');
            this.searchSuggestions = this.searchOverlay.querySelector('.search-suggestions');
            this.searchHistoryContainer = this.searchOverlay.querySelector('.search-history');
            
            this.bindOverlayEvents();
        }
    }
    
    /**
     * Load sample search data
     */
    loadSearchData() {
        // In a real application, this would come from an API
        this.searchData = [
            {
                id: 1,
                title: 'Cyberpunk 2077',
                type: 'game',
                genre: 'Action RPG',
                developer: 'CD Projekt RED',
                year: 2020,
                rating: 9.1,
                image: 'https://via.placeholder.com/80x100/667eea/ffffff?text=C2077',
                tags: ['sci-fi', 'open-world', 'rpg', 'action']
            },
            {
                id: 2,
                title: 'The Witcher 3: Wild Hunt',
                type: 'game',
                genre: 'Open World RPG',
                developer: 'CD Projekt RED',
                year: 2015,
                rating: 9.8,
                image: 'https://via.placeholder.com/80x100/f093fb/ffffff?text=W3',
                tags: ['fantasy', 'open-world', 'rpg', 'adventure']
            },
            {
                id: 3,
                title: 'Elden Ring',
                type: 'game',
                genre: 'Action RPG',
                developer: 'FromSoftware',
                year: 2022,
                rating: 9.6,
                image: 'https://via.placeholder.com/80x100/4facfe/ffffff?text=ER',
                tags: ['souls-like', 'fantasy', 'difficult', 'open-world']
            },
            {
                id: 4,
                title: 'God of War',
                type: 'game',
                genre: 'Action Adventure',
                developer: 'Santa Monica Studio',
                year: 2018,
                rating: 9.4,
                image: 'https://via.placeholder.com/80x100/fbbf24/ffffff?text=GOW',
                tags: ['mythology', 'action', 'adventure', 'single-player']
            },
            {
                id: 5,
                title: 'Action',
                type: 'genre',
                count: 1247,
                description: 'Fast-paced games with combat and challenges'
            },
            {
                id: 6,
                title: 'RPG',
                type: 'genre',
                count: 892,
                description: 'Role-playing games with character progression'
            },
            {
                id: 7,
                title: 'CD Projekt RED',
                type: 'developer',
                gameCount: 12,
                description: 'Polish video game developer'
            }
        ];
    }
    
    /**
     * Bind search events
     */
    bindEvents() {
        if (this.searchInput) {
            // Input events for real-time search
            this.searchInput.addEventListener('input', debounce((e) => {
                this.handleSearch(e.target.value);
            }, this.searchDelay));
            
            // Focus event to show overlay
            this.searchInput.addEventListener('focus', () => {
                this.showSearchOverlay();
            });
            
            // Keyboard navigation
            this.searchInput.addEventListener('keydown', (e) => {
                this.handleKeyboardNavigation(e);
            });
        }
        
        if (this.searchButton) {
            this.searchButton.addEventListener('click', () => {
                this.executeSearch();
            });
        }
    }
    
    /**
     * Bind overlay events
     */
    bindOverlayEvents() {
        // Overlay input events
        this.overlayInput.addEventListener('input', debounce((e) => {
            this.handleSearch(e.target.value);
        }, this.searchDelay));
        
        this.overlayInput.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });
        
        // Close button
        this.overlayClose.addEventListener('click', () => {
            this.hideSearchOverlay();
        });
        
        // Close on overlay click
        this.searchOverlay.addEventListener('click', (e) => {
            if (e.target === this.searchOverlay) {
                this.hideSearchOverlay();
            }
        });
        
        // Prevent propagation on content click
        const overlayContent = this.searchOverlay.querySelector('.search-overlay-content');
        overlayContent.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K to open search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.showSearchOverlay();
            }
            
            // Escape to close search
            if (e.key === 'Escape') {
                this.hideSearchOverlay();
            }
        });
    }
    
    /**
     * Handle search input
     * @param {string} query - Search query
     */
    handleSearch(query) {
        this.currentQuery = query.trim();
        
        if (this.currentQuery.length < this.minQueryLength) {
            this.showDefaultContent();
            return;
        }
        
        this.isSearching = true;
        this.showSearchResults(this.performSearch(this.currentQuery));
    }
    
    /**
     * Perform search on data
     * @param {string} query - Search query
     * @returns {Array} Search results
     */
    performSearch(query) {
        const searchTerms = query.toLowerCase().split(' ');
        
        return this.searchData.filter(item => {
            const searchableText = [
                item.title,
                item.type,
                item.genre,
                item.developer,
                item.description,
                ...(item.tags || [])
            ].join(' ').toLowerCase();
            
            return searchTerms.every(term => searchableText.includes(term));
        }).sort((a, b) => {
            // Sort by relevance (exact title matches first)
            const aTitle = a.title.toLowerCase();
            const bTitle = b.title.toLowerCase();
            const queryLower = query.toLowerCase();
            
            if (aTitle.includes(queryLower) && !bTitle.includes(queryLower)) return -1;
            if (!aTitle.includes(queryLower) && bTitle.includes(queryLower)) return 1;
            
            return 0;
        });
    }
    
    /**
     * Show search results
     * @param {Array} results - Search results
     */
    showSearchResults(results) {
        if (!this.searchResults) return;
        
        this.hideDefaultContent();
        
        if (results.length === 0) {
            this.searchResults.innerHTML = `
                <div class="search-no-results">
                    <i class="fas fa-search"></i>
                    <h3>No results found</h3>
                    <p>Try adjusting your search terms or browse by category.</p>
                </div>
            `;
        } else {
            const resultsHTML = results.map(item => this.createResultItem(item)).join('');
            this.searchResults.innerHTML = `
                <div class="search-results-header">
                    <h3>Search Results (${results.length})</h3>
                </div>
                <div class="search-results-list">
                    ${resultsHTML}
                </div>
            `;
        }
        
        this.searchResults.style.display = 'block';
        this.bindResultEvents();
    }
    
    /**
     * Create result item HTML
     * @param {Object} item - Result item data
     * @returns {string} HTML string
     */
    createResultItem(item) {
        switch (item.type) {
            case 'game':
                return `
                    <div class="search-result-item game-result" data-id="${item.id}" data-type="${item.type}">
                        <div class="result-image">
                            <img src="${item.image}" alt="${item.title}">
                        </div>
                        <div class="result-content">
                            <h4 class="result-title">${this.highlightQuery(item.title)}</h4>
                            <p class="result-meta">${item.genre} • ${item.developer} • ${item.year}</p>
                            <div class="result-rating">
                                <i class="fas fa-star"></i>
                                <span>${item.rating}</span>
                            </div>
                        </div>
                        <div class="result-actions">
                            <button class="result-action" title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                `;
            
            case 'genre':
                return `
                    <div class="search-result-item genre-result" data-id="${item.id}" data-type="${item.type}">
                        <div class="result-icon">
                            <i class="fas fa-th-large"></i>
                        </div>
                        <div class="result-content">
                            <h4 class="result-title">${this.highlightQuery(item.title)}</h4>
                            <p class="result-meta">${item.count} games</p>
                            <p class="result-description">${item.description}</p>
                        </div>
                    </div>
                `;
            
            case 'developer':
                return `
                    <div class="search-result-item developer-result" data-id="${item.id}" data-type="${item.type}">
                        <div class="result-icon">
                            <i class="fas fa-building"></i>
                        </div>
                        <div class="result-content">
                            <h4 class="result-title">${this.highlightQuery(item.title)}</h4>
                            <p class="result-meta">${item.gameCount} games</p>
                            <p class="result-description">${item.description}</p>
                        </div>
                    </div>
                `;
            
            default:
                return '';
        }
    }
    
    /**
     * Highlight search query in text
     * @param {string} text - Text to highlight
     * @returns {string} Text with highlighted query
     */
    highlightQuery(text) {
        if (!this.currentQuery) return text;
        
        const regex = new RegExp(`(${this.currentQuery})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
    
    /**
     * Bind result item events
     */
    bindResultEvents() {
        const resultItems = this.searchResults.querySelectorAll('.search-result-item');
        
        resultItems.forEach(item => {
            item.addEventListener('click', () => {
                const id = item.getAttribute('data-id');
                const type = item.getAttribute('data-type');
                this.handleResultClick(id, type);
            });
        });
    }
    
    /**
     * Handle result item click
     * @param {string} id - Item ID
     * @param {string} type - Item type
     */
    handleResultClick(id, type) {
        const item = this.searchData.find(i => i.id == id && i.type === type);
        
        if (item) {
            // Add to search history
            this.addToHistory(item.title);
            
            // Dispatch event
            dispatchCustomEvent('searchResultClick', {
                item: item,
                query: this.currentQuery
            });
            
            // Hide overlay
            this.hideSearchOverlay();
            
            console.log('Search result clicked:', item);
        }
    }
    
    /**
     * Execute search
     */
    executeSearch() {
        const query = this.searchInput ? this.searchInput.value : '';
        
        if (query.trim().length >= this.minQueryLength) {
            this.addToHistory(query);
            
            dispatchCustomEvent('searchExecute', {
                query: query,
                results: this.performSearch(query)
            });
            
            console.log('Search executed:', query);
        }
    }
    
    /**
     * Show search overlay
     */
    showSearchOverlay() {
        if (!this.searchOverlay) return;
        
        this.searchOverlay.classList.add('active');
        document.body.classList.add('search-overlay-open');
        
        // Focus overlay input
        setTimeout(() => {
            if (this.overlayInput) {
                this.overlayInput.focus();
                // Copy value from main search input
                if (this.searchInput && this.searchInput.value) {
                    this.overlayInput.value = this.searchInput.value;
                }
            }
        }, 100);
        
        this.showDefaultContent();
        
        dispatchCustomEvent('searchOverlayOpen');
    }
    
    /**
     * Hide search overlay
     */
    hideSearchOverlay() {
        if (!this.searchOverlay) return;
        
        this.searchOverlay.classList.remove('active');
        document.body.classList.remove('search-overlay-open');
        
        // Clear search state
        this.currentQuery = '';
        this.isSearching = false;
        
        dispatchCustomEvent('searchOverlayClose');
    }
    
    /**
     * Show default content (suggestions and history)
     */
    showDefaultContent() {
        if (this.searchSuggestions) {
            this.searchSuggestions.style.display = 'block';
            this.renderSuggestions();
        }
        
        if (this.searchHistoryContainer) {
            this.searchHistoryContainer.style.display = 'block';
            this.renderSearchHistory();
        }
        
        if (this.searchResults) {
            this.searchResults.style.display = 'none';
        }
    }
    
    /**
     * Hide default content
     */
    hideDefaultContent() {
        if (this.searchSuggestions) {
            this.searchSuggestions.style.display = 'none';
        }
        
        if (this.searchHistoryContainer) {
            this.searchHistoryContainer.style.display = 'none';
        }
    }
    
    /**
     * Render search suggestions
     */
    renderSuggestions() {
        const suggestions = ['Action Games', 'RPG', 'Indie Games', 'Multiplayer', 'Single Player'];
        const suggestionTags = this.searchSuggestions.querySelector('.suggestion-tags');
        
        if (suggestionTags) {
            suggestionTags.innerHTML = suggestions.map(suggestion => 
                `<button class="suggestion-tag" data-suggestion="${suggestion}">${suggestion}</button>`
            ).join('');
            
            // Bind suggestion clicks
            suggestionTags.addEventListener('click', (e) => {
                const tag = e.target.closest('.suggestion-tag');
                if (tag) {
                    const suggestion = tag.getAttribute('data-suggestion');
                    this.overlayInput.value = suggestion;
                    this.handleSearch(suggestion);
                }
            });
        }
    }
    
    /**
     * Add item to search history
     * @param {string} query - Search query
     */
    addToHistory(query) {
        if (!query || this.searchHistory.includes(query)) return;
        
        this.searchHistory.unshift(query);
        
        if (this.searchHistory.length > this.maxHistoryItems) {
            this.searchHistory = this.searchHistory.slice(0, this.maxHistoryItems);
        }
        
        this.saveSearchHistory();
    }
    
    /**
     * Render search history
     */
    renderSearchHistory() {
        const historyItems = this.searchHistoryContainer.querySelector('.history-items');
        
        if (historyItems && this.searchHistory.length > 0) {
            historyItems.innerHTML = this.searchHistory.map(item => 
                `<button class="history-item" data-query="${item}">
                    <i class="fas fa-clock"></i>
                    <span>${item}</span>
                    <button class="history-remove" data-query="${item}" title="Remove">
                        <i class="fas fa-times"></i>
                    </button>
                </button>`
            ).join('');
            
            // Bind history item clicks
            historyItems.addEventListener('click', (e) => {
                const historyItem = e.target.closest('.history-item');
                const removeBtn = e.target.closest('.history-remove');
                
                if (removeBtn) {
                    e.stopPropagation();
                    const query = removeBtn.getAttribute('data-query');
                    this.removeFromHistory(query);
                } else if (historyItem) {
                    const query = historyItem.getAttribute('data-query');
                    this.overlayInput.value = query;
                    this.handleSearch(query);
                }
            });
        } else if (historyItems) {
            historyItems.innerHTML = '<p class="no-history">No recent searches</p>';
        }
    }
    
    /**
     * Remove item from search history
     * @param {string} query - Query to remove
     */
    removeFromHistory(query) {
        this.searchHistory = this.searchHistory.filter(item => item !== query);
        this.saveSearchHistory();
        this.renderSearchHistory();
    }
    
    /**
     * Save search history to localStorage
     */
    saveSearchHistory() {
        storage.set('searchHistory', this.searchHistory);
    }
    
    /**
     * Load search history from localStorage
     */
    loadSearchHistory() {
        this.searchHistory = storage.get('searchHistory', []);
    }
    
    /**
     * Handle keyboard navigation
     * @param {Event} e - Keyboard event
     */
    handleKeyboardNavigation(e) {
        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                this.executeSearch();
                break;
            
            case 'Escape':
                e.preventDefault();
                this.hideSearchOverlay();
                break;
        }
    }
    
    /**
     * Clear search history
     */
    clearHistory() {
        this.searchHistory = [];
        this.saveSearchHistory();
        this.renderSearchHistory();
    }
    
    /**
     * Get search suggestions based on query
     * @param {string} query - Search query
     * @returns {Array} Suggestions array
     */
    getSuggestions(query) {
        // In a real app, this would call an API
        return this.searchData
            .filter(item => item.title.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 5)
            .map(item => item.title);
    }
}

// CSS for search overlay (injected if not present)
const searchOverlayCSS = `
.search-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    z-index: 9999;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
}

.search-overlay.active {
    opacity: 1;
    visibility: visible;
}

.search-overlay-content {
    max-width: 800px;
    margin: 80px auto 0;
    background: var(--color-surface);
    border-radius: var(--radius-2xl);
    box-shadow: var(--shadow-2xl);
    max-height: calc(100vh - 160px);
    overflow: hidden;
}

.search-overlay-header {
    padding: var(--spacing-6);
    border-bottom: 1px solid var(--color-border);
}

.search-overlay-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
}

.search-overlay-input {
    flex: 1;
    padding: var(--spacing-4);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    font-size: var(--font-size-lg);
}

.search-overlay-close {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-full);
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    color: var(--color-text-secondary);
}

.search-overlay-body {
    padding: var(--spacing-6);
    max-height: 60vh;
    overflow-y: auto;
}

.search-result-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    padding: var(--spacing-4);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: background var(--transition-fast);
}

.search-result-item:hover {
    background: var(--color-bg-secondary);
}

.suggestion-tag, .history-item {
    padding: var(--spacing-2) var(--spacing-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--transition-fast);
    margin: var(--spacing-1);
}

.suggestion-tag:hover, .history-item:hover {
    background: var(--color-primary);
    color: var(--color-white);
    border-color: var(--color-primary);
}

mark {
    background: var(--color-primary);
    color: var(--color-white);
    padding: 2px 4px;
    border-radius: 3px;
}
`;

// Inject CSS if not present
if (!document.querySelector('#search-overlay-styles')) {
    const style = document.createElement('style');
    style.id = 'search-overlay-styles';
    style.textContent = searchOverlayCSS;
    document.head.appendChild(style);
}

// Initialize search manager when DOM is ready
let searchManager;

domReady(() => {
    searchManager = new SearchManager();
    
    // Listen for search events
    document.addEventListener('searchResultClick', (e) => {
        console.log('Search result clicked:', e.detail);
    });
    
    document.addEventListener('searchExecute', (e) => {
        console.log('Search executed:', e.detail);
    });
});

// Export for global access
window.SearchManager = SearchManager;
window.searchManager = searchManager;
