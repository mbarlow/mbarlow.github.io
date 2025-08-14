/**
 * UUID utility functions
 */
export class UUID {
    /**
     * Generate a proper UUID v4
     */
    static generate() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Validate if a string is a proper UUID
     */
    static isValid(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }

    /**
     * Create a UUID for an entity based on its tag/name (deterministic for same names)
     * This ensures same-named entities get the same UUID across sessions
     */
    static fromName(name) {
        // Simple deterministic UUID generation based on name
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            const char = name.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        // Convert hash to hex and pad to create UUID-like structure
        const hex = Math.abs(hash).toString(16).padStart(8, '0');
        return `${hex.substring(0, 8)}-${hex.substring(0, 4)}-4${hex.substring(1, 4)}-8${hex.substring(0, 3)}-${hex.padEnd(12, '0').substring(0, 12)}`;
    }
}