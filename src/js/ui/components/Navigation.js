import { UIComponent } from './UIComponent.js';
import { Debug } from '../utils/Debug.js';
import { UIEvents } from '../utils/EventBus.js';
import { templateRegistry } from '../templates/TemplateRegistry.js';

/**
 * Navigation Component
 * Handles view switching and navigation state management
 */
export class Navigation extends UIComponent {
    constructor(options = {}) {
        super('Navigation', options);
        
        // Default configuration
        this.config = {
            defaultView: 'chat',
            views: [
                {
                    id: 'chat',
                    label: 'Chat',
                    icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
                    viewId: 'chat-view'
                },
                {
                    id: 'projects',
                    label: 'Projects', 
                    icon: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
                    viewId: 'projects-view'
                },
                {
                    id: 'about',
                    label: 'About',
                    icon: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
                    viewId: 'about-view'
                }
            ],
            selectors: {
                navItems: '.nav-item',
                views: '.view'
            },
            activeClass: 'active',
            ...options.config
        };
        
        this.currentView = null;
        this.viewHistory = [];
        
        Debug.log(this.name, 'Created with config', this.config);
    }

    /**
     * Initialize navigation
     */
    setup() {
        Debug.methodEntry(this.name, 'setup');
        
        // Set initial view
        const initialView = this.config.defaultView;
        this.switchView(initialView, false); // Don't emit event on initial load
        
        Debug.success(this.name, `Initialized with view: ${this.currentView}`);
    }

    /**
     * Bind navigation events
     */
    bindEvents() {
        Debug.methodEntry(this.name, 'bindEvents');
        
        // Bind nav item clicks
        this.bindNavItems();
        
        // Listen for view change requests from other components
        this.subscribe(UIEvents.VIEW_CHANGED, this.handleViewChangeRequest);
        
        // Listen for keyboard shortcuts
        this.addEventListener(document, 'keydown', this.handleKeyboardShortcuts);
    }

    /**
     * Bind navigation item click events
     */
    bindNavItems() {
        const navItems = document.querySelectorAll(this.config.selectors.navItems);
        
        Debug.log(this.name, `Found ${navItems.length} navigation items`);
        
        navItems.forEach((item) => {
            this.addEventListener(item, 'click', (e) => {
                e.preventDefault();
                const viewName = item.dataset.view;
                
                if (viewName && this.isValidView(viewName)) {
                    Debug.log(this.name, `Nav item clicked: ${viewName}`);
                    this.switchView(viewName);
                } else {
                    Debug.warn(this.name, `Invalid view from nav item: ${viewName}`);
                }
            });
        });
    }

    /**
     * Handle keyboard shortcuts for navigation
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyboardShortcuts(e) {
        // Only handle if no modifiers are pressed and not in an input
        if (e.ctrlKey || e.altKey || e.metaKey || e.target.matches('input, textarea')) {
            return;
        }
        
        // Handle Ctrl+Number for view switching
        if (e.ctrlKey && e.key >= '1' && e.key <= '9') {
            const viewIndex = parseInt(e.key) - 1;
            const view = this.config.views[viewIndex];
            
            if (view) {
                e.preventDefault();
                Debug.log(this.name, `Keyboard shortcut: Ctrl+${e.key} -> ${view.id}`);
                this.switchView(view.id);
            }
        }
    }

    /**
     * Handle view change requests from event bus
     * @param {string} viewName - Requested view
     */
    handleViewChangeRequest(viewName) {
        Debug.log(this.name, `View change requested via event bus: ${viewName}`);
        if (this.isValidView(viewName)) {
            this.switchView(viewName);
        }
    }

    /**
     * Switch to a different view
     * @param {string} viewName - View to switch to
     * @param {boolean} emitEvent - Whether to emit change event (default: true)
     */
    switchView(viewName, emitEvent = true) {
        Debug.methodEntry(this.name, 'switchView', { viewName, emitEvent });
        
        if (!this.isValidView(viewName)) {
            Debug.error(this.name, `Invalid view: ${viewName}`, { validViews: this.getViewNames() });
            return false;
        }
        
        const oldView = this.currentView;
        
        // Update navigation state
        this.updateNavItems(viewName);
        this.updateViews(viewName);
        
        // Update current view and history
        this.currentView = viewName;
        this.addToHistory(viewName);
        
        // Emit view changed event
        if (emitEvent) {
            this.emit(UIEvents.VIEW_CHANGED, {
                view: viewName,
                oldView,
                timestamp: Date.now()
            });
        }
        
        Debug.success(this.name, `View switched: ${oldView} -> ${viewName}`);
        return true;
    }

    /**
     * Get current view
     * @returns {string} Current view name
     */
    getCurrentView() {
        return this.currentView;
    }

    /**
     * Get all available views
     * @returns {Array} Array of view objects
     */
    getViews() {
        return [...this.config.views];
    }

    /**
     * Get view names only
     * @returns {Array<string>} Array of view names
     */
    getViewNames() {
        return this.config.views.map(v => v.id);
    }

    /**
     * Check if view is valid
     * @param {string} viewName - View to validate
     * @returns {boolean} True if valid
     */
    isValidView(viewName) {
        return this.getViewNames().includes(viewName);
    }

    /**
     * Get view by name
     * @param {string} viewName - View name
     * @returns {Object|null} View object or null
     */
    getView(viewName) {
        return this.config.views.find(v => v.id === viewName) || null;
    }

    /**
     * Update navigation item active states
     * @param {string} activeView - Currently active view
     */
    updateNavItems(activeView) {
        const navItems = document.querySelectorAll(this.config.selectors.navItems);
        
        navItems.forEach((item) => {
            const isActive = item.dataset.view === activeView;
            item.classList.toggle(this.config.activeClass, isActive);
        });
        
        Debug.log(this.name, `Updated ${navItems.length} nav items for view: ${activeView}`);
    }

    /**
     * Update view visibility
     * @param {string} activeView - Currently active view
     */
    updateViews(activeView) {
        const views = document.querySelectorAll(this.config.selectors.views);
        
        // Hide all views
        views.forEach((view) => {
            view.classList.remove(this.config.activeClass);
        });
        
        // Show target view
        const viewConfig = this.getView(activeView);
        if (viewConfig) {
            const targetView = document.getElementById(viewConfig.viewId);
            if (targetView) {
                targetView.classList.add(this.config.activeClass);
                Debug.log(this.name, `Activated view: ${viewConfig.viewId}`);
            } else {
                Debug.warn(this.name, `View element not found: ${viewConfig.viewId}`);
            }
        }
        
        Debug.log(this.name, `Updated ${views.length} views for view: ${activeView}`);
    }

    /**
     * Add view to navigation history
     * @param {string} viewName - View name
     */
    addToHistory(viewName) {
        // Remove if already in history
        this.viewHistory = this.viewHistory.filter(v => v !== viewName);
        
        // Add to front
        this.viewHistory.unshift(viewName);
        
        // Keep only last 10 views
        this.viewHistory = this.viewHistory.slice(0, 10);
        
        Debug.log(this.name, `Added to history: ${viewName}`, { history: this.viewHistory });
    }

    /**
     * Get navigation history
     * @returns {Array<string>} View history
     */
    getHistory() {
        return [...this.viewHistory];
    }

    /**
     * Go to previous view in history
     */
    goBack() {
        if (this.viewHistory.length > 1) {
            const previousView = this.viewHistory[1]; // [0] is current, [1] is previous
            Debug.log(this.name, `Going back to: ${previousView}`);
            this.switchView(previousView);
        } else {
            Debug.log(this.name, 'No history to go back to');
        }
    }

    /**
     * Navigate to next view (cyclic)
     */
    nextView() {
        const views = this.getViewNames();
        const currentIndex = views.indexOf(this.currentView);
        const nextIndex = (currentIndex + 1) % views.length;
        const nextView = views[nextIndex];
        
        Debug.log(this.name, `Cycling to next view: ${this.currentView} -> ${nextView}`);
        this.switchView(nextView);
    }

    /**
     * Navigate to previous view (cyclic)
     */
    previousView() {
        const views = this.getViewNames();
        const currentIndex = views.indexOf(this.currentView);
        const prevIndex = currentIndex === 0 ? views.length - 1 : currentIndex - 1;
        const prevView = views[prevIndex];
        
        Debug.log(this.name, `Cycling to previous view: ${this.currentView} -> ${prevView}`);
        this.switchView(prevView);
    }

    /**
     * Render navigation using template
     * @param {Object} options - Render options
     * @returns {string} Rendered HTML
     */
    renderNavigation(options = {}) {
        const items = this.config.views.map(view => ({
            ...view,
            active: view.id === this.currentView
        }));
        
        return templateRegistry.render('navigation', {
            items,
            ...options
        });
    }

    /**
     * Add a new view to navigation
     * @param {Object} viewConfig - View configuration
     */
    addView(viewConfig) {
        if (!viewConfig.id || this.isValidView(viewConfig.id)) {
            Debug.warn(this.name, `View already exists or invalid: ${viewConfig.id}`);
            return false;
        }
        
        const view = {
            id: viewConfig.id,
            label: viewConfig.label || viewConfig.id,
            icon: viewConfig.icon || '',
            viewId: viewConfig.viewId || `${viewConfig.id}-view`,
            ...viewConfig
        };
        
        this.config.views.push(view);
        Debug.log(this.name, `Added view: ${view.id}`, view);
        
        // Re-bind events to include new view
        this.bindNavItems();
        
        return true;
    }

    /**
     * Remove a view from navigation
     * @param {string} viewId - View ID to remove
     */
    removeView(viewId) {
        if (!this.isValidView(viewId)) {
            Debug.warn(this.name, `View does not exist: ${viewId}`);
            return false;
        }
        
        // Don't allow removing the current view
        if (this.currentView === viewId) {
            Debug.warn(this.name, `Cannot remove current view: ${viewId}`);
            return false;
        }
        
        this.config.views = this.config.views.filter(v => v.id !== viewId);
        this.viewHistory = this.viewHistory.filter(v => v !== viewId);
        
        Debug.log(this.name, `Removed view: ${viewId}`);
        return true;
    }

    /**
     * Get component state
     * @returns {Object} Current state
     */
    getState() {
        return {
            currentView: this.currentView,
            viewHistory: this.viewHistory,
            availableViews: this.getViewNames(),
            config: this.config
        };
    }

    /**
     * Restore component state
     * @param {Object} state - State to restore
     */
    setState(state) {
        if (state.currentView && this.isValidView(state.currentView)) {
            this.switchView(state.currentView, false);
        }
        
        if (state.viewHistory && Array.isArray(state.viewHistory)) {
            this.viewHistory = [...state.viewHistory];
        }
        
        Debug.log(this.name, 'State restored', state);
    }

    /**
     * Update component configuration
     * @param {Object} newConfig - New configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        Debug.log(this.name, 'Configuration updated', newConfig);
        
        // Re-bind events if views changed
        if (newConfig.views) {
            this.bindNavItems();
        }
    }
}