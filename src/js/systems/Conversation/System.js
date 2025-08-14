import { System } from '../../core/System.js';
import { Conversation } from '../../components/Conversation.js';

/**
 * ConversationSystem - Manages DMs and Channels using the new Conversation paradigm
 * Replaces the session-based approach with persistent conversations
 */
export class ConversationSystem extends System {
    constructor() {
        super();
        this.requiredComponents = [];
        
        // System references
        this.world = null;
        this.industrialPortfolio = null;
        
        // Conversation storage
        this.conversations = new Map(); // id -> Conversation
        this.dmLookup = new Map(); // "entityId1:entityId2" -> conversationId
        this.channels = new Map(); // name -> conversationId
        
        // Current active conversation
        this.activeConversationId = null;
    }

    async init(world, industrialPortfolio) {
        console.log("💬 Initializing Conversation System...");
        this.world = world;
        this.industrialPortfolio = industrialPortfolio;
        
        // Load saved conversations
        await this.loadSavedConversations();
        
        console.log("✅ Conversation System initialized");
    }
    
    async loadSavedConversations() {
        try {
            const persistenceSystem = this.world?.getSystem("persistence");
            if (!persistenceSystem?.initialized) {
                console.log("📂 Persistence system not ready, skipping conversation loading");
                return;
            }
            
            console.log("📂 Loading saved conversations...");
            const allSessions = await persistenceSystem.storage.getAllSessions();
            let loadedCount = 0;
            
            for (const session of allSessions) {
                // Only load conversation-type sessions (new format)
                if (session.type === 'conversation' && session.conversationType) {
                    const conversation = new Conversation(session.conversationType, {
                        id: session.id,
                        participants: session.participants || [],
                        messageCount: session.messageCount || 0,
                        createdAt: session.createdAt,
                        lastActivityAt: session.lastActivityAt,
                        name: session.channelName || session.title,
                        description: session.channelDescription,
                        isPrivate: session.isPrivate
                    });
                    
                    // Load messages from chat log
                    if (session.chatLogId) {
                        try {
                            const chatLog = await persistenceSystem.storage.loadChatLog(session.chatLogId);
                            if (chatLog && chatLog.messages) {
                                conversation.messages = chatLog.messages;
                                conversation.messageCount = chatLog.messages.length;
                                console.log(`📜 Loaded ${chatLog.messages.length} messages for ${conversation.type} "${conversation.name}"`);
                            }
                        } catch (error) {
                            console.warn(`Failed to load chat log for conversation ${session.id}:`, error);
                        }
                    }
                    
                    // Store the conversation
                    this.conversations.set(conversation.id, conversation);
                    
                    // Update lookup maps
                    if (conversation.type === 'dm') {
                        const dmKey = Array.from(conversation.participants).sort().join(':');
                        this.dmLookup.set(dmKey, conversation.id);
                    } else if (conversation.type === 'channel') {
                        this.channels.set(conversation.name, conversation.id);
                    }
                    
                    loadedCount++;
                }
            }
            
            console.log(`📊 Loaded ${loadedCount} saved conversations`);
            
        } catch (error) {
            console.error("❌ Failed to load saved conversations:", error);
        }
    }

    // DM Management
    findOrCreateDM(entityId1, entityId2) {
        const dmKey = [entityId1, entityId2].sort().join(':');
        
        // Check if DM already exists
        if (this.dmLookup.has(dmKey)) {
            const conversationId = this.dmLookup.get(dmKey);
            return this.conversations.get(conversationId);
        }
        
        // Create new DM
        const dm = new Conversation('dm', {
            participants: [entityId1, entityId2],
            createdBy: entityId1
        });
        
        this.conversations.set(dm.id, dm);
        this.dmLookup.set(dmKey, dm.id);
        
        console.log(`📱 Created new DM between ${entityId1} and ${entityId2}: ${dm.id}`);
        return dm;
    }
    
    getDM(entityId1, entityId2) {
        const dmKey = [entityId1, entityId2].sort().join(':');
        const conversationId = this.dmLookup.get(dmKey);
        return conversationId ? this.conversations.get(conversationId) : null;
    }
    
    getAllDMs(entityId) {
        const dms = [];
        for (const conversation of this.conversations.values()) {
            if (conversation.type === 'dm' && conversation.hasParticipant(entityId)) {
                dms.push(conversation);
            }
        }
        return dms.sort((a, b) => b.lastActivityAt - a.lastActivityAt);
    }

    // Channel Management
    createChannel(name, creatorId, options = {}) {
        // Check if channel name already exists
        if (this.channels.has(name)) {
            throw new Error(`Channel "${name}" already exists`);
        }
        
        const channel = new Conversation('channel', {
            name: name,
            description: options.description || '',
            isPrivate: options.isPrivate || false,
            participants: [creatorId, ...(options.initialMembers || [])],
            createdBy: creatorId
        });
        
        this.conversations.set(channel.id, channel);
        this.channels.set(name, channel.id);
        
        console.log(`🌐 Created new channel "${name}": ${channel.id}`);
        return channel;
    }
    
    getChannel(name) {
        const conversationId = this.channels.get(name);
        return conversationId ? this.conversations.get(conversationId) : null;
    }
    
    getAllChannels(entityId = null) {
        const channels = [];
        for (const conversation of this.conversations.values()) {
            if (conversation.type === 'channel') {
                // If entityId provided, only return channels they're in
                if (!entityId || conversation.hasParticipant(entityId)) {
                    channels.push(conversation);
                }
            }
        }
        return channels.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    joinChannel(channelName, entityId) {
        const channel = this.getChannel(channelName);
        if (!channel) {
            throw new Error(`Channel "${channelName}" not found`);
        }
        
        if (channel.isPrivate) {
            throw new Error(`Channel "${channelName}" is private`);
        }
        
        channel.addParticipant(entityId);
        console.log(`👋 ${entityId} joined channel "${channelName}"`);
        return channel;
    }
    
    leaveChannel(channelName, entityId) {
        const channel = this.getChannel(channelName);
        if (!channel) {
            throw new Error(`Channel "${channelName}" not found`);
        }
        
        channel.removeParticipant(entityId);
        console.log(`👋 ${entityId} left channel "${channelName}"`);
        return channel;
    }

    // Message Management
    addMessage(conversationId, senderId, content, type = 'user', options = {}) {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) {
            throw new Error(`Conversation ${conversationId} not found`);
        }
        
        // Verify sender is participant
        if (!conversation.hasParticipant(senderId)) {
            throw new Error(`Entity ${senderId} is not a participant in conversation ${conversationId}`);
        }
        
        // Create message
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const message = {
            id: messageId,
            conversationId: conversationId,
            senderId: senderId,
            content: content,
            type: type,
            timestamp: Date.now(),
            ...options
        };
        
        // Initialize messages array if it doesn't exist
        if (!conversation.messages) {
            conversation.messages = [];
        }
        
        // Store the full message data on the conversation
        conversation.messages.push(message);
        
        // Add to conversation messageIds tracking
        conversation.addMessage(messageId);
        
        console.log(`💌 Added message to ${conversation.type} ${conversation.id}: ${content.substring(0, 50)}...`);
        
        // Trigger UI update if this is the active conversation
        if (this.activeConversationId === conversationId) {
            this.notifyMessageAdded(message);
        }
        
        return message;
    }

    // Active Conversation Management
    setActiveConversation(conversationId) {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) {
            throw new Error(`Conversation ${conversationId} not found`);
        }
        
        // Deactivate previous
        if (this.activeConversationId) {
            const prev = this.conversations.get(this.activeConversationId);
            if (prev) prev.isActive = false;
        }
        
        // Activate new
        conversation.isActive = true;
        this.activeConversationId = conversationId;
        
        console.log(`🎯 Set active conversation: ${conversation.type} "${conversation.getDisplayName()}"`);
        return conversation;
    }
    
    getActiveConversation() {
        return this.activeConversationId ? this.conversations.get(this.activeConversationId) : null;
    }

    // Compatibility methods for existing code
    getConversationById(id) {
        return this.conversations.get(id);
    }
    
    getAllConversations() {
        return Array.from(this.conversations.values());
    }

    // Debug and utility methods
    getDebugInfo() {
        const dms = this.getAllConversations().filter(c => c.type === 'dm');
        const channels = this.getAllConversations().filter(c => c.type === 'channel');
        
        return {
            totalConversations: this.conversations.size,
            dms: dms.length,
            channels: channels.length,
            activeConversation: this.activeConversationId,
            dmLookups: this.dmLookup.size,
            channelNames: Array.from(this.channels.keys())
        };
    }

    // UI notification for real-time updates
    notifyMessageAdded(message) {
        try {
            // Get the SessionManagementSystem to trigger UI update
            const sessionMgmt = this.world?.getSystem("sessionManagement");
            if (sessionMgmt) {
                // Get sender entity to get display name
                const senderEntity = this.world?.entities?.get(message.senderId);
                const authorName = senderEntity?.tag || message.speaker_name || message.senderId;
                
                // Add the message to the UI
                sessionMgmt.addChannelMessage(
                    message.type,
                    message.content,
                    authorName,
                    message.timestamp,
                    {} // options for display
                );
                
                console.log(`🔔 UI updated with new message from ${authorName}`);
            } else {
                console.warn("⚠️ SessionManagementSystem not available for UI update");
            }
        } catch (error) {
            console.warn("⚠️ Failed to notify UI of new message:", error);
        }
    }

    // System update method (required by ECS)
    update(deltaTime) {
        // ConversationSystem doesn't need regular updates
        // It responds to user actions instead
    }
}