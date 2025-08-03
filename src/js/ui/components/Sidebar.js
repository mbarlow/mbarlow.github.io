import { UIComponent } from './UIComponent.js';
import { Debug } from '../utils/Debug.js';
import { UIEvents } from '../utils/EventBus.js';

/**
 * Sidebar Component
 * Handles sidebar collapse/expand functionality and state persistence
 */
export class Sidebar extends UIComponent {
    constructor(options = {}) {
        super('Sidebar', options);
        
        // Default configuration
        this.config = {
            storageKey: 'sidebar-collapsed',
            selectors: {
                sidebar: '#sidebar',
                toggle: '#sidebar-toggle'
            },
            classes: {
                collapsed: 'collapsed'
            },
            breakpoints: {
                mobile: 768,
                tablet: 1024
            },
            ...options.config
        };
        
        this.isCollapsed = false;
        this.isMobile = false;
        
        Debug.log(this.name, 'Created with config', this.config);
    }

    /**
     * Initialize sidebar
     */
    setup() {
        Debug.methodEntry(this.name, 'setup');
        
        // Check initial responsive state
        this.updateResponsiveState();
        
        // Load saved sidebar state
        const savedCollapsed = this.loadState();
        if (savedCollapsed && !this.isMobile) {
            this.collapse(false); // Don't save on initial load
        }
        
        Debug.success(this.name, `Initialized - collapsed: ${this.isCollapsed}, mobile: ${this.isMobile}`);
    }

    /**
     * Bind sidebar events
     */
    bindEvents() {
        Debug.methodEntry(this.name, 'bindEvents');
        
        // Bind toggle button
        this.bindToggleButton();
        
        // Listen for window resize
        this.addEventListener(window, 'resize', this.handleResize);
        
        // Listen for sidebar requests from other components
        this.subscribe(UIEvents.SIDEBAR_TOGGLED, this.handleSidebarRequest);
        
        // Listen for keyboard shortcuts
        this.addEventListener(document, 'keydown', this.handleKeyboardShortcuts);
    }

    /**
     * Bind sidebar toggle button
     */
    bindToggleButton() {
        const toggle = document.querySelector(this.config.selectors.toggle);
        const sidebar = document.querySelector(this.config.selectors.sidebar);
        
        if (toggle && sidebar) {
            Debug.log(this.name, 'Found sidebar and toggle elements');
            
            this.addEventListener(toggle, 'click', (e) => {
                e.preventDefault();
                Debug.log(this.name, 'Toggle button clicked');
                this.toggle();
            });
        } else {
            Debug.warn(this.name, 'Sidebar or toggle element not found', {
                sidebar: !!sidebar,
                toggle: !!toggle
            });
        }
    }

    /**
     * Handle window resize events
     */
    handleResize = () => {
        const wasOnMobile = this.isMobile;
        this.updateResponsiveState();
        
        // If we switched from mobile to desktop, restore saved state
        if (wasOnMobile && !this.isMobile) {
            const savedCollapsed = this.loadState();
            if (savedCollapsed !== this.isCollapsed) {
                savedCollapsed ? this.collapse(false) : this.expand(false);
            }
        }
        
        // If we switched to mobile, always expand
        if (!wasOnMobile && this.isMobile && this.isCollapsed) {
            this.expand(false);
        }
    };

    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyboardShortcuts(e) {
        // Toggle sidebar with Ctrl+B or Cmd+B
        if ((e.ctrlKey || e.metaKey) && e.key === 'b' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            Debug.log(this.name, 'Keyboard shortcut: Ctrl/Cmd+B');
            this.toggle();
        }
    }

    /**
     * Handle sidebar requests from event bus
     * @param {Object} data - Event data
     */
    handleSidebarRequest(data) {
        Debug.log(this.name, 'Sidebar request via event bus', data);
        
        if (data.action === 'toggle') {
            this.toggle();
        } else if (data.action === 'collapse') {
            this.collapse();
        } else if (data.action === 'expand') {
            this.expand();
        }
    }

    /**
     * Toggle sidebar state
     */
    toggle() {
        Debug.methodEntry(this.name, 'toggle');
        
        if (this.isCollapsed) {
            this.expand();
        } else {
            this.collapse();
        }
    }

    /**
     * Collapse sidebar
     * @param {boolean} save - Whether to save state (default: true)
     */
    collapse(save = true) {
        Debug.methodEntry(this.name, 'collapse', { save });
        
        // On mobile, don't allow collapse
        if (this.isMobile) {
            Debug.log(this.name, 'Collapse prevented on mobile');
            return false;
        }
        
        const sidebar = document.querySelector(this.config.selectors.sidebar);
        if (sidebar) {
            sidebar.classList.add(this.config.classes.collapsed);
            this.isCollapsed = true;
            
            if (save) {
                this.saveState(true);
            }
            
            // Emit event
            this.emit(UIEvents.SIDEBAR_TOGGLED, {
                collapsed: true,
                action: 'collapsed',
                timestamp: Date.now()
            });
            
            Debug.success(this.name, 'Sidebar collapsed');
            return true;
        }
        
        return false;
    }

    /**
     * Expand sidebar
     * @param {boolean} save - Whether to save state (default: true)
     */
    expand(save = true) {
        Debug.methodEntry(this.name, 'expand', { save });
        
        const sidebar = document.querySelector(this.config.selectors.sidebar);
        if (sidebar) {
            sidebar.classList.remove(this.config.classes.collapsed);
            this.isCollapsed = false;
            
            if (save) {
                this.saveState(false);
            }
            
            // Emit event
            this.emit(UIEvents.SIDEBAR_TOGGLED, {
                collapsed: false,
                action: 'expanded',
                timestamp: Date.now()
            });
            
            Debug.success(this.name, 'Sidebar expanded');
            return true;
        }
        
        return false;
    }

    /**
     * Get current sidebar state
     * @returns {boolean} True if collapsed
     */
    isCollapsedState() {
        return this.isCollapsed;
    }

    /**
     * Check if sidebar is expanded
     * @returns {boolean} True if expanded
     */
    isExpanded() {
        return !this.isCollapsed;
    }

    /**
     * Update responsive state based on window size
     */
    updateResponsiveState() {
        const windowWidth = window.innerWidth;
        const wasMobile = this.isMobile;
        
        this.isMobile = windowWidth < this.config.breakpoints.mobile;
        
        if (wasMobile !== this.isMobile) {
            Debug.log(this.name, `Responsive state changed: mobile = ${this.isMobile}`, {
                windowWidth,
                breakpoint: this.config.breakpoints.mobile
            });
        }
    }

    /**
     * Load sidebar state from localStorage
     * @returns {boolean} Saved collapsed state
     */
    loadState() {
        try {
            const saved = localStorage.getItem(this.config.storageKey);
            const collapsed = saved === 'true';
            
            Debug.log(this.name, 'Loaded sidebar state from storage', {
                saved,
                collapsed
            });
            
            return collapsed;
        } catch (error) {
            Debug.error(this.name, 'Failed to load sidebar state', error);
            return false;
        }
    }

    /**
     * Save sidebar state to localStorage
     * @param {boolean} collapsed - Collapsed state
     */
    saveState(collapsed) {
        try {
            localStorage.setItem(this.config.storageKey, collapsed.toString());
            Debug.log(this.name, `Saved sidebar state: ${collapsed}`);
        } catch (error) {
            Debug.error(this.name, 'Failed to save sidebar state', error);
        }
    }

    /**
     * Force responsive behavior for testing
     * @param {boolean} mobile - Force mobile state
     */
    setMobileMode(mobile) {
        const wasMobile = this.isMobile;
        this.isMobile = mobile;
        
        Debug.log(this.name, `Forced mobile mode: ${mobile}`);
        
        if (mobile && this.isCollapsed) {
            this.expand(false);
        } else if (!mobile && wasMobile) {
            const savedCollapsed = this.loadState();
            if (savedCollapsed) {
                this.collapse(false);
            }
        }
    }

    /**
     * Get sidebar width information
     * @returns {Object} Width information
     */
    getWidthInfo() {
        const sidebar = document.querySelector(this.config.selectors.sidebar);
        
        if (sidebar) {
            const computedStyle = window.getComputedStyle(sidebar);
            return {
                collapsed: this.isCollapsed,
                width: sidebar.offsetWidth,
                computedWidth: computedStyle.width,
                mobile: this.isMobile
            };
        }
        
        return null;
    }

    /**
     * Set custom breakpoints
     * @param {Object} breakpoints - New breakpoint values
     */
    setBreakpoints(breakpoints) {
        this.config.breakpoints = { ...this.config.breakpoints, ...breakpoints };
        this.updateResponsiveState();
        
        Debug.log(this.name, 'Updated breakpoints', this.config.breakpoints);
    }

    /**
     * Add CSS class to sidebar
     * @param {string} className - Class to add
     */
    addClass(className) {
        const sidebar = document.querySelector(this.config.selectors.sidebar);
        if (sidebar) {
            sidebar.classList.add(className);
            Debug.log(this.name, `Added class: ${className}`);
        }
    }

    /**
     * Remove CSS class from sidebar
     * @param {string} className - Class to remove
     */
    removeClass(className) {
        const sidebar = document.querySelector(this.config.selectors.sidebar);
        if (sidebar) {
            sidebar.classList.remove(className);
            Debug.log(this.name, `Removed class: ${className}`);
        }
    }

    /**
     * Get component state
     * @returns {Object} Current state
     */
    getState() {
        return {
            isCollapsed: this.isCollapsed,
            isMobile: this.isMobile,
            widthInfo: this.getWidthInfo(),
            config: this.config
        };
    }

    /**
     * Restore component state
     * @param {Object} state - State to restore
     */
    setState(state) {
        if (typeof state.isCollapsed === 'boolean') {
            if (state.isCollapsed) {
                this.collapse(false);
            } else {
                this.expand(false);
            }
        }
        
        if (typeof state.isMobile === 'boolean') {
            this.setMobileMode(state.isMobile);
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
        
        // Re-bind events if selectors changed
        if (newConfig.selectors) {
            this.bindToggleButton();
        }
        
        // Update responsive state if breakpoints changed
        if (newConfig.breakpoints) {
            this.updateResponsiveState();
        }
    }

    /**
     * Get sidebar element
     * @returns {HTMLElement|null} Sidebar element
     */
    getSidebarElement() {
        return document.querySelector(this.config.selectors.sidebar);
    }

    /**
     * Get toggle element
     * @returns {HTMLElement|null} Toggle element
     */
    getToggleElement() {
        return document.querySelector(this.config.selectors.toggle);
    }
}