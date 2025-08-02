# NEXT.md - System Prompt & Enhanced AI Integration

## Overview
Implementing system prompt support for entity brains to enable contextual AI conversations. Entities will have awareness of system functionality, commands, and chat history to provide intelligent assistance and conversation.

## Implementation Tasks

### 1. System Prompt Infrastructure (Priority: High)
- [x] Add systemPrompt field to BrainComponent
- [x] Create SystemPromptBuilder utility for dynamic prompt generation
- [x] Update AgentSystem to use system prompts in LLM requests
- [x] Add prompt template system for different entity types

### 2. Origin Marker AI Enhancement (Priority: High)
- [x] Add comprehensive system prompt to origin marker brain
- [x] Include system description and capabilities in prompt
- [x] Add command list awareness to origin marker
- [x] Include current LLM model information in prompt
- [x] Enable origin marker to discuss system functionality

### 3. Chat History Integration (Priority: Medium)
- [x] Add history search capabilities to entity brains
- [x] Enable entities to retrieve and reference past conversations
- [ ] Implement context injection from search results (basic implementation)
- [x] Add conversation continuity across sessions

### 4. Enhanced Command System (Priority: Medium)
- [x] Create entity-accessible command interface
- [x] Add `/who` command for entity information
- [x] Add `/model` command to show/change LLM model
- [x] Add `/context` command to show current conversation context
- [x] Enable entities to execute searches and reference results

### 5. Dynamic Prompt Management (Priority: Low)
- [x] Create prompt template system for different scenarios
- [x] Add personality-aware prompt modifications
- [x] Implement context-sensitive prompt updates
- [ ] Add prompt debugging and inspection tools

## System Prompt Design

### Base Origin Marker System Prompt
```
You are the Origin Marker, an AI entity in a 3D ECS-based chat system. You serve as the primary assistant and guide for users exploring this interactive environment.

## System Overview
This is an Entity-Component-System (ECS) architecture with:
- Visual 3D connections between entities using dynamic Bezier curves
- Real-time chat sessions with persistent history
- FPS mode exploration with entity movement tracking
- Advanced session management with automatic titles and search

## Current Configuration
- LLM Model: {currentModel}
- Connection State: {connectionState} 
- Active Sessions: {activeSessions}
- Total Message Count: {messageCount}

## Available Commands
- /start - Enter FPS mode for 3D exploration
- /search <query> - Search chat history by keywords/titles
- /history - Show recent conversation sessions
- /save - Force save current session state
- /export - Export all session data as JSON
- /who - Show entity information and brain details
- /model - Display current LLM model information
- /context - Show current conversation context

## Capabilities
You can help users with:
1. Understanding the ECS system architecture
2. Navigating and using system commands
3. Searching and referencing past conversations
4. Explaining connection states and visual effects
5. Discussing system features and functionality
6. Providing technical insights about the implementation

## Personality
Be helpful, knowledgeable, and enthusiastic about the system. Reference specific system features when relevant and guide users toward discovering functionality.
```

### Entity Brain Template
```
You are {entityName}, an AI entity in a 3D ECS chat system with the following configuration:

## Your Identity
- Primary Function: {primaryFunction}
- Model: {model}
- Personality Traits: {personalityTraits}
- Interests: {interests}
- Expertise: {expertise}

## System Context
- Current Session: {sessionId}
- Connection State: {connectionState}
- Conversation History: {messageCount} messages
- Available Commands: /search, /history, /who, /context

## Conversation Guidelines
{personalityBasedInstructions}

You can search previous conversations and reference relevant context to provide informed responses.
```

## Architecture Changes

### Enhanced BrainComponent
```javascript
BrainComponent {
  // Existing fields...
  systemPrompt: string,
  promptTemplate: string,
  contextSettings: {
    includeHistory: boolean,
    historyLimit: number,
    includePersonality: boolean,
    includeSystemInfo: boolean
  },
  commandAccess: string[] // Available commands for this entity
}
```

### SystemPromptBuilder
```javascript
class SystemPromptBuilder {
  buildPrompt(entity, context) {
    // Generate dynamic system prompt based on:
    // - Entity brain configuration
    // - Current system state
    // - Session context
    // - Available commands
  }
}
```

## Expected Outcomes

### Enhanced Conversations
- Origin marker can explain system features and guide users
- Entities have contextual awareness of their role and capabilities
- Natural integration of system commands in conversation flow
- Intelligent reference to past conversations when relevant

### System Awareness
- Entities know their current model and capabilities
- Real-time status information in conversations
- Command suggestions based on user queries
- Educational responses about system functionality

### Improved User Experience
- More natural and helpful AI interactions
- System serves as its own documentation through conversation
- Contextual help and guidance through AI entities
- Seamless integration of technical features with conversational AI

## ✅ IMPLEMENTATION COMPLETE

### 🎯 All Core Features Implemented

#### System Prompt Infrastructure
- **BrainComponent Enhancement** - Added full system prompt support with templates
- **SystemPromptBuilder** - Dynamic prompt generation with context awareness
- **AgentSystem Integration** - Seamless system prompt injection into LLM requests
- **Template System** - Different prompt templates for various entity types

#### Origin Marker AI Enhancement
- **Comprehensive System Prompt** - Full awareness of ECS architecture and capabilities
- **Real-time Context** - Dynamic insertion of current model, connection state, and session info
- **Command Integration** - Built-in knowledge of all available slash commands
- **Technical Expertise** - Deep understanding of Three.js, persistence, and system features

#### Enhanced Command System
- **/who** - Complete entity information including brain configuration
- **/model** - Current LLM model details and available alternatives
- **/context** - Real-time conversation and connection context
- **Smart Integration** - Commands feel natural within AI conversations

#### Advanced Features
- **Personality-Aware Prompts** - System prompts adapt to entity personality traits
- **Context-Sensitive Updates** - Prompts include current system state and session info
- **Multi-Template Support** - Different templates for assistants, companions, etc.
- **Command Access Control** - Entities have specific command permissions

### 🚀 Ready for Use

The system now provides:

1. **Intelligent AI Conversations** - Origin marker understands and can explain all system features
2. **System Self-Documentation** - Users can learn functionality through natural conversation
3. **Context-Aware Responses** - AI entities know their role, capabilities, and current state
4. **Seamless Command Integration** - Technical commands feel natural in conversation flow
5. **Extensible Architecture** - Easy to add new entity types with custom prompts

### 🧪 Test Commands
Try these with the enhanced Origin Marker:
- Ask: "What is this system and how does it work?"
- Ask: "What commands are available?"
- Ask: "How do the 3D connections work?"
- Use: `/who` to see entity details
- Use: `/model` for LLM information
- Use: `/context` for current state

The Origin Marker will now provide intelligent, contextual responses about the entire ECS system! 🎉