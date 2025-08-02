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
        
        // Behavioral modifiers
        this.responseStyle = config.responseStyle || 'balanced';
        this.verbosity = config.verbosity || 0.5;
        this.creativity = config.creativity || 0.5;
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
            creativity: this.creativity
        };
    }
}