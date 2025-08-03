/**
 * DOM utility helpers for common operations
 */
export const DOMHelpers = {
    /**
     * Create element with attributes and content
     * @param {string} tag - HTML tag name
     * @param {Object} attrs - Attributes object
     * @param {string|HTMLElement|Array} content - Content (text, element, or array of elements)
     * @returns {HTMLElement}
     */
    createElement(tag, attrs = {}, content = null) {
        const element = document.createElement(tag);
        
        // Set attributes
        Object.entries(attrs).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else if (key.startsWith('data-')) {
                element.setAttribute(key, value);
            } else if (key.startsWith('on') && typeof value === 'function') {
                const event = key.substring(2).toLowerCase();
                element.addEventListener(event, value);
            } else {
                element[key] = value;
            }
        });
        
        // Add content
        if (content !== null) {
            if (typeof content === 'string') {
                element.textContent = content;
            } else if (Array.isArray(content)) {
                content.forEach(child => {
                    if (child) element.appendChild(child);
                });
            } else if (content instanceof HTMLElement) {
                element.appendChild(content);
            }
        }
        
        return element;
    },

    /**
     * Create element from HTML string
     * @param {string} html - HTML string
     * @returns {HTMLElement}
     */
    createFromHTML(html) {
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        return template.content.firstChild;
    },

    /**
     * Empty an element (remove all children)
     * @param {HTMLElement} element - Element to empty
     */
    empty(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    },

    /**
     * Replace element content
     * @param {HTMLElement} element - Target element
     * @param {string|HTMLElement|Array} content - New content
     */
    setContent(element, content) {
        this.empty(element);
        
        if (typeof content === 'string') {
            element.innerHTML = content;
        } else if (Array.isArray(content)) {
            content.forEach(child => {
                if (child) element.appendChild(child);
            });
        } else if (content instanceof HTMLElement) {
            element.appendChild(content);
        }
    },

    /**
     * Add classes to element
     * @param {HTMLElement} element - Target element
     * @param {...string} classes - Classes to add
     */
    addClass(element, ...classes) {
        element.classList.add(...classes);
    },

    /**
     * Remove classes from element
     * @param {HTMLElement} element - Target element
     * @param {...string} classes - Classes to remove
     */
    removeClass(element, ...classes) {
        element.classList.remove(...classes);
    },

    /**
     * Toggle classes on element
     * @param {HTMLElement} element - Target element
     * @param {string} className - Class to toggle
     * @param {boolean} force - Force add/remove
     */
    toggleClass(element, className, force) {
        element.classList.toggle(className, force);
    },

    /**
     * Check if element has class
     * @param {HTMLElement} element - Target element
     * @param {string} className - Class to check
     * @returns {boolean}
     */
    hasClass(element, className) {
        return element.classList.contains(className);
    },

    /**
     * Get element by selector with error handling
     * @param {string} selector - CSS selector
     * @param {HTMLElement} parent - Parent element (default: document)
     * @returns {HTMLElement|null}
     */
    getElement(selector, parent = document) {
        try {
            return parent.querySelector(selector);
        } catch (e) {
            console.error(`Invalid selector: ${selector}`, e);
            return null;
        }
    },

    /**
     * Get all elements by selector
     * @param {string} selector - CSS selector
     * @param {HTMLElement} parent - Parent element (default: document)
     * @returns {Array<HTMLElement>}
     */
    getElements(selector, parent = document) {
        try {
            return Array.from(parent.querySelectorAll(selector));
        } catch (e) {
            console.error(`Invalid selector: ${selector}`, e);
            return [];
        }
    },

    /**
     * Show element
     * @param {HTMLElement} element - Element to show
     * @param {string} displayType - Display type (default: '')
     */
    show(element, displayType = '') {
        element.style.display = displayType;
    },

    /**
     * Hide element
     * @param {HTMLElement} element - Element to hide
     */
    hide(element) {
        element.style.display = 'none';
    },

    /**
     * Check if element is visible
     * @param {HTMLElement} element - Element to check
     * @returns {boolean}
     */
    isVisible(element) {
        return element.style.display !== 'none' && 
               element.offsetParent !== null;
    },

    /**
     * Get element position relative to viewport
     * @param {HTMLElement} element - Target element
     * @returns {Object} Position object with top, left, right, bottom
     */
    getPosition(element) {
        const rect = element.getBoundingClientRect();
        return {
            top: rect.top,
            left: rect.left,
            right: rect.right,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height
        };
    },

    /**
     * Scroll element into view
     * @param {HTMLElement} element - Element to scroll to
     * @param {Object} options - Scroll options
     */
    scrollIntoView(element, options = { behavior: 'smooth', block: 'center' }) {
        element.scrollIntoView(options);
    },

    /**
     * Escape HTML to prevent XSS
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Debounce function for event handlers
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function for event handlers
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in ms
     * @returns {Function} Throttled function
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};