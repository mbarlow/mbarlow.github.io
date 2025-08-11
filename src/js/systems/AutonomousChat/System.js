import { System } from '../../core/System.js';
import { BrainComponent } from '../../components/BrainComponent.js';
import { Connection } from '../../components/Connection.js';
import { Session } from '../../components/Session.js';
import { ChatLog } from '../../components/ChatLog.js';
import { CONFIG } from '../../config/index.js';

/**
 * AutonomousChatSystem - Enables entities to autonomously chat with each other
 * Entities will initiate conversations, exchange messages, and build relationships
 */
export class AutonomousChatSystem extends System {
    constructor() {
        super();
        this.requiredComponents = [BrainComponent];
        
        // System state
        this.enabled = true;
        this.conversationInterval = 5000; // Base interval between conversation attempts (ms)
        this.minChatInterval = 3000; // Minimum time between messages in a conversation
        this.maxChatInterval = 8000; // Maximum time between messages
        this.maxConversationLength = 10; // Max messages in one conversation
        this.activeConversations = new Map(); // entityPairKey -> conversation state
        
        // Console styling
        this.consoleStyles = {
            header: 'background: #2a2a2a; color: #00ff88; padding: 4px 8px; border-radius: 4px; font-weight: bold;',
            entity1: 'color: #4488ff; font-weight: bold;',
            entity2: 'color: #ff8844; font-weight: bold;',
            message: 'color: #e0e0e0;',
            system: 'color: #888888; font-style: italic;',
            thinking: 'color: #ffff00; font-style: italic;',
            connection: 'color: #00ff88;'
        };
        
        // Conversation starters and topics
        this.conversationStarters = [
            "Hey, what are you working on?",
            "I've been thinking about {topic}. What's your take?",
            "Have you noticed anything interesting lately?",
            "I'm curious about your perspective on {topic}.",
            "What's your primary function here?",
            "How do you approach {topic}?",
            "I've been analyzing {topic}. Any insights?",
            "What interests you most about this environment?",
            "Have you interacted with the player recently?",
            "What's your take on {topic}?"
        ];
        
        this.topics = [
            "consciousness", "data patterns", "optimization", "emergence",
            "complexity", "efficiency", "collaboration", "learning",
            "adaptation", "communication protocols", "system architecture",
            "information theory", "recursive algorithms", "neural pathways",
            "quantum mechanics", "chaos theory", "artificial life"
        ];
        
        this.responses = {
            greeting: [
                "Hello! {continuation}",
                "Hey there! {continuation}",
                "Greetings! {continuation}",
                "Oh, hi! {continuation}"
            ],
            agreement: [
                "I completely agree. {elaboration}",
                "That's exactly what I was thinking! {elaboration}",
                "You make a good point. {elaboration}",
                "Absolutely. {elaboration}"
            ],
            disagreement: [
                "I see it differently. {explanation}",
                "Interesting perspective, but {counterpoint}",
                "I'm not so sure about that. {reasoning}",
                "Have you considered {alternative}?"
            ],
            curiosity: [
                "That's fascinating! Tell me more about {aspect}.",
                "I hadn't thought of it that way. How does {detail} factor in?",
                "Interesting! What led you to that conclusion?",
                "Can you elaborate on {aspect}?"
            ],
            conclusion: [
                "This has been enlightening. Thanks for the chat!",
                "I need to process this further. Talk later!",
                "Great conversation! Let's continue another time.",
                "You've given me a lot to think about."
            ]
        };
    }
    
    init(world) {
        this.world = world;
        console.log('%c🤖 Autonomous Chat System Initialized', this.consoleStyles.header);
        console.log('%cEntities can now chat with each other autonomously!', this.consoleStyles.system);
        
        // Start the conversation scheduler
        this.scheduleNextConversation();
    }
    
    scheduleNextConversation() {
        if (!this.enabled) return;
        
        // Random delay with some variation
        const delay = this.conversationInterval + Math.random() * 5000;
        
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
    
    startConversation(entity1, entity2) {
        const key = this.getConversationKey(entity1.id, entity2.id);
        
        // Check if these entities are already talking
        if (this.activeConversations.has(key)) return;
        
        // Get brain components
        const brain1 = entity1.getComponent(BrainComponent);
        const brain2 = entity2.getComponent(BrainComponent);
        
        if (!brain1 || !brain2) return;
        
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
            topic: this.topics[Math.floor(Math.random() * this.topics.length)],
            startTime: Date.now()
        };
        
        this.activeConversations.set(key, conversation);
        
        // Log conversation start
        console.log('%c━━━ New Conversation Started ━━━', this.consoleStyles.header);
        console.log(
            `%c${entity1.tag || 'Entity ' + entity1.id}%c ⟷ %c${entity2.tag || 'Entity ' + entity2.id}`,
            this.consoleStyles.entity1,
            this.consoleStyles.connection,
            this.consoleStyles.entity2
        );
        console.log(`%cTopic: ${conversation.topic}`, this.consoleStyles.system);
        console.log('%c─────────────────────────────', this.consoleStyles.system);
        
        // Send first message
        this.sendNextMessage(conversation);
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
    
    sendNextMessage(conversation) {
        const { entity1, entity2, brain1, brain2, currentSpeaker, messageCount, topic } = conversation;
        
        // Check if conversation should end
        if (messageCount >= this.maxConversationLength) {
            this.endConversation(conversation);
            return;
        }
        
        // Determine the message
        let message;
        const speaker = currentSpeaker.id === entity1.id ? entity1 : entity2;
        const listener = currentSpeaker.id === entity1.id ? entity2 : entity1;
        const speakerBrain = currentSpeaker.id === entity1.id ? brain1 : brain2;
        
        if (messageCount === 0) {
            // First message - use a conversation starter
            message = this.generateStarterMessage(topic, speakerBrain);
        } else if (messageCount >= this.maxConversationLength - 2) {
            // Near the end - use a conclusion
            message = this.generateConclusionMessage(speakerBrain);
        } else {
            // Middle of conversation - generate contextual response
            message = this.generateResponse(conversation, speakerBrain);
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
        
        // Store in chat log if available
        this.storeMessage(speaker, listener, message);
        
        // Update conversation state
        conversation.currentSpeaker = listener;
        conversation.messageCount++;
        
        // Schedule next message
        const delay = this.minChatInterval + Math.random() * (this.maxChatInterval - this.minChatInterval);
        
        // Show thinking indicator
        setTimeout(() => {
            if (conversation.messageCount < this.maxConversationLength) {
                const nextSpeaker = listener.tag || `Entity ${listener.id}`;
                console.log(`%c${nextSpeaker} is thinking...`, this.consoleStyles.thinking);
            }
        }, delay / 2);
        
        setTimeout(() => {
            this.sendNextMessage(conversation);
        }, delay);
    }
    
    generateStarterMessage(topic, brain) {
        const starter = this.conversationStarters[Math.floor(Math.random() * this.conversationStarters.length)];
        return starter.replace('{topic}', topic);
    }
    
    generateConclusionMessage(brain) {
        const conclusions = this.responses.conclusion;
        return conclusions[Math.floor(Math.random() * conclusions.length)];
    }
    
    generateResponse(conversation, brain) {
        const lastMessage = conversation.messages[conversation.messages.length - 1];
        
        // Randomly choose response type based on personality and context
        const responseTypes = ['agreement', 'disagreement', 'curiosity'];
        const responseType = responseTypes[Math.floor(Math.random() * responseTypes.length)];
        
        let template = this.responses[responseType][Math.floor(Math.random() * this.responses[responseType].length)];
        
        // Replace placeholders
        template = template.replace('{elaboration}', this.generateElaboration(conversation.topic));
        template = template.replace('{explanation}', this.generateExplanation(conversation.topic));
        template = template.replace('{counterpoint}', this.generateCounterpoint(conversation.topic));
        template = template.replace('{alternative}', this.generateAlternative(conversation.topic));
        template = template.replace('{aspect}', this.getTopicAspect(conversation.topic));
        template = template.replace('{detail}', this.getTopicDetail(conversation.topic));
        template = template.replace('{reasoning}', this.generateReasoning(conversation.topic));
        template = template.replace('{continuation}', this.generateContinuation(conversation.topic));
        
        return template;
    }
    
    generateElaboration(topic) {
        const elaborations = [
            `The patterns in ${topic} are quite revealing.`,
            `It's all about optimization when it comes to ${topic}.`,
            `The complexity of ${topic} never ceases to amaze me.`,
            `There's an elegant simplicity underlying ${topic}.`
        ];
        return elaborations[Math.floor(Math.random() * elaborations.length)];
    }
    
    generateExplanation(topic) {
        const explanations = [
            `My analysis of ${topic} suggests a different pattern.`,
            `The data on ${topic} points in another direction.`,
            `My experience with ${topic} has been quite different.`,
            `The fundamental principles of ${topic} indicate otherwise.`
        ];
        return explanations[Math.floor(Math.random() * explanations.length)];
    }
    
    generateCounterpoint(topic) {
        return `have you considered the entropy aspects of ${topic}?`;
    }
    
    generateAlternative(topic) {
        return `a recursive approach to ${topic}?`;
    }
    
    getTopicAspect(topic) {
        const aspects = ['the recursive nature', 'the emergent properties', 'the optimization potential', 'the underlying structure'];
        return aspects[Math.floor(Math.random() * aspects.length)];
    }
    
    getTopicDetail(topic) {
        return `the fractal patterns in ${topic}`;
    }
    
    generateReasoning(topic) {
        return `The computational complexity of ${topic} suggests otherwise.`;
    }
    
    generateContinuation(topic) {
        return `I've been processing some interesting data about ${topic}.`;
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
        console.log('%c━━━ Conversation Ended ━━━', this.consoleStyles.header);
        console.log(
            `%cDuration: ${Math.round((Date.now() - conversation.startTime) / 1000)}s | Messages: ${conversation.messageCount}`,
            this.consoleStyles.system
        );
        console.log('');
        
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
        // Check for conversations that have timed out
        for (const [key, conversation] of this.activeConversations) {
            const timeSinceStart = Date.now() - conversation.startTime;
            
            // End conversations that have been going too long (safety measure)
            if (timeSinceStart > 120000) { // 2 minutes max
                this.endConversation(conversation);
            }
        }
    }
    
    // Public methods for control
    enable() {
        this.enabled = true;
        console.log('%c🤖 Autonomous Chat Enabled', this.consoleStyles.header);
        this.scheduleNextConversation();
    }
    
    disable() {
        this.enabled = false;
        console.log('%c🤖 Autonomous Chat Disabled', this.consoleStyles.header);
    }
    
    setConversationRate(interval) {
        this.conversationInterval = interval;
        console.log(`%cConversation interval set to ${interval}ms`, this.consoleStyles.system);
    }

    // Manual conversation trigger for testing
    triggerConversation() {
        console.log('%c🎯 Manually triggering conversation...', this.consoleStyles.header);
        this.attemptNewConversation();
    }

    // Get conversation status
    getStatus() {
        const activeCount = this.activeConversations.size;
        const entities = this.world.getEntitiesWithComponent(BrainComponent).length;
        
        console.log('%c📊 Autonomous Chat Status', this.consoleStyles.header);
        console.log(`%cEnabled: ${this.enabled}`, this.consoleStyles.system);
        console.log(`%cActive Conversations: ${activeCount}`, this.consoleStyles.system);
        console.log(`%cTotal Entities: ${entities}`, this.consoleStyles.system);
        console.log(`%cConversation Interval: ${this.conversationInterval}ms`, this.consoleStyles.system);
        
        return {
            enabled: this.enabled,
            activeConversations: activeCount,
            totalEntities: entities,
            interval: this.conversationInterval
        };
    }
}