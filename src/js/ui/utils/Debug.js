/**
 * Debug utility for development logging and object inspection
 * Provides structured logging with component context and object dumps
 */
export class Debug {
    static DEBUG_MODE = true; // Can be controlled via env or config
    static LOG_LEVELS = {
        INFO: '💬',
        WARN: '⚠️',
        ERROR: '❌',
        SUCCESS: '✅',
        DEBUG: '🔍',
        TRACE: '📍'
    };

    /**
     * Log with component context and structured data
     * @param {string} component - Component name (e.g., 'ThemeManager')
     * @param {string} action - Action being performed
     * @param {*} data - Data to log
     * @param {string} level - Log level (default: DEBUG)
     */
    static log(component, action, data = null, level = 'DEBUG') {
        if (!this.DEBUG_MODE) return;

        const icon = this.LOG_LEVELS[level] || '📝';
        const timestamp = new Date().toISOString();
        
        console.group(`${icon} [${component}] ${action}`);
        console.log('Timestamp:', timestamp);
        
        if (data !== null && data !== undefined) {
            if (typeof data === 'object') {
                console.log('Data:');
                console.dir(data, { depth: 3 });
            } else {
                console.log('Data:', data);
            }
        }
        
        if (level === 'TRACE') {
            console.trace('Stack trace');
        }
        
        console.groupEnd();
    }

    /**
     * Dump an object with formatted output
     * @param {*} obj - Object to dump
     * @param {string} label - Label for the dump
     */
    static dump(obj, label = 'Object Dump') {
        if (!this.DEBUG_MODE) return;

        console.group(`📦 ${label}`);
        
        if (obj === null) {
            console.log('null');
        } else if (obj === undefined) {
            console.log('undefined');
        } else if (Array.isArray(obj)) {
            console.log(`Array[${obj.length}]:`);
            console.table(obj);
        } else if (typeof obj === 'object') {
            const keys = Object.keys(obj);
            console.log(`Object with ${keys.length} properties:`);
            console.table(obj);
            
            // Also show nested structure
            console.log('Full structure:');
            console.dir(obj, { depth: 3 });
        } else {
            console.log(`${typeof obj}:`, obj);
        }
        
        console.groupEnd();
    }

    /**
     * Log method entry with parameters
     * @param {string} component - Component name
     * @param {string} method - Method name
     * @param {object} params - Method parameters
     */
    static methodEntry(component, method, params = {}) {
        this.log(component, `➡️ ${method}()`, params, 'TRACE');
    }

    /**
     * Log method exit with return value
     * @param {string} component - Component name
     * @param {string} method - Method name
     * @param {*} returnValue - Return value
     */
    static methodExit(component, method, returnValue) {
        this.log(component, `⬅️ ${method}() returns`, returnValue, 'TRACE');
    }

    /**
     * Log a warning
     * @param {string} component - Component name
     * @param {string} message - Warning message
     * @param {*} data - Additional data
     */
    static warn(component, message, data = null) {
        this.log(component, message, data, 'WARN');
    }

    /**
     * Log an error
     * @param {string} component - Component name
     * @param {string} message - Error message
     * @param {Error|*} error - Error object or data
     */
    static error(component, message, error = null) {
        if (!this.DEBUG_MODE) return;

        console.group(`❌ [${component}] ${message}`);
        console.log('Timestamp:', new Date().toISOString());
        
        if (error instanceof Error) {
            console.error('Error:', error.message);
            console.error('Stack:', error.stack);
        } else if (error) {
            console.error('Error data:', error);
        }
        
        console.trace('Error location');
        console.groupEnd();
    }

    /**
     * Log success
     * @param {string} component - Component name
     * @param {string} message - Success message
     * @param {*} data - Additional data
     */
    static success(component, message, data = null) {
        this.log(component, message, data, 'SUCCESS');
    }

    /**
     * Create a performance timer
     * @param {string} label - Timer label
     * @returns {Function} Function to stop timer and log result
     */
    static timer(label) {
        const start = performance.now();
        
        return () => {
            const end = performance.now();
            const duration = (end - start).toFixed(2);
            this.log('Performance', `${label} took ${duration}ms`, { start, end, duration }, 'INFO');
        };
    }

    /**
     * Toggle debug mode
     * @param {boolean} enabled - Enable or disable debug mode
     */
    static setDebugMode(enabled) {
        this.DEBUG_MODE = enabled;
        this.log('Debug', `Debug mode ${enabled ? 'enabled' : 'disabled'}`, null, 'INFO');
    }
}

// Make Debug available globally for easy access
window.Debug = Debug;