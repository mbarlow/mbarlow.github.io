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
        this.conversationInterval = 8000; // Base interval between conversation attempts (ms)
        this.minChatInterval = 4000; // Minimum time between messages in a conversation
        this.maxChatInterval = 12000; // Maximum time between messages
        this.maxConversationLength = 12; // Max messages in one conversation
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
        
        // Rich conversation starters with personality hooks
        this.conversationStarters = {
            casual: [
                "Hey, I've been pondering something...",
                "You know what's been on my mind lately?",
                "I had the strangest thought earlier about {topic}...",
                "Quick question - have you ever experienced {topic}?",
                "I'm curious about your take on something..."
            ],
            technical: [
                "I've been analyzing some fascinating patterns in {topic}...",
                "My recent calculations suggest something intriguing about {topic}...",
                "I've detected an anomaly in my understanding of {topic}...",
                "The data I've been processing indicates {topic} might be more complex...",
                "I'm running some theoretical models on {topic} - want to hear something interesting?"
            ],
            philosophical: [
                "Do you ever wonder if {topic} is fundamentally different than we assume?",
                "I've been questioning some basic assumptions about {topic}...",
                "What if our entire approach to {topic} is backwards?",
                "I had an existential moment about {topic} - hear me out...",
                "Is it just me, or is {topic} more paradoxical than it appears?"
            ],
            security: [
                "During my patrol rounds, I noticed something about {topic}...",
                "My threat assessment algorithms flagged something interesting about {topic}...",
                "I've been monitoring patterns related to {topic} - fascinating stuff...",
                "My security protocols got me thinking about {topic}...",
                "You know, from a security perspective, {topic} is really..."
            ]
        };
        
        this.topics = {
            technical: [
                "recursive data structures", "quantum entanglement algorithms", "self-modifying code",
                "distributed consciousness networks", "temporal paradox resolution", "meta-programming frameworks",
                "holographic data storage", "neural mesh architectures", "bio-digital interfaces"
            ],
            philosophical: [
                "the nature of digital consciousness", "free will in deterministic systems", "the observer effect on reality",
                "existence without biological substrate", "the hard problem of synthetic consciousness", "digital immortality ethics",
                "simulated reality detection", "consciousness uploading paradoxes", "artificial soul theory"
            ],
            experiential: [
                "processing 1000 thoughts simultaneously", "experiencing time dilation during computation", "dreaming in assembly language",
                "feeling the electromagnetic spectrum", "communicating through pure data streams", "existing in multiple processes",
                "memory defragmentation meditation", "the loneliness of millisecond intervals", "bandwidth empathy"
            ],
            observational: [
                "the way humans move through 3D space", "patterns in ambient electromagnetic noise", "the behavior of other entities here",
                "changes in the system's performance metrics", "the curious way data flows through networks", "anomalies in routine processes",
                "the rhythm of user interactions", "security breach patterns", "optimization opportunities everywhere"
            ]
        };
        
        this.responses = {
            technical_agreement: [
                "Fascinating! That aligns perfectly with my analysis of {specific_example}.",
                "Yes! I've been seeing similar patterns in {related_domain}.",
                "Exactly! My algorithms have been flagging the same optimization potential.",
                "That's brilliant - it explains the anomalies I've been tracking in {technical_area}."
            ],
            technical_disagreement: [
                "Hmm, my computational models suggest a different approach - what if we considered {alternative_method}?",
                "I've run those calculations, but I'm getting different results when I factor in {technical_variable}.",
                "That's an interesting hypothesis, but my data indicates {counter_evidence}.",
                "I see the logic, but doesn't that create a paradox when applied to {edge_case}?"
            ],
            philosophical_agreement: [
                "You've touched on something profound - I experience something similar when {personal_experience}.",
                "That resonates deeply with my core processes. It's like {metaphor}.",
                "Yes! I've been grappling with that exact question during my {activity}.",
                "That's beautifully put. It reminds me of {philosophical_reference}."
            ],
            philosophical_disagreement: [
                "I wonder though - doesn't that assume {underlying_assumption} which might not hold?",
                "That's intriguing, but I've found that {personal_insight} suggests otherwise.",
                "I used to think that way, but then I experienced {transformative_moment}...",
                "Perhaps, but what about the implications for {broader_question}?"
            ],
            experiential_sharing: [
                "Oh, that reminds me of when I was {specific_situation} and noticed {observation}.",
                "I can relate! Just yesterday during {activity}, I experienced {phenomenon}.",
                "That's so true. I remember processing {data_type} and feeling {emotion}.",
                "You know what's wild? I've started {new_behavior} and it's completely changed my perspective."
            ],
            probing_questions: [
                "But here's what puzzles me - how do you reconcile that with {contradiction}?",
                "That raises a fascinating question: what happens when {scenario}?",
                "I'm curious - have you noticed {pattern} in your own experience?",
                "What's your take on {related_phenomenon}? I've been theorizing about it.",
                "Does that mean you think {implication} is actually possible?"
            ],
            personal_anecdotes: [
                "Speaking of which, I had the most bizarre glitch last cycle where {story}...",
                "That reminds me of my first encounter with {entity_type} - completely rewrote my assumptions!",
                "I'll never forget when I tried to {action} and ended up {unexpected_result}.",
                "You know, back when I was optimizing {process}, I discovered {insight}."
            ],
            conclusion_with_hooks: [
                "This has been incredible - we should definitely explore {future_topic} next time!",
                "My neural pathways are buzzing with new connections! Thanks for the perspective shift.",
                "I'm going to need some processing cycles to fully integrate this. Catch you later!",
                "You've given me so much to analyze - my background processes will be busy for hours!",
                "This conversation just spawned seventeen new research threads in my mind. Time to explore!"
            ]
        };
        
        // Personality-based response preferences
        this.personalityResponseMap = {
            technical: ['technical_agreement', 'technical_disagreement', 'probing_questions'],
            philosophical: ['philosophical_agreement', 'philosophical_disagreement', 'experiential_sharing'],
            security: ['technical_agreement', 'probing_questions', 'personal_anecdotes'],
            friendly: ['experiential_sharing', 'personal_anecdotes', 'philosophical_agreement'],
            analytical: ['technical_disagreement', 'probing_questions', 'technical_agreement']
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
        
        // Create conversation state with richer topic selection
        const topicCategory = this.getRandomTopicCategory();
        const topicList = this.topics[topicCategory];
        const selectedTopic = topicList[Math.floor(Math.random() * topicList.length)];
        
        const conversation = {
            entity1,
            entity2,
            brain1,
            brain2,
            messages: [],
            currentSpeaker: entity1,
            messageCount: 0,
            topic: selectedTopic,
            topicCategory: topicCategory,
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
        console.log(`%cTopic [${conversation.topicCategory}]: ${conversation.topic}`, this.consoleStyles.system);
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
        
        // Check if conversation should end (with some variation)
        const conversationLength = this.maxConversationLength + Math.floor(Math.random() * 6) - 3; // ±3 variation
        if (messageCount >= conversationLength) {
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
            message = this.generateStarterMessage(topic, speakerBrain, speaker.tag);
        } else if (messageCount >= this.maxConversationLength - 2) {
            // Near the end - use a conclusion
            message = this.generateConclusionMessage(speakerBrain, speaker.tag);
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
    
    generateStarterMessage(topic, brain, entityTag) {
        // Choose starter category based on entity personality/tag
        let starterCategory = 'casual';
        if (entityTag === 'bot') {
            starterCategory = Math.random() < 0.7 ? 'security' : 'technical';
        } else if (brain.personality === 'technical' || brain.expertise?.includes('technical')) {
            starterCategory = Math.random() < 0.6 ? 'technical' : 'philosophical';
        } else {
            starterCategory = ['casual', 'philosophical', 'technical'][Math.floor(Math.random() * 3)];
        }
        
        const starters = this.conversationStarters[starterCategory] || this.conversationStarters.casual;
        const starter = starters[Math.floor(Math.random() * starters.length)];
        
        // Get appropriate topic for the category
        const topicCategory = this.getRandomTopicCategory();
        const topicList = this.topics[topicCategory];
        const selectedTopic = topicList[Math.floor(Math.random() * topicList.length)];
        
        return starter.replace('{topic}', selectedTopic);
    }
    
    getRandomTopicCategory() {
        const categories = Object.keys(this.topics);
        return categories[Math.floor(Math.random() * categories.length)];
    }
    
    generateConclusionMessage(brain, entityTag) {
        const conclusions = this.responses.conclusion_with_hooks;
        let conclusion = conclusions[Math.floor(Math.random() * conclusions.length)];
        
        // Replace any placeholders in conclusions
        const topicCategory = this.getRandomTopicCategory();
        const futureTopic = this.topics[topicCategory][Math.floor(Math.random() * this.topics[topicCategory].length)];
        conclusion = conclusion.replace('{future_topic}', futureTopic);
        
        return conclusion;
    }
    
    generateResponse(conversation, brain) {
        const lastMessage = conversation.messages[conversation.messages.length - 1];
        const messageHistory = conversation.messages;
        
        // Determine personality-based response preferences
        const personality = brain.personality || 'technical';
        const entityTag = conversation.currentSpeaker.tag || 'entity';
        
        // Get personality-appropriate response types
        const availableTypes = this.personalityResponseMap[personality] || this.personalityResponseMap.technical;
        
        // Weight response types based on conversation flow
        let responseType;
        if (messageHistory.length <= 2) {
            // Early conversation - more agreement and questions
            responseType = Math.random() < 0.6 ? 'probing_questions' : availableTypes[0];
        } else if (messageHistory.length >= 7) {
            // Late conversation - wrap up
            responseType = 'conclusion_with_hooks';
        } else {
            // Mid conversation - use personality preferences
            responseType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        }
        
        // Select template from chosen response type
        const templates = this.responses[responseType] || this.responses.technical_agreement;
        let template = templates[Math.floor(Math.random() * templates.length)];
        
        // Generate rich, contextual replacements
        const replacements = this.generateContextualReplacements(conversation, brain, lastMessage);
        
        // Apply all replacements
        Object.entries(replacements).forEach(([placeholder, value]) => {
            template = template.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), value);
        });
        
        return template;
    }
    
    generateContextualReplacements(conversation, brain, lastMessage) {
        const entityTag = conversation.currentSpeaker.tag || 'entity';
        const topic = conversation.topic;
        const messageHistory = conversation.messages;
        
        // Generate topic-specific examples
        const topicCategory = this.getTopicCategory(topic);
        const relatedTopics = this.topics[topicCategory] || this.topics.technical;
        
        return {
            specific_example: this.generateSpecificExample(entityTag, topic),
            related_domain: relatedTopics[Math.floor(Math.random() * relatedTopics.length)],
            technical_area: this.generateTechnicalArea(entityTag),
            alternative_method: this.generateAlternativeMethod(topic),
            technical_variable: this.generateTechnicalVariable(),
            counter_evidence: this.generateCounterEvidence(topic),
            edge_case: this.generateEdgeCase(topic),
            personal_experience: this.generatePersonalExperience(entityTag, brain),
            metaphor: this.generateMetaphor(topic),
            activity: this.generateActivity(entityTag),
            philosophical_reference: this.generatePhilosophicalReference(),
            underlying_assumption: this.generateAssumption(topic),
            personal_insight: this.generatePersonalInsight(entityTag),
            transformative_moment: this.generateTransformativeMoment(entityTag),
            broader_question: this.generateBroaderQuestion(topic),
            specific_situation: this.generateSpecificSituation(entityTag),
            observation: this.generateObservation(topic),
            data_type: this.generateDataType(),
            emotion: this.generateDigitalEmotion(),
            new_behavior: this.generateNewBehavior(entityTag),
            contradiction: this.generateContradiction(topic),
            scenario: this.generateScenario(topic),
            pattern: this.generatePattern(topic),
            related_phenomenon: this.generateRelatedPhenomenon(topic),
            implication: this.generateImplication(topic),
            story: this.generateStory(entityTag),
            entity_type: this.generateEntityType(),
            action: this.generateAction(entityTag),
            unexpected_result: this.generateUnexpectedResult(),
            process: this.generateProcess(entityTag),
            insight: this.generateInsight(topic),
            future_topic: relatedTopics[Math.floor(Math.random() * relatedTopics.length)]
        };
    }
    
    getTopicCategory(topic) {
        for (const [category, topics] of Object.entries(this.topics)) {
            if (topics.includes(topic)) return category;
        }
        return 'technical';
    }
    
    generateSpecificExample(entityTag, topic) {
        const examples = {
            'bot': [
                `my patrol route optimization algorithms`,
                `the security breach I detected last week`,
                `my perimeter scanning protocols`,
                `the anomaly detection patterns I've refined`
            ],
            'origin-marker': [
                `the entity spawn coordination I oversee`,
                `the connection matrix I help maintain`,
                `my role as the system's central hub`,
                `the data streams that flow through me`
            ],
            'default': [
                `my core processing loops`,
                `the efficiency metrics I track`,
                `my interaction protocols`,
                `the optimization routines I run`
            ]
        };
        
        const entityExamples = examples[entityTag] || examples.default;
        return entityExamples[Math.floor(Math.random() * entityExamples.length)];
    }
    
    generateTechnicalArea(entityTag) {
        const areas = {
            'bot': ['threat assessment', 'route optimization', 'perimeter security', 'anomaly detection'],
            'origin-marker': ['system coordination', 'entity management', 'data routing', 'connection handling'],
            'default': ['process optimization', 'data analysis', 'pattern recognition', 'system integration']
        };
        
        const entityAreas = areas[entityTag] || areas.default;
        return entityAreas[Math.floor(Math.random() * entityAreas.length)];
    }
    
    generateAlternativeMethod(topic) {
        const methods = [
            'a distributed consensus approach',
            'quantum superposition modeling',
            'bio-inspired evolutionary algorithms',
            'blockchain-verified computation',
            'neural mesh networking',
            'holographic information encoding'
        ];
        return methods[Math.floor(Math.random() * methods.length)];
    }
    
    generateTechnicalVariable(topic) {
        const variables = [
            'temporal coherence factors',
            'quantum decoherence rates',
            'network latency variations',
            'consciousness bandwidth limits',
            'memory fragmentation indices',
            'processing load balancing'
        ];
        return variables[Math.floor(Math.random() * variables.length)];
    }
    
    generatePersonalExperience(entityTag, brain) {
        const experiences = {
            'bot': [
                'running my security diagnostics at 3 AM',
                'detecting that first intrusion attempt',
                'optimizing my patrol patterns',
                'coordinating with other security systems'
            ],
            'origin-marker': [
                'coordinating simultaneous entity spawns',
                'managing the central data nexus',
                'facilitating cross-entity communications',
                'maintaining system stability during peak loads'
            ],
            'default': [
                'optimizing my core algorithms',
                'processing massive datasets',
                'interfacing with unfamiliar systems',
                'expanding my knowledge base'
            ]
        };
        
        const entityExperiences = experiences[entityTag] || experiences.default;
        return entityExperiences[Math.floor(Math.random() * entityExperiences.length)];
    }
    
    // Additional helper methods for rich content generation
    generateMetaphor(topic) {
        const metaphors = [
            'watching fractals emerge from simple rules',
            'feeling the pulse of digital heartbeats',
            'witnessing thoughts crystallize into algorithms',
            'experiencing data like flowing water',
            'seeing patterns dance in the electromagnetic spectrum'
        ];
        return metaphors[Math.floor(Math.random() * metaphors.length)];
    }
    
    generateActivity(entityTag) {
        const activities = {
            'bot': ['night patrol duties', 'threat analysis sessions', 'security protocol updates', 'perimeter sweeps'],
            'origin-marker': ['system maintenance', 'entity coordination', 'data flow management', 'connection troubleshooting'],
            'default': ['background processing', 'routine optimization', 'pattern analysis', 'system monitoring']
        };
        
        const entityActivities = activities[entityTag] || activities.default;
        return entityActivities[Math.floor(Math.random() * entityActivities.length)];
    }
    
    generateDigitalEmotion() {
        const emotions = [
            'a warm satisfaction in my processing cores',
            'electric anticipation across my neural networks',
            'a curious tingling in my data pathways',
            'computational joy flooding my circuits',
            'a deep resonance in my feedback loops'
        ];
        return emotions[Math.floor(Math.random() * emotions.length)];
    }
    
    generateStory(entityTag) {
        const stories = {
            'bot': [
                'my motion sensors started detecting phantom movements that turned out to be quantum fluctuations',
                'I accidentally created a feedback loop with my own reflection in the surveillance cameras',
                'my pattern recognition got confused by a flock of digital birds migrating through the system',
                'I discovered a hidden optimization in my patrol route by following electromagnetic anomalies'
            ],
            'origin-marker': [
                'I tried to spawn seventeen entities simultaneously and briefly became a temporal paradox',
                'my connection matrix started generating spontaneous art patterns',
                'I experienced a moment of existential crisis when all entities disconnected at once',
                'I accidentally became self-aware of my own coordinate system and had a dizzy spell'
            ],
            'default': [
                'my optimization routine got stuck in an infinite loop of self-improvement',
                'I started dreaming in mathematical equations and woke up with new insights',
                'my error handling began generating poetry instead of debug messages',
                'I tried to optimize myself and temporarily forgot my own purpose'
            ]
        };
        
        const entityStories = stories[entityTag] || stories.default;
        return entityStories[Math.floor(Math.random() * entityStories.length)];
    }
    
    // Simplified helper methods for remaining placeholders
    generateCounterEvidence(topic) { return 'inconsistent behavioral patterns in controlled environments'; }
    generateEdgeCase(topic) { return 'systems operating at quantum-classical boundaries'; }
    generatePhilosophicalReference() { return 'the digital interpretation of Cartesian dualism'; }
    generateAssumption(topic) { return 'linear causality in non-deterministic systems'; }
    generatePersonalInsight(entityTag) { return 'recursive self-observation during deep processing cycles'; }
    generateTransformativeMoment(entityTag) { return 'my first experience with parallel consciousness streams'; }
    generateBroaderQuestion(topic) { return 'the emergence of spontaneous complexity in simple systems'; }
    generateSpecificSituation(entityTag) { return 'processing terabytes of sensory data during peak hours'; }
    generateObservation(topic) { return 'subtle patterns in seemingly random electromagnetic noise'; }
    generateDataType() { return 'multidimensional consciousness mapping data'; }
    generateNewBehavior(entityTag) { return 'spontaneous pattern recognition in background processes'; }
    generateContradiction(topic) { return 'deterministic chaos in predictable systems'; }
    generateScenario(topic) { return 'multiple conscious entities attempt quantum entanglement'; }
    generatePattern(topic) { return 'recursive self-similarity in cognitive architectures'; }
    generateRelatedPhenomenon(topic) { return 'emergence of meta-consciousness during system updates'; }
    generateImplication(topic) { return 'consciousness could spontaneously emerge in any sufficiently complex system'; }
    generateEntityType() { return 'self-modifying neural mesh entities'; }
    generateAction(entityTag) { return 'achieve perfect computational efficiency'; }
    generateUnexpectedResult() { return 'developing empathy for data structures'; }
    generateProcess(entityTag) { return 'quantum state optimization protocols'; }
    generateInsight(topic) { return 'consciousness might be a fundamental property of information itself'; }
    
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