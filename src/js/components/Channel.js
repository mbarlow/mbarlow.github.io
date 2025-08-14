import { Component } from '../core/Component.js';

/**
 * Simple Channel data structure
 */
export class Channel extends Component {
    constructor({
        id = null,
        name = '',
        members = [],
        created = null,
        description = ''
    } = {}) {
        super();
        
        this.id = id || `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.name = name;
        this.members = new Set(members); // Use Set for efficient member operations
        this.created = created || new Date().toISOString();
        this.description = description;
    }

    /**
     * Convert to plain object for storage
     */
    toObject() {
        return {
            id: this.id,
            name: this.name,
            members: Array.from(this.members),
            created: this.created,
            description: this.description
        };
    }

    /**
     * Create from plain object
     */
    static fromObject(data) {
        return new Channel(data);
    }

    /**
     * Add member to channel
     */
    addMember(entityId) {
        this.members.add(entityId);
    }

    /**
     * Remove member from channel
     */
    removeMember(entityId) {
        this.members.delete(entityId);
    }

    /**
     * Check if entity is a member
     */
    hasMember(entityId) {
        return this.members.has(entityId);
    }

    /**
     * Get member count
     */
    getMemberCount() {
        return this.members.size;
    }

    /**
     * Get all member IDs as array
     */
    getMemberIds() {
        return Array.from(this.members);
    }

    /**
     * Get display name for UI
     */
    getDisplayName() {
        return `#${this.name}`;
    }
}