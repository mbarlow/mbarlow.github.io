import { Debug } from '../utils/Debug.js';
import { eventBus } from '../utils/EventBus.js';

/**
 * Base class for all UI components
 * Provides common functionality like element binding, event handling, and lifecycle
 */
export class UIComponent {
    constructor(name, options = {}) {
        this.name = name;
        this.options = options;
        this.element = null;
        this.children = new Map();
        this.eventListeners = [];
        this.busSubscriptions = [];
        this.initialized = false;
        
        Debug.log(this.name, 'Component created', { options });
    }

    /**
     * Initialize the component
     * @param {HTMLElement|string} element - DOM element or selector
     */
    init(element) {
        Debug.methodEntry(this.name, 'init', { element });
        
        // Get DOM element
        if (typeof element === 'string') {
            this.element = document.querySelector(element);
            if (!this.element) {
                Debug.error(this.name, `Element not found: ${element}`);
                return false;
            }
        } else {
            this.element = element;
        }

        // Call setup lifecycle method
        this.setup();
        
        // Bind events
        this.bindEvents();
        
        // Initialize children
        this.initChildren();
        
        this.initialized = true;
        Debug.success(this.name, 'Component initialized');
        
        return true;
    }

    /**
     * Setup method - override in subclasses
     * Called during initialization
     */
    setup() {
        // Override in subclasses
    }

    /**
     * Bind events - override in subclasses
     * Called during initialization
     */
    bindEvents() {
        // Override in subclasses
    }

    /**
     * Initialize child components
     */
    initChildren() {
        this.children.forEach((child, name) => {
            Debug.log(this.name, `Initializing child: ${name}`);
            child.init();
        });
    }

    /**
     * Add a child component
     * @param {string} name - Child component name
     * @param {UIComponent} component - Child component instance
     */
    addChild(name, component) {
        Debug.log(this.name, `Adding child component: ${name}`);
        this.children.set(name, component);
        
        if (this.initialized) {
            component.init();
        }
    }

    /**
     * Get a child component
     * @param {string} name - Child component name
     * @returns {UIComponent|null}
     */
    getChild(name) {
        return this.children.get(name) || null;
    }

    /**
     * Remove a child component
     * @param {string} name - Child component name
     */
    removeChild(name) {
        const child = this.children.get(name);
        if (child) {
            Debug.log(this.name, `Removing child component: ${name}`);
            child.destroy();
            this.children.delete(name);
        }
    }

    /**
     * Add DOM event listener with automatic cleanup
     * @param {HTMLElement} element - Target element
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @param {Object} options - Event options
     */
    addEventListener(element, event, handler, options = {}) {
        const boundHandler = handler.bind(this);
        element.addEventListener(event, boundHandler, options);
        
        this.eventListeners.push({
            element,
            event,
            handler: boundHandler,
            options
        });
        
        Debug.log(this.name, `Added event listener: ${event}`, {
            element: element.tagName || 'document',
            hasOptions: Object.keys(options).length > 0
        });
    }

    /**
     * Subscribe to event bus with automatic cleanup
     * @param {string} eventName - Event name
     * @param {Function} handler - Event handler
     * @returns {Function} Unsubscribe function
     */
    subscribe(eventName, handler) {
        const unsubscribe = eventBus.on(eventName, handler, this);
        this.busSubscriptions.push({ eventName, unsubscribe });
        
        Debug.log(this.name, `Subscribed to bus event: ${eventName}`);
        
        return unsubscribe;
    }

    /**
     * Emit event on the event bus
     * @param {string} eventName - Event name
     * @param {...*} args - Event arguments
     */
    emit(eventName, ...args) {
        Debug.log(this.name, `Emitting bus event: ${eventName}`, args);
        eventBus.emit(eventName, ...args);
    }

    /**
     * Find element within component
     * @param {string} selector - CSS selector
     * @returns {HTMLElement|null}
     */
    find(selector) {
        if (!this.element) return null;
        return this.element.querySelector(selector);
    }

    /**
     * Find all elements within component
     * @param {string} selector - CSS selector
     * @returns {NodeList}
     */
    findAll(selector) {
        if (!this.element) return [];
        return this.element.querySelectorAll(selector);
    }

    /**
     * Show the component
     */
    show() {
        if (this.element) {
            this.element.style.display = '';
            this.emit(`${this.name}:shown`);
        }
    }

    /**
     * Hide the component
     */
    hide() {
        if (this.element) {
            this.element.style.display = 'none';
            this.emit(`${this.name}:hidden`);
        }
    }

    /**
     * Toggle component visibility
     */
    toggle() {
        if (this.element) {
            const isHidden = this.element.style.display === 'none';
            if (isHidden) {
                this.show();
            } else {
                this.hide();
            }
        }
    }

    /**
     * Update component - override in subclasses
     * @param {Object} data - Update data
     */
    update(data = {}) {
        Debug.log(this.name, 'Update called', data);
        // Override in subclasses
    }

    /**
     * Render component - override in subclasses
     * @param {Object} data - Render data
     */
    render(data = {}) {
        Debug.log(this.name, 'Render called', data);
        // Override in subclasses
    }

    /**
     * Clean up and destroy the component
     */
    destroy() {
        Debug.log(this.name, 'Destroying component');
        
        // Clean up children
        this.children.forEach((child, name) => {
            Debug.log(this.name, `Destroying child: ${name}`);
            child.destroy();
        });
        this.children.clear();
        
        // Clean up DOM event listeners
        this.eventListeners.forEach(({ element, event, handler, options }) => {
            element.removeEventListener(event, handler, options);
        });
        this.eventListeners = [];
        
        // Clean up bus subscriptions
        this.busSubscriptions.forEach(({ eventName, unsubscribe }) => {
            Debug.log(this.name, `Unsubscribing from bus event: ${eventName}`);
            unsubscribe();
        });
        this.busSubscriptions = [];
        
        // Clear element reference
        this.element = null;
        this.initialized = false;
        
        Debug.success(this.name, 'Component destroyed');
    }

    /**
     * Helper to safely get element attribute
     * @param {string} attr - Attribute name
     * @param {*} defaultValue - Default value if not found
     * @returns {string|*}
     */
    getAttribute(attr, defaultValue = null) {
        return this.element?.getAttribute(attr) || defaultValue;
    }

    /**
     * Helper to safely set element attribute
     * @param {string} attr - Attribute name
     * @param {string} value - Attribute value
     */
    setAttribute(attr, value) {
        if (this.element) {
            this.element.setAttribute(attr, value);
        }
    }

    /**
     * Helper to add CSS class
     * @param {string} className - Class name
     */
    addClass(className) {
        if (this.element) {
            this.element.classList.add(className);
        }
    }

    /**
     * Helper to remove CSS class
     * @param {string} className - Class name
     */
    removeClass(className) {
        if (this.element) {
            this.element.classList.remove(className);
        }
    }

    /**
     * Helper to toggle CSS class
     * @param {string} className - Class name
     * @param {boolean} force - Force add/remove
     */
    toggleClass(className, force) {
        if (this.element) {
            this.element.classList.toggle(className, force);
        }
    }

    /**
     * Helper to check if has CSS class
     * @param {string} className - Class name
     * @returns {boolean}
     */
    hasClass(className) {
        return this.element?.classList.contains(className) || false;
    }
}