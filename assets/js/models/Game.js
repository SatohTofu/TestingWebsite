/* ==============================================
   GAME MODEL
   ============================================== */

/**
 * Game entity class representing a video game
 * Handles game data, metadata, and user interactions
 * 
 * Usage:
 * const game = new Game({
 *   id: 1,
 *   title: 'The Legend of Zelda: Breath of the Wild',
 *   genre: ['Action', 'Adventure'],
 *   platform: ['Nintendo Switch', 'Wii U']
 * });
 * 
 * game.addRating(8.5);
 * console.log(game.getAverageRating());
 */

class Game {
    constructor(data = {}) {
        // Core properties
        this.id = data.id || null;
        this.title = data.title || '';
        this.slug = data.slug || this.generateSlug(data.title);
        this.description = data.description || '';
        this.shortDescription = data.shortDescription || '';
        
        // Game details
        this.developer = data.developer || '';
        this.publisher = data.publisher || '';
        this.genre = Array.isArray(data.genre) ? data.genre : [];
        this.tags = Array.isArray(data.tags) ? data.tags : [];
        this.platform = Array.isArray(data.platform) ? data.platform : [];
        
        // Release information
        this.releaseDate = data.releaseDate ? new Date(data.releaseDate) : null;
        this.earlyAccessDate = data.earlyAccessDate ? new Date(data.earlyAccessDate) : null;
        this.isEarlyAccess = data.isEarlyAccess || false;
        this.isReleased = data.isReleased || false;
        
        // Pricing
        this.price = {
            current: data.price?.current || 0,
            original: data.price?.original || 0,
            currency: data.price?.currency || 'USD',
            discount: data.price?.discount || 0,
            free: data.price?.free || false
        };
        
        // Content ratings
        this.ageRating = data.ageRating || null; // ESRB, PEGI, etc.
        this.contentWarnings = Array.isArray(data.contentWarnings) ? data.contentWarnings : [];
        
        // Media
        this.images = {
            cover: data.images?.cover || null,
            background: data.images?.background || null,
            screenshots: Array.isArray(data.images?.screenshots) ? data.images.screenshots : [],
            artwork: Array.isArray(data.images?.artwork) ? data.images.artwork : []
        };
        
        this.videos = {
            trailer: data.videos?.trailer || null,
            gameplay: Array.isArray(data.videos?.gameplay) ? data.videos.gameplay : []
        };
        
        // Technical specs
        this.systemRequirements = {
            minimum: data.systemRequirements?.minimum || {},
            recommended: data.systemRequirements?.recommended || {}
        };
        
        // Game statistics
        this.stats = {
            playersCount: data.stats?.playersCount || 0,
            averageRating: data.stats?.averageRating || 0,
            ratingsCount: data.stats?.ratingsCount || 0,
            reviewsCount: data.stats?.reviewsCount || 0,
            wishlistCount: data.stats?.wishlistCount || 0,
            downloadCount: data.stats?.downloadCount || 0,
            playtimeAverage: data.stats?.playtimeAverage || 0, // in minutes
            completionRate: data.stats?.completionRate || 0 // percentage
        };
        
        // User-specific data (when user is logged in)
        this.userStats = {
            owned: data.userStats?.owned || false,
            wishlisted: data.userStats?.wishlisted || false,
            favorited: data.userStats?.favorited || false,
            played: data.userStats?.played || false,
            completed: data.userStats?.completed || false,
            playtime: data.userStats?.playtime || 0, // in minutes
            rating: data.userStats?.rating || null,
            lastPlayed: data.userStats?.lastPlayed ? new Date(data.userStats.lastPlayed) : null,
            firstPlayed: data.userStats?.firstPlayed ? new Date(data.userStats.firstPlayed) : null,
            achievements: data.userStats?.achievements || []
        };
        
        // Metadata
        this.featured = data.featured || false;
        this.trending = data.trending || false;
        this.popular = data.popular || false;
        this.newRelease = data.newRelease || false;
        this.comingSoon = data.comingSoon || false;
        
        // DLC and expansions
        this.dlc = Array.isArray(data.dlc) ? data.dlc : [];
        this.expansions = Array.isArray(data.expansions) ? data.expansions : [];
        this.baseGame = data.baseGame || null; // If this is DLC
        
        // Multiplayer info
        this.multiplayer = {
            supported: data.multiplayer?.supported || false,
            online: data.multiplayer?.online || false,
            local: data.multiplayer?.local || false,
            coop: data.multiplayer?.coop || false,
            competitive: data.multiplayer?.competitive || false,
            maxPlayers: data.multiplayer?.maxPlayers || 1
        };
        
        // Accessibility features
        this.accessibility = {
            subtitles: data.accessibility?.subtitles || false,
            colorblindSupport: data.accessibility?.colorblindSupport || false,
            controllerSupport: data.accessibility?.controllerSupport || false,
            keyboardMouse: data.accessibility?.keyboardMouse || false,
            touchSupport: data.accessibility?.touchSupport || false
        };
        
        // Timestamps
        this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
        
        // Collections for related data
        this.reviews = [];
        this.ratings = [];
        this.achievements = [];
        
        // Validation errors
        this.errors = new Map();
        
        // Event listeners
        this.listeners = new Map();
        
        this.validate();
    }
    
    /**
     * Generate URL slug from title
     * @param {string} title - Game title
     * @returns {string} URL slug
     */
    generateSlug(title) {
        if (!title) return '';
        
        return title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single
            .trim('-'); // Remove leading/trailing hyphens
    }
    
    /**
     * Validate game data
     * @returns {boolean} Validation result
     */
    validate() {
        this.errors.clear();
        
        // Title validation
        if (!this.title || this.title.trim().length === 0) {
            this.errors.set('title', 'Game title is required');
        } else if (this.title.length > 200) {
            this.errors.set('title', 'Game title cannot exceed 200 characters');
        }
        
        // Description validation
        if (this.description && this.description.length > 5000) {
            this.errors.set('description', 'Description cannot exceed 5000 characters');
        }
        
        // Developer validation
        if (!this.developer || this.developer.trim().length === 0) {
            this.errors.set('developer', 'Developer is required');
        }
        
        // Genre validation
        if (this.genre.length === 0) {
            this.errors.set('genre', 'At least one genre is required');
        }
        
        // Platform validation
        if (this.platform.length === 0) {
            this.errors.set('platform', 'At least one platform is required');
        }
        
        // Price validation
        if (this.price.current < 0) {
            this.errors.set('price', 'Price cannot be negative');
        }
        
        // Release date validation
        if (this.releaseDate && this.releaseDate > new Date()) {
            this.comingSoon = true;
        }
        
        return this.errors.size === 0;
    }
    
    /**
     * Check if game is valid
     * @returns {boolean} Validation status
     */
    isValid() {
        return this.errors.size === 0;
    }
    
    /**
     * Get validation errors
     * @returns {Object} Validation errors
     */
    getErrors() {
        const errorsObj = {};
        for (const [key, value] of this.errors.entries()) {
            errorsObj[key] = value;
        }
        return errorsObj;
    }
    
    /**
     * Update game statistics
     * @param {Object} newStats - New statistics
     * @returns {Game} Game instance for chaining
     */
    updateStats(newStats) {
        const oldStats = { ...this.stats };
        this.stats = { ...this.stats, ...newStats };
        this.updatedAt = new Date();
        
        this.emit('statsUpdated', { newStats: this.stats, oldStats });
        
        return this;
    }
    
    /**
     * Add rating to game
     * @param {number} rating - Rating value (0-10)
     * @param {string} userId - User ID
     * @returns {boolean} Success status
     */
    addRating(rating, userId = null) {
        if (rating < 0 || rating > 10) {
            return false;
        }
        
        const ratingObj = {
            value: rating,
            userId,
            timestamp: new Date()
        };
        
        // Remove existing rating from same user
        if (userId) {
            this.ratings = this.ratings.filter(r => r.userId !== userId);
        }
        
        this.ratings.push(ratingObj);
        
        // Recalculate average rating
        this.recalculateRating();
        
        this.emit('ratingAdded', ratingObj);
        
        return true;
    }
    
    /**
     * Remove rating from game
     * @param {string} userId - User ID
     * @returns {boolean} Success status
     */
    removeRating(userId) {
        const initialLength = this.ratings.length;
        this.ratings = this.ratings.filter(r => r.userId !== userId);
        
        if (this.ratings.length < initialLength) {
            this.recalculateRating();
            this.emit('ratingRemoved', { userId });
            return true;
        }
        
        return false;
    }
    
    /**
     * Recalculate average rating
     */
    recalculateRating() {
        if (this.ratings.length === 0) {
            this.stats.averageRating = 0;
            this.stats.ratingsCount = 0;
            return;
        }
        
        const sum = this.ratings.reduce((total, rating) => total + rating.value, 0);
        this.stats.averageRating = Math.round((sum / this.ratings.length) * 10) / 10;
        this.stats.ratingsCount = this.ratings.length;
    }
    
    /**
     * Get average rating
     * @returns {number} Average rating
     */
    getAverageRating() {
        return this.stats.averageRating;
    }
    
    /**
     * Get rating distribution
     * @returns {Object} Rating distribution
     */
    getRatingDistribution() {
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 };
        
        this.ratings.forEach(rating => {
            const rounded = Math.round(rating.value);
            if (distribution.hasOwnProperty(rounded)) {
                distribution[rounded]++;
            }
        });
        
        return distribution;
    }
    
    /**
     * Check if game is free
     * @returns {boolean} Is free
     */
    isFree() {
        return this.price.free || this.price.current === 0;
    }
    
    /**
     * Check if game is on sale
     * @returns {boolean} Is on sale
     */
    isOnSale() {
        return this.price.discount > 0 && this.price.current < this.price.original;
    }
    
    /**
     * Get discount percentage
     * @returns {number} Discount percentage
     */
    getDiscountPercentage() {
        if (this.price.original === 0) return 0;
        return Math.round(((this.price.original - this.price.current) / this.price.original) * 100);
    }
    
    /**
     * Format price for display
     * @param {string} locale - Locale for formatting
     * @returns {string} Formatted price
     */
    getFormattedPrice(locale = 'en-US') {
        if (this.isFree()) {
            return 'Free';
        }
        
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: this.price.currency
        }).format(this.price.current);
    }
    
    /**
     * Get age rating display
     * @returns {string} Age rating display
     */
    getAgeRatingDisplay() {
        if (!this.ageRating) return 'Not Rated';
        
        const ratingMap = {
            'E': 'Everyone',
            'E10+': 'Everyone 10+',
            'T': 'Teen',
            'M': 'Mature 17+',
            'AO': 'Adults Only',
            'PEGI3': 'PEGI 3',
            'PEGI7': 'PEGI 7',
            'PEGI12': 'PEGI 12',
            'PEGI16': 'PEGI 16',
            'PEGI18': 'PEGI 18'
        };
        
        return ratingMap[this.ageRating] || this.ageRating;
    }
    
    /**
     * Get release status
     * @returns {string} Release status
     */
    getReleaseStatus() {
        if (!this.releaseDate) return 'TBA';
        
        const now = new Date();
        
        if (this.releaseDate > now) {
            return 'Coming Soon';
        } else if (this.isEarlyAccess) {
            return 'Early Access';
        } else {
            return 'Released';
        }
    }
    
    /**
     * Get days until release
     * @returns {number} Days until release (negative if already released)
     */
    getDaysUntilRelease() {
        if (!this.releaseDate) return null;
        
        const now = new Date();
        const diffTime = this.releaseDate - now;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    /**
     * Check if game supports feature
     * @param {string} feature - Feature to check
     * @returns {boolean} Feature support
     */
    supportsFeature(feature) {
        const featureMap = {
            'multiplayer': this.multiplayer.supported,
            'online': this.multiplayer.online,
            'coop': this.multiplayer.coop,
            'competitive': this.multiplayer.competitive,
            'controller': this.accessibility.controllerSupport,
            'keyboard': this.accessibility.keyboardMouse,
            'touch': this.accessibility.touchSupport,
            'subtitles': this.accessibility.subtitles,
            'colorblind': this.accessibility.colorblindSupport
        };
        
        return featureMap[feature] || false;
    }
    
    /**
     * Get playtime display
     * @param {number} minutes - Playtime in minutes
     * @returns {string} Formatted playtime
     */
    static formatPlaytime(minutes) {
        if (minutes < 60) {
            return `${minutes} min`;
        } else if (minutes < 1440) { // Less than 24 hours
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        } else {
            const days = Math.floor(minutes / 1440);
            const hours = Math.floor((minutes % 1440) / 60);
            return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
        }
    }
    
    /**
     * Get user's playtime formatted
     * @returns {string} Formatted user playtime
     */
    getUserPlaytimeFormatted() {
        return Game.formatPlaytime(this.userStats.playtime);
    }
    
    /**
     * Get average playtime formatted
     * @returns {string} Formatted average playtime
     */
    getAveragePlaytimeFormatted() {
        return Game.formatPlaytime(this.stats.playtimeAverage);
    }
    
    /**
     * Check if game matches search criteria
     * @param {Object} criteria - Search criteria
     * @returns {boolean} Match result
     */
    matchesCriteria(criteria) {
        const {
            query,
            genre,
            platform,
            priceRange,
            rating,
            releaseYear,
            features
        } = criteria;
        
        // Text search
        if (query) {
            const searchText = query.toLowerCase();
            const searchableText = [
                this.title,
                this.description,
                this.developer,
                this.publisher,
                ...this.genre,
                ...this.tags
            ].join(' ').toLowerCase();
            
            if (!searchableText.includes(searchText)) {
                return false;
            }
        }
        
        // Genre filter
        if (genre && genre !== 'all') {
            if (!this.genre.includes(genre)) {
                return false;
            }
        }
        
        // Platform filter
        if (platform && platform !== 'all') {
            if (!this.platform.includes(platform)) {
                return false;
            }
        }
        
        // Price range filter
        if (priceRange) {
            const { min, max } = priceRange;
            if (this.price.current < min || this.price.current > max) {
                return false;
            }
        }
        
        // Rating filter
        if (rating && rating !== 'all') {
            const minRating = parseFloat(rating);
            if (this.stats.averageRating < minRating) {
                return false;
            }
        }
        
        // Release year filter
        if (releaseYear && releaseYear !== 'all') {
            if (!this.releaseDate) {
                return false;
            }
            
            const year = this.releaseDate.getFullYear();
            if (year !== parseInt(releaseYear)) {
                return false;
            }
        }
        
        // Features filter
        if (features && features.length > 0) {
            const hasAllFeatures = features.every(feature => this.supportsFeature(feature));
            if (!hasAllFeatures) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Get similar games based on genre and tags
     * @param {Array} allGames - All available games
     * @param {number} limit - Maximum number of similar games
     * @returns {Array} Similar games
     */
    getSimilarGames(allGames, limit = 5) {
        const scores = allGames
            .filter(game => game.id !== this.id)
            .map(game => {
                let score = 0;
                
                // Genre similarity
                const commonGenres = game.genre.filter(g => this.genre.includes(g));
                score += commonGenres.length * 3;
                
                // Tag similarity
                const commonTags = game.tags.filter(t => this.tags.includes(t));
                score += commonTags.length * 2;
                
                // Developer similarity
                if (game.developer === this.developer) {
                    score += 5;
                }
                
                // Publisher similarity
                if (game.publisher === this.publisher) {
                    score += 3;
                }
                
                // Platform similarity
                const commonPlatforms = game.platform.filter(p => this.platform.includes(p));
                score += commonPlatforms.length;
                
                return { game, score };
            })
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
        
        return scores.map(item => item.game);
    }
    
    /**
     * Convert game to plain object
     * @param {boolean} includeUserStats - Include user-specific data
     * @returns {Object} Plain object representation
     */
    toObject(includeUserStats = false) {
        const obj = {
            id: this.id,
            title: this.title,
            slug: this.slug,
            description: this.description,
            shortDescription: this.shortDescription,
            developer: this.developer,
            publisher: this.publisher,
            genre: [...this.genre],
            tags: [...this.tags],
            platform: [...this.platform],
            releaseDate: this.releaseDate,
            earlyAccessDate: this.earlyAccessDate,
            isEarlyAccess: this.isEarlyAccess,
            isReleased: this.isReleased,
            price: { ...this.price },
            ageRating: this.ageRating,
            contentWarnings: [...this.contentWarnings],
            images: {
                ...this.images,
                screenshots: [...this.images.screenshots],
                artwork: [...this.images.artwork]
            },
            videos: {
                ...this.videos,
                gameplay: [...this.videos.gameplay]
            },
            systemRequirements: { ...this.systemRequirements },
            stats: { ...this.stats },
            featured: this.featured,
            trending: this.trending,
            popular: this.popular,
            newRelease: this.newRelease,
            comingSoon: this.comingSoon,
            dlc: [...this.dlc],
            expansions: [...this.expansions],
            baseGame: this.baseGame,
            multiplayer: { ...this.multiplayer },
            accessibility: { ...this.accessibility },
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
        
        if (includeUserStats) {
            obj.userStats = { ...this.userStats };
        }
        
        return obj;
    }
    
    /**
     * Convert game to JSON
     * @param {boolean} includeUserStats - Include user-specific data
     * @returns {string} JSON representation
     */
    toJSON(includeUserStats = false) {
        return JSON.stringify(this.toObject(includeUserStats));
    }
    
    /**
     * Create game from plain object
     * @param {Object} data - Game data
     * @returns {Game} Game instance
     */
    static fromObject(data) {
        return new Game(data);
    }
    
    /**
     * Create game from JSON
     * @param {string} json - JSON string
     * @returns {Game} Game instance
     */
    static fromJSON(json) {
        return Game.fromObject(JSON.parse(json));
    }
    
    // Event system methods
    
    /**
     * Add event listener
     * @param {string} event - Event name
     * @param {Function} callback - Event callback
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
    }
    
    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} callback - Event callback
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }
    
    /**
     * Emit event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in game event listener for ${event}:`, error);
                }
            });
        }
    }
    
    /**
     * Clear all event listeners
     */
    clearListeners() {
        this.listeners.clear();
    }
}

// Export for global access
window.Game = Game;
