/**
 * Debug logging utility for the UI layer
 * Provides namespaced logging with conditional output
 */

class DebugLogger {
    constructor() {
        this.enabled = true; // Can be controlled via localStorage or config
        this.namespaces = new Set(['ui', 'chat', 'command', 'system']);
    }

    /**
     * Log a message for a specific namespace
     * @param {string} namespace - The namespace for the log
     * @param {string} message - The log message
     * @param {*} data - Optional data to log
     */
    log(namespace, message, data = null) {
        if (!this.enabled) return;
        
        const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
        const prefix = `[${timestamp}] [${namespace.toUpperCase()}]`;
        
        if (data !== null && data !== undefined) {
            console.log(`${prefix} ${message}`, data);
        } else {
            console.log(`${prefix} ${message}`);
        }
    }

    /**
     * UI namespace logging
     */
    ui(message, data = null) {
        this.log('ui', message, data);
    }

    /**
     * Chat namespace logging
     */
    chat(message, data = null) {
        this.log('chat', message, data);
    }

    /**
     * Command namespace logging
     */
    command(message, data = null) {
        this.log('command', message, data);
    }

    /**
     * System namespace logging
     */
    system(message, data = null) {
        this.log('system', message, data);
    }

    /**
     * Error logging
     */
    error(namespace, message, error = null) {
        const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
        const prefix = `[${timestamp}] [${namespace.toUpperCase()}] ERROR:`;
        
        if (error instanceof Error) {
            console.error(`${prefix} ${message}`, error.message, error.stack);
        } else if (error) {
            console.error(`${prefix} ${message}`, error);
        } else {
            console.error(`${prefix} ${message}`);
        }
    }

    /**
     * Warning logging
     */
    warn(namespace, message, data = null) {
        const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
        const prefix = `[${timestamp}] [${namespace.toUpperCase()}] WARN:`;
        
        if (data) {
            console.warn(`${prefix} ${message}`, data);
        } else {
            console.warn(`${prefix} ${message}`);
        }
    }

    /**
     * Enable or disable debug logging
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        console.log(`Debug logging ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Check if debug logging is enabled
     */
    isEnabled() {
        return this.enabled;
    }
}

// Create singleton instance
export const debugLog = new DebugLogger();

// Also export the class for testing or custom instances
export { DebugLogger };