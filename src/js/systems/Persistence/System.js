import { System } from '../../core/System.js';
import { SessionStorage } from '../../components/SessionStorage.js';
import { Session } from '../../components/Session.js';
import { ChatLog } from '../../components/ChatLog.js';
import { BrainComponent } from '../../components/BrainComponent.js';

export class PersistenceSystem extends System {
    constructor(world) {
        super();
        this.world = world;
        this.storage = new SessionStorage();
        this.saveInterval = 30000; // Save every 30 seconds
        this.lastSave = 0;
        this.initialized = false;
    }

    async init() {
        console.log('💾 Initializing PersistenceSystem...');
        
        try {
            await this.storage.initIndexedDB();
            await this.loadExistingData();
            this.initialized = true;
            console.log('✅ PersistenceSystem initialized');
        } catch (error) {
            console.warn('⚠️ IndexedDB unavailable, falling back to localStorage:', error);
            this.initialized = true;
        }
    }

    async loadExistingData() {
        console.log('📂 Loading existing session data...');
        
        try {
            const sessions = await this.storage.getAllSessions();
            console.log(`📊 Found ${sessions.length} saved sessions`);
            
            // Load the most recent active session if any
            const recentSessions = sessions
                .filter(s => s.state === 'active' || s.state === 'inactive')
                .sort((a, b) => b.lastActivityAt - a.lastActivityAt);
            
            if (recentSessions.length > 0) {
                const recentSession = recentSessions[0];
                console.log('🔄 Found recent session to potentially restore:', recentSession.title || recentSession.id);
                
                // Could implement auto-restore logic here
                // For now, just log that we have data available
            }
            
        } catch (error) {
            console.error('❌ Failed to load existing data:', error);
        }
    }

    async saveCurrentState() {
        if (!this.initialized) return;
        
        console.log('💾 Saving current state...');
        
        try {
            let savedCount = 0;
            
            // Save old SessionSystem data
            const sessionSystem = this.world.getSystem('session');
            if (sessionSystem) {
                for (const [sessionId, sessionData] of sessionSystem.sessions) {
                    const { session, entities } = sessionData;
                    
                    // Create session data
                    const sessionStorageData = this.storage.createSessionData(session);
                    await this.storage.saveSession(sessionStorageData);
                    
                    // Save chat log
                    const chatLogComp = entities[0]?.getComponent(ChatLog);
                    if (chatLogComp) {
                        const chatLog = chatLogComp.getLog(session.chatLogId);
                        if (chatLog) {
                            const chatLogData = this.storage.createChatLogData(chatLog);
                            await this.storage.saveChatLog(chatLogData);
                        }
                    }
                    
                    // Save brain data for all participants
                    for (const entity of entities) {
                        const brain = entity.getComponent(BrainComponent);
                        if (brain) {
                            const brainData = this.storage.createBrainData(entity.id, brain);
                            await this.storage.saveBrain(brainData);
                        }
                    }
                    
                    savedCount++;
                }
            }
            
            // Save new ConversationSystem data
            const conversationSystem = this.world.getSystem('conversation');
            if (conversationSystem) {
                const conversations = conversationSystem.getAllConversations();
                
                for (const conversation of conversations) {
                    // Only save conversations that have messages
                    if (conversation.messages && conversation.messages.length > 0) {
                        // Save conversation as a session for compatibility
                        const sessionData = {
                            id: conversation.id,
                            type: 'conversation',
                            conversationType: conversation.type, // 'dm' or 'channel'
                            title: conversation.name || `${conversation.type} conversation`,
                            participants: Array.from(conversation.participants),
                            messageCount: conversation.messageCount,
                            createdAt: conversation.createdAt,
                            lastActivityAt: conversation.lastActivityAt,
                            state: conversation.isActive ? 'active' : 'inactive',
                            chatLogId: `chatlog_${conversation.id}`
                        };
                        
                        // Add channel-specific data
                        if (conversation.type === 'channel') {
                            sessionData.channelName = conversation.name;
                            sessionData.channelDescription = conversation.description;
                            sessionData.isPrivate = conversation.isPrivate;
                        }
                        
                        await this.storage.saveSession(sessionData);
                        
                        // Save messages as a chat log
                        const chatLogData = {
                            id: sessionData.chatLogId,
                            sessionId: conversation.id,
                            messages: conversation.messages || [],
                            createdAt: conversation.createdAt,
                            lastActivity: conversation.lastActivityAt
                        };
                        
                        await this.storage.saveChatLog(chatLogData);
                        savedCount++;
                        
                        console.log(`💾 Saved ${conversation.type} "${conversation.name || conversation.id}" with ${conversation.messages.length} messages`);
                    }
                }
            }
            
            console.log(`✅ Saved ${savedCount} sessions/conversations to storage`);
            
        } catch (error) {
            console.error('❌ Failed to save state:', error);
        }
    }

    async searchSessions(query) {
        if (!this.initialized) return [];
        
        try {
            // Search by title first
            const titleResults = await this.storage.searchByTitle(query);
            
            // Search by keywords
            const keywords = query.split(' ').filter(k => k.length > 2);
            const keywordResults = await this.storage.searchSessions(keywords);
            
            // Combine and deduplicate results
            const allResults = [...titleResults, ...keywordResults];
            const uniqueResults = allResults.filter((result, index, self) => 
                index === self.findIndex(r => r.id === result.id)
            );
            
            // Sort by relevance (most recent first)
            return uniqueResults.sort((a, b) => b.lastActivityAt - a.lastActivityAt);
            
        } catch (error) {
            console.error('❌ Search failed:', error);
            return [];
        }
    }

    async loadSession(sessionId) {
        if (!this.initialized) return null;
        
        try {
            const session = await this.storage.loadSession(sessionId);
            const chatLog = session ? await this.storage.loadChatLog(session.chatLogId) : null;
            
            return {
                session,
                chatLog,
                participants: session?.participants || []
            };
            
        } catch (error) {
            console.error('❌ Failed to load session:', error);
            return null;
        }
    }

    async exportData() {
        if (!this.initialized) return null;
        
        try {
            return await this.storage.exportAllData();
        } catch (error) {
            console.error('❌ Export failed:', error);
            return null;
        }
    }

    async importData(data) {
        if (!this.initialized) return false;
        
        try {
            await this.storage.importData(data);
            return true;
        } catch (error) {
            console.error('❌ Import failed:', error);
            return false;
        }
    }

    // Auto-save functionality
    update(deltaTime) {
        if (!this.initialized) return;
        
        const now = Date.now();
        if (now - this.lastSave > this.saveInterval) {
            this.saveCurrentState();
            this.lastSave = now;
        }
    }

    // Manual save trigger
    async forceSave() {
        await this.saveCurrentState();
        this.lastSave = Date.now();
    }

    // Get session history for UI
    async getSessionHistory(limit = 20) {
        if (!this.initialized) return [];
        
        try {
            const sessions = await this.storage.getAllSessions();
            return sessions
                .sort((a, b) => b.lastActivityAt - a.lastActivityAt)
                .slice(0, limit)
                .map(session => ({
                    id: session.id,
                    title: session.title || 'Untitled Session',
                    lastActivity: new Date(session.lastActivityAt).toLocaleString(),
                    messageCount: session.messageCount,
                    participants: session.participants.length,
                    keywords: session.keywords
                }));
        } catch (error) {
            console.error('❌ Failed to get session history:', error);
            return [];
        }
    }

    // Cleanup old sessions
    async cleanupOldSessions(daysToKeep = 30) {
        if (!this.initialized) return;
        
        const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
        
        try {
            const sessions = await this.storage.getAllSessions();
            const oldSessions = sessions.filter(s => s.lastActivityAt < cutoffTime);
            
            console.log(`🧹 Cleaning up ${oldSessions.length} old sessions`);
            
            // Implementation would delete old sessions and their associated data
            // For now, just log what would be cleaned
            
        } catch (error) {
            console.error('❌ Cleanup failed:', error);
        }
    }
}