import { Debug } from './utils/Debug.js';
import { eventBus, UIEvents } from './utils/EventBus.js';

/**
 * Main UI Manager - Coordinates all UI components
 * Acts as the bridge between the app and UI components
 */
export class UIManager {
    constructor() {
        this.components = new Map();
        this.initialized = false;
        Debug.log('UIManager', 'Created');
    }

    /**
     * Initialize the UI manager
     * @param {Object} config - Configuration object
     */
    async init(config = {}) {
        Debug.methodEntry('UIManager', 'init', config);
        
        try {
            // Store config
            this.config = config;
            
            // Set debug mode if specified
            if (config.debug !== undefined) {
                Debug.setDebugMode(config.debug);
            }
            
            // Initialize components in order
            await this.initializeComponents();
            
            // Set up global error handling
            this.setupErrorHandling();
            
            this.initialized = true;
            Debug.success('UIManager', 'Initialization complete');
            
            return true;
        } catch (error) {
            Debug.error('UIManager', 'Initialization failed', error);
            throw error;
        }
    }

    /**
     * Register a UI component
     * @param {string} name - Component name
     * @param {UIComponent} component - Component instance
     */
    register(name, component) {
        Debug.log('UIManager', `Registering component: ${name}`);
        
        if (this.components.has(name)) {
            Debug.warn('UIManager', `Component already registered: ${name}`);
        }
        
        this.components.set(name, component);
        
        // If already initialized, initialize the component immediately
        if (this.initialized && component.element) {
            component.init();
        }
    }

    /**
     * Get a registered component
     * @param {string} name - Component name
     * @returns {UIComponent|null}
     */
    get(name) {
        return this.components.get(name) || null;
    }

    /**
     * Remove a component
     * @param {string} name - Component name
     */
    remove(name) {
        const component = this.components.get(name);
        if (component) {
            Debug.log('UIManager', `Removing component: ${name}`);
            component.destroy();
            this.components.delete(name);
        }
    }

    /**
     * Initialize all registered components
     */
    async initializeComponents() {
        Debug.log('UIManager', 'Initializing all components');
        
        for (const [name, component] of this.components) {
            try {
                Debug.log('UIManager', `Initializing component: ${name}`);
                const result = component.init();
                
                if (result === false) {
                    Debug.warn('UIManager', `Component initialization returned false: ${name}`);
                }
            } catch (error) {
                Debug.error('UIManager', `Failed to initialize component: ${name}`, error);
                // Continue with other components
            }
        }
    }

    /**
     * Set up global error handling for UI
     */
    setupErrorHandling() {
        // Catch unhandled errors in UI events
        window.addEventListener('error', (event) => {
            Debug.error('UIManager', 'Unhandled UI error', {
                message: event.message,
                filename: event.filename,
                line: event.lineno,
                col: event.colno,
                error: event.error
            });
        });

        // Catch unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            Debug.error('UIManager', 'Unhandled promise rejection', {
                reason: event.reason,
                promise: event.promise
            });
        });
    }

    /**
     * Broadcast an event to all components
     * @param {string} eventName - Event name
     * @param {...*} args - Event arguments
     */
    broadcast(eventName, ...args) {
        Debug.log('UIManager', `Broadcasting event: ${eventName}`, args);
        eventBus.emit(eventName, ...args);
    }

    /**
     * Update all components
     * @param {Object} data - Update data
     */
    updateAll(data = {}) {
        Debug.log('UIManager', 'Updating all components', data);
        
        this.components.forEach((component, name) => {
            try {
                component.update(data);
            } catch (error) {
                Debug.error('UIManager', `Error updating component: ${name}`, error);
            }
        });
    }

    /**
     * Get current UI state
     * @returns {Object} UI state
     */
    getState() {
        const state = {
            initialized: this.initialized,
            componentCount: this.components.size,
            components: {}
        };
        
        // Get state from each component if they implement getState
        this.components.forEach((component, name) => {
            if (typeof component.getState === 'function') {
                try {
                    state.components[name] = component.getState();
                } catch (error) {
                    Debug.error('UIManager', `Error getting state from component: ${name}`, error);
                    state.components[name] = { error: error.message };
                }
            }
        });
        
        return state;
    }

    /**
     * Restore UI state
     * @param {Object} state - State to restore
     */
    setState(state) {
        Debug.log('UIManager', 'Restoring UI state', state);
        
        if (state.components) {
            Object.entries(state.components).forEach(([name, componentState]) => {
                const component = this.components.get(name);
                if (component && typeof component.setState === 'function') {
                    try {
                        component.setState(componentState);
                    } catch (error) {
                        Debug.error('UIManager', `Error restoring state for component: ${name}`, error);
                    }
                }
            });
        }
    }

    /**
     * Clean up and destroy all components
     */
    destroy() {
        Debug.log('UIManager', 'Destroying UI manager');
        
        // Destroy all components
        this.components.forEach((component, name) => {
            Debug.log('UIManager', `Destroying component: ${name}`);
            try {
                component.destroy();
            } catch (error) {
                Debug.error('UIManager', `Error destroying component: ${name}`, error);
            }
        });
        
        this.components.clear();
        this.initialized = false;
        
        // Clear event bus
        eventBus.clear();
        
        Debug.success('UIManager', 'UI manager destroyed');
    }

    /**
     * Debug dump of all components
     */
    debug() {
        const info = {
            initialized: this.initialized,
            componentCount: this.components.size,
            components: Array.from(this.components.keys()),
            eventBusEvents: eventBus.getEvents()
        };
        
        Debug.dump(info, 'UIManager State');
        
        // Also dump event bus state
        eventBus.debug();
    }
}

// Create singleton instance
export const uiManager = new UIManager();