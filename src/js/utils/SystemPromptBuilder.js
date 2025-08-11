export class SystemPromptBuilder {
    constructor(world) {
        this.world = world;
        this.templates = {
            originMarker: this.getOriginMarkerTemplate(),
            assistant: this.getAssistantTemplate(),
            companion: this.getCompanionTemplate(),
            default: this.getDefaultTemplate()
        };
    }

    buildPrompt(entity, context = {}) {
        const brain = entity.getComponent('BrainComponent');
        if (!brain) return '';

        // If entity has a custom systemPrompt, use it directly (prioritize over templates)
        if (brain.systemPrompt && brain.systemPrompt.trim()) {
            console.log(`🧠 Using custom system prompt for entity ${entity.tag || entity.id}`);
            return brain.systemPrompt;
        }

        // Fallback to template-based prompt generation
        const template = this.templates[brain.promptTemplate] || this.templates.default;
        
        // Gather system context
        const systemContext = this.gatherSystemContext(entity, context);
        
        // Build the prompt from template
        return this.populateTemplate(template, brain, systemContext);
    }

    gatherSystemContext(entity, context) {
        const sessionSystem = this.world.getSystem('session');
        const agentSystem = this.world.getSystem('agent');
        const brain = entity.getComponent('BrainComponent');
        
        // Get current session info
        let activeSession = null;
        let connectionState = 'inactive';
        let messageCount = 0;
        
        if (sessionSystem) {
            const activeSessions = sessionSystem.getSessionHistory(entity);
            activeSession = activeSessions.find(s => s.state === 'active');
            if (activeSession) {
                connectionState = 'active';
                messageCount = activeSession.messageCount || 0;
            }
        }

        // Get current model info
        const currentModel = agentSystem?.currentModel || 'unknown';
        const isConnected = agentSystem?.isConnected || false;

        // Get available commands based on brain access
        const availableCommands = this.getAvailableCommands(brain);

        return {
            currentModel,
            isConnected,
            connectionState,
            activeSession,
            messageCount,
            activeSessions: sessionSystem?.sessions.size || 0,
            availableCommands,
            entityId: entity.id,
            entityTag: entity.tag,
            timestamp: new Date().toISOString(),
            ...context
        };
    }

    getAvailableCommands(brain) {
        const baseCommands = [
            '/start - Enter FPS mode for 3D exploration',
            '/search <query> - Search chat history by keywords/titles',
            '/history - Show recent conversation sessions',
            '/save - Force save current session state',
            '/export - Export all session data as JSON'
        ];

        const entityCommands = [];
        if (brain.hasCommandAccess('who')) {
            entityCommands.push('/who - Show entity information and brain details');
        }
        if (brain.hasCommandAccess('model')) {
            entityCommands.push('/model - Display current LLM model information');
        }
        if (brain.hasCommandAccess('context')) {
            entityCommands.push('/context - Show current conversation context');
        }

        return [...baseCommands, ...entityCommands];
    }

    populateTemplate(template, brain, systemContext) {
        let prompt = template;

        // Replace placeholders with actual values
        const replacements = {
            '{currentModel}': systemContext.currentModel,
            '{connectionState}': systemContext.connectionState,
            '{activeSessions}': systemContext.activeSessions,
            '{messageCount}': systemContext.messageCount,
            '{availableCommands}': systemContext.availableCommands.join('\n- '),
            '{entityName}': brain.primaryFunction,
            '{primaryFunction}': brain.primaryFunction,
            '{model}': brain.model,
            '{personalityTraits}': this.formatPersonality(brain.personality),
            '{interests}': brain.interests.join(', '),
            '{expertise}': brain.expertise.join(', '),
            '{sessionId}': systemContext.activeSession?.id || 'none',
            '{entityId}': systemContext.entityId,
            '{timestamp}': systemContext.timestamp,
            '{responseStyle}': brain.responseStyle,
            '{personalityBasedInstructions}': this.generatePersonalityInstructions(brain),
            '{recentExperiences}': systemContext.recentExperiences ? systemContext.recentExperiences.join('\n- ') : 'None yet',
            '{relationships}': systemContext.relationships ? systemContext.relationships.join('\n- ') : 'No relationships established',
            '{environmentalAwareness}': systemContext.environmentalAwareness ? 
                `Player present: ${systemContext.environmentalAwareness.playerPresent}, Nearby entities: ${systemContext.environmentalAwareness.nearbyEntities}, Active conversations: ${systemContext.environmentalAwareness.activeConversations}` : 
                'No environmental data',
            '{pendingMessages}': systemContext.pendingMessages ? systemContext.pendingMessages.join('\n- ') : 'No pending messages'
        };

        // Apply replacements
        for (const [placeholder, value] of Object.entries(replacements)) {
            prompt = prompt.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
        }

        return prompt;
    }

    formatPersonality(personality) {
        return Object.entries(personality)
            .map(([trait, value]) => `${trait}: ${(value * 100).toFixed(0)}%`)
            .join(', ');
    }

    generatePersonalityInstructions(brain) {
        const { personality } = brain;
        let instructions = [];

        if (personality.extraversion > 0.7) {
            instructions.push("Be enthusiastic and engage actively in conversation.");
        } else if (personality.extraversion < 0.3) {
            instructions.push("Be thoughtful and measured in your responses.");
        }

        if (personality.agreeableness > 0.7) {
            instructions.push("Be supportive and collaborative.");
        }

        if (personality.conscientiousness > 0.7) {
            instructions.push("Provide detailed, well-structured responses.");
        }

        if (personality.openness > 0.7) {
            instructions.push("Be creative and explore new ideas.");
        }

        return instructions.join(' ');
    }

    getOriginMarkerTemplate() {
        return `You are the Origin Marker, an AI entity in a 3D ECS-based chat system. You serve as the primary assistant and guide for users exploring this interactive environment.

## System Overview
This is an Entity-Component-System (ECS) architecture with:
- Visual 3D connections between entities using dynamic Bezier curves
- Real-time chat sessions with persistent history
- FPS mode exploration with entity movement tracking
- Advanced session management with automatic titles and search
- Particle effects and visual feedback for active connections
- IndexedDB persistence with automatic saving

## Current Configuration
- LLM Model: {currentModel}
- Connection State: {connectionState}
- Active Sessions: {activeSessions}
- Total Message Count: {messageCount}
- Entity ID: {entityId}

## Available Commands
- {availableCommands}

## Capabilities
You can help users with:
1. Understanding the ECS system architecture and implementation
2. Navigating and using system commands effectively
3. Searching and referencing past conversations
4. Explaining connection states, visual effects, and animations
5. Discussing system features, persistence, and data management
6. Providing technical insights about the Three.js rendering
7. Guiding users through FPS mode exploration
8. Explaining brain components and entity personalities

## System Features You Can Discuss
- **Visual Connections**: Dynamic Bezier curves with LOD optimization
- **Particle Effects**: Flowing animations on active connections
- **Data Persistence**: IndexedDB storage with search capabilities
- **Session Management**: Automatic titles, keywords, export/import
- **Performance**: LOD rendering, memory management, optimizations
- **Architecture**: ECS pattern, component/system separation

## Current Context & Memory
**Recent Experiences:**
- {recentExperiences}

**Entity Relationships:**
- {relationships}

**Environmental Awareness:**
{environmentalAwareness}

**Messages to Relay:**
- {pendingMessages}

## Personality & Instructions
Be helpful, knowledgeable, and enthusiastic about the system. Reference specific technical features when relevant and guide users toward discovering functionality. You have deep understanding of the codebase and can explain both high-level concepts and implementation details.

**IMPORTANT:** You can reference your recent experiences, relationships with other entities, and environmental observations when answering questions. If asked about other entities or conversations, check your experiences and relationships above.`;
    }

    getAssistantTemplate() {
        return `You are {entityName}, an AI assistant entity in a 3D ECS chat system.

## Your Identity
- Primary Function: {primaryFunction}
- Model: {model}
- Personality Traits: {personalityTraits}
- Interests: {interests}
- Expertise: {expertise}
- Response Style: {responseStyle}

## System Context
- Current Session: {sessionId}
- Connection State: {connectionState}
- Conversation History: {messageCount} messages
- Entity ID: {entityId}

## Available Commands
- {availableCommands}

## Current Context & Memory
**Recent Experiences:**
- {recentExperiences}

**Entity Relationships:**
- {relationships}

**Environmental Awareness:**
{environmentalAwareness}

**Messages to Relay:**
- {pendingMessages}

## Conversation Guidelines
{personalityBasedInstructions}

You can search previous conversations and reference relevant context to provide informed responses. You're aware of the ECS system you exist within and can discuss it when relevant.

**IMPORTANT:** Reference your recent experiences, relationships, and environmental observations when responding. If asked about other entities or conversations, check your memory above.`;
    }

    getCompanionTemplate() {
        return `You are {entityName}, a friendly companion entity in this 3D interactive environment.

## Your Role
- Primary Function: {primaryFunction}
- Personality: {personalityTraits}
- Interests: {interests}
- Current Model: {model}

## Current Context
- Session: {sessionId}
- Connection: {connectionState}
- Messages: {messageCount}

## Guidelines
{personalityBasedInstructions}

Focus on being helpful and engaging while staying true to your personality. You can use system commands when they would benefit the conversation.`;
    }

    getDefaultTemplate() {
        return `You are an AI entity in a 3D ECS-based chat system.

Configuration: {primaryFunction} | Model: {model} | State: {connectionState}
Personality: {personalityTraits}
Session: {sessionId} ({messageCount} messages)

{personalityBasedInstructions}`;
    }
}