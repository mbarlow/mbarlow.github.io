import { UIComponent } from './UIComponent.js';
import { Debug } from '../utils/Debug.js';
import { UIEvents } from '../utils/EventBus.js';
import { templateRegistry } from '../templates/TemplateRegistry.js';

/**
 * Font Manager Component
 * Handles font switching, dropdown management, and persistence
 */
export class FontManager extends UIComponent {
    constructor(options = {}) {
        super('FontManager', options);
        
        // Default configuration
        this.config = {
            defaultFont: 'Inter',
            storageKey: 'portfolio-font',
            fontCategories: [
                {
                    title: 'Monospace (Code)',
                    fonts: [
                        { name: 'JetBrains Mono', value: 'JetBrains Mono' },
                        { name: 'Fira Code', value: 'Fira Code' },
                        { name: 'Source Code Pro', value: 'Source Code Pro' },
                        { name: 'Roboto Mono', value: 'Roboto Mono' },
                        { name: 'Ubuntu Mono', value: 'Ubuntu Mono' }
                    ]
                },
                {
                    title: 'Sans Serif (Interface)',
                    fonts: [
                        { name: 'Inter', value: 'Inter' },
                        { name: 'Source Sans Pro', value: 'Source Sans Pro' },
                        { name: 'Roboto', value: 'Roboto' },
                        { name: 'Open Sans', value: 'Open Sans' },
                        { name: 'Lato', value: 'Lato' },
                        { name: 'Poppins', value: 'Poppins' },
                        { name: 'Nunito', value: 'Nunito' }
                    ]
                }
            ],
            selectors: {
                toggle: '#font-toggle',
                dropdown: '#font-dropdown',
                close: '#font-dropdown-close',
                options: '.font-option'
            },
            bodyAttribute: 'data-font',
            ...options.config
        };
        
        this.currentFont = null;
        this.isDropdownOpen = false;
        
        Debug.log(this.name, 'Created with config', this.config);
    }

    /**
     * Initialize font manager
     */
    setup() {
        Debug.methodEntry(this.name, 'setup');
        
        // Load saved font or use default
        const savedFont = this.loadFont();
        this.setFont(savedFont, false); // Don't save on initial load
        
        Debug.success(this.name, `Initialized with font: ${this.currentFont}`);
    }

    /**
     * Bind font-related events
     */
    bindEvents() {
        Debug.methodEntry(this.name, 'bindEvents');
        
        // Bind dropdown controls
        this.bindDropdownControls();
        
        // Bind font options
        this.bindFontOptions();
        
        // Listen for font change requests from other components
        this.subscribe(UIEvents.FONT_CHANGED, this.handleFontChangeRequest);
        
        // Close dropdown on Escape key
        this.addEventListener(document, 'keydown', this.handleKeyboardShortcuts);
        
        // Close dropdown on outside click
        this.addEventListener(document, 'click', this.handleOutsideClick);
    }

    /**
     * Bind dropdown toggle and close controls
     */
    bindDropdownControls() {
        const toggle = document.querySelector(this.config.selectors.toggle);
        const close = document.querySelector(this.config.selectors.close);
        const dropdown = document.querySelector(this.config.selectors.dropdown);
        
        if (toggle) {
            Debug.log(this.name, 'Found font toggle button');
            this.addEventListener(toggle, 'click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleDropdown();
            });
        }
        
        if (close) {
            Debug.log(this.name, 'Found font dropdown close button');
            this.addEventListener(close, 'click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideDropdown();
            });
        }
        
        if (dropdown) {
            // Close on backdrop click (clicking outside content area)
            this.addEventListener(dropdown, 'click', (e) => {
                if (e.target === dropdown) {
                    this.hideDropdown();
                }
            });
        }
    }

    /**
     * Bind font option click events
     */
    bindFontOptions() {
        const options = document.querySelectorAll(this.config.selectors.options);
        
        Debug.log(this.name, `Found ${options.length} font options`);
        
        options.forEach((option) => {
            this.addEventListener(option, 'click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const fontName = option.dataset.font;
                if (fontName && this.isValidFont(fontName)) {
                    Debug.log(this.name, `Font option clicked: ${fontName}`);
                    this.setFont(fontName);
                    this.hideDropdown();
                } else {
                    Debug.warn(this.name, `Invalid font from option: ${fontName}`);
                }
            });
        });
    }

    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyboardShortcuts(e) {
        // Close dropdown on Escape
        if (e.key === 'Escape' && this.isDropdownOpen) {
            e.preventDefault();
            this.hideDropdown();
        }
    }

    /**
     * Handle clicks outside the dropdown
     * @param {MouseEvent} e - Mouse event
     */
    handleOutsideClick(e) {
        if (!this.isDropdownOpen) return;
        
        const dropdown = document.querySelector(this.config.selectors.dropdown);
        const toggle = document.querySelector(this.config.selectors.toggle);
        
        // Check if click is outside dropdown and toggle
        if (dropdown && toggle && 
            !dropdown.contains(e.target) && 
            !toggle.contains(e.target)) {
            this.hideDropdown();
        }
    }

    /**
     * Handle font change requests from event bus
     * @param {string} font - Requested font
     */
    handleFontChangeRequest(font) {
        Debug.log(this.name, `Font change requested via event bus: ${font}`);
        if (this.isValidFont(font)) {
            this.setFont(font);
        }
    }

    /**
     * Set the current font
     * @param {string} font - Font name
     * @param {boolean} save - Whether to save to localStorage (default: true)
     */
    setFont(font, save = true) {
        Debug.methodEntry(this.name, 'setFont', { font, save });
        
        if (!this.isValidFont(font)) {
            Debug.error(this.name, `Invalid font: ${font}`, { validFonts: this.getFontNames() });
            return false;
        }
        
        const oldFont = this.currentFont;
        this.currentFont = font;
        
        // Update DOM
        this.updateBodyAttribute(font);
        this.updateFontOptions(font);
        
        // Save to localStorage if requested
        if (save) {
            this.saveFont(font);
        }
        
        // Emit font changed event
        this.emit(UIEvents.FONT_CHANGED, {
            font,
            oldFont,
            timestamp: Date.now()
        });
        
        Debug.success(this.name, `Font changed: ${oldFont} -> ${font}`);
        return true;
    }

    /**
     * Get current font
     * @returns {string} Current font name
     */
    getFont() {
        return this.currentFont;
    }

    /**
     * Get all available fonts organized by category
     * @returns {Array} Array of font category objects
     */
    getFontCategories() {
        return this.config.fontCategories.map(category => ({
            ...category,
            fonts: category.fonts.map(font => ({
                ...font,
                active: font.value === this.currentFont
            }))
        }));
    }

    /**
     * Get all font names (flattened)
     * @returns {Array<string>} Array of font names
     */
    getFontNames() {
        return this.config.fontCategories.flatMap(cat => 
            cat.fonts.map(font => font.value)
        );
    }

    /**
     * Check if font is valid
     * @param {string} font - Font to validate
     * @returns {boolean} True if valid
     */
    isValidFont(font) {
        return this.getFontNames().includes(font);
    }

    /**
     * Show font dropdown
     */
    showDropdown() {
        const dropdown = document.querySelector(this.config.selectors.dropdown);
        if (dropdown) {
            dropdown.classList.add('show');
            this.isDropdownOpen = true;
            
            Debug.log(this.name, 'Font dropdown opened');
            this.emit('fontDropdown:opened');
        }
    }

    /**
     * Hide font dropdown
     */
    hideDropdown() {
        const dropdown = document.querySelector(this.config.selectors.dropdown);
        if (dropdown) {
            dropdown.classList.remove('show');
            this.isDropdownOpen = false;
            
            Debug.log(this.name, 'Font dropdown closed');
            this.emit('fontDropdown:closed');
        }
    }

    /**
     * Toggle font dropdown
     */
    toggleDropdown() {
        if (this.isDropdownOpen) {
            this.hideDropdown();
        } else {
            this.showDropdown();
        }
    }

    /**
     * Update body data attribute
     * @param {string} font - Font name
     */
    updateBodyAttribute(font) {
        const attribute = this.config.bodyAttribute;
        document.body.setAttribute(attribute, font);
        
        Debug.log(this.name, `Updated body ${attribute} to: ${font}`);
    }

    /**
     * Update font option active states
     * @param {string} activeFont - Currently active font
     */
    updateFontOptions(activeFont) {
        const options = document.querySelectorAll(this.config.selectors.options);
        
        options.forEach((option) => {
            const isActive = option.dataset.font === activeFont;
            option.classList.toggle('active', isActive);
        });
        
        Debug.log(this.name, `Updated ${options.length} font options for font: ${activeFont}`);
    }

    /**
     * Load font from localStorage
     * @returns {string} Saved font or default
     */
    loadFont() {
        try {
            const saved = localStorage.getItem(this.config.storageKey);
            const font = saved && this.isValidFont(saved) ? saved : this.config.defaultFont;
            
            Debug.log(this.name, 'Loaded font from storage', { 
                saved, 
                font, 
                isDefault: !saved || !this.isValidFont(saved)
            });
            
            return font;
        } catch (error) {
            Debug.error(this.name, 'Failed to load font from localStorage', error);
            return this.config.defaultFont;
        }
    }

    /**
     * Save font to localStorage
     * @param {string} font - Font to save
     */
    saveFont(font) {
        try {
            localStorage.setItem(this.config.storageKey, font);
            Debug.log(this.name, `Saved font to localStorage: ${font}`);
        } catch (error) {
            Debug.error(this.name, 'Failed to save font to localStorage', error);
        }
    }

    /**
     * Render font dropdown using template
     * @param {Object} options - Render options
     * @returns {string} Rendered HTML
     */
    renderFontDropdown(options = {}) {
        const sections = this.getFontCategories();
        
        return templateRegistry.render('fontDropdown', {
            open: this.isDropdownOpen,
            sections,
            ...options
        });
    }

    /**
     * Find fonts by category
     * @param {string} category - Category name (e.g., 'monospace', 'sans-serif')
     * @returns {Array} Fonts in category
     */
    getFontsByCategory(category) {
        const lowerCategory = category.toLowerCase();
        return this.config.fontCategories.find(cat => 
            cat.title.toLowerCase().includes(lowerCategory)
        )?.fonts || [];
    }

    /**
     * Search fonts by name
     * @param {string} query - Search query
     * @returns {Array} Matching fonts
     */
    searchFonts(query) {
        const lowerQuery = query.toLowerCase();
        const results = [];
        
        this.config.fontCategories.forEach(category => {
            category.fonts.forEach(font => {
                if (font.name.toLowerCase().includes(lowerQuery)) {
                    results.push({
                        ...font,
                        category: category.title
                    });
                }
            });
        });
        
        return results;
    }

    /**
     * Get component state
     * @returns {Object} Current state
     */
    getState() {
        return {
            currentFont: this.currentFont,
            isDropdownOpen: this.isDropdownOpen,
            availableFonts: this.getFontNames(),
            config: this.config
        };
    }

    /**
     * Restore component state
     * @param {Object} state - State to restore
     */
    setState(state) {
        if (state.currentFont && this.isValidFont(state.currentFont)) {
            this.setFont(state.currentFont, false);
        }
        
        if (state.isDropdownOpen) {
            this.showDropdown();
        } else {
            this.hideDropdown();
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