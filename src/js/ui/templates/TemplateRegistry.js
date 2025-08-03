import { Debug } from '../utils/Debug.js';
import { templateLoader } from './TemplateLoader.js';
import { template } from './Template.js';
import { commonTemplates } from '../html/templates/common.js';
import { appTemplates } from '../html/templates/app.js';

/**
 * Template registry for managing all application templates
 * Handles registration, loading, and organization of templates
 */
export class TemplateRegistry {
    constructor() {
        this.categories = new Map();
        this.aliases = new Map();
        
        Debug.log('TemplateRegistry', 'Initialized');
    }

    /**
     * Initialize with default templates
     */
    async init() {
        Debug.log('TemplateRegistry', 'Loading default templates');
        
        try {
            // Register common templates
            this.registerCategory('common', commonTemplates);
            
            // Register app-specific templates
            this.registerCategory('app', appTemplates);
            
            // Set up some global template variables
            template.setGlobal('DEBUG_MODE', Debug.DEBUG_MODE);
            template.setGlobal('timestamp', () => Date.now());
            template.setGlobal('formatDate', (date, format) => {
                // Simple date formatter
                const d = new Date(date);
                return d.toLocaleString();
            });
            
            Debug.success('TemplateRegistry', 'Default templates loaded');
        } catch (error) {
            Debug.error('TemplateRegistry', 'Failed to initialize templates', error);
            throw error;
        }
    }

    /**
     * Register a category of templates
     * @param {string} category - Category name
     * @param {Object} templates - Templates object
     */
    registerCategory(category, templates) {
        Debug.log('TemplateRegistry', `Registering category: ${category}`, {
            templateCount: Object.keys(templates).length
        });
        
        this.categories.set(category, templates);
        
        // Register each template with the loader
        for (const [name, templateString] of Object.entries(templates)) {
            const fullName = `${category}.${name}`;
            templateLoader.register(fullName, templateString);
        }
    }

    /**
     * Register a single template
     * @param {string} name - Template name (can include category prefix)
     * @param {string} templateString - Template string
     * @param {string} category - Category (optional)
     */
    register(name, templateString, category = 'custom') {
        const fullName = name.includes('.') ? name : `${category}.${name}`;
        
        Debug.log('TemplateRegistry', `Registering template: ${fullName}`);
        
        // Add to category
        if (!this.categories.has(category)) {
            this.categories.set(category, {});
        }
        
        const baseName = name.includes('.') ? name.split('.')[1] : name;
        this.categories.get(category)[baseName] = templateString;
        
        // Register with loader
        templateLoader.register(fullName, templateString);
    }

    /**
     * Create an alias for a template
     * @param {string} alias - Alias name
     * @param {string} templateName - Original template name
     */
    alias(alias, templateName) {
        this.aliases.set(alias, templateName);
        Debug.log('TemplateRegistry', `Created alias: ${alias} -> ${templateName}`);
    }

    /**
     * Render a template
     * @param {string} name - Template name or alias
     * @param {Object} context - Context data
     * @param {Object} options - Render options
     * @returns {string} Rendered output
     */
    render(name, context = {}, options = {}) {
        // Resolve alias
        const templateName = this.aliases.get(name) || name;
        
        // Add category prefix if not present
        const fullName = templateName.includes('.') ? templateName : `app.${templateName}`;
        
        return templateLoader.render(fullName, context, options);
    }

    /**
     * Check if template exists
     * @param {string} name - Template name
     * @returns {boolean}
     */
    has(name) {
        const templateName = this.aliases.get(name) || name;
        const fullName = templateName.includes('.') ? templateName : `app.${templateName}`;
        return templateLoader.get(fullName) !== null;
    }

    /**
     * Get all templates in a category
     * @param {string} category - Category name
     * @returns {Object} Templates in category
     */
    getCategory(category) {
        return this.categories.get(category) || {};
    }

    /**
     * Get all category names
     * @returns {Array<string>} Category names
     */
    getCategories() {
        return Array.from(this.categories.keys());
    }

    /**
     * Search templates by name or content
     * @param {string} query - Search query
     * @returns {Array<Object>} Search results
     */
    search(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();
        
        for (const [category, templates] of this.categories) {
            for (const [name, templateString] of Object.entries(templates)) {
                const fullName = `${category}.${name}`;
                
                if (name.toLowerCase().includes(lowerQuery) ||
                    templateString.toLowerCase().includes(lowerQuery)) {
                    results.push({
                        name: fullName,
                        category,
                        shortName: name,
                        template: templateString
                    });
                }
            }
        }
        
        return results;
    }

    /**
     * Precompile all templates for better performance
     */
    precompile() {
        Debug.log('TemplateRegistry', 'Precompiling all templates');
        
        let compiled = 0;
        
        for (const [category, templates] of this.categories) {
            for (const name of Object.keys(templates)) {
                const fullName = `${category}.${name}`;
                try {
                    // Trigger compilation by rendering with empty context
                    templateLoader.render(fullName, {});
                    compiled++;
                } catch (error) {
                    Debug.warn('TemplateRegistry', `Failed to precompile: ${fullName}`, error);
                }
            }
        }
        
        Debug.success('TemplateRegistry', `Precompiled ${compiled} templates`);
    }

    /**
     * Validate all templates
     * @returns {Array<Object>} Validation results
     */
    validate() {
        Debug.log('TemplateRegistry', 'Validating all templates');
        
        const results = [];
        
        for (const [category, templates] of this.categories) {
            for (const [name, templateString] of Object.entries(templates)) {
                const fullName = `${category}.${name}`;
                
                try {
                    // Try to compile the template
                    template.compile(templateString);
                    results.push({
                        name: fullName,
                        valid: true,
                        error: null
                    });
                } catch (error) {
                    results.push({
                        name: fullName,
                        valid: false,
                        error: error.message
                    });
                    Debug.error('TemplateRegistry', `Invalid template: ${fullName}`, error);
                }
            }
        }
        
        const validCount = results.filter(r => r.valid).length;
        const invalidCount = results.length - validCount;
        
        Debug.log('TemplateRegistry', `Validation complete`, {
            total: results.length,
            valid: validCount,
            invalid: invalidCount
        });
        
        return results;
    }

    /**
     * Export all templates for debugging
     * @returns {Object} All templates organized by category
     */
    export() {
        const result = {};
        
        for (const [category, templates] of this.categories) {
            result[category] = { ...templates };
        }
        
        return result;
    }

    /**
     * Clear all templates
     */
    clear() {
        const categoryCount = this.categories.size;
        const aliasCount = this.aliases.size;
        
        this.categories.clear();
        this.aliases.clear();
        templateLoader.clear();
        
        Debug.log('TemplateRegistry', 'Cleared all templates', {
            categories: categoryCount,
            aliases: aliasCount
        });
    }

    /**
     * Debug information
     */
    debug() {
        const info = {
            categories: Array.from(this.categories.keys()),
            aliases: Object.fromEntries(this.aliases),
            templateCounts: {}
        };
        
        for (const [category, templates] of this.categories) {
            info.templateCounts[category] = Object.keys(templates).length;
        }
        
        Debug.dump(info, 'TemplateRegistry State');
    }
}

// Create singleton instance
export const templateRegistry = new TemplateRegistry();