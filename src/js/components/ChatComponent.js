import { Component } from '../core/Component.js';

/**
 * Chat component for entities - provides simple chat methods
 */
export class ChatComponent extends Component {
    constructor() {
        super();
        this.joinedChannels = new Set(); // Track which channels this entity has joined
    }

    /**
     * Initialize with world reference for accessing ChatSystem
     */
    init(world, entityId) {
        this.world = world;
        this.entityId = entityId;
    }

    /**
     * Send a message to a channel
     */
    async sendChannelMsg(channelName, message) {
        const chatSystem = this.world?.getSystem('chat');
        if (!chatSystem) {
            console.warn('ChatSystem not available');
            return null;
        }

        const result = await chatSystem.sendChannelMessage(channelName, this.entityId, message);
        if (result) {
            this.joinedChannels.add(channelName);
        }
        return result;
    }

    /**
     * Send a DM to another entity
     */
    async sendDM(targetEntityId, message) {
        const chatSystem = this.world?.getSystem('chat');
        if (!chatSystem) {
            console.warn('ChatSystem not available');
            return null;
        }

        return await chatSystem.sendDM(this.entityId, targetEntityId, message);
    }

    /**
     * Join a channel
     */
    async joinChannel(channelName) {
        const chatSystem = this.world?.getSystem('chat');
        if (!chatSystem) {
            console.warn('ChatSystem not available');
            return false;
        }

        const joined = await chatSystem.joinChannel(channelName, this.entityId);
        if (joined) {
            this.joinedChannels.add(channelName);
            console.log(`🤖 ${this.entityId} joined #${channelName}`);
        }
        return joined;
    }

    /**
     * Get recent messages from a channel for context
     */
    async getChannelContext(channelName, count = 5) {
        const chatSystem = this.world?.getSystem('chat');
        if (!chatSystem) return [];

        return await chatSystem.getRecentContext('channel', channelName, count);
    }

    /**
     * Get recent DM messages with another entity for context
     */
    async getDMContext(otherEntityId, count = 5) {
        const chatSystem = this.world?.getSystem('chat');
        if (!chatSystem) return [];

        const messages = await chatSystem.getDMMessages(this.entityId, otherEntityId, count);
        return messages.slice(-count);
    }

    /**
     * Check if entity is in a channel
     */
    isInChannel(channelName) {
        return this.joinedChannels.has(channelName);
    }

    /**
     * Get all joined channels
     */
    getJoinedChannels() {
        return Array.from(this.joinedChannels);
    }

    /**
     * Generate a contextual response based on recent messages
     */
    async generateContextualResponse(channelName, mentionedEntity = null) {
        const agentSystem = this.world?.getSystem('agent');
        if (!agentSystem) return null;

        // Get recent context from the channel
        const context = await this.getChannelContext(channelName, 5);
        if (context.length === 0) return null;

        // Build context string
        let contextStr = `Recent conversation in #${channelName}:\\n`;
        for (const msg of context) {
            const senderEntity = this.world?.entities?.get(msg.author);
            const senderName = senderEntity?.tag || msg.author;
            contextStr += `${senderName}: ${msg.content}\\n`;
        }

        // Add mention context if applicable
        if (mentionedEntity) {
            contextStr += `\\nYou were mentioned by ${mentionedEntity}. Please respond appropriately.`;
        }

        // Get the entity associated with this component
        const entity = this.world?.entities?.get(this.entityId);
        if (!entity) return null;

        try {
            const response = await agentSystem.generateResponseWithContext(
                contextStr,
                entity,
                { 
                    context: 'channel_conversation',
                    channel: channelName,
                    recentMessages: context.length
                }
            );

            return response;
        } catch (error) {
            console.warn(`Failed to generate response for ${this.entityId}:`, error);
            return null;
        }
    }

    /**
     * Auto-respond to channel messages with context awareness
     */
    async handleChannelMessage(channelName, newMessage) {
        // Don't respond to own messages
        if (newMessage.author === this.entityId) return;

        // Check if we're mentioned
        const isMentioned = newMessage.hasMention(this.entityId);
        
        // Random chance to respond even without mention (for natural conversation)
        const shouldRespond = isMentioned || (Math.random() < 0.3 && this.isInChannel(channelName));
        
        if (shouldRespond) {
            // Small delay to make it feel more natural
            setTimeout(async () => {
                const response = await this.generateContextualResponse(
                    channelName, 
                    isMentioned ? newMessage.author : null
                );
                
                if (response) {
                    await this.sendChannelMsg(channelName, response);
                }
            }, 1000 + Math.random() * 3000); // 1-4 second delay
        }
    }
}