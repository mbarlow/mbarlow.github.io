import { Debug } from '../utils/Debug.js';

/**
 * Jinja2-like template engine for JavaScript
 * Supports variables, conditionals, loops, and filters
 */
export class Template {
    constructor() {
        this.cache = new Map();
        this.filters = new Map();
        this.globals = {};
        
        // Register default filters
        this.registerDefaultFilters();
        
        Debug.log('Template', 'Template engine initialized');
    }

    /**
     * Render a template string with context data
     * @param {string} template - Template string
     * @param {Object} context - Context data
     * @param {Object} options - Render options
     * @returns {string} Rendered output
     */
    render(template, context = {}, options = {}) {
        const startTime = performance.now();
        
        try {
            // Merge globals with context
            const fullContext = { ...this.globals, ...context };
            
            // Check cache if enabled
            const cacheKey = options.cacheKey || this.hash(template);
            let compiled = this.cache.get(cacheKey);
            
            if (!compiled || options.noCache) {
                compiled = this.compile(template);
                if (!options.noCache) {
                    this.cache.set(cacheKey, compiled);
                }
            }
            
            // Execute compiled template
            const result = compiled(fullContext);
            
            const renderTime = performance.now() - startTime;
            Debug.log('Template', `Rendered in ${renderTime.toFixed(2)}ms`, {
                templateLength: template.length,
                contextKeys: Object.keys(fullContext),
                cached: !!this.cache.get(cacheKey)
            });
            
            return result;
        } catch (error) {
            Debug.error('Template', 'Render error', error);
            throw new TemplateError(`Template render error: ${error.message}`, template, error);
        }
    }

    /**
     * Compile template string to function
     * @param {string} template - Template string
     * @returns {Function} Compiled template function
     */
    compile(template) {
        Debug.log('Template', 'Compiling template', { length: template.length });
        
        // Parse template into tokens
        const tokens = this.tokenize(template);
        
        // Generate JavaScript code
        const code = this.generate(tokens);
        
        // Create function
        try {
            const func = new Function('context', 'filters', 'escapeHtml', code);
            return (context) => func(context, this.filters, this.escapeHtml);
        } catch (error) {
            Debug.error('Template', 'Compilation error', { code, error });
            throw new TemplateError('Template compilation failed', template, error);
        }
    }

    /**
     * Tokenize template string
     * @param {string} template - Template string
     * @returns {Array} Tokens
     */
    tokenize(template) {
        const tokens = [];
        let current = 0;
        
        while (current < template.length) {
            // Look for template tags
            if (template.substr(current, 2) === '{{') {
                // Variable tag
                const end = template.indexOf('}}', current + 2);
                if (end === -1) {
                    throw new TemplateError('Unclosed variable tag', template);
                }
                
                tokens.push({
                    type: 'variable',
                    value: template.substring(current + 2, end).trim(),
                    start: current,
                    end: end + 2
                });
                
                current = end + 2;
            } else if (template.substr(current, 2) === '{%') {
                // Control tag
                const end = template.indexOf('%}', current + 2);
                if (end === -1) {
                    throw new TemplateError('Unclosed control tag', template);
                }
                
                const content = template.substring(current + 2, end).trim();
                const [command, ...args] = content.split(/\s+/);
                
                tokens.push({
                    type: 'control',
                    command,
                    args: args.join(' '),
                    value: content,
                    start: current,
                    end: end + 2
                });
                
                current = end + 2;
            } else if (template.substr(current, 2) === '{#') {
                // Comment tag
                const end = template.indexOf('#}', current + 2);
                if (end === -1) {
                    throw new TemplateError('Unclosed comment tag', template);
                }
                
                tokens.push({
                    type: 'comment',
                    value: template.substring(current + 2, end).trim(),
                    start: current,
                    end: end + 2
                });
                
                current = end + 2;
            } else {
                // Text content
                let end = current;
                while (end < template.length) {
                    if (template.substr(end, 2) === '{{' || 
                        template.substr(end, 2) === '{%' ||
                        template.substr(end, 2) === '{#') {
                        break;
                    }
                    end++;
                }
                
                if (end > current) {
                    tokens.push({
                        type: 'text',
                        value: template.substring(current, end),
                        start: current,
                        end: end
                    });
                }
                
                current = end;
            }
        }
        
        return tokens;
    }

    /**
     * Generate JavaScript code from tokens
     * @param {Array} tokens - Tokens
     * @returns {string} JavaScript code
     */
    generate(tokens) {
        let code = 'let output = "";\n';
        let depth = 0;
        const stack = [];
        
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            
            switch (token.type) {
                case 'text':
                    code += `output += ${JSON.stringify(token.value)};\n`;
                    break;
                    
                case 'variable':
                    code += `output += escapeHtml(${this.compileExpression(token.value)});\n`;
                    break;
                    
                case 'comment':
                    // Comments are ignored
                    break;
                    
                case 'control':
                    code += this.compileControl(token, stack) + '\n';
                    break;
            }
        }
        
        // Check for unclosed blocks
        if (stack.length > 0) {
            const unclosed = stack[stack.length - 1];
            throw new TemplateError(`Unclosed ${unclosed.command} block`, null);
        }
        
        code += 'return output;';
        
        Debug.log('Template', 'Generated code', { lineCount: code.split('\n').length });
        
        return code;
    }

    /**
     * Compile control structure
     * @param {Object} token - Control token
     * @param {Array} stack - Block stack
     * @returns {string} JavaScript code
     */
    compileControl(token, stack) {
        const { command, args } = token;
        
        switch (command) {
            case 'if':
                stack.push(token);
                return `if (${this.compileExpression(args)}) {`;
                
            case 'elif':
            case 'elseif':
                if (stack.length === 0 || stack[stack.length - 1].command !== 'if') {
                    throw new TemplateError('elif without if', null);
                }
                return `} else if (${this.compileExpression(args)}) {`;
                
            case 'else':
                if (stack.length === 0 || 
                    (stack[stack.length - 1].command !== 'if' && 
                     stack[stack.length - 1].command !== 'for')) {
                    throw new TemplateError('else without if or for', null);
                }
                return '} else {';
                
            case 'endif':
                if (stack.length === 0 || stack[stack.length - 1].command !== 'if') {
                    throw new TemplateError('endif without if', null);
                }
                stack.pop();
                return '}';
                
            case 'for':
                stack.push(token);
                const forParts = this.parseForLoop(args);
                return this.compileForLoop(forParts);
                
            case 'endfor':
                if (stack.length === 0 || stack[stack.length - 1].command !== 'for') {
                    throw new TemplateError('endfor without for', null);
                }
                stack.pop();
                return '}';
                
            case 'set':
                return this.compileSet(args);
                
            default:
                throw new TemplateError(`Unknown control command: ${command}`, null);
        }
    }

    /**
     * Parse for loop syntax
     * @param {string} args - For loop arguments
     * @returns {Object} Parsed for loop parts
     */
    parseForLoop(args) {
        // Support: for item in items
        // Support: for key, value in items
        const match = args.match(/^(\w+)(?:\s*,\s*(\w+))?\s+in\s+(.+)$/);
        if (!match) {
            throw new TemplateError(`Invalid for loop syntax: ${args}`, null);
        }
        
        return {
            key: match[2] || null,
            value: match[2] ? match[1] : match[1],
            index: match[2] ? match[1] : null,
            expression: match[3]
        };
    }

    /**
     * Compile for loop
     * @param {Object} parts - For loop parts
     * @returns {string} JavaScript code
     */
    compileForLoop(parts) {
        const { key, value, expression } = parts;
        const items = this.compileExpression(expression);
        
        let code = `{\n`;
        code += `  const _items = ${items};\n`;
        code += `  if (Array.isArray(_items)) {\n`;
        code += `    for (let _i = 0; _i < _items.length; _i++) {\n`;
        if (key) {
            code += `      context['${key}'] = _i;\n`;
        }
        code += `      context['${value}'] = _items[_i];\n`;
        code += `      context['loop'] = { index: _i, index1: _i + 1, first: _i === 0, last: _i === _items.length - 1, length: _items.length };\n`;
        code += `      try {\n`;
        
        return code;
    }

    /**
     * Compile set statement
     * @param {string} args - Set arguments
     * @returns {string} JavaScript code
     */
    compileSet(args) {
        const match = args.match(/^(\w+)\s*=\s*(.+)$/);
        if (!match) {
            throw new TemplateError(`Invalid set syntax: ${args}`, null);
        }
        
        const [, variable, expression] = match;
        return `context['${variable}'] = ${this.compileExpression(expression)};`;
    }

    /**
     * Compile expression with filters
     * @param {string} expression - Expression string
     * @returns {string} JavaScript code
     */
    compileExpression(expression) {
        // Handle filters (e.g., variable|filter|filter2)
        const parts = expression.split('|').map(p => p.trim());
        let code = this.compileVariable(parts[0]);
        
        // Apply filters
        for (let i = 1; i < parts.length; i++) {
            const filterParts = parts[i].match(/^(\w+)(?:\((.*)\))?$/);
            if (!filterParts) {
                throw new TemplateError(`Invalid filter syntax: ${parts[i]}`, null);
            }
            
            const [, filterName, filterArgs] = filterParts;
            const args = filterArgs ? `, ${filterArgs}` : '';
            code = `filters.get('${filterName}')(${code}${args})`;
        }
        
        return code;
    }

    /**
     * Compile variable reference
     * @param {string} variable - Variable name
     * @returns {string} JavaScript code
     */
    compileVariable(variable) {
        // Handle dot notation (e.g., user.name)
        const parts = variable.split('.');
        let code = 'context';
        
        for (const part of parts) {
            if (part.match(/^\w+$/)) {
                code += `['${part}']`;
            } else {
                // Handle array access (e.g., items[0])
                const match = part.match(/^(\w+)\[(.+)\]$/);
                if (match) {
                    code += `['${match[1]}'][${match[2]}]`;
                } else {
                    code += `[${part}]`;
                }
            }
        }
        
        return `(${code} ?? '')`;
    }

    /**
     * Register default filters
     */
    registerDefaultFilters() {
        // String filters
        this.registerFilter('upper', (str) => String(str).toUpperCase());
        this.registerFilter('lower', (str) => String(str).toLowerCase());
        this.registerFilter('title', (str) => String(str).replace(/\w\S*/g, txt => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        ));
        this.registerFilter('trim', (str) => String(str).trim());
        this.registerFilter('truncate', (str, length = 50, end = '...') => 
            str.length > length ? str.substring(0, length - end.length) + end : str
        );
        
        // Number filters
        this.registerFilter('abs', (num) => Math.abs(num));
        this.registerFilter('round', (num, decimals = 0) => Number(num.toFixed(decimals)));
        this.registerFilter('floor', (num) => Math.floor(num));
        this.registerFilter('ceil', (num) => Math.ceil(num));
        
        // Array filters
        this.registerFilter('length', (arr) => Array.isArray(arr) ? arr.length : 0);
        this.registerFilter('first', (arr) => Array.isArray(arr) ? arr[0] : null);
        this.registerFilter('last', (arr) => Array.isArray(arr) ? arr[arr.length - 1] : null);
        this.registerFilter('join', (arr, separator = ', ') => Array.isArray(arr) ? arr.join(separator) : '');
        this.registerFilter('reverse', (arr) => Array.isArray(arr) ? [...arr].reverse() : []);
        this.registerFilter('sort', (arr) => Array.isArray(arr) ? [...arr].sort() : []);
        
        // Date filters
        this.registerFilter('date', (date, format = 'YYYY-MM-DD') => {
            const d = new Date(date);
            if (isNaN(d.getTime())) return '';
            
            const pad = (n) => String(n).padStart(2, '0');
            
            return format
                .replace('YYYY', d.getFullYear())
                .replace('MM', pad(d.getMonth() + 1))
                .replace('DD', pad(d.getDate()))
                .replace('HH', pad(d.getHours()))
                .replace('mm', pad(d.getMinutes()))
                .replace('ss', pad(d.getSeconds()));
        });
        
        // Utility filters
        this.registerFilter('default', (value, defaultValue = '') => value || defaultValue);
        this.registerFilter('json', (obj) => JSON.stringify(obj, null, 2));
        this.registerFilter('keys', (obj) => Object.keys(obj || {}));
        this.registerFilter('values', (obj) => Object.values(obj || {}));
    }

    /**
     * Register a custom filter
     * @param {string} name - Filter name
     * @param {Function} func - Filter function
     */
    registerFilter(name, func) {
        this.filters.set(name, func);
        Debug.log('Template', `Registered filter: ${name}`);
    }

    /**
     * Set global context variable
     * @param {string} name - Variable name
     * @param {*} value - Variable value
     */
    setGlobal(name, value) {
        this.globals[name] = value;
    }

    /**
     * Clear template cache
     */
    clearCache() {
        const size = this.cache.size;
        this.cache.clear();
        Debug.log('Template', `Cleared template cache`, { entriesCleared: size });
    }

    /**
     * Escape HTML to prevent XSS
     * @param {*} str - String to escape
     * @returns {string} Escaped string
     */
    escapeHtml(str) {
        if (str == null) return '';
        
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;'
        };
        
        return String(str).replace(/[&<>"'\/]/g, (s) => map[s]);
    }

    /**
     * Generate hash for template caching
     * @param {string} str - String to hash
     * @returns {string} Hash
     */
    hash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(36);
    }
}

/**
 * Template error class
 */
class TemplateError extends Error {
    constructor(message, template, originalError = null) {
        super(message);
        this.name = 'TemplateError';
        this.template = template;
        this.originalError = originalError;
    }
}

// Create singleton instance
export const template = new Template();