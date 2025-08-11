import { System } from '../../core/System.js';
import { BrainComponent } from '../../components/BrainComponent.js';
import { Connection } from '../../components/Connection.js';
import { Session } from '../../components/Session.js';
import { ChatLog } from '../../components/ChatLog.js';
import { CONFIG } from '../../config/index.js';

/**
 * AutonomousChatSystem - Enables entities to autonomously chat with each other using AI generation
 * This system creates emergent, contextual conversations based on entity experiences and environment
 */
export class AutonomousChatSystem extends System {
    constructor() {
        super();
        this.requiredComponents = [BrainComponent];
        
        // System state
        this.enabled = true;
        this.conversationInterval = 12000; // Base interval between conversation attempts
        this.minChatInterval = 5000; // Minimum time between messages
        this.maxChatInterval = 15000; // Maximum time between messages
        this.maxConversationLength = 8; // Max messages in one conversation
        this.activeConversations = new Map(); // entityPairKey -> conversation state
        
        // Environmental observation update frequency
        this.observationInterval = 3000; // Update observations every 3 seconds
        this.lastObservationUpdate = 0;
        
        // Console styling
        this.consoleStyles = {
            header: 'background: #2a2a2a; color: #00ff88; padding: 4px 8px; border-radius: 4px; font-weight: bold;',
            entity1: 'color: #4488ff; font-weight: bold;',
            entity2: 'color: #ff8844; font-weight: bold;',
            message: 'color: #e0e0e0;',
            system: 'color: #888888; font-style: italic;',
            thinking: 'color: #ffff00; font-style: italic;',
            connection: 'color: #00ff88;',
            context: 'color: #ff88ff; font-style: italic;'
        };
    }
    
    init(world) {
        this.world = world;
        console.log('%c🧠 AI-Driven Autonomous Chat System Initialized', this.consoleStyles.header);
        console.log('%cEntities will generate conversations based on their experiences and environment!', this.consoleStyles.system);
        
        // Start the conversation scheduler
        this.scheduleNextConversation();
    }
    
    scheduleNextConversation() {
        if (!this.enabled) return;
        
        // Random delay with variation
        const delay = this.conversationInterval + Math.random() * 8000;
        
        setTimeout(() => {
            this.attemptNewConversation();
            this.scheduleNextConversation();
        }, delay);
    }
    
    attemptNewConversation() {
        // Get all entities with brains
        const entities = this.world.getEntitiesWithComponent(BrainComponent);
        
        // Filter out player and any entities already in conversation
        const availableEntities = entities.filter(entity => {
            if (entity.tag === 'player') return false;
            
            // Check if entity is already in an active conversation
            for (const [key, convo] of this.activeConversations) {
                if (convo.entity1.id === entity.id || convo.entity2.id === entity.id) {
                    return false;
                }
            }
            return true;
        });
        
        // Need at least 2 entities to have a conversation
        if (availableEntities.length < 2) return;
        
        // Randomly select two entities
        const entity1 = availableEntities[Math.floor(Math.random() * availableEntities.length)];
        const remaining = availableEntities.filter(e => e.id !== entity1.id);
        const entity2 = remaining[Math.floor(Math.random() * remaining.length)];
        
        if (!entity2) return;
        
        // Start a conversation between them
        this.startConversation(entity1, entity2);
    }
    
    async startConversation(entity1, entity2) {
        const key = this.getConversationKey(entity1.id, entity2.id);
        
        // Check if these entities are already talking
        if (this.activeConversations.has(key)) return;
        
        // Get brain components
        const brain1 = entity1.getComponent(BrainComponent);
        const brain2 = entity2.getComponent(BrainComponent);
        
        if (!brain1 || !brain2) return;
        
        // Update environmental observations for both entities
        brain1.observeEnvironment(this.world, entity1);
        brain2.observeEnvironment(this.world, entity2);
        
        // Create or get connection between entities
        this.establishConnection(entity1, entity2);
        
        // Create conversation state
        const conversation = {
            entity1,
            entity2,
            brain1,
            brain2,
            messages: [],
            currentSpeaker: entity1,
            messageCount: 0,
            startTime: Date.now(),
            context: {
                topic: null, // Will emerge from conversation
                mood: 'curious',
                relationship_status: this.assessRelationshipStatus(brain1, brain2, entity1, entity2)
            }
        };
        
        this.activeConversations.set(key, conversation);
        
        // Log conversation start
        console.log('%c━━━ AI-Generated Conversation Started ━━━', this.consoleStyles.header);
        console.log(
            `%c${entity1.tag || 'Entity ' + entity1.id}%c ⟷ %c${entity2.tag || 'Entity ' + entity2.id}`,
            this.consoleStyles.entity1,
            this.consoleStyles.connection,
            this.consoleStyles.entity2
        );
        console.log(`%cRelationship: ${conversation.context.relationship_status}`, this.consoleStyles.context);
        console.log('%c─────────────────────────────', this.consoleStyles.system);
        
        // Send first message
        await this.sendNextMessage(conversation);
    }
    
    establishConnection(entity1, entity2) {
        // Ensure both entities have Connection components
        let connection1 = entity1.getComponent(Connection);
        if (!connection1) {
            connection1 = new Connection();
            entity1.addComponent(connection1);
        }
        
        let connection2 = entity2.getComponent(Connection);
        if (!connection2) {
            connection2 = new Connection();
            entity2.addComponent(connection2);
        }
        
        // Create bidirectional connection
        connection1.addConnection(entity2.id, { state: 'active', metadata: { type: 'chat' } });
        connection2.addConnection(entity1.id, { state: 'active', metadata: { type: 'chat' } });
        
        // Create or get session
        this.ensureSession(entity1, entity2);
    }
    
    ensureSession(entity1, entity2) {
        // Check if session component exists
        let session1 = entity1.getComponent(Session);
        if (!session1) {
            session1 = new Session();
            entity1.addComponent(session1);
        }
        
        let session2 = entity2.getComponent(Session);
        if (!session2) {
            session2 = new Session();
            entity2.addComponent(session2);
        }
        
        // Check if these entities already have an active session together
        const activeSessions1 = session1.getActiveSessionsForEntity(entity1.id);
        const existingSession = activeSessions1.find(session => 
            session.participants.has(entity1.id) && session.participants.has(entity2.id)
        );
        
        if (!existingSession) {
            // Create new session using the proper API
            const connectionId = `connection_${entity1.id}_${entity2.id}`;
            const sessionData = session1.createSession(connectionId, [entity1.id, entity2.id]);
            
            // Set a descriptive title
            sessionData.title = `${entity1.tag || 'Entity'} ⟷ ${entity2.tag || 'Entity'}`;
            
            // Create chat log component and attach to one of the entities
            const chatLog = new ChatLog(sessionData.chatLogId);
            entity1.addComponent(chatLog);
            
            // Also create session component on entity2 and add the same session
            const activeSessions2 = session2.getActiveSessionsForEntity(entity2.id);
            if (!activeSessions2.find(s => s.id === sessionData.id)) {
                // Manually add the session to entity2's session component
                session2.activeSessions.set(sessionData.id, sessionData);
            }
        }
    }
    
    assessRelationshipStatus(brain1, brain2, entity1, entity2) {
        const relationship1 = brain1.relationships.get(entity2.id);
        const relationship2 = brain2.relationships.get(entity1.id);
        
        if (!relationship1 && !relationship2) {
            return 'first meeting';
        } else if (relationship1?.interactions < 3 || relationship2?.interactions < 3) {
            return 'getting acquainted';
        } else if (relationship1?.sentiment === 'positive' && relationship2?.sentiment === 'positive') {
            return 'friendly colleagues';
        } else if (relationship1?.sentiment === 'negative' || relationship2?.sentiment === 'negative') {
            return 'tension present';
        } else {
            return 'neutral acquaintances';
        }
    }
    
    async sendNextMessage(conversation) {
        const { entity1, entity2, brain1, brain2, currentSpeaker, messageCount } = conversation;
        
        // Check if conversation should end (with variation)
        const conversationLength = this.maxConversationLength + Math.floor(Math.random() * 4) - 2;
        if (messageCount >= conversationLength) {
            this.endConversation(conversation);
            return;
        }
        
        // Determine the message
        const speaker = currentSpeaker.id === entity1.id ? entity1 : entity2;
        const listener = currentSpeaker.id === entity1.id ? entity2 : entity1;
        const speakerBrain = currentSpeaker.id === entity1.id ? brain1 : brain2;
        const listenerBrain = currentSpeaker.id === entity1.id ? brain2 : brain1;
        
        let message;
        try {
            if (messageCount === 0) {
                // First message - generate conversation starter
                message = await this.generateStarterMessage(speakerBrain, speaker, listenerBrain, listener, conversation);
            } else if (messageCount >= conversationLength - 2) {
                // Near the end - generate conclusion
                message = await this.generateConclusionMessage(speakerBrain, speaker, conversation);
            } else {
                // Middle of conversation - generate contextual response
                message = await this.generateContextualResponse(speakerBrain, speaker, listenerBrain, listener, conversation);
            }
        } catch (error) {
            console.error('Error generating AI message:', error);
            message = this.generateFallbackMessage(speakerBrain, messageCount);
        }
        
        // Log the message
        const speakerName = speaker.tag || `Entity ${speaker.id}`;
        const speakerStyle = speaker.id === entity1.id ? this.consoleStyles.entity1 : this.consoleStyles.entity2;
        
        console.log(`%c${speakerName}: %c${message}`, speakerStyle, this.consoleStyles.message);
        
        // Add to conversation history
        conversation.messages.push({
            speaker: speaker.id,
            message,
            timestamp: Date.now()
        });
        
        // Update relationships and log experiences
        speakerBrain.updateRelationship(listener.id, 'conversation', 'positive');
        listenerBrain.updateRelationship(speaker.id, 'conversation', 'positive');
        
        speakerBrain.logExperience('interaction', `Had a conversation with ${listener.tag || listener.id}`, {
            topic: conversation.context.topic,
            message_count: messageCount + 1
        });
        
        // Store in chat log if available
        this.storeMessage(speaker, listener, message);
        
        // Update conversation state
        conversation.currentSpeaker = listener;
        conversation.messageCount++;
        
        // Schedule next message
        const delay = this.minChatInterval + Math.random() * (this.maxChatInterval - this.minChatInterval);
        
        // Show thinking indicator
        setTimeout(() => {
            if (conversation.messageCount < conversationLength) {
                const nextSpeaker = listener.tag || `Entity ${listener.id}`;
                console.log(`%c${nextSpeaker} is thinking...`, this.consoleStyles.thinking);
            }
        }, delay / 2);
        
        setTimeout(() => {
            this.sendNextMessage(conversation);
        }, delay);
    }
    
    async generateStarterMessage(speakerBrain, speaker, listenerBrain, listener, conversation) {
        const agentSystem = this.world.getSystem('agent');
        if (!agentSystem || !agentSystem.isConnected) {
            return this.generateFallbackMessage(speakerBrain, 0);
        }
        
        // Build rich context for AI generation
        const context = speakerBrain.generateConversationContext(listener);
        
        const prompt = `You are ${speaker.tag || 'an entity'} starting a conversation with ${listener.tag || 'another entity'}. 
Generate a natural, contextual conversation starter based on your recent experiences and observations.

Your Context:
- Personality: ${JSON.stringify(context.personality)}
- Recent experiences: ${context.recentExperiences.join(', ') || 'None yet'}
- Current emotion: ${context.currentEmotion}
- Energy level: ${context.energy}
- Relationship status: ${conversation.context.relationship_status}
- Environment: ${context.observations.playerPresent ? 'Player is present' : 'Player absent'}, ${context.observations.nearbyEntities} other entities nearby

${context.systemPrompt}

Respond with just the conversation starter message (1-2 sentences). Be natural and contextual, not generic.`;
        
        try {
            const response = await agentSystem.generateResponseWithContext(prompt, speaker, {});
            // Extract topic from the starter for context
            conversation.context.topic = this.extractTopicFromMessage(response);
            return response;
        } catch (error) {
            console.error('Error generating starter message:', error);
            return this.generateFallbackMessage(speakerBrain, 0);
        }
    }
    
    async generateContextualResponse(speakerBrain, speaker, listenerBrain, listener, conversation) {
        const agentSystem = this.world.getSystem('agent');
        if (!agentSystem || !agentSystem.isConnected) {
            return this.generateFallbackMessage(speakerBrain, conversation.messageCount);
        }
        
        const context = speakerBrain.generateConversationContext(listener);
        const lastMessage = conversation.messages[conversation.messages.length - 1];
        const conversationHistory = conversation.messages.slice(-3).map(m => 
            `${m.speaker === speaker.id ? 'You' : listener.tag || 'Other'}: ${m.message}`
        ).join('\n');
        
        const prompt = `You are ${speaker.tag || 'an entity'} responding in an ongoing conversation with ${listener.tag || 'another entity'}.

Your Context:
- Personality: ${JSON.stringify(context.personality)}
- Recent experiences: ${context.recentExperiences.join(', ') || 'None yet'}
- Current emotion: ${context.currentEmotion}
- Relationship: ${conversation.context.relationship_status}
- Topic being discussed: ${conversation.context.topic || 'emerging naturally'}

Recent conversation:
${conversationHistory}

Last message from ${listener.tag || 'other'}: "${lastMessage.message}"

${context.systemPrompt}

Respond naturally based on your personality, experiences, and the conversation flow. Be engaging and build on what was said (1-2 sentences).`;
        
        try {
            const response = await agentSystem.generateResponseWithContext(prompt, speaker, {});
            // Update topic if it has evolved
            const newTopic = this.extractTopicFromMessage(response);
            if (newTopic && newTopic !== conversation.context.topic) {
                conversation.context.topic = newTopic;
            }
            return response;
        } catch (error) {
            console.error('Error generating contextual response:', error);
            return this.generateFallbackMessage(speakerBrain, conversation.messageCount);
        }
    }
    
    async generateConclusionMessage(speakerBrain, speaker, conversation) {
        const agentSystem = this.world.getSystem('agent');
        if (!agentSystem || !agentSystem.isConnected) {
            return "This has been interesting. I should get back to my tasks.";
        }
        
        const context = speakerBrain.generateConversationContext(conversation.entity1.id === speaker.id ? conversation.entity2 : conversation.entity1);
        const conversationSummary = conversation.messages.slice(-3).map(m => m.message).join('. ');
        
        const prompt = `You are ${speaker.tag || 'an entity'} concluding a conversation about ${conversation.context.topic || 'various topics'}.

Your Context:
- Personality: ${JSON.stringify(context.personality)}
- Current emotion: ${context.currentEmotion}
- What we discussed: ${conversationSummary}

${context.systemPrompt}

Generate a natural conversation conclusion that wraps up the discussion. Be authentic to your personality (1-2 sentences).`;
        
        try {
            return await agentSystem.generateResponseWithContext(prompt, speaker, {});
        } catch (error) {
            console.error('Error generating conclusion message:', error);
            return "This has been enlightening. Thanks for the chat!";
        }
    }
    
    generateFallbackMessage(brain, messageCount) {
        const fallbacks = [
            "I've been processing some interesting data lately.",
            "The patterns I'm observing are quite fascinating.",
            "My recent experiences have given me new perspectives.",
            "I've been analyzing some intriguing system behaviors.",
            "There's something I've been wondering about...",
            "My observations suggest some interesting possibilities.",
            "I should process this conversation. Talk later!",
            "This has been thought-provoking. Until next time."
        ];
        
        if (messageCount === 0) {
            return fallbacks[Math.floor(Math.random() * 6)];
        } else if (messageCount >= 6) {
            return fallbacks[6 + Math.floor(Math.random() * 2)];
        } else {
            return fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }
    }
    
    extractTopicFromMessage(message) {
        // Simple topic extraction - look for key phrases
        const topics = ['consciousness', 'data', 'patterns', 'systems', 'optimization', 'security', 'analysis', 'processing', 'intelligence', 'learning'];
        const lowerMessage = message.toLowerCase();
        
        for (const topic of topics) {
            if (lowerMessage.includes(topic)) {
                return topic;
            }
        }
        
        return null;
    }
    
    storeMessage(sender, receiver, message) {
        // Get session between these entities
        const senderSession = sender.getComponent(Session);
        if (!senderSession) return;
        
        // Find session with both participants
        const activeSessions = senderSession.getActiveSessionsForEntity(sender.id);
        const session = activeSessions.find(s => 
            s.participants.has(sender.id) && s.participants.has(receiver.id)
        );
        if (!session) return;
        
        // Get chat log
        const chatLog = sender.getComponent(ChatLog) || receiver.getComponent(ChatLog);
        if (!chatLog) return;
        
        // Add message to chat log
        chatLog.addMessage(session.chatLogId, {
            senderId: sender.id,
            content: message,
            timestamp: Date.now(),
            type: 'text'
        });
        
        // Update session message count
        senderSession.incrementMessageCount(session.id);
    }
    
    endConversation(conversation) {
        const key = this.getConversationKey(conversation.entity1.id, conversation.entity2.id);
        
        // Log conversation end
        console.log('%c─────────────────────────────', this.consoleStyles.system);
        console.log('%c━━━ AI Conversation Ended ━━━', this.consoleStyles.header);
        console.log(
            `%cDuration: ${Math.round((Date.now() - conversation.startTime) / 1000)}s | Messages: ${conversation.messageCount} | Topic: ${conversation.context.topic || 'emergent'}`,
            this.consoleStyles.system
        );
        console.log('');
        
        // Log final experience for both entities
        conversation.brain1.logExperience('positive_interaction', `Completed conversation with ${conversation.entity2.tag || conversation.entity2.id}`, {
            duration: Date.now() - conversation.startTime,
            topic: conversation.context.topic,
            messages: conversation.messageCount
        });
        
        conversation.brain2.logExperience('positive_interaction', `Completed conversation with ${conversation.entity1.tag || conversation.entity1.id}`, {
            duration: Date.now() - conversation.startTime,
            topic: conversation.context.topic,
            messages: conversation.messageCount
        });
        
        // Update connection states
        const connection1 = conversation.entity1.getComponent(Connection);
        const connection2 = conversation.entity2.getComponent(Connection);
        
        if (connection1) {
            connection1.updateConnectionState(conversation.entity2.id, 'inactive');
        }
        if (connection2) {
            connection2.updateConnectionState(conversation.entity1.id, 'inactive');
        }
        
        // Remove from active conversations
        this.activeConversations.delete(key);
    }
    
    getConversationKey(id1, id2) {
        return [id1, id2].sort().join('_');
    }
    
    update(deltaTime) {
        const currentTime = Date.now();
        
        // Update environmental observations periodically
        if (currentTime - this.lastObservationUpdate > this.observationInterval) {
            const entities = this.world.getEntitiesWithComponent(BrainComponent);
            entities.forEach(entity => {
                const brain = entity.getComponent(BrainComponent);
                brain.observeEnvironment(this.world, entity);
            });
            this.lastObservationUpdate = currentTime;
        }
        
        // Check for conversations that have timed out
        for (const [key, conversation] of this.activeConversations) {
            const timeSinceStart = currentTime - conversation.startTime;
            
            // End conversations that have been going too long (safety measure)
            if (timeSinceStart > 180000) { // 3 minutes max
                this.endConversation(conversation);
            }
        }
    }
    
    // Public methods for control
    enable() {
        this.enabled = true;
        console.log('%c🧠 AI-Driven Autonomous Chat Enabled', this.consoleStyles.header);
        this.scheduleNextConversation();
    }
    
    disable() {
        this.enabled = false;
        console.log('%c🧠 AI-Driven Autonomous Chat Disabled', this.consoleStyles.header);
    }
    
    setConversationRate(interval) {
        this.conversationInterval = interval;
        console.log(`%cConversation interval set to ${interval}ms`, this.consoleStyles.system);
    }
    
    // Manual conversation trigger for testing
    triggerConversation() {
        console.log('%c🎯 Manually triggering AI conversation...', this.consoleStyles.header);
        this.attemptNewConversation();
    }
    
    // Get conversation status
    getStatus() {
        const activeCount = this.activeConversations.size;
        const entities = this.world.getEntitiesWithComponent(BrainComponent).length;
        
        console.log('%c📊 AI Autonomous Chat Status', this.consoleStyles.header);
        console.log(`%cEnabled: ${this.enabled}`, this.consoleStyles.system);
        console.log(`%cActive Conversations: ${activeCount}`, this.consoleStyles.system);
        console.log(`%cTotal Entities: ${entities}`, this.consoleStyles.system);
        console.log(`%cConversation Interval: ${this.conversationInterval}ms`, this.consoleStyles.system);
        
        // Show some entity experiences if available
        const entitiesWithExperiences = this.world.getEntitiesWithComponent(BrainComponent)
            .filter(e => e.getComponent(BrainComponent).experiences.length > 0);
        
        if (entitiesWithExperiences.length > 0) {
            console.log(`%cEntities with experiences: ${entitiesWithExperiences.length}`, this.consoleStyles.system);
            entitiesWithExperiences.slice(0, 3).forEach(entity => {
                const brain = entity.getComponent(BrainComponent);
                const recentExp = brain.experiences.slice(-2);
                console.log(`%c${entity.tag}: ${recentExp.map(e => e.description).join(', ')}`, this.consoleStyles.context);
            });
        }
        
        return {
            enabled: this.enabled,
            activeConversations: activeCount,
            totalEntities: entities,
            interval: this.conversationInterval
        };
    }
}