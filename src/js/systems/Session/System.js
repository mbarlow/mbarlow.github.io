import { System } from '../../core/System.js';
import { Connection } from '../../components/Connection.js';
import { Session } from '../../components/Session.js';
import { ChatLog } from '../../components/ChatLog.js';
import { BrainComponent } from '../../components/BrainComponent.js';
import { VoxelIndicatorComponent } from '../../components/VoxelIndicatorComponent.js';
import { generateUUID } from '../../utils/uuid.js';

export class SessionSystem extends System {
    constructor(world) {
        super();
        this.world = world;
        this.sessions = new Map(); // sessionId -> sessionData
        this.chatLogs = new Map(); // chatLogId -> chatLog
    }

    async findOrCreateSession(entity1, entity2) {
        // Load existing sessions from persistence first
        const persistenceSystem = this.world.getSystem("persistence");
        if (persistenceSystem && persistenceSystem.initialized) {
            try {
                const allSessions = await persistenceSystem.storage.getAllSessions();
                console.log(`🔍 Checking ${allSessions.length} existing sessions for reuse...`);
                
                // Sort sessions by creation time (newest first) to prefer most recent empty session
                const sortedSessions = allSessions.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                
                // Look for empty sessions between these specific entities first
                for (const sessionData of sortedSessions) {
                    // Check if this session involves both entities (by tag since IDs change)
                    const entity1Tag = entity1.tag || entity1.id;
                    const entity2Tag = entity2.tag || entity2.id;
                    const sessionTitle = sessionData.title || '';
                    
                    // Check if session title contains both entity tags
                    if (sessionTitle.toLowerCase().includes(entity1Tag.toLowerCase()) && 
                        sessionTitle.toLowerCase().includes(entity2Tag.toLowerCase())) {
                        
                        // Check if this session has no messages
                        if (sessionData.messageCount === 0) {
                            console.log(`♻️ Found empty session to reuse: ${sessionData.title}`);
                            
                            // Load this session into the entities
                            const sessionComp1 = this.world.ensureComponent(entity1, Session);
                            const sessionComp2 = this.world.ensureComponent(entity2, Session);
                            
                            // Restore the session data, ensuring participants is a Set
                            const restoredSession = {
                                ...sessionData,
                                participants: new Set(Array.isArray(sessionData.participants) ? 
                                    sessionData.participants : 
                                    Array.from(sessionData.participants))
                            };
                            
                            sessionComp1.activeSessions.set(restoredSession.id, restoredSession);
                            sessionComp2.activeSessions.set(restoredSession.id, restoredSession);
                            
                            // Store reference in the sessions map for system tracking
                            this.sessions.set(restoredSession.id, {
                                session: restoredSession,
                                entities: [entity1, entity2]
                            });
                            
                            restoredSession.reused = true;
                            restoredSession.lastActivityAt = Date.now();
                            return restoredSession;
                        }
                    }
                }
                
                // If no matching session found, look for ANY empty session to reuse (fallback)
                for (const sessionData of sortedSessions) {
                    if (sessionData.messageCount === 0) {
                        console.log(`♻️ Found any empty session to reuse: ${sessionData.title || sessionData.id}`);
                        
                        // Load this session into the entities
                        const sessionComp1 = this.world.ensureComponent(entity1, Session);
                        const sessionComp2 = this.world.ensureComponent(entity2, Session);
                        
                        // Restore the session data, ensuring participants is a Set
                        const restoredSession = {
                            ...sessionData,
                            participants: new Set([entity1.id, entity2.id]), // Update participants to new entities
                            title: `${entity1.tag || entity1.id} ⟷ ${entity2.tag || entity2.id}` // Update title
                        };
                        
                        sessionComp1.activeSessions.set(restoredSession.id, restoredSession);
                        sessionComp2.activeSessions.set(restoredSession.id, restoredSession);
                        
                        // Store reference in the sessions map for system tracking
                        this.sessions.set(restoredSession.id, {
                            session: restoredSession,
                            entities: [entity1, entity2]
                        });
                        
                        restoredSession.reused = true;
                        restoredSession.lastActivityAt = Date.now();
                        return restoredSession;
                    }
                }
            } catch (error) {
                console.warn('Failed to load existing sessions:', error);
            }
        }
        
        // Check in-memory sessions as fallback
        const existingSessions = this.getSessionsBetweenEntities(entity1, entity2);
        
        for (const session of existingSessions) {
            // Check if this session has any messages
            const chatLog = entity1.getComponent(ChatLog) || entity2.getComponent(ChatLog);
            if (chatLog) {
                const log = chatLog.getLog(session.chatLogId);
                if (log && log.messages.length === 0) {
                    // Found an empty session we can reuse
                    console.log(`♻️ Reusing in-memory empty session`);
                    session.reused = true;
                    session.lastActivityAt = Date.now();
                    return session;
                }
            }
        }
        
        // No empty session found, create a new one
        console.log('📝 Creating new session - no empty sessions found to reuse');
        const newSession = this.createSession(entity1, entity2);
        if (newSession) {
            newSession.reused = false;
        }
        return newSession;
    }
    
    getSessionsBetweenEntities(entity1, entity2) {
        const sessions = [];
        const sessionComp1 = entity1.getComponent(Session);
        
        if (sessionComp1) {
            for (const [sessionId, sessionData] of sessionComp1.activeSessions) {
                if (sessionData.participants.has(entity1.id) && 
                    sessionData.participants.has(entity2.id)) {
                    sessions.push(sessionData);
                }
            }
        }
        
        return sessions;
    }

    createSession(entity1, entity2) {
        // Check if entities have required components
        const conn1 = entity1.getComponent(Connection);
        const conn2 = entity2.getComponent(Connection);
        
        if (!conn1 || !conn2) {
            console.error('Entities must have Connection components');
            return null;
        }

        // Create connection if it doesn't exist
        if (!conn1.hasConnectionTo(entity2.id)) {
            const connectionData = {
                id: generateUUID(),
                state: 'active'
            };
            conn1.addConnection(entity2.id, connectionData);
            conn2.addConnection(entity1.id, connectionData);
        }

        // Create session
        const sessionComp = this.world.ensureComponent(entity1, Session);
        const sessionComp2 = this.world.ensureComponent(entity2, Session);
        
        const sessionData = sessionComp.createSession(
            conn1.getConnection(entity2.id).id,
            [entity1.id, entity2.id]
        );
        
        // Set a default title based on entity tags for better session identification
        const entity1Name = entity1.tag || `Entity ${entity1.id.substring(0, 8)}`;
        const entity2Name = entity2.tag || `Entity ${entity2.id.substring(0, 8)}`;
        sessionData.title = `${entity1Name} ⟷ ${entity2Name}`;

        // Share session with both entities
        sessionComp2.activeSessions.set(sessionData.id, sessionData);

        // Create chat log
        const chatLogComp = this.world.ensureComponent(entity1, ChatLog);
        const chatLogComp2 = this.world.ensureComponent(entity2, ChatLog);
        
        chatLogComp.createLog(sessionData.chatLogId);
        chatLogComp2.logs = chatLogComp.logs; // Share the same logs Map

        // Update connection with session
        conn1.updateConnectionSession(entity2.id, sessionData.id);
        conn2.updateConnectionSession(entity1.id, sessionData.id);
        conn1.updateConnectionState(entity2.id, 'active');
        conn2.updateConnectionState(entity1.id, 'active');

        // Update brain components if they exist
        const brain1 = entity1.getComponent(BrainComponent);
        const brain2 = entity2.getComponent(BrainComponent);
        
        if (brain1) brain1.addSessionToHistory(sessionData.id);
        if (brain2) brain2.addSessionToHistory(sessionData.id);

        this.sessions.set(sessionData.id, {
            session: sessionData,
            entities: [entity1, entity2]
        });

        return sessionData;
    }

    activateSession(sessionId) {
        const sessionData = this.sessions.get(sessionId);
        if (!sessionData) return;

        const { session, entities } = sessionData;
        session.state = 'active';
        
        // Update connection states
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            const otherEntity = entities[1 - i];
            const conn = entity.getComponent(Connection);
            if (conn) {
                conn.updateConnectionState(otherEntity.id, 'active');
            }
        }

        // Update session components
        entities.forEach(entity => {
            const sessionComp = entity.getComponent(Session);
            if (sessionComp) {
                sessionComp.updateSessionState(sessionId, 'active');
            }
        });
    }

    deactivateSession(sessionId) {
        const sessionData = this.sessions.get(sessionId);
        if (!sessionData) return;

        const { session, entities } = sessionData;
        session.state = 'inactive';
        
        // Update connection states
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            const otherEntity = entities[1 - i];
            const conn = entity.getComponent(Connection);
            if (conn) {
                conn.updateConnectionState(otherEntity.id, 'inactive');
            }
        }

        // Update session components
        entities.forEach(entity => {
            const sessionComp = entity.getComponent(Session);
            if (sessionComp) {
                sessionComp.deactivateSession(sessionId);
            }
            
            const brain = entity.getComponent(BrainComponent);
            if (brain) {
                brain.removeActiveSession(sessionId);
            }
        });
    }

    sendMessage(sessionId, senderId, content, type = 'user', options = {}) {
        const sessionData = this.sessions.get(sessionId);
        if (!sessionData) return null;

        const { session, entities } = sessionData;
        
        // Get chat log from any entity (they share the same log)
        const chatLogComp = entities[0].getComponent(ChatLog);
        if (!chatLogComp) return null;

        // Add message to log with optional images
        const message = chatLogComp.addMessage(session.chatLogId, {
            senderId,
            content,
            type,
            images: options.images || [],
            metadata: options.metadata || {}
        });

        // Update session
        entities.forEach(entity => {
            const sessionComp = entity.getComponent(Session);
            if (sessionComp) {
                sessionComp.incrementMessageCount(sessionId);
            }
        });

        // Update brain memories and trigger indicators
        const senderEntity = entities.find(e => e.id === senderId);
        if (senderEntity) {
            const brain = senderEntity.getComponent(BrainComponent);
            if (brain) {
                brain.addToShortTermMemory({
                    type: 'sent_message',
                    content,
                    sessionId
                });
            }
        }

        // Trigger notification indicators for receiving entities
        entities.forEach(entity => {
            if (entity.id !== senderId) {
                const indicator = entity.getComponent(VoxelIndicatorComponent);
                if (indicator) {
                    // Show notification animation
                    indicator.setState('notification');
                    
                    // Return to idle after notification
                    setTimeout(() => {
                        if (indicator.state === 'notification') {
                            indicator.setState('idle');
                        }
                    }, 1200);
                }
            }
        });

        // Update receiver memories
        const receiverEntities = entities.filter(e => e.id !== senderId);
        receiverEntities.forEach(entity => {
            const brain = entity.getComponent(BrainComponent);
            if (brain) {
                brain.addToShortTermMemory({
                    type: 'received_message',
                    content,
                    senderId,
                    sessionId
                });
            }
        });

        return message;
    }

    async generateSessionTitle(sessionId) {
        const sessionData = this.sessions.get(sessionId);
        if (!sessionData) {
            console.warn('Session data not found for title generation');
            return;
        }

        const { session, entities } = sessionData;
        
        // Check if we've already attempted or are attempting title generation
        if (session.titleGenerationAttempted || session.isGeneratingTitle) {
            return;
        }
        
        console.log('🏷️ Generating session title for session:', sessionId);
        session.isGeneratingTitle = true;
        const chatLogComp = entities[0].getComponent(ChatLog);
        if (!chatLogComp) {
            console.warn('No chat log component found for title generation');
            return;
        }

        const messages = chatLogComp.getMessages(session.chatLogId, 10);
        if (messages.length < 3) {
            console.log('Not enough messages for title generation:', messages.length);
            session.isGeneratingTitle = false;
            // Don't mark as attempted yet - we might have enough messages later
            return;
        }
        
        // Mark as attempted since we have enough messages
        session.titleGenerationAttempted = true;

        // Get the agent system to generate title
        const agentSystem = this.world.getSystem('agent');
        if (!agentSystem || !agentSystem.isConnected) {
            console.warn('Agent system not available for title generation');
            return;
        }

        const context = messages.map(m => m.content).join('\n');
        const prompt = `Summarize this conversation in one short sentence (max 8 words):\n${context}`;

        try {
            console.log('🤖 Requesting title generation from LLM...');
            const title = await agentSystem.generateResponse(prompt, {
                model: 'gemma3', // Use the current model
                temperature: 0.3
            });

            // Extract keywords
            const keywordPrompt = `List 3-5 keywords from this conversation (comma separated):\n${context}`;
            const keywordsResponse = await agentSystem.generateResponse(keywordPrompt, {
                model: 'gemma3',
                temperature: 0.3
            });
            const keywords = keywordsResponse.split(',').map(k => k.trim());

            console.log('✅ Generated session title:', title.trim());
            console.log('🏷️ Generated keywords:', keywords);

            // Update session
            entities.forEach(entity => {
                const sessionComp = entity.getComponent(Session);
                if (sessionComp) {
                    sessionComp.updateSessionTitle(sessionId, title.trim(), keywords);
                }
            });
        } catch (error) {
            console.error('❌ Failed to generate session title:', error);
        } finally {
            session.isGeneratingTitle = false;
        }
    }

    getSessionHistory(entity) {
        const brain = entity.getComponent(BrainComponent);
        if (!brain) return [];

        return brain.sessionHistory.map(sessionId => {
            const sessionComp = entity.getComponent(Session);
            if (!sessionComp) return null;
            return sessionComp.getSession(sessionId);
        }).filter(s => s !== null);
    }

    searchSessions(entity, query) {
        const sessions = this.getSessionHistory(entity);
        const lowerQuery = query.toLowerCase();
        
        return sessions.filter(session => 
            session.title?.toLowerCase().includes(lowerQuery) ||
            session.keywords.some(k => k.toLowerCase().includes(lowerQuery))
        );
    }

    update(deltaTime) {
        // Check for sessions that need title generation (throttled)
        this.titleCheckTimer = (this.titleCheckTimer || 0) + deltaTime;
        
        // Only check every 5 seconds
        if (this.titleCheckTimer >= 5000) {
            this.titleCheckTimer = 0;
            
            for (const [sessionId, sessionData] of this.sessions) {
                const { session } = sessionData;
                if (!session.title && session.messageCount >= 3 && !session.titleGenerationAttempted && !session.isGeneratingTitle) {
                    this.generateSessionTitle(sessionId);
                }
            }
        }

        // Clean up inactive sessions after timeout
        const inactivityTimeout = 5 * 60 * 1000; // 5 minutes
        const now = Date.now();
        
        for (const [sessionId, sessionData] of this.sessions) {
            const { session } = sessionData;
            if (session.state === 'active' && 
                now - session.lastActivityAt > inactivityTimeout) {
                this.deactivateSession(sessionId);
            }
        }
    }
}