import { System } from '../../core/System.js';
import { ChatStorage } from '../../storage/ChatStorage.js';
import { Message } from '../../components/Message.js';
import { Channel } from '../../components/Channel.js';

/**
 * Simple unified chat system for channels and DMs
 * Replaces the complex Session/Conversation systems
 */
export class ChatSystem extends System {
    constructor() {
        super();
        this.storage = new ChatStorage();
        this.initialized = false;
        this.activeTarget = null; // Current channel or DM target
        this.activeType = null;   // 'channel' or 'dm'
    }

    async init(world, industrialPortfolio) {
        console.log('💬 Initializing ChatSystem...');
        this.world = world;
        this.industrialPortfolio = industrialPortfolio;
        
        // Initialize storage
        await this.storage.init();
        
        // Create default channels if they don't exist
        await this.ensureDefaultChannels();
        
        this.initialized = true;
        console.log('✅ ChatSystem initialized');
    }

    /**
     * Ensure default channels exist
     */
    async ensureDefaultChannels() {
        // Create general channel
        let generalChannel = await this.storage.getChannelByName('general');
        if (!generalChannel) {
            generalChannel = new Channel({
                name: 'general',
                description: 'General discussion channel',
                members: []
            });
            await this.storage.saveChannel(generalChannel);
            console.log('📡 Created default #general channel');
        }

        // Create random channel
        let randomChannel = await this.storage.getChannelByName('random');
        if (!randomChannel) {
            randomChannel = new Channel({
                name: 'random',
                description: 'Random conversations and autonomous chat',
                members: []
            });
            await this.storage.saveChannel(randomChannel);
            console.log('📡 Created default #random channel');
        }
    }

    /**
     * Send a message to a channel
     */
    async sendChannelMessage(channelName, authorId, content) {
        if (!this.initialized) {
            console.warn('ChatSystem not initialized');
            return null;
        }

        const channel = await this.storage.getChannelByName(channelName);
        if (!channel) {
            console.warn(`Channel #${channelName} not found`);
            return null;
        }

        // Check if author is a member (or add them)
        if (!channel.hasMember(authorId)) {
            channel.addMember(authorId);
            await this.storage.saveChannel(channel);
        }

        const message = new Message({
            type: 'channel',
            targetId: channel.id,
            content: content,
            author: authorId
        });

        await this.storage.saveMessage(message);
        console.log(`📡 Channel message sent to #${channelName}: ${content.substring(0, 50)}...`);

        // Trigger UI update if this is the active channel
        if (this.activeType === 'channel' && this.activeTarget === channel.id) {
            this.notifyNewMessage(message, channel);
        }

        return message;
    }

    /**
     * Send a DM to an entity
     */
    async sendDM(fromEntityId, toEntityId, content) {
        if (!this.initialized) {
            console.warn('ChatSystem not initialized');
            return null;
        }

        const message = new Message({
            type: 'dm',
            targetId: toEntityId,
            content: content,
            author: fromEntityId
        });

        await this.storage.saveMessage(message);
        console.log(`💬 DM sent from ${fromEntityId} to ${toEntityId}: ${content.substring(0, 50)}...`);

        // Trigger UI update if this is the active DM
        if (this.activeType === 'dm' && 
            (this.activeTarget === toEntityId || this.activeTarget === fromEntityId)) {
            this.notifyNewMessage(message);
        }

        return message;
    }

    /**
     * Join an entity to a channel
     */
    async joinChannel(channelName, entityId) {
        const channel = await this.storage.getChannelByName(channelName);
        if (!channel) {
            console.warn(`Channel #${channelName} not found`);
            return false;
        }

        if (!channel.hasMember(entityId)) {
            channel.addMember(entityId);
            await this.storage.saveChannel(channel);
            console.log(`🤖 Entity ${entityId} joined #${channelName}`);
            return true;
        }

        return false; // Already a member
    }

    /**
     * Get all channels
     */
    async getAllChannels() {
        return await this.storage.getAllChannels();
    }

    /**
     * Get channel messages
     */
    async getChannelMessages(channelName, limit = 100) {
        const channel = await this.storage.getChannelByName(channelName);
        if (!channel) return [];
        
        return await this.storage.getMessages('channel', channel.id, limit);
    }

    /**
     * Get DM messages between two entities
     */
    async getDMMessages(entityId1, entityId2, limit = 100) {
        // Get ALL DM messages and filter properly to avoid cross-contamination
        const allDMMessages = await this.storage.getAllMessages('dm');

        // Filter to only include messages between these two specific entities
        const filteredMessages = allDMMessages.filter(msg => 
            msg.type === 'dm' && (
                (msg.author === entityId1 && msg.targetId === entityId2) ||
                (msg.author === entityId2 && msg.targetId === entityId1)
            )
        );

        console.log(`💬 Found ${filteredMessages.length} DM messages between ${entityId1} and ${entityId2}`);

        // Sort by timestamp and limit
        filteredMessages.sort((a, b) => new Date(a.created) - new Date(b.created));
        return filteredMessages.slice(-limit);
    }

    /**
     * Get entities with DM history
     */
    async getDMEntities() {
        return await this.storage.getDMEntities();
    }

    /**
     * Set active chat target for UI updates
     */
    setActiveTarget(type, targetId) {
        this.activeType = type;
        this.activeTarget = targetId;
        console.log(`🎯 Set active chat: ${type} ${targetId}`);
    }

    /**
     * Get recent messages for context (useful for AI responses)
     */
    async getRecentContext(type, targetId, count = 5) {
        if (type === 'channel') {
            const channels = await this.getAllChannels();
            const channel = channels.find(c => c.id === targetId || c.name === targetId);
            if (!channel) return [];
            return await this.storage.getRecentMessages('channel', channel.id, count);
        } else {
            return await this.storage.getRecentMessages('dm', targetId, count);
        }
    }

    /**
     * Notify UI of new message
     */
    notifyNewMessage(message, channel = null) {
        try {
            // Get the entity that sent the message for display name
            const senderEntity = this.world?.entities?.get(message.author);
            const authorName = senderEntity?.tag || message.author;

            // Add message to UI (this will need to integrate with existing UI system)
            if (this.industrialPortfolio) {
                let messageType = message.type === 'channel' ? 'assistant' : 'user';
                
                if (message.type === 'channel') {
                    // For channel messages, use exact same format as DM messages
                    this.industrialPortfolio.addMessage(
                        messageType,
                        message.content,
                        { 
                            author: authorName,
                            timestamp: message.created,
                            isChannelMessage: true
                        }
                    );
                } else {
                    // For DMs, determine if it's from player or other entity
                    const isFromPlayer = message.author === this.industrialPortfolio?.playerEntity?.id;
                    messageType = isFromPlayer ? 'user' : 'assistant';
                    
                    this.industrialPortfolio.addMessage(
                        messageType,
                        message.content,
                        { 
                            author: authorName,
                            timestamp: message.created,
                            isChannelMessage: false,
                            originalAuthor: message.author
                        }
                    );
                }
            }
            
            console.log(`🔔 UI updated with new message from ${authorName} (${message.type})`);
        } catch (error) {
            console.warn('⚠️ Failed to notify UI of new message:', error);
        }
    }

    /**
     * Create a new channel
     */
    async createChannel(name, creatorId, description = '') {
        const existing = await this.storage.getChannelByName(name);
        if (existing) {
            throw new Error(`Channel #${name} already exists`);
        }

        const channel = new Channel({
            name: name,
            description: description,
            members: [creatorId]
        });

        await this.storage.saveChannel(channel);
        console.log(`📡 Created new channel #${name}`);
        return channel;
    }

    /**
     * System update method (required by ECS)
     */
    update(deltaTime) {
        // ChatSystem doesn't need regular updates
        // It responds to actions instead
    }

    /**
     * Debug info
     */
    async getDebugInfo() {
        const channels = await this.getAllChannels();
        const dmEntities = await this.getDMEntities();
        
        return {
            initialized: this.initialized,
            channelCount: channels.length,
            dmEntityCount: dmEntities.length,
            activeTarget: this.activeTarget,
            activeType: this.activeType,
            channels: channels.map(c => ({ name: c.name, members: c.getMemberCount() }))
        };
    }
}