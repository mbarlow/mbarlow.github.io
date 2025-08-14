import { Component } from '../core/Component.js';
import { UUID } from '../utils/UUID.js';

/**
 * Simple Message data structure for both channels and DMs
 */
export class Message extends Component {
    constructor({
        id = null,
        type = 'channel', // 'channel' or 'dm'
        targetId = null,  // channel ID or entity ID for DMs
        content = '',
        created = null,
        author = null     // entity ID of message sender
    } = {}) {
        super();
        
        this.id = id || UUID.generate();
        this.type = type;
        this.targetId = targetId;
        this.content = content;
        this.created = created || new Date().toISOString();
        this.author = author;
    }

    /**
     * Convert to plain object for storage
     */
    toObject() {
        return {
            id: this.id,
            type: this.type,
            targetId: this.targetId,
            content: this.content,
            created: this.created,
            author: this.author
        };
    }

    /**
     * Create from plain object
     */
    static fromObject(data) {
        return new Message(data);
    }

    /**
     * Check if this is a channel message
     */
    isChannelMessage() {
        return this.type === 'channel';
    }

    /**
     * Check if this is a DM message
     */
    isDMMessage() {
        return this.type === 'dm';
    }

    /**
     * Get formatted timestamp
     */
    getFormattedTime() {
        return new Date(this.created).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    /**
     * Check if message contains an @ mention
     */
    hasMention(entityId) {
        return this.content.includes(`@${entityId}`) || this.content.includes('@everyone');
    }
}