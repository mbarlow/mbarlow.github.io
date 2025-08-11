import { Component } from '../core/Component.js';

export class BrainComponent extends Component {
    constructor(config = {}) {
        super();
        
        // Core attributes
        this.model = config.model || 'human'; // 'human' or ollama model name
        this.primaryFunction = config.primaryFunction || 'general';
        
        // Personality traits
        this.personality = {
            openness: config.personality?.openness || 0.5,
            conscientiousness: config.personality?.conscientiousness || 0.5,
            extraversion: config.personality?.extraversion || 0.5,
            agreeableness: config.personality?.agreeableness || 0.5,
            neuroticism: config.personality?.neuroticism || 0.5,
            ...config.personality
        };
        
        // Current state
        this.currentStatus = config.currentStatus || 'idle';
        this.emotion = config.emotion || 'neutral';
        this.energy = config.energy || 1.0;
        
        // Interests and knowledge
        this.interests = config.interests || [];
        this.expertise = config.expertise || [];
        this.notes = config.notes || '';
        
        // Session history
        this.sessionHistory = config.sessionHistory || [];
        this.activeSessionIds = new Set();
        
        // Memory and context
        this.shortTermMemory = [];
        this.longTermMemory = config.longTermMemory || [];
        this.contextWindow = config.contextWindow || 10; // messages to remember
        
        // Experience logging for emergent personality development
        this.experiences = config.experiences || [];
        this.observations = config.observations || [];
        this.relationships = new Map(); // entityId -> relationship data
        this.environmentalAwareness = {
            lastPlayerPosition: null,
            lastPlayerAction: null,
            nearbyEntities: [],
            systemState: 'unknown',
            interestingEvents: []
        };
        
        // Behavioral modifiers
        this.responseStyle = config.responseStyle || 'balanced';
        this.verbosity = config.verbosity || 0.5;
        this.creativity = config.creativity || 0.5;
        
        // System prompt configuration
        this.systemPrompt = config.systemPrompt || '';
        this.promptTemplate = config.promptTemplate || 'default';
        this.contextSettings = {
            includeHistory: config.contextSettings?.includeHistory || true,
            historyLimit: config.contextSettings?.historyLimit || 5,
            includePersonality: config.contextSettings?.includePersonality || true,
            includeSystemInfo: config.contextSettings?.includeSystemInfo || true,
            includeCommands: config.contextSettings?.includeCommands || true,
            ...config.contextSettings
        };
        this.commandAccess = config.commandAccess || ['search', 'history', 'who', 'context'];
    }

    addSessionToHistory(sessionId) {
        if (!this.sessionHistory.includes(sessionId)) {
            this.sessionHistory.push(sessionId);
        }
        this.activeSessionIds.add(sessionId);
    }

    removeActiveSession(sessionId) {
        this.activeSessionIds.delete(sessionId);
    }

    updateEmotion(newEmotion, intensity = 1.0) {
        this.emotion = newEmotion;
        this.emotionIntensity = Math.max(0, Math.min(1, intensity));
    }

    updateStatus(newStatus) {
        this.currentStatus = newStatus;
    }

    addToShortTermMemory(item) {
        this.shortTermMemory.push({
            content: item,
            timestamp: Date.now()
        });
        
        // Limit short term memory size
        if (this.shortTermMemory.length > this.contextWindow) {
            this.shortTermMemory.shift();
        }
    }

    addToLongTermMemory(item, category = 'general') {
        this.longTermMemory.push({
            content: item,
            category,
            timestamp: Date.now()
        });
    }

    getRecentMemories(count = 5) {
        return this.shortTermMemory.slice(-count);
    }

    searchLongTermMemory(query) {
        const lowerQuery = query.toLowerCase();
        return this.longTermMemory.filter(memory => 
            memory.content.toLowerCase().includes(lowerQuery)
        );
    }

    getPersonalityProfile() {
        return {
            model: this.model,
            primaryFunction: this.primaryFunction,
            personality: this.personality,
            interests: this.interests,
            expertise: this.expertise,
            responseStyle: this.responseStyle
        };
    }

    shouldRespond(context = {}) {
        // Determine if this brain should respond based on personality and context
        const baseChance = this.personality.extraversion;
        const relevanceBonus = this.interests.some(interest => 
            context.topic?.toLowerCase().includes(interest.toLowerCase())
        ) ? 0.3 : 0;
        
        return Math.random() < (baseChance + relevanceBonus);
    }

    generateResponseContext() {
        return {
            personality: this.personality,
            emotion: this.emotion,
            recentMemories: this.getRecentMemories(),
            responseStyle: this.responseStyle,
            verbosity: this.verbosity,
            creativity: this.creativity,
            systemPrompt: this.systemPrompt,
            contextSettings: this.contextSettings,
            commandAccess: this.commandAccess
        };
    }

    updateSystemPrompt(newPrompt) {
        this.systemPrompt = newPrompt;
    }

    hasCommandAccess(command) {
        return this.commandAccess.includes(command);
    }

    addCommandAccess(command) {
        if (!this.commandAccess.includes(command)) {
            this.commandAccess.push(command);
        }
    }

    removeCommandAccess(command) {
        this.commandAccess = this.commandAccess.filter(cmd => cmd !== command);
    }
    
    // Experience and observation tracking
    logExperience(type, description, context = {}) {
        const experience = {
            type, // 'interaction', 'observation', 'thought', 'discovery', etc.
            description,
            context,
            timestamp: Date.now(),
            emotional_impact: this.assessEmotionalImpact(type, context)
        };
        
        this.experiences.push(experience);
        
        // Keep experiences manageable - remove oldest if too many
        if (this.experiences.length > 100) {
            this.experiences.shift();
        }
        
        // Update long-term personality traits based on experiences
        this.updatePersonalityFromExperience(experience);
    }
    
    observeEnvironment(world, entity) {
        // Gather environmental observations
        const nearbyEntities = this.findNearbyEntities(world, entity);
        const playerEntity = world.getEntitiesByTag('player')[0];
        const systemHealth = this.assessSystemHealth(world);
        
        const observation = {
            nearbyEntities: nearbyEntities.map(e => ({
                id: e.id,
                tag: e.tag,
                position: e.getComponent('TransformComponent')?.position,
                state: e.getComponent('VoxelIndicatorComponent')?.state || 'unknown'
            })),
            playerPresent: !!playerEntity,
            playerPosition: playerEntity?.getComponent('TransformComponent')?.position,
            systemLoad: systemHealth.activeConnections || 0,
            activeConversations: systemHealth.conversations || 0,
            timestamp: Date.now()
        };
        
        // Note interesting changes
        if (this.environmentalAwareness.lastPlayerPosition && playerEntity) {
            const playerMoved = this.calculateDistance(
                this.environmentalAwareness.lastPlayerPosition,
                observation.playerPosition
            ) > 1.0;
            
            if (playerMoved) {
                this.logExperience('observation', 'Player moved to a new location', {
                    from: this.environmentalAwareness.lastPlayerPosition,
                    to: observation.playerPosition
                });
            }
        }
        
        // Update awareness
        this.environmentalAwareness = {
            ...observation,
            lastPlayerPosition: observation.playerPosition,
            interestingEvents: this.environmentalAwareness.interestingEvents.slice(-10) // Keep last 10
        };
    }
    
    updateRelationship(entityId, interactionType, sentiment = 'neutral', topic = null) {
        if (!this.relationships.has(entityId)) {
            this.relationships.set(entityId, {
                entityId,
                interactions: 0,
                lastInteraction: null,
                sentiment: 'neutral',
                topics_discussed: [],
                memorable_moments: []
            });
        }
        
        const relationship = this.relationships.get(entityId);
        relationship.interactions++;
        relationship.lastInteraction = Date.now();
        
        // Add topic to topics_discussed if provided
        if (topic && !relationship.topics_discussed.includes(topic)) {
            relationship.topics_discussed.push(topic);
            // Keep only last 10 topics
            if (relationship.topics_discussed.length > 10) {
                relationship.topics_discussed.shift();
            }
        }
        
        // Update sentiment (simple moving average)
        const sentimentValue = sentiment === 'positive' ? 1 : sentiment === 'negative' ? -1 : 0;
        const currentValue = relationship.sentiment === 'positive' ? 1 : relationship.sentiment === 'negative' ? -1 : 0;
        const newValue = (currentValue * 0.8) + (sentimentValue * 0.2);
        
        relationship.sentiment = newValue > 0.3 ? 'positive' : newValue < -0.3 ? 'negative' : 'neutral';
        
        this.relationships.set(entityId, relationship);
    }
    
    // Generate contextual conversation starters based on experiences
    generateConversationContext(otherEntity) {
        const recentExperiences = this.experiences.slice(-5);
        const relationship = this.relationships.get(otherEntity.id);
        const observations = this.environmentalAwareness;
        
        // Build rich context for AI generation
        return {
            recentExperiences: recentExperiences.map(exp => `${exp.type}: ${exp.description}`),
            relationship: relationship ? {
                interactions: relationship.interactions,
                sentiment: relationship.sentiment,
                topics: relationship.topics_discussed.slice(-3)
            } : null,
            observations: {
                playerPresent: observations.playerPresent,
                nearbyEntities: observations.nearbyEntities.length,
                systemLoad: observations.systemLoad,
                interestingEvents: observations.interestingEvents.slice(-3)
            },
            personality: this.personality,
            interests: this.interests,
            expertise: this.expertise,
            currentEmotion: this.emotion,
            energy: this.energy,
            systemPrompt: this.systemPrompt
        };
    }
    
    // Helper methods
    findNearbyEntities(world, entity, radius = 15) {
        const transform = entity.getComponent('TransformComponent');
        if (!transform) return [];
        
        return Array.from(world.entities.values())
            .filter(e => e.id !== entity.id && e.getComponent('TransformComponent'))
            .filter(e => {
                const otherTransform = e.getComponent('TransformComponent');
                return this.calculateDistance(transform.position, otherTransform.position) <= radius;
            });
    }
    
    calculateDistance(pos1, pos2) {
        if (!pos1 || !pos2) return Infinity;
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx*dx + dy*dy + dz*dz);
    }
    
    assessSystemHealth(world) {
        const connectionSystem = world.getSystem('connection');
        const autonomousChatSystem = world.getSystem('autonomousChat');
        
        return {
            activeConnections: connectionSystem?.connectors?.size || 0,
            conversations: autonomousChatSystem?.activeConversations?.size || 0,
            entities: world.entities.size
        };
    }
    
    assessEmotionalImpact(type, context) {
        // Simple emotional impact assessment
        switch(type) {
            case 'positive_interaction': return 0.3;
            case 'discovery': return 0.2;
            case 'conflict': return -0.2;
            case 'observation': return 0.1;
            default: return 0;
        }
    }
    
    updatePersonalityFromExperience(experience) {
        // Gradually evolve personality based on experiences
        // This is subtle and happens over many experiences
        const impact = experience.emotional_impact * 0.01; // Very small changes
        
        if (experience.type === 'positive_interaction') {
            this.personality.agreeableness += impact;
            this.personality.extraversion += impact * 0.5;
        } else if (experience.type === 'discovery') {
            this.personality.openness += impact;
        } else if (experience.type === 'conflict') {
            this.personality.neuroticism += Math.abs(impact);
            this.personality.agreeableness -= Math.abs(impact);
        }
        
        // Keep personality traits in bounds
        Object.keys(this.personality).forEach(trait => {
            this.personality[trait] = Math.max(0, Math.min(1, this.personality[trait]));
        });
    }
}