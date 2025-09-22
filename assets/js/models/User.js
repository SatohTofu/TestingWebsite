/* ==============================================
   USER MODEL
   ============================================== */

/**
 * User entity class representing a GameVault user
 * Handles user data, preferences, and authentication state
 * 
 * Usage:
 * const user = new User({
 *   id: 1,
 *   username: 'gamer123',
 *   email: 'gamer@example.com'
 * });
 * 
 * user.updatePreferences({ theme: 'dark' });
 * user.addToLibrary(gameId);
 */

class User {
    constructor(data = {}) {
        // Core properties
        this.id = data.id || null;
        this.username = data.username || '';
        this.email = data.email || '';
        this.displayName = data.displayName || data.username || '';
        this.avatar = data.avatar || null;
        this.bio = data.bio || '';
        this.location = data.location || '';
        this.website = data.website || '';
        
        // Authentication
        this.isAuthenticated = data.isAuthenticated || false;
        this.lastLoginAt = data.lastLoginAt ? new Date(data.lastLoginAt) : null;
        this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
        
        // Preferences
        this.preferences = {
            theme: 'system',
            language: 'en',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            notifications: {
                email: true,
                push: true,
                gameUpdates: true,
                reviews: true,
                social: true
            },
            privacy: {
                profileVisibility: 'public', // public, friends, private
                libraryVisibility: 'public',
                activityVisibility: 'friends',
                showOnlineStatus: true
            },
            display: {
                showAvatars: true,
                showSpoilers: false,
                compactMode: false,
                animationsEnabled: true
            },
            ...data.preferences
        };
        
        // Statistics
        this.stats = {
            gamesOwned: 0,
            gamesPlayed: 0,
            gamesCompleted: 0,
            hoursPlayed: 0,
            reviewsWritten: 0,
            ratingsGiven: 0,
            achievementsUnlocked: 0,
            friendsCount: 0,
            followersCount: 0,
            followingCount: 0,
            ...data.stats
        };
        
        // Collections
        this.library = new Set(data.library || []);
        this.wishlist = new Set(data.wishlist || []);
        this.favorites = new Set(data.favorites || []);
        this.friends = new Set(data.friends || []);
        this.blockedUsers = new Set(data.blockedUsers || []);
        
        // Activity tracking
        this.recentActivity = data.recentActivity || [];
        this.currentGame = data.currentGame || null;
        this.status = data.status || 'offline'; // online, away, busy, offline
        this.customStatus = data.customStatus || '';
        
        // Badges and achievements
        this.badges = data.badges || [];
        this.achievements = data.achievements || [];
        
        // Validation errors
        this.errors = new Map();
        
        // Event callbacks
        this.listeners = new Map();
        
        this.validate();
    }
    
    /**
     * Validate user data
     * @returns {boolean} Validation result
     */
    validate() {
        this.errors.clear();
        
        // Username validation
        if (!this.username || this.username.length < 3) {
            this.errors.set('username', 'Username must be at least 3 characters long');
        } else if (!/^[a-zA-Z0-9_-]+$/.test(this.username)) {
            this.errors.set('username', 'Username can only contain letters, numbers, underscores and hyphens');
        }
        
        // Email validation
        if (!this.email) {
            this.errors.set('email', 'Email is required');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
            this.errors.set('email', 'Invalid email format');
        }
        
        // Display name validation
        if (this.displayName && this.displayName.length > 50) {
            this.errors.set('displayName', 'Display name cannot exceed 50 characters');
        }
        
        // Bio validation
        if (this.bio && this.bio.length > 500) {
            this.errors.set('bio', 'Bio cannot exceed 500 characters');
        }
        
        // Website validation
        if (this.website && !/^https?:\/\/.+/.test(this.website)) {
            this.errors.set('website', 'Website must be a valid URL');
        }
        
        return this.errors.size === 0;
    }
    
    /**
     * Check if user is valid
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
     * Update user preferences
     * @param {Object} newPreferences - New preferences
     * @returns {User} User instance for chaining
     */
    updatePreferences(newPreferences) {
        this.preferences = {
            ...this.preferences,
            ...newPreferences,
            notifications: {
                ...this.preferences.notifications,
                ...newPreferences.notifications
            },
            privacy: {
                ...this.preferences.privacy,
                ...newPreferences.privacy
            },
            display: {
                ...this.preferences.display,
                ...newPreferences.display
            }
        };
        
        this.updatedAt = new Date();
        this.emit('preferencesUpdated', this.preferences);
        
        return this;
    }
    
    /**
     * Update user statistics
     * @param {Object} newStats - New statistics
     * @returns {User} User instance for chaining
     */
    updateStats(newStats) {
        const oldStats = { ...this.stats };
        this.stats = { ...this.stats, ...newStats };
        this.updatedAt = new Date();
        
        this.emit('statsUpdated', { newStats: this.stats, oldStats });
        
        return this;
    }
    
    /**
     * Add game to library
     * @param {number|string} gameId - Game ID
     * @returns {boolean} Success status
     */
    addToLibrary(gameId) {
        if (this.library.has(gameId)) {
            return false;
        }
        
        this.library.add(gameId);
        this.updateStats({ gamesOwned: this.library.size });
        this.addActivity('library_add', { gameId });
        
        this.emit('libraryUpdated', { action: 'add', gameId });
        
        return true;
    }
    
    /**
     * Remove game from library
     * @param {number|string} gameId - Game ID
     * @returns {boolean} Success status
     */
    removeFromLibrary(gameId) {
        if (!this.library.has(gameId)) {
            return false;
        }
        
        this.library.delete(gameId);
        this.updateStats({ gamesOwned: this.library.size });
        this.addActivity('library_remove', { gameId });
        
        this.emit('libraryUpdated', { action: 'remove', gameId });
        
        return true;
    }
    
    /**
     * Add game to wishlist
     * @param {number|string} gameId - Game ID
     * @returns {boolean} Success status
     */
    addToWishlist(gameId) {
        if (this.wishlist.has(gameId) || this.library.has(gameId)) {
            return false;
        }
        
        this.wishlist.add(gameId);
        this.addActivity('wishlist_add', { gameId });
        
        this.emit('wishlistUpdated', { action: 'add', gameId });
        
        return true;
    }
    
    /**
     * Remove game from wishlist
     * @param {number|string} gameId - Game ID
     * @returns {boolean} Success status
     */
    removeFromWishlist(gameId) {
        if (!this.wishlist.has(gameId)) {
            return false;
        }
        
        this.wishlist.delete(gameId);
        this.addActivity('wishlist_remove', { gameId });
        
        this.emit('wishlistUpdated', { action: 'remove', gameId });
        
        return true;
    }
    
    /**
     * Add game to favorites
     * @param {number|string} gameId - Game ID
     * @returns {boolean} Success status
     */
    addToFavorites(gameId) {
        if (this.favorites.has(gameId)) {
            return false;
        }
        
        this.favorites.add(gameId);
        this.addActivity('favorite_add', { gameId });
        
        this.emit('favoritesUpdated', { action: 'add', gameId });
        
        return true;
    }
    
    /**
     * Remove game from favorites
     * @param {number|string} gameId - Game ID
     * @returns {boolean} Success status
     */
    removeFromFavorites(gameId) {
        if (!this.favorites.has(gameId)) {
            return false;
        }
        
        this.favorites.delete(gameId);
        this.addActivity('favorite_remove', { gameId });
        
        this.emit('favoritesUpdated', { action: 'remove', gameId });
        
        return true;
    }
    
    /**
     * Add friend
     * @param {number|string} userId - User ID
     * @returns {boolean} Success status
     */
    addFriend(userId) {
        if (this.friends.has(userId) || userId === this.id) {
            return false;
        }
        
        this.friends.add(userId);
        this.updateStats({ friendsCount: this.friends.size });
        this.addActivity('friend_add', { userId });
        
        this.emit('friendsUpdated', { action: 'add', userId });
        
        return true;
    }
    
    /**
     * Remove friend
     * @param {number|string} userId - User ID
     * @returns {boolean} Success status
     */
    removeFriend(userId) {
        if (!this.friends.has(userId)) {
            return false;
        }
        
        this.friends.delete(userId);
        this.updateStats({ friendsCount: this.friends.size });
        this.addActivity('friend_remove', { userId });
        
        this.emit('friendsUpdated', { action: 'remove', userId });
        
        return true;
    }
    
    /**
     * Block user
     * @param {number|string} userId - User ID
     * @returns {boolean} Success status
     */
    blockUser(userId) {
        if (this.blockedUsers.has(userId) || userId === this.id) {
            return false;
        }
        
        this.blockedUsers.add(userId);
        this.friends.delete(userId); // Remove from friends if blocked
        
        this.emit('userBlocked', { userId });
        
        return true;
    }
    
    /**
     * Unblock user
     * @param {number|string} userId - User ID
     * @returns {boolean} Success status
     */
    unblockUser(userId) {
        if (!this.blockedUsers.has(userId)) {
            return false;
        }
        
        this.blockedUsers.delete(userId);
        
        this.emit('userUnblocked', { userId });
        
        return true;
    }
    
    /**
     * Add activity to recent activity
     * @param {string} type - Activity type
     * @param {Object} data - Activity data
     */
    addActivity(type, data = {}) {
        const activity = {
            type,
            data,
            timestamp: new Date(),
            id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        this.recentActivity.unshift(activity);
        
        // Keep only last 100 activities
        if (this.recentActivity.length > 100) {
            this.recentActivity = this.recentActivity.slice(0, 100);
        }
        
        this.emit('activityAdded', activity);
    }
    
    /**
     * Set current playing game
     * @param {number|string} gameId - Game ID
     * @param {Object} sessionData - Session data
     */
    setCurrentGame(gameId, sessionData = {}) {
        this.currentGame = {
            gameId,
            startedAt: new Date(),
            ...sessionData
        };
        
        this.addActivity('game_start', { gameId });
        this.emit('currentGameChanged', this.currentGame);
    }
    
    /**
     * Clear current playing game
     * @param {Object} sessionData - Final session data
     */
    clearCurrentGame(sessionData = {}) {
        if (!this.currentGame) {
            return;
        }
        
        const session = {
            ...this.currentGame,
            endedAt: new Date(),
            ...sessionData
        };
        
        // Calculate session duration
        if (session.startedAt && session.endedAt) {
            session.duration = session.endedAt - session.startedAt;
            
            // Update total hours played
            const hoursPlayed = Math.round(session.duration / (1000 * 60 * 60) * 100) / 100;
            this.updateStats({ 
                hoursPlayed: this.stats.hoursPlayed + hoursPlayed 
            });
        }
        
        this.addActivity('game_end', { 
            gameId: session.gameId, 
            duration: session.duration 
        });
        
        this.currentGame = null;
        this.emit('currentGameChanged', null);
        this.emit('gameSessionEnded', session);
    }
    
    /**
     * Set user status
     * @param {string} status - Status (online, away, busy, offline)
     * @param {string} customStatus - Custom status message
     */
    setStatus(status, customStatus = '') {
        const oldStatus = this.status;
        this.status = status;
        this.customStatus = customStatus;
        
        this.emit('statusChanged', { 
            newStatus: status, 
            oldStatus, 
            customStatus 
        });
    }
    
    /**
     * Add badge to user
     * @param {Object} badge - Badge object
     */
    addBadge(badge) {
        const existingBadge = this.badges.find(b => b.id === badge.id);
        if (!existingBadge) {
            this.badges.push({
                ...badge,
                earnedAt: new Date()
            });
            
            this.addActivity('badge_earned', { badge });
            this.emit('badgeEarned', badge);
        }
    }
    
    /**
     * Add achievement to user
     * @param {Object} achievement - Achievement object
     */
    addAchievement(achievement) {
        const existingAchievement = this.achievements.find(a => a.id === achievement.id);
        if (!existingAchievement) {
            this.achievements.push({
                ...achievement,
                unlockedAt: new Date()
            });
            
            this.updateStats({ 
                achievementsUnlocked: this.achievements.length 
            });
            
            this.addActivity('achievement_unlocked', { achievement });
            this.emit('achievementUnlocked', achievement);
        }
    }
    
    /**
     * Get user's display avatar URL
     * @returns {string} Avatar URL
     */
    getAvatarUrl() {
        if (this.avatar) {
            return this.avatar;
        }
        
        // Generate default avatar based on username
        const hash = this.username.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
        const color = colors[Math.abs(hash) % colors.length];
        
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.displayName || this.username)}&background=${color.slice(1)}&color=fff&size=128`;
    }
    
    /**
     * Get user level based on experience/stats
     * @returns {number} User level
     */
    getLevel() {
        const totalScore = this.stats.gamesCompleted * 10 + 
                          this.stats.reviewsWritten * 5 + 
                          this.stats.ratingsGiven * 2 + 
                          this.stats.achievementsUnlocked * 3;
        
        return Math.floor(Math.sqrt(totalScore / 100)) + 1;
    }
    
    /**
     * Get experience points for next level
     * @returns {Object} Experience info
     */
    getExperienceInfo() {
        const currentLevel = this.getLevel();
        const currentLevelXP = Math.pow(currentLevel - 1, 2) * 100;
        const nextLevelXP = Math.pow(currentLevel, 2) * 100;
        
        const totalScore = this.stats.gamesCompleted * 10 + 
                          this.stats.reviewsWritten * 5 + 
                          this.stats.ratingsGiven * 2 + 
                          this.stats.achievementsUnlocked * 3;
        
        return {
            level: currentLevel,
            currentXP: totalScore - currentLevelXP,
            nextLevelXP: nextLevelXP - currentLevelXP,
            totalXP: totalScore,
            progress: (totalScore - currentLevelXP) / (nextLevelXP - currentLevelXP)
        };
    }
    
    /**
     * Check if user can perform action based on privacy settings
     * @param {string} action - Action to check
     * @param {User} requestingUser - User requesting the action
     * @returns {boolean} Permission status
     */
    canPerformAction(action, requestingUser = null) {
        if (!requestingUser || requestingUser.id === this.id) {
            return true;
        }
        
        if (this.blockedUsers.has(requestingUser.id)) {
            return false;
        }
        
        const privacySettings = {
            'view_profile': this.preferences.privacy.profileVisibility,
            'view_library': this.preferences.privacy.libraryVisibility,
            'view_activity': this.preferences.privacy.activityVisibility
        };
        
        const setting = privacySettings[action];
        if (!setting) {
            return true; // Default to allow if no specific setting
        }
        
        switch (setting) {
            case 'public':
                return true;
            case 'friends':
                return this.friends.has(requestingUser.id);
            case 'private':
                return false;
            default:
                return true;
        }
    }
    
    /**
     * Convert user to plain object
     * @param {boolean} includePrivate - Include private data
     * @returns {Object} Plain object representation
     */
    toObject(includePrivate = false) {
        const obj = {
            id: this.id,
            username: this.username,
            displayName: this.displayName,
            avatar: this.getAvatarUrl(),
            bio: this.bio,
            location: this.location,
            website: this.website,
            createdAt: this.createdAt,
            stats: { ...this.stats },
            status: this.status,
            customStatus: this.customStatus,
            badges: [...this.badges],
            level: this.getLevel(),
            experienceInfo: this.getExperienceInfo()
        };
        
        if (includePrivate) {
            obj.email = this.email;
            obj.preferences = { ...this.preferences };
            obj.library = Array.from(this.library);
            obj.wishlist = Array.from(this.wishlist);
            obj.favorites = Array.from(this.favorites);
            obj.friends = Array.from(this.friends);
            obj.recentActivity = [...this.recentActivity];
            obj.achievements = [...this.achievements];
            obj.currentGame = this.currentGame;
            obj.lastLoginAt = this.lastLoginAt;
            obj.updatedAt = this.updatedAt;
        }
        
        return obj;
    }
    
    /**
     * Convert user to JSON
     * @param {boolean} includePrivate - Include private data
     * @returns {string} JSON representation
     */
    toJSON(includePrivate = false) {
        return JSON.stringify(this.toObject(includePrivate));
    }
    
    /**
     * Create user from plain object
     * @param {Object} data - User data
     * @returns {User} User instance
     */
    static fromObject(data) {
        return new User(data);
    }
    
    /**
     * Create user from JSON
     * @param {string} json - JSON string
     * @returns {User} User instance
     */
    static fromJSON(json) {
        return User.fromObject(JSON.parse(json));
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
                    console.error(`Error in user event listener for ${event}:`, error);
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
window.User = User;
