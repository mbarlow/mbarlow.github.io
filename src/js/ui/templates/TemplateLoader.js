import { Debug } from '../utils/Debug.js';
import { template } from './Template.js';

/**
 * Template loader and cache manager
 * Handles loading templates from various sources
 */
export class TemplateLoader {
    constructor() {
        this.templates = new Map();
        this.loaders = new Map();
        
        // Register default loaders
        this.registerLoader('dom', this.loadFromDOM.bind(this));
        this.registerLoader('string', this.loadFromString.bind(this));
        this.registerLoader('url', this.loadFromURL.bind(this));
        
        Debug.log('TemplateLoader', 'Initialized');
    }

    /**
     * Register a template
     * @param {string} name - Template name
     * @param {string} templateString - Template string
     */
    register(name, templateString) {
        this.templates.set(name, {
            source: templateString,
            compiled: null,
            lastUsed: Date.now()
        });
        
        Debug.log('TemplateLoader', `Registered template: ${name}`, {
            length: templateString.length
        });
    }

    /**
     * Load and register template from source
     * @param {string} name - Template name
     * @param {string} source - Source string (e.g., '#template-id', 'url:path/to/template.html')
     * @returns {Promise<string>} Template string
     */
    async load(name, source) {
        Debug.log('TemplateLoader', `Loading template: ${name}`, { source });
        
        // Parse source type
        const [type, ...rest] = source.split(':');
        const loader = this.loaders.get(type) || this.loaders.get('dom');
        
        if (!loader) {
            throw new Error(`Unknown template loader type: ${type}`);
        }
        
        try {
            const templateString = await loader(type === source ? source : rest.join(':'));
            this.register(name, templateString);
            return templateString;
        } catch (error) {
            Debug.error('TemplateLoader', `Failed to load template: ${name}`, error);
            throw error;
        }
    }

    /**
     * Get template by name
     * @param {string} name - Template name
     * @returns {string|null} Template string
     */
    get(name) {
        const templateData = this.templates.get(name);
        if (templateData) {
            templateData.lastUsed = Date.now();
            return templateData.source;
        }
        return null;
    }

    /**
     * Render template by name
     * @param {string} name - Template name
     * @param {Object} context - Context data
     * @param {Object} options - Render options
     * @returns {string} Rendered output
     */
    render(name, context = {}, options = {}) {
        const templateString = this.get(name);
        if (!templateString) {
            throw new Error(`Template not found: ${name}`);
        }
        
        // Use template name as cache key
        return template.render(templateString, context, {
            ...options,
            cacheKey: name
        });
    }

    /**
     * Load template from DOM element
     * @param {string} selector - CSS selector or element ID
     * @returns {Promise<string>} Template string
     */
    async loadFromDOM(selector) {
        // Handle ID selector
        const elementSelector = selector.startsWith('#') ? selector : `#${selector}`;
        const element = document.querySelector(elementSelector);
        
        if (!element) {
            throw new Error(`Template element not found: ${elementSelector}`);
        }
        
        // Get template content
        if (element.tagName === 'SCRIPT' && element.type === 'text/template') {
            return element.textContent.trim();
        } else if (element.tagName === 'TEMPLATE') {
            return element.innerHTML.trim();
        } else {
            return element.innerHTML.trim();
        }
    }

    /**
     * Load template from string
     * @param {string} templateString - Template string
     * @returns {Promise<string>} Template string
     */
    async loadFromString(templateString) {
        return templateString;
    }

    /**
     * Load template from URL
     * @param {string} url - Template URL
     * @returns {Promise<string>} Template string
     */
    async loadFromURL(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.text();
        } catch (error) {
            throw new Error(`Failed to load template from URL: ${url} - ${error.message}`);
        }
    }

    /**
     * Register custom loader
     * @param {string} type - Loader type
     * @param {Function} loader - Loader function
     */
    registerLoader(type, loader) {
        this.loaders.set(type, loader);
        Debug.log('TemplateLoader', `Registered loader: ${type}`);
    }

    /**
     * Preload multiple templates
     * @param {Object} templates - Object mapping names to sources
     * @returns {Promise<void>}
     */
    async preload(templates) {
        const promises = [];
        
        for (const [name, source] of Object.entries(templates)) {
            promises.push(this.load(name, source));
        }
        
        await Promise.all(promises);
        Debug.log('TemplateLoader', `Preloaded ${promises.length} templates`);
    }

    /**
     * Clear old templates from cache
     * @param {number} maxAge - Maximum age in milliseconds
     */
    cleanup(maxAge = 3600000) { // Default: 1 hour
        const now = Date.now();
        let removed = 0;
        
        for (const [name, data] of this.templates) {
            if (now - data.lastUsed > maxAge) {
                this.templates.delete(name);
                removed++;
            }
        }
        
        if (removed > 0) {
            Debug.log('TemplateLoader', `Cleaned up ${removed} old templates`);
        }
    }

    /**
     * Get all registered template names
     * @returns {Array<string>} Template names
     */
    list() {
        return Array.from(this.templates.keys());
    }

    /**
     * Clear all templates
     */
    clear() {
        const count = this.templates.size;
        this.templates.clear();
        template.clearCache();
        Debug.log('TemplateLoader', `Cleared ${count} templates`);
    }

    /**
     * Export all templates (for debugging)
     * @returns {Object} Templates object
     */
    export() {
        const result = {};
        for (const [name, data] of this.templates) {
            result[name] = data.source;
        }
        return result;
    }
}

// Create singleton instance
export const templateLoader = new TemplateLoader();