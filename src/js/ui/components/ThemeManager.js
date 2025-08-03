import { UIComponent } from './UIComponent.js';
import { Debug } from '../utils/Debug.js';
import { UIEvents } from '../utils/EventBus.js';
import { templateRegistry } from '../templates/TemplateRegistry.js';

/**
 * Theme Manager Component
 * Handles theme switching, persistence, and UI updates
 */
export class ThemeManager extends UIComponent {
    constructor(options = {}) {
        super('ThemeManager', options);
        
        // Default configuration
        this.config = {
            defaultTheme: 'dark',
            storageKey: 'portfolio-theme',
            themes: [
                { value: 'light', label: 'Light', className: 'theme-light' },
                { value: 'dark', label: 'Dark', className: 'theme-dark' },
                { value: 'grey', label: 'Grey', className: 'theme-grey' }
            ],
            buttonSelector: '.theme-btn',
            bodyAttribute: 'data-theme',
            ...options.config
        };
        
        this.currentTheme = null;
        
        Debug.log(this.name, 'Created with config', this.config);
    }

    /**
     * Initialize theme manager
     */
    setup() {
        Debug.methodEntry(this.name, 'setup');
        
        // Load saved theme or use default
        const savedTheme = this.loadTheme();
        this.setTheme(savedTheme, false); // Don't save on initial load
        
        Debug.success(this.name, `Initialized with theme: ${this.currentTheme}`);
    }

    /**
     * Bind theme-related events
     */
    bindEvents() {
        Debug.methodEntry(this.name, 'bindEvents');
        
        // Find and bind theme buttons
        this.bindThemeButtons();
        
        // Listen for keyboard shortcuts (1, 2, 3 for themes)
        this.addEventListener(document, 'keydown', this.handleKeyboardShortcuts);
        
        // Listen for theme change requests from other components
        this.subscribe(UIEvents.THEME_CHANGED, this.handleThemeChangeRequest);
    }

    /**
     * Bind click events to theme buttons
     */
    bindThemeButtons() {
        const themeButtons = document.querySelectorAll(this.config.buttonSelector);
        
        Debug.log(this.name, `Found ${themeButtons.length} theme buttons`);
        
        themeButtons.forEach((btn) => {
            this.addEventListener(btn, 'click', (e) => {
                e.preventDefault();
                const theme = btn.dataset.theme;
                
                if (theme && this.isValidTheme(theme)) {
                    Debug.log(this.name, `Button clicked for theme: ${theme}`);
                    this.setTheme(theme);
                } else {
                    Debug.warn(this.name, `Invalid theme from button: ${theme}`);
                }
            });
        });
    }

    /**
     * Handle keyboard shortcuts for theme switching
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyboardShortcuts(e) {
        // Only handle if no modifiers are pressed and not in an input
        if (e.ctrlKey || e.altKey || e.metaKey || e.target.matches('input, textarea')) {
            return;
        }
        
        const keyThemeMap = {
            '1': 'light',
            '2': 'dark', 
            '3': 'grey'
        };
        
        const theme = keyThemeMap[e.key];
        if (theme && this.isValidTheme(theme)) {
            e.preventDefault();
            Debug.log(this.name, `Keyboard shortcut: ${e.key} -> ${theme}`);
            this.setTheme(theme);
        }
    }

    /**
     * Handle theme change requests from event bus
     * @param {string} theme - Requested theme
     */
    handleThemeChangeRequest(theme) {
        Debug.log(this.name, `Theme change requested via event bus: ${theme}`);
        if (this.isValidTheme(theme)) {
            this.setTheme(theme);
        }
    }

    /**
     * Set the current theme
     * @param {string} theme - Theme name
     * @param {boolean} save - Whether to save to localStorage (default: true)
     */
    setTheme(theme, save = true) {
        Debug.methodEntry(this.name, 'setTheme', { theme, save });
        
        if (!this.isValidTheme(theme)) {
            Debug.error(this.name, `Invalid theme: ${theme}`, { validThemes: this.getThemeNames() });
            return false;
        }
        
        const oldTheme = this.currentTheme;
        this.currentTheme = theme;
        
        // Update DOM
        this.updateBodyAttribute(theme);
        this.updateThemeButtons(theme);
        
        // Save to localStorage if requested
        if (save) {
            this.saveTheme(theme);
        }
        
        // Emit theme changed event
        this.emit(UIEvents.THEME_CHANGED, {
            theme,
            oldTheme,
            timestamp: Date.now()
        });
        
        Debug.success(this.name, `Theme changed: ${oldTheme} -> ${theme}`);
        return true;
    }

    /**
     * Get current theme
     * @returns {string} Current theme name
     */
    getTheme() {
        return this.currentTheme;
    }

    /**
     * Get all available themes
     * @returns {Array} Array of theme objects
     */
    getThemes() {
        return [...this.config.themes];
    }

    /**
     * Get theme names only
     * @returns {Array<string>} Array of theme names
     */
    getThemeNames() {
        return this.config.themes.map(t => t.value);
    }

    /**
     * Check if theme is valid
     * @param {string} theme - Theme to validate
     * @returns {boolean} True if valid
     */
    isValidTheme(theme) {
        return this.getThemeNames().includes(theme);
    }

    /**
     * Update body data attribute
     * @param {string} theme - Theme name
     */
    updateBodyAttribute(theme) {
        const attribute = this.config.bodyAttribute;
        document.body.setAttribute(attribute, theme);
        
        Debug.log(this.name, `Updated body ${attribute} to: ${theme}`);
    }

    /**
     * Update theme button active states
     * @param {string} activeTheme - Currently active theme
     */
    updateThemeButtons(activeTheme) {
        const buttons = document.querySelectorAll(this.config.buttonSelector);
        
        buttons.forEach((btn) => {
            const isActive = btn.dataset.theme === activeTheme;
            btn.classList.toggle('active', isActive);
        });
        
        Debug.log(this.name, `Updated ${buttons.length} theme buttons for theme: ${activeTheme}`);
    }

    /**
     * Load theme from localStorage
     * @returns {string} Saved theme or default
     */
    loadTheme() {
        try {
            const saved = localStorage.getItem(this.config.storageKey);
            const theme = saved && this.isValidTheme(saved) ? saved : this.config.defaultTheme;
            
            Debug.log(this.name, 'Loaded theme from storage', { 
                saved, 
                theme, 
                isDefault: !saved || !this.isValidTheme(saved)
            });
            
            return theme;
        } catch (error) {
            Debug.error(this.name, 'Failed to load theme from localStorage', error);
            return this.config.defaultTheme;
        }
    }

    /**
     * Save theme to localStorage
     * @param {string} theme - Theme to save
     */
    saveTheme(theme) {
        try {
            localStorage.setItem(this.config.storageKey, theme);
            Debug.log(this.name, `Saved theme to localStorage: ${theme}`);
        } catch (error) {
            Debug.error(this.name, 'Failed to save theme to localStorage', error);
        }
    }

    /**
     * Cycle to next theme
     */
    nextTheme() {
        const themes = this.getThemeNames();
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        const nextTheme = themes[nextIndex];
        
        Debug.log(this.name, `Cycling to next theme: ${this.currentTheme} -> ${nextTheme}`);
        this.setTheme(nextTheme);
    }

    /**
     * Cycle to previous theme
     */
    previousTheme() {
        const themes = this.getThemeNames();
        const currentIndex = themes.indexOf(this.currentTheme);
        const prevIndex = currentIndex === 0 ? themes.length - 1 : currentIndex - 1;
        const prevTheme = themes[prevIndex];
        
        Debug.log(this.name, `Cycling to previous theme: ${this.currentTheme} -> ${prevTheme}`);
        this.setTheme(prevTheme);
    }

    /**
     * Render theme selector using template
     * @param {Object} options - Render options
     * @returns {string} Rendered HTML
     */
    renderThemeSelector(options = {}) {
        const themes = this.config.themes.map(theme => ({
            ...theme,
            active: theme.value === this.currentTheme
        }));
        
        return templateRegistry.render('themeSelector', {
            themes,
            ...options
        });
    }

    /**
     * Get component state
     * @returns {Object} Current state
     */
    getState() {
        return {
            currentTheme: this.currentTheme,
            availableThemes: this.getThemeNames(),
            config: this.config
        };
    }

    /**
     * Restore component state
     * @param {Object} state - State to restore
     */
    setState(state) {
        if (state.currentTheme && this.isValidTheme(state.currentTheme)) {
            this.setTheme(state.currentTheme, false);
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
    }
}