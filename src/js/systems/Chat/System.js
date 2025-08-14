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
        
        // Force database upgrade if needed for entities store
        await this.storage.forceUpgrade();
        
        // Create default channels if they don't exist
        await this.ensureDefaultChannels();
        
        this.initialized = true;
        
        // Expose debug methods globally
        if (typeof window !== 'undefined') {
            window.clearChatData = () => this.clearAllData();
            window.deleteChatDB = () => this.deleteDatabase();
        }
        
        console.log('✅ ChatSystem initialized');
        console.log('🔧 Debug: Use clearChatData() or deleteChatDB() in console to reset data');
        
        console.log('🔧 Simple entity storage: entities are stored by name with regular UUIDs');
        console.log('🔧 Debug: Use clearChatData() or deleteChatDB() in console to reset data');
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

        // Get entity name for consistent storage
        const worldEntity = this.world?.entities?.get(authorId);
        const entityName = worldEntity?.tag || worldEntity?.id || authorId;
        
        // Get or create entity data for consistent UUID
        const authorEntity = await this.storage.getOrCreateEntity(entityName, 'entity');
        
        // Check if author is a member (or add them) using UUID
        if (!channel.hasMember(authorEntity.uuid)) {
            channel.addMember(authorEntity.uuid);
            await this.storage.saveChannel(channel);
        }

        const message = new Message({
            type: 'channel',
            targetId: channel.id,
            content: content,
            author: authorEntity.uuid
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

        // Get entity names for consistent storage
        const fromWorldEntity = this.world?.entities?.get(fromEntityId);
        const toWorldEntity = this.world?.entities?.get(toEntityId);
        const fromEntityName = fromWorldEntity?.tag || fromWorldEntity?.id || fromEntityId;
        const toEntityName = toWorldEntity?.tag || toWorldEntity?.id || toEntityId;
        
        // Get or create entity data for consistent UUIDs
        const fromEntity = await this.storage.getOrCreateEntity(fromEntityName, 'entity');
        const toEntity = await this.storage.getOrCreateEntity(toEntityName, 'entity');
        
        const message = new Message({
            type: 'dm',
            targetId: toEntity.uuid,
            content: content,
            author: fromEntity.uuid
        });

        await this.storage.saveMessage(message);
        console.log(`💬 DM sent from ${fromEntity.name} to ${toEntity.name}: ${content.substring(0, 50)}...`);

        // Trigger UI update if this is the active DM
        if (this.activeType === 'dm' && 
            (this.activeTarget === toEntity.uuid || this.activeTarget === fromEntity.uuid)) {
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

        // Get entity name for consistent storage
        const worldEntity = this.world?.entities?.get(entityId);
        const entityName = worldEntity?.tag || worldEntity?.id || entityId;
        
        // Get or create entity data for consistent UUID
        const entity = await this.storage.getOrCreateEntity(entityName, 'entity');
        
        if (!channel.hasMember(entity.uuid)) {
            channel.addMember(entity.uuid);
            await this.storage.saveChannel(channel);
            console.log(`🤖 Entity ${entity.name} joined #${channelName}`);
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
        // Get entity names and their UUIDs
        const entity1World = this.world?.entities?.get(entityId1);
        const entity2World = this.world?.entities?.get(entityId2);
        const entity1Name = entity1World?.tag || entity1World?.id || entityId1;
        const entity2Name = entity2World?.tag || entity2World?.id || entityId2;
        
        // Get entity data (will find existing by name)
        const entity1Data = await this.storage.getOrCreateEntity(entity1Name, 'entity');
        const entity2Data = await this.storage.getOrCreateEntity(entity2Name, 'entity');
        
        // Get ALL DM messages and filter by UUIDs
        const allDMMessages = await this.storage.getAllMessages('dm');

        // Filter to only include messages between these two specific entities (by UUID)
        const filteredMessages = allDMMessages.filter(msg => 
            msg.type === 'dm' && (
                (msg.author === entity1Data.uuid && msg.targetId === entity2Data.uuid) ||
                (msg.author === entity2Data.uuid && msg.targetId === entity1Data.uuid)
            )
        );

        console.log(`💬 Found ${filteredMessages.length} DM messages between ${entity1Name} and ${entity2Name}`);

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
     * Notify UI of new message - ONLY if it matches the current active view
     */
    notifyNewMessage(message, channel = null) {
        try {
            console.log(`🔍 FILTERING CHECK: message.type=${message.type}, activeType=${this.activeType}, activeTarget=${this.activeTarget}, channel=${channel?.id || 'null'}`);
            
            // STRICT FILTERING: Only display if message matches current active view
            if (message.type === 'channel') {
                // Only show channel messages if we're actively viewing that specific channel
                if (this.activeType !== 'channel' || !channel || this.activeTarget !== channel.id) {
                    console.log(`🔇 IGNORING CHANNEL MESSAGE: activeType=${this.activeType} (should be 'channel'), activeTarget=${this.activeTarget}, messageChannel=${channel?.id}`);
                    return;
                }
                console.log(`✅ ALLOWING CHANNEL MESSAGE: matches active channel view`);
            } else if (message.type === 'dm') {
                // Only show DM messages if we're actively viewing that specific DM conversation
                const playerEntity = this.industrialPortfolio?.playerEntity;
                if (!playerEntity) {
                    console.log(`🔇 IGNORING DM MESSAGE: no player entity`);
                    return;
                }
                
                const isRelevantDM = (message.author === playerEntity.id && message.targetId === this.activeTarget) ||
                                   (message.targetId === playerEntity.id && message.author === this.activeTarget);
                
                if (this.activeType !== 'dm' || !isRelevantDM) {
                    console.log(`🔇 IGNORING DM MESSAGE: activeType=${this.activeType} (should be 'dm'), isRelevantDM=${isRelevantDM}`);
                    return;
                }
                console.log(`✅ ALLOWING DM MESSAGE: matches active DM view`);
            }

            // Get the entity that sent the message for display name
            const senderEntity = this.world?.entities?.get(message.author);
            const authorName = senderEntity?.tag || message.author;

            // Add message to UI - only gets here if it matches the active view
            if (this.industrialPortfolio) {
                const isFromPlayer = message.author === this.industrialPortfolio?.playerEntity?.id;
                
                this.industrialPortfolio.addMessage(
                    isFromPlayer ? 'user' : 'assistant',
                    message.content,
                    { 
                        author: authorName,
                        timestamp: message.created,
                        isChannelMessage: message.type === 'channel'
                    }
                );
            }
            
            console.log(`🔔 UI updated with new message from ${authorName} (${message.type}) - matches active view`);
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

    /**
     * Clear all chat data (exposed for debugging)
     */
    async clearAllData() {
        await this.storage.clearAll();
        console.log('🗑️ All chat data cleared');
    }

    /**
     * Delete entire database (exposed for debugging)
     */
    async deleteDatabase() {
        await this.storage.deleteDatabase();
        console.log('🗑️ Database deleted - please refresh the page');
    }
}