import { Debug } from './Debug.js';

/**
 * Simple event bus for UI component communication
 * Allows decoupled communication between UI components
 */
export class EventBus {
    constructor() {
        this.events = new Map();
        this.oneTimeEvents = new Map();
        Debug.log('EventBus', 'Initialized');
    }

    /**
     * Subscribe to an event
     * @param {string} eventName - Name of the event
     * @param {Function} callback - Callback function
     * @param {Object} context - Context to bind the callback to
     * @returns {Function} Unsubscribe function
     */
    on(eventName, callback, context = null) {
        Debug.log('EventBus', `Subscribing to event: ${eventName}`, { 
            hasContext: !!context,
            currentListeners: this.events.get(eventName)?.length || 0
        });

        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }

        const handler = { callback, context };
        this.events.get(eventName).push(handler);

        // Return unsubscribe function
        return () => this.off(eventName, callback);
    }

    /**
     * Subscribe to an event once
     * @param {string} eventName - Name of the event
     * @param {Function} callback - Callback function
     * @param {Object} context - Context to bind the callback to
     */
    once(eventName, callback, context = null) {
        Debug.log('EventBus', `Subscribing once to event: ${eventName}`);

        const wrappedCallback = (...args) => {
            callback.apply(context, args);
            this.off(eventName, wrappedCallback);
        };

        this.on(eventName, wrappedCallback, context);
    }

    /**
     * Unsubscribe from an event
     * @param {string} eventName - Name of the event
     * @param {Function} callback - Callback function to remove
     */
    off(eventName, callback) {
        if (!this.events.has(eventName)) return;

        const handlers = this.events.get(eventName);
        const filteredHandlers = handlers.filter(h => h.callback !== callback);
        
        Debug.log('EventBus', `Unsubscribing from event: ${eventName}`, {
            previousCount: handlers.length,
            newCount: filteredHandlers.length
        });

        if (filteredHandlers.length === 0) {
            this.events.delete(eventName);
        } else {
            this.events.set(eventName, filteredHandlers);
        }
    }

    /**
     * Emit an event
     * @param {string} eventName - Name of the event
     * @param {...*} args - Arguments to pass to callbacks
     */
    emit(eventName, ...args) {
        const handlers = this.events.get(eventName);
        
        Debug.log('EventBus', `Emitting event: ${eventName}`, {
            handlerCount: handlers?.length || 0,
            args: args
        });

        if (!handlers) return;

        // Clone handlers array to avoid issues if handlers modify the list
        const handlersToCall = [...handlers];

        handlersToCall.forEach(({ callback, context }) => {
            try {
                callback.apply(context, args);
            } catch (error) {
                Debug.error('EventBus', `Error in event handler for ${eventName}`, error);
            }
        });
    }

    /**
     * Remove all event listeners
     */
    clear() {
        const eventCount = this.events.size;
        this.events.clear();
        Debug.log('EventBus', `Cleared all events`, { eventCount });
    }

    /**
     * Get all registered events
     * @returns {Array<string>} Array of event names
     */
    getEvents() {
        return Array.from(this.events.keys());
    }

    /**
     * Get listener count for an event
     * @param {string} eventName - Name of the event
     * @returns {number} Number of listeners
     */
    getListenerCount(eventName) {
        return this.events.get(eventName)?.length || 0;
    }

    /**
     * Debug dump of all events and listeners
     */
    debug() {
        const eventInfo = {};
        this.events.forEach((handlers, eventName) => {
            eventInfo[eventName] = {
                listenerCount: handlers.length,
                listeners: handlers.map(h => ({
                    hasContext: !!h.context,
                    callbackName: h.callback.name || 'anonymous'
                }))
            };
        });
        Debug.dump(eventInfo, 'EventBus State');
    }
}

// Create singleton instance
export const eventBus = new EventBus();

// Common UI events
export const UIEvents = {
    // Theme events
    THEME_CHANGED: 'theme:changed',
    
    // Font events
    FONT_CHANGED: 'font:changed',
    
    // Navigation events
    VIEW_CHANGED: 'view:changed',
    
    // Sidebar events
    SIDEBAR_TOGGLED: 'sidebar:toggled',
    
    // Session events
    SESSION_SELECTED: 'session:selected',
    SESSION_CREATED: 'session:created',
    SESSION_DELETED: 'session:deleted',
    SESSION_RENAMED: 'session:renamed',
    SESSION_LIST_UPDATED: 'session:list:updated',
    SESSION_CHANGED: 'session:changed',
    
    // Chat events
    MESSAGE_SENT: 'message:sent',
    MESSAGE_RECEIVED: 'message:received',
    MESSAGE_ADDED: 'message:added',
    MESSAGES_CLEARED: 'messages:cleared',
    CHAT_INPUT_FOCUSED: 'chat:input:focused',
    CHAT_TARGET_CHANGED: 'chat:target:changed',
    IMAGE_ADDED: 'chat:image:added',
    IMAGES_CLEARED: 'chat:images:cleared',
    
    // Modal events
    MODAL_OPENED: 'modal:opened',
    MODAL_CLOSED: 'modal:closed',
    
    // Command events
    COMMAND_EXECUTED: 'command:executed'
};