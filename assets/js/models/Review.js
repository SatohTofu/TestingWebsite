/* ==============================================
   REVIEW MODEL
   ============================================== */

/**
 * Review entity class representing a user game review
 * Handles review data, validation, and user interactions
 * 
 * Usage:
 * const review = new Review({
 *   gameId: 123,
 *   userId: 456,
 *   title: 'Amazing game!',
 *   content: 'This game exceeded my expectations...',
 *   rating: 9.0,
 *   recommended: true
 * });
 * 
 * review.addHelpfulVote('user789');
 * console.log(review.getHelpfulScore());
 */

class Review {
    constructor(data = {}) {
        // Core properties
        this.id = data.id || null;
        this.gameId = data.gameId || null;
        this.userId = data.userId || null;
        this.username = data.username || '';
        this.userAvatar = data.userAvatar || null;
        
        // Review content
        this.title = data.title || '';
        this.content = data.content || '';
        this.rating = data.rating || null; // 0-10 scale
        this.recommended = data.recommended !== undefined ? data.recommended : null;
        
        // Review metadata
        this.playtimeAtReview = data.playtimeAtReview || 0; // minutes
        this.completedGame = data.completedGame || false;
        this.achievementsUnlocked = data.achievementsUnlocked || 0;
        this.gameVersion = data.gameVersion || null;
        this.platform = data.platform || null;
        
        // Review categorization
        this.tags = Array.isArray(data.tags) ? data.tags : [];
        this.pros = Array.isArray(data.pros) ? data.pros : [];
        this.cons = Array.isArray(data.cons) ? data.cons : [];
        
        // Quality indicators
        this.verified = data.verified || false; // Verified purchase/ownership
        this.featured = data.featured || false;
        this.staffPick = data.staffPick || false;
        this.spoilerWarning = data.spoilerWarning || false;
        
        // User interaction stats
        this.stats = {
            views: data.stats?.views || 0,
            helpfulVotes: data.stats?.helpfulVotes || 0,
            unhelpfulVotes: data.stats?.unhelpfulVotes || 0,
            replies: data.stats?.replies || 0,
            reports: data.stats?.reports || 0,
            shares: data.stats?.shares || 0
        };
        
        // Content moderation
        this.moderation = {
            status: data.moderation?.status || 'approved', // pending, approved, rejected, hidden
            flagged: data.moderation?.flagged || false,
            moderatorId: data.moderation?.moderatorId || null,
            moderatorNotes: data.moderation?.moderatorNotes || '',
            autoModScore: data.moderation?.autoModScore || 0
        };
        
        // Edit history
        this.editHistory = Array.isArray(data.editHistory) ? data.editHistory : [];
        this.lastEditedAt = data.lastEditedAt ? new Date(data.lastEditedAt) : null;
        this.editedByModerator = data.editedByModerator || false;
        
        // Timestamps
        this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
        this.publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;
        
        // User votes tracking
        this.helpfulVotes = new Set(data.helpfulVotes || []);
        this.unhelpfulVotes = new Set(data.unhelpfulVotes || []);
        
        // Review replies/comments
        this.replies = Array.isArray(data.replies) ? data.replies : [];
        
        // Validation errors
        this.errors = new Map();
        
        // Event listeners
        this.listeners = new Map();
        
        this.validate();
    }
    
    /**
     * Validate review data
     * @returns {boolean} Validation result
     */
    validate() {
        this.errors.clear();
        
        // Game ID validation
        if (!this.gameId) {
            this.errors.set('gameId', 'Game ID is required');
        }
        
        // User ID validation
        if (!this.userId) {
            this.errors.set('userId', 'User ID is required');
        }
        
        // Title validation
        if (!this.title || this.title.trim().length === 0) {
            this.errors.set('title', 'Review title is required');
        } else if (this.title.length > 200) {
            this.errors.set('title', 'Review title cannot exceed 200 characters');
        }
        
        // Content validation
        if (!this.content || this.content.trim().length === 0) {
            this.errors.set('content', 'Review content is required');
        } else if (this.content.length < 50) {
            this.errors.set('content', 'Review content must be at least 50 characters');
        } else if (this.content.length > 10000) {
            this.errors.set('content', 'Review content cannot exceed 10000 characters');
        }
        
        // Rating validation
        if (this.rating !== null) {
            if (typeof this.rating !== 'number' || this.rating < 0 || this.rating > 10) {
                this.errors.set('rating', 'Rating must be a number between 0 and 10');
            }
        }
        
        // Playtime validation
        if (this.playtimeAtReview < 0) {
            this.errors.set('playtimeAtReview', 'Playtime cannot be negative');
        }
        
        // Content quality checks
        if (this.content) {
            // Check for excessive caps
            const capsRatio = (this.content.match(/[A-Z]/g) || []).length / this.content.length;
            if (capsRatio > 0.5) {
                this.errors.set('content', 'Review contains excessive capital letters');
            }
            
            // Check for repetitive characters
            if (/(.)\1{4,}/.test(this.content)) {
                this.errors.set('content', 'Review contains repetitive characters');
            }
            
            // Check for minimum word count
            const wordCount = this.content.trim().split(/\s+/).length;
            if (wordCount < 10) {
                this.errors.set('content', 'Review must contain at least 10 words');
            }
        }
        
        return this.errors.size === 0;
    }
    
    /**
     * Check if review is valid
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
     * Add helpful vote
     * @param {string} userId - User ID
     * @returns {boolean} Success status
     */
    addHelpfulVote(userId) {
        if (userId === this.userId) {
            return false; // Users cannot vote on their own reviews
        }
        
        // Remove from unhelpful if exists
        this.unhelpfulVotes.delete(userId);
        
        // Add to helpful
        const wasAdded = !this.helpfulVotes.has(userId);
        this.helpfulVotes.add(userId);
        
        if (wasAdded) {
            this.stats.helpfulVotes = this.helpfulVotes.size;
            this.stats.unhelpfulVotes = this.unhelpfulVotes.size;
            this.updatedAt = new Date();
            this.emit('voteAdded', { type: 'helpful', userId });
        }
        
        return wasAdded;
    }
    
    /**
     * Add unhelpful vote
     * @param {string} userId - User ID
     * @returns {boolean} Success status
     */
    addUnhelpfulVote(userId) {
        if (userId === this.userId) {
            return false; // Users cannot vote on their own reviews
        }
        
        // Remove from helpful if exists
        this.helpfulVotes.delete(userId);
        
        // Add to unhelpful
        const wasAdded = !this.unhelpfulVotes.has(userId);
        this.unhelpfulVotes.add(userId);
        
        if (wasAdded) {
            this.stats.helpfulVotes = this.helpfulVotes.size;
            this.stats.unhelpfulVotes = this.unhelpfulVotes.size;
            this.updatedAt = new Date();
            this.emit('voteAdded', { type: 'unhelpful', userId });
        }
        
        return wasAdded;
    }
    
    /**
     * Remove vote
     * @param {string} userId - User ID
     * @returns {boolean} Success status
     */
    removeVote(userId) {
        const hadHelpful = this.helpfulVotes.has(userId);
        const hadUnhelpful = this.unhelpfulVotes.has(userId);
        
        this.helpfulVotes.delete(userId);
        this.unhelpfulVotes.delete(userId);
        
        if (hadHelpful || hadUnhelpful) {
            this.stats.helpfulVotes = this.helpfulVotes.size;
            this.stats.unhelpfulVotes = this.unhelpfulVotes.size;
            this.updatedAt = new Date();
            this.emit('voteRemoved', { userId });
            return true;
        }
        
        return false;
    }
    
    /**
     * Get helpful score (helpful votes - unhelpful votes)
     * @returns {number} Helpful score
     */
    getHelpfulScore() {
        return this.stats.helpfulVotes - this.stats.unhelpfulVotes;
    }
    
    /**
     * Get helpfulness ratio (helpful / total votes)
     * @returns {number} Ratio between 0 and 1
     */
    getHelpfulnessRatio() {
        const totalVotes = this.stats.helpfulVotes + this.stats.unhelpfulVotes;
        if (totalVotes === 0) return 0;
        return this.stats.helpfulVotes / totalVotes;
    }
    
    /**
     * Check if user has voted
     * @param {string} userId - User ID
     * @returns {string|null} Vote type ('helpful', 'unhelpful') or null
     */
    getUserVote(userId) {
        if (this.helpfulVotes.has(userId)) return 'helpful';
        if (this.unhelpfulVotes.has(userId)) return 'unhelpful';
        return null;
    }
    
    /**
     * Update review content
     * @param {Object} updates - Content updates
     * @param {string} editorId - ID of user making edit
     * @returns {boolean} Success status
     */
    updateContent(updates, editorId = null) {
        // Store edit history
        const editEntry = {
            timestamp: new Date(),
            editorId: editorId || this.userId,
            changes: {},
            reason: updates.reason || 'Content update'
        };
        
        // Track what changed
        const fieldsToTrack = ['title', 'content', 'rating', 'recommended', 'pros', 'cons', 'tags'];
        fieldsToTrack.forEach(field => {
            if (updates.hasOwnProperty(field) && updates[field] !== this[field]) {
                editEntry.changes[field] = {
                    old: this[field],
                    new: updates[field]
                };
            }
        });
        
        // Only proceed if there are actual changes
        if (Object.keys(editEntry.changes).length === 0) {
            return false;
        }
        
        // Apply updates
        Object.keys(editEntry.changes).forEach(field => {
            this[field] = updates[field];
        });
        
        // Update metadata
        this.lastEditedAt = new Date();
        this.updatedAt = new Date();
        this.editedByModerator = (editorId !== this.userId);
        
        // Add to edit history
        this.editHistory.push(editEntry);
        
        // Revalidate
        this.validate();
        
        this.emit('contentUpdated', { updates, editEntry });
        
        return true;
    }
    
    /**
     * Add reply to review
     * @param {Object} replyData - Reply data
     * @returns {string} Reply ID
     */
    addReply(replyData) {
        const reply = {
            id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: replyData.userId,
            username: replyData.username,
            content: replyData.content,
            createdAt: new Date(),
            ...replyData
        };
        
        this.replies.push(reply);
        this.stats.replies = this.replies.length;
        this.updatedAt = new Date();
        
        this.emit('replyAdded', reply);
        
        return reply.id;
    }
    
    /**
     * Remove reply from review
     * @param {string} replyId - Reply ID
     * @returns {boolean} Success status
     */
    removeReply(replyId) {
        const initialLength = this.replies.length;
        this.replies = this.replies.filter(reply => reply.id !== replyId);
        
        if (this.replies.length < initialLength) {
            this.stats.replies = this.replies.length;
            this.updatedAt = new Date();
            this.emit('replyRemoved', { replyId });
            return true;
        }
        
        return false;
    }
    
    /**
     * Flag review for moderation
     * @param {string} reason - Flag reason
     * @param {string} reporterId - Reporter user ID
     * @returns {boolean} Success status
     */
    flag(reason, reporterId) {
        if (!reason || !reporterId) return false;
        
        this.moderation.flagged = true;
        this.moderation.status = 'pending';
        this.stats.reports++;
        this.updatedAt = new Date();
        
        this.emit('flagged', { reason, reporterId });
        
        return true;
    }
    
    /**
     * Moderate review
     * @param {string} action - Moderation action (approve, reject, hide)
     * @param {string} moderatorId - Moderator ID
     * @param {string} notes - Moderation notes
     * @returns {boolean} Success status
     */
    moderate(action, moderatorId, notes = '') {
        const validActions = ['approve', 'reject', 'hide'];
        if (!validActions.includes(action)) return false;
        
        const statusMap = {
            approve: 'approved',
            reject: 'rejected',
            hide: 'hidden'
        };
        
        this.moderation.status = statusMap[action];
        this.moderation.moderatorId = moderatorId;
        this.moderation.moderatorNotes = notes;
        this.moderation.flagged = false;
        this.updatedAt = new Date();
        
        this.emit('moderated', { action, moderatorId, notes });
        
        return true;
    }
    
    /**
     * Check if review is visible to users
     * @returns {boolean} Visibility status
     */
    isVisible() {
        return this.moderation.status === 'approved';
    }
    
    /**
     * Get content preview (truncated)
     * @param {number} maxLength - Maximum length
     * @returns {string} Content preview
     */
    getContentPreview(maxLength = 200) {
        if (this.content.length <= maxLength) {
            return this.content;
        }
        
        return this.content.substring(0, maxLength).trim() + '...';
    }
    
    /**
     * Get reading time estimate
     * @returns {number} Reading time in minutes
     */
    getReadingTime() {
        const wordsPerMinute = 200;
        const wordCount = this.content.trim().split(/\s+/).length;
        return Math.ceil(wordCount / wordsPerMinute);
    }
    
    /**
     * Get playtime at review formatted
     * @returns {string} Formatted playtime
     */
    getPlaytimeFormatted() {
        return Game.formatPlaytime(this.playtimeAtReview);
    }
    
    /**
     * Get review age
     * @returns {string} Time since review was created
     */
    getAge() {
        const now = new Date();
        const diffMs = now - this.createdAt;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            if (diffHours === 0) {
                const diffMinutes = Math.floor(diffMs / (1000 * 60));
                return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
            }
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        } else if (diffDays < 30) {
            return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        } else if (diffDays < 365) {
            const diffMonths = Math.floor(diffDays / 30);
            return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
        } else {
            const diffYears = Math.floor(diffDays / 365);
            return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
        }
    }
    
    /**
     * Check if review is recent
     * @param {number} days - Days threshold
     * @returns {boolean} Is recent
     */
    isRecent(days = 7) {
        const now = new Date();
        const diffMs = now - this.createdAt;
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        return diffDays <= days;
    }
    
    /**
     * Get quality score based on various factors
     * @returns {number} Quality score (0-100)
     */
    getQualityScore() {
        let score = 0;
        
        // Content length score (20 points max)
        const contentLength = this.content.length;
        if (contentLength >= 500) score += 20;
        else if (contentLength >= 200) score += 15;
        else if (contentLength >= 100) score += 10;
        else score += 5;
        
        // Helpfulness score (30 points max)
        const helpfulnessRatio = this.getHelpfulnessRatio();
        const totalVotes = this.stats.helpfulVotes + this.stats.unhelpfulVotes;
        if (totalVotes >= 10) {
            score += Math.round(helpfulnessRatio * 30);
        } else if (totalVotes >= 5) {
            score += Math.round(helpfulnessRatio * 20);
        } else {
            score += Math.round(helpfulnessRatio * 10);
        }
        
        // Playtime credibility (20 points max)
        if (this.playtimeAtReview >= 300) score += 20; // 5+ hours
        else if (this.playtimeAtReview >= 120) score += 15; // 2+ hours
        else if (this.playtimeAtReview >= 60) score += 10; // 1+ hour
        else score += 5;
        
        // Verification bonus (10 points)
        if (this.verified) score += 10;
        
        // Completion bonus (10 points)
        if (this.completedGame) score += 10;
        
        // Detailed pros/cons (10 points)
        if (this.pros.length >= 2 && this.cons.length >= 2) score += 10;
        else if (this.pros.length >= 1 || this.cons.length >= 1) score += 5;
        
        return Math.min(100, score);
    }
    
    /**
     * Convert review to plain object
     * @param {boolean} includeVotes - Include vote data
     * @returns {Object} Plain object representation
     */
    toObject(includeVotes = false) {
        const obj = {
            id: this.id,
            gameId: this.gameId,
            userId: this.userId,
            username: this.username,
            userAvatar: this.userAvatar,
            title: this.title,
            content: this.content,
            rating: this.rating,
            recommended: this.recommended,
            playtimeAtReview: this.playtimeAtReview,
            completedGame: this.completedGame,
            achievementsUnlocked: this.achievementsUnlocked,
            gameVersion: this.gameVersion,
            platform: this.platform,
            tags: [...this.tags],
            pros: [...this.pros],
            cons: [...this.cons],
            verified: this.verified,
            featured: this.featured,
            staffPick: this.staffPick,
            spoilerWarning: this.spoilerWarning,
            stats: { ...this.stats },
            moderation: { ...this.moderation },
            editHistory: [...this.editHistory],
            lastEditedAt: this.lastEditedAt,
            editedByModerator: this.editedByModerator,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            publishedAt: this.publishedAt,
            replies: [...this.replies]
        };
        
        if (includeVotes) {
            obj.helpfulVotes = Array.from(this.helpfulVotes);
            obj.unhelpfulVotes = Array.from(this.unhelpfulVotes);
        }
        
        return obj;
    }
    
    /**
     * Convert review to JSON
     * @param {boolean} includeVotes - Include vote data
     * @returns {string} JSON representation
     */
    toJSON(includeVotes = false) {
        return JSON.stringify(this.toObject(includeVotes));
    }
    
    /**
     * Create review from plain object
     * @param {Object} data - Review data
     * @returns {Review} Review instance
     */
    static fromObject(data) {
        return new Review(data);
    }
    
    /**
     * Create review from JSON
     * @param {string} json - JSON string
     * @returns {Review} Review instance
     */
    static fromJSON(json) {
        return Review.fromObject(JSON.parse(json));
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
                    console.error(`Error in review event listener for ${event}:`, error);
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
window.Review = Review;
