/* ==============================================
   AUTHENTICATION MANAGER
   ============================================== */

/**
 * Manages user authentication state and UI transitions
 * Handles login, registration, logout, and user session management
 */

class AuthManager extends EventEmitter {
    constructor() {
        super();
        
        this.currentUser = null;
        this.isAuthenticated = false;
        this.token = null;
        
        // UI elements
        this.guestLanding = null;
        this.userDashboard = null;
        this.authModals = null;
        
        // Bind methods
        this.init = this.init.bind(this);
        this.login = this.login.bind(this);
        this.register = this.register.bind(this);
        this.logout = this.logout.bind(this);
        this.checkAuthState = this.checkAuthState.bind(this);
        this.showGuestView = this.showGuestView.bind(this);
        this.showUserView = this.showUserView.bind(this);
        
        this.init();
    }
    
    /**
     * Initialize authentication manager
     */
    init() {
        try {
            this.setupUIElements();
            this.checkAuthState();
            this.setupEventListeners();
            this.setupAuthModals();
            
            console.log('AuthManager initialized');
        } catch (error) {
            console.error('Error initializing AuthManager:', error);
            // Fallback to show original content
            const originalContent = document.getElementById('original-content');
            if (originalContent) {
                originalContent.style.display = 'block';
            }
        }
    }
    
    /**
     * Setup UI element references
     */
    setupUIElements() {
        // Create guest landing page
        this.createGuestLanding();
        
        // Create user dashboard
        this.createUserDashboard();
        
        // Create authentication modals
        this.createAuthModals();
    }
    
    /**
     * Check current authentication state
     */
    checkAuthState() {
        const savedToken = localStorage.getItem('gameVault_token');
        const savedUser = localStorage.getItem('gameVault_user');
        
        if (savedToken && savedUser) {
            try {
                this.token = savedToken;
                this.currentUser = JSON.parse(savedUser);
                this.isAuthenticated = true;
                this.showUserView();
            } catch (error) {
                console.error('Error parsing saved user data:', error);
                this.clearAuthData();
                this.showGuestView();
            }
        } else {
            this.showGuestView();
        }
    }
    
    /**
     * Handle user login
     */
    async login(credentials) {
        try {
            // Show loading state
            this.emit('loginStart');
            
            // Simulate API call (replace with actual API call)
            const response = await this.mockApiCall('login', credentials);
            
            if (response.success) {
                this.token = response.token;
                this.currentUser = response.user;
                this.isAuthenticated = true;
                
                // Save to localStorage
                localStorage.setItem('gameVault_token', this.token);
                localStorage.setItem('gameVault_user', JSON.stringify(this.currentUser));
                
                // Show success and redirect
                this.emit('loginSuccess', this.currentUser);
                this.closeAuthModals();
                this.showUserView();
                
                return { success: true, user: this.currentUser };
            } else {
                throw new Error(response.message || 'Login failed');
            }
        } catch (error) {
            this.emit('loginError', error.message);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Handle user registration
     */
    async register(userData) {
        try {
            // Show loading state
            this.emit('registerStart');
            
            // Simulate API call (replace with actual API call)
            const response = await this.mockApiCall('register', userData);
            
            if (response.success) {
                this.token = response.token;
                this.currentUser = response.user;
                this.isAuthenticated = true;
                
                // Save to localStorage
                localStorage.setItem('gameVault_token', this.token);
                localStorage.setItem('gameVault_user', JSON.stringify(this.currentUser));
                
                // Show success and redirect
                this.emit('registerSuccess', this.currentUser);
                this.closeAuthModals();
                this.showUserView();
                
                return { success: true, user: this.currentUser };
            } else {
                throw new Error(response.message || 'Registration failed');
            }
        } catch (error) {
            this.emit('registerError', error.message);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Handle user logout
     */
    logout() {
        this.clearAuthData();
        this.emit('logout');
        this.showGuestView();
    }
    
    /**
     * Clear authentication data
     */
    clearAuthData() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.token = null;
        
        localStorage.removeItem('gameVault_token');
        localStorage.removeItem('gameVault_user');
    }
    
    /**
     * Show guest landing page
     */
    showGuestView() {
        if (this.guestLanding) {
            this.guestLanding.style.display = 'block';
        }
        if (this.userDashboard) {
            this.userDashboard.style.display = 'none';
        }
        
        // Update navigation
        this.updateNavigation(false);
        
        this.emit('viewChanged', 'guest');
    }
    
    /**
     * Show user dashboard
     */
    showUserView() {
        if (this.guestLanding) {
            this.guestLanding.style.display = 'none';
        }
        if (this.userDashboard) {
            this.userDashboard.style.display = 'block';
        }
        
        // Update navigation
        this.updateNavigation(true);
        
        // Populate user data
        this.populateUserDashboard();
        
        this.emit('viewChanged', 'user');
    }
    
    /**
     * Mock API call simulation
     */
    async mockApiCall(endpoint, data) {
        return new Promise((resolve) => {
            setTimeout(() => {
                if (endpoint === 'login') {
                    // Mock successful login
                    resolve({
                        success: true,
                        token: 'mock_token_' + Date.now(),
                        user: {
                            id: 1,
                            username: data.username || 'user123',
                            email: data.email,
                            displayName: data.username || 'Gaming User',
                            avatar: 'https://via.placeholder.com/100x100/667eea/ffffff?text=U',
                            joinedAt: new Date().toISOString(),
                            stats: {
                                gamesPlayed: 42,
                                reviewsWritten: 15,
                                hoursPlayed: 156,
                                achievements: 23
                            }
                        }
                    });
                } else if (endpoint === 'register') {
                    // Mock successful registration
                    resolve({
                        success: true,
                        token: 'mock_token_' + Date.now(),
                        user: {
                            id: Date.now(),
                            username: data.username,
                            email: data.email,
                            displayName: data.username,
                            avatar: 'https://via.placeholder.com/100x100/667eea/ffffff?text=' + data.username.charAt(0).toUpperCase(),
                            joinedAt: new Date().toISOString(),
                            stats: {
                                gamesPlayed: 0,
                                reviewsWritten: 0,
                                hoursPlayed: 0,
                                achievements: 0
                            }
                        }
                    });
                }
            }, 1500); // Simulate network delay
        });
    }
    
    /**
     * Create guest landing page
     */
    createGuestLanding() {
        const existingLanding = document.getElementById('guest-landing');
        if (existingLanding) {
            this.guestLanding = existingLanding;
            return;
        }
        
        const landingHTML = `
            <div id="guest-landing" class="guest-landing">
                <!-- Hero Section -->
                <section class="hero-section">
                    <div class="hero-background">
                        <div class="hero-overlay"></div>
                    </div>
                    <div class="hero-content">
                        <div class="container">
                            <div class="hero-text">
                                <h1 class="hero-title">
                                    Welcome to <span class="brand-highlight">GameVault</span>
                                </h1>
                                <p class="hero-subtitle">
                                    Discover, track, and rate your favorite games. Join the ultimate gaming community.
                                </p>
                                <div class="hero-actions">
                                    <button class="btn btn-primary btn-large" id="guest-register-btn">
                                        <i class="fas fa-user-plus"></i>
                                        Get Started
                                    </button>
                                    <button class="btn btn-outline btn-large" id="guest-login-btn">
                                        <i class="fas fa-sign-in-alt"></i>
                                        Sign In
                                    </button>
                                </div>
                            </div>
                            <div class="hero-visual">
                                <div class="feature-preview">
                                    <div class="preview-card">
                                        <i class="fas fa-gamepad"></i>
                                        <h3>Discover Games</h3>
                                        <p>Explore thousands of games across all platforms</p>
                                    </div>
                                    <div class="preview-card">
                                        <i class="fas fa-star"></i>
                                        <h3>Rate & Review</h3>
                                        <p>Share your thoughts with the gaming community</p>
                                    </div>
                                    <div class="preview-card">
                                        <i class="fas fa-users"></i>
                                        <h3>Connect</h3>
                                        <p>Find friends and discover new favorites</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                
                <!-- Features Section -->
                <section class="features-section">
                    <div class="container">
                        <h2 class="section-title">Why Choose GameVault?</h2>
                        <div class="features-grid">
                            <div class="feature-item">
                                <div class="feature-icon">
                                    <i class="fas fa-database"></i>
                                </div>
                                <h3>Comprehensive Database</h3>
                                <p>Access information on thousands of games from indie to AAA titles</p>
                            </div>
                            <div class="feature-item">
                                <div class="feature-icon">
                                    <i class="fas fa-chart-line"></i>
                                </div>
                                <h3>Track Your Progress</h3>
                                <p>Monitor your gaming journey with detailed statistics and achievements</p>
                            </div>
                            <div class="feature-item">
                                <div class="feature-icon">
                                    <i class="fas fa-comments"></i>
                                </div>
                                <h3>Community Reviews</h3>
                                <p>Read honest reviews from fellow gamers and share your own experiences</p>
                            </div>
                        </div>
                    </div>
                </section>
                
                <!-- CTA Section -->
                <section class="cta-section">
                    <div class="container">
                        <div class="cta-content">
                            <h2>Ready to Start Your Gaming Journey?</h2>
                            <p>Join thousands of gamers who trust GameVault to discover their next favorite game.</p>
                            <button class="btn btn-primary btn-large" id="guest-cta-register">
                                Create Your Account
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        `;
        
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.insertAdjacentHTML('afterbegin', landingHTML);
            this.guestLanding = document.getElementById('guest-landing');
        }
    }
    
    /**
     * Create user dashboard
     */
    createUserDashboard() {
        const existingDashboard = document.getElementById('user-dashboard');
        if (existingDashboard) {
            this.userDashboard = existingDashboard;
            return;
        }
        
        const dashboardHTML = `
            <div id="user-dashboard" class="user-dashboard" style="display: none;">
                <!-- Dashboard Header -->
                <section class="dashboard-header">
                    <div class="container">
                        <div class="dashboard-welcome">
                            <div class="user-info">
                                <img id="dashboard-avatar" class="user-avatar-large" src="" alt="User Avatar">
                                <div class="user-details">
                                    <h1>Welcome back, <span id="dashboard-username"></span>!</h1>
                                    <p class="user-subtitle">Ready to discover new games?</p>
                                </div>
                            </div>
                            <div class="user-stats">
                                <div class="stat-item">
                                    <span class="stat-number" id="stat-games">0</span>
                                    <span class="stat-label">Games</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-number" id="stat-reviews">0</span>
                                    <span class="stat-label">Reviews</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-number" id="stat-hours">0</span>
                                    <span class="stat-label">Hours</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-number" id="stat-achievements">0</span>
                                    <span class="stat-label">Achievements</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                
                <!-- Quick Actions -->
                <section class="quick-actions">
                    <div class="container">
                        <div class="actions-grid">
                            <div class="action-card">
                                <i class="fas fa-search"></i>
                                <h3>Discover Games</h3>
                                <p>Explore new titles and hidden gems</p>
                                <button class="btn btn-outline">Browse</button>
                            </div>
                            <div class="action-card">
                                <i class="fas fa-list"></i>
                                <h3>My Library</h3>
                                <p>Manage your game collection</p>
                                <button class="btn btn-outline">View Library</button>
                            </div>
                            <div class="action-card">
                                <i class="fas fa-pen"></i>
                                <h3>Write Review</h3>
                                <p>Share your gaming experience</p>
                                <button class="btn btn-outline">Start Writing</button>
                            </div>
                            <div class="action-card">
                                <i class="fas fa-users"></i>
                                <h3>Community</h3>
                                <p>Connect with fellow gamers</p>
                                <button class="btn btn-outline">Join Discussion</button>
                            </div>
                        </div>
                    </div>
                </section>
                
                <!-- Recent Activity -->
                <section class="recent-activity">
                    <div class="container">
                        <h2 class="section-title">Recent Activity</h2>
                        <div class="activity-feed" id="activity-feed">
                            <div class="activity-item">
                                <i class="fas fa-star activity-icon"></i>
                                <div class="activity-content">
                                    <p>Welcome to GameVault! Start by exploring some games.</p>
                                    <span class="activity-time">Just now</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        `;
        
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.insertAdjacentHTML('afterbegin', dashboardHTML);
            this.userDashboard = document.getElementById('user-dashboard');
        }
    }
    
    /**
     * Create authentication modals
     */
    createAuthModals() {
        const modalHTML = `
            <!-- Login Modal -->
            <div id="login-modal" class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Welcome Back</h2>
                        <button class="modal-close" data-modal="login-modal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="login-form" class="auth-form">
                            <div class="form-group">
                                <label for="login-email">Email</label>
                                <input type="email" id="login-email" name="email" required>
                            </div>
                            <div class="form-group">
                                <label for="login-password">Password</label>
                                <div class="password-input">
                                    <input type="password" id="login-password" name="password" required>
                                    <button type="button" class="password-toggle" data-target="login-password">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary btn-full">
                                    <span class="btn-text">Sign In</span>
                                    <span class="btn-loading" style="display: none;">
                                        <i class="fas fa-spinner fa-spin"></i>
                                    </span>
                                </button>
                            </div>
                            <div class="form-footer">
                                <p>Don't have an account? <a href="#" id="switch-to-register">Sign up</a></p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            
            <!-- Register Modal -->
            <div id="register-modal" class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Join GameVault</h2>
                        <button class="modal-close" data-modal="register-modal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="register-form" class="auth-form">
                            <div class="form-group">
                                <label for="register-username">Username</label>
                                <input type="text" id="register-username" name="username" required>
                            </div>
                            <div class="form-group">
                                <label for="register-email">Email</label>
                                <input type="email" id="register-email" name="email" required>
                            </div>
                            <div class="form-group">
                                <label for="register-password">Password</label>
                                <div class="password-input">
                                    <input type="password" id="register-password" name="password" required>
                                    <button type="button" class="password-toggle" data-target="register-password">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="register-confirm-password">Confirm Password</label>
                                <div class="password-input">
                                    <input type="password" id="register-confirm-password" name="confirmPassword" required>
                                    <button type="button" class="password-toggle" data-target="register-confirm-password">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary btn-full">
                                    <span class="btn-text">Create Account</span>
                                    <span class="btn-loading" style="display: none;">
                                        <i class="fas fa-spinner fa-spin"></i>
                                    </span>
                                </button>
                            </div>
                            <div class="form-footer">
                                <p>Already have an account? <a href="#" id="switch-to-login">Sign in</a></p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.setupModalEvents();
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Authentication related buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('#guest-register-btn, #guest-cta-register, #nav-register-btn')) {
                this.showRegisterModal();
            } else if (e.target.matches('#guest-login-btn, #nav-login-btn')) {
                this.showLoginModal();
            } else if (e.target.matches('[data-logout]')) {
                this.logout();
            }
        });
    }
    
    /**
     * Setup modal events
     */
    setupModalEvents() {
        // Modal close events
        document.addEventListener('click', (e) => {
            if (e.target.matches('.modal-close')) {
                const modal = e.target.closest('.modal-overlay');
                this.closeModal(modal);
            } else if (e.target.matches('.modal-overlay')) {
                this.closeModal(e.target);
            }
        });
        
        // Switch between login/register
        document.getElementById('switch-to-register')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeModal(document.getElementById('login-modal'));
            this.showRegisterModal();
        });
        
        document.getElementById('switch-to-login')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeModal(document.getElementById('register-modal'));
            this.showLoginModal();
        });
        
        // Password toggle
        document.addEventListener('click', (e) => {
            if (e.target.matches('.password-toggle') || e.target.closest('.password-toggle')) {
                const button = e.target.closest('.password-toggle');
                const targetId = button.dataset.target;
                const input = document.getElementById(targetId);
                const icon = button.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.replace('fa-eye', 'fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.replace('fa-eye-slash', 'fa-eye');
                }
            }
        });
        
        // Form submissions
        document.getElementById('login-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLoginSubmit(e.target);
        });
        
        document.getElementById('register-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegisterSubmit(e.target);
        });
    }
    
    /**
     * Show login modal
     */
    showLoginModal() {
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('modal-show');
        }
    }
    
    /**
     * Show register modal
     */
    showRegisterModal() {
        const modal = document.getElementById('register-modal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('modal-show');
        }
    }
    
    /**
     * Close modal
     */
    closeModal(modal) {
        if (modal) {
            modal.classList.remove('modal-show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    }
    
    /**
     * Close all auth modals
     */
    closeAuthModals() {
        this.closeModal(document.getElementById('login-modal'));
        this.closeModal(document.getElementById('register-modal'));
    }
    
    /**
     * Handle login form submission
     */
    async handleLoginSubmit(form) {
        const formData = new FormData(form);
        const credentials = {
            email: formData.get('email'),
            password: formData.get('password')
        };
        
        // Show loading state
        this.setFormLoading(form, true);
        
        try {
            const result = await this.login(credentials);
            if (!result.success) {
                this.showFormError(form, result.error);
            }
        } catch (error) {
            this.showFormError(form, error.message);
        } finally {
            this.setFormLoading(form, false);
        }
    }
    
    /**
     * Handle register form submission
     */
    async handleRegisterSubmit(form) {
        const formData = new FormData(form);
        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword')
        };
        
        // Validation
        if (userData.password !== userData.confirmPassword) {
            this.showFormError(form, 'Passwords do not match');
            return;
        }
        
        // Show loading state
        this.setFormLoading(form, true);
        
        try {
            const result = await this.register(userData);
            if (!result.success) {
                this.showFormError(form, result.error);
            }
        } catch (error) {
            this.showFormError(form, error.message);
        } finally {
            this.setFormLoading(form, false);
        }
    }
    
    /**
     * Set form loading state
     */
    setFormLoading(form, isLoading) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        
        if (isLoading) {
            submitBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline-block';
        } else {
            submitBtn.disabled = false;
            btnText.style.display = 'inline-block';
            btnLoading.style.display = 'none';
        }
    }
    
    /**
     * Show form error
     */
    showFormError(form, message) {
        let errorDiv = form.querySelector('.form-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'form-error';
            form.insertBefore(errorDiv, form.querySelector('.form-actions'));
        }
        
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        // Hide error after 5 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
    
    /**
     * Update navigation based on auth state
     */
    updateNavigation(isAuthenticated) {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;
        
        const userProfile = navbar.querySelector('.user-profile');
        const guestActions = navbar.querySelector('.guest-actions');
        const navUserAvatar = document.getElementById('nav-user-avatar');
        
        if (isAuthenticated) {
            navbar.classList.add('authenticated');
            
            // Show user profile dropdown, hide guest buttons
            if (userProfile) {
                userProfile.style.display = 'block';
            }
            if (guestActions) {
                guestActions.style.display = 'none';
            }
            
            // Update user avatar in navigation
            if (navUserAvatar && this.currentUser) {
                navUserAvatar.src = this.currentUser.avatar;
            }
        } else {
            navbar.classList.remove('authenticated');
            
            // Hide user profile, show guest buttons
            if (userProfile) {
                userProfile.style.display = 'none';
            }
            if (guestActions) {
                guestActions.style.display = 'flex';
            }
        }
    }
    
    /**
     * Populate user dashboard with user data
     */
    populateUserDashboard() {
        if (!this.currentUser) return;
        
        // Update user info
        const avatar = document.getElementById('dashboard-avatar');
        const username = document.getElementById('dashboard-username');
        
        if (avatar) avatar.src = this.currentUser.avatar;
        if (username) username.textContent = this.currentUser.displayName;
        
        // Update stats
        const stats = this.currentUser.stats || {};
        const statElements = {
            'stat-games': stats.gamesPlayed || 0,
            'stat-reviews': stats.reviewsWritten || 0,
            'stat-hours': stats.hoursPlayed || 0,
            'stat-achievements': stats.achievements || 0
        };
        
        Object.entries(statElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }
}

// Make AuthManager available globally
window.AuthManager = AuthManager;
