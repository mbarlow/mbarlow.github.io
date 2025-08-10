# Agent System

The Agent System handles AI chat integration with Ollama, manages model selection, processes AI responses, and bridges the ECS world with external AI services.

## Overview

This system provides the core AI functionality for the application, managing connections to local Ollama instances, handling model selection, processing chat requests, and integrating AI responses back into the ECS world.

## Components Required

- **BrainComponent**: For entity AI personalities and configurations

## Key Features

### Ollama Integration
- Connection management to local Ollama server
- Model availability detection and listing
- Health monitoring and reconnection handling
- API request/response processing

### Model Management
- Dynamic model discovery from Ollama
- Model switching and selection
- Model capability detection
- Performance optimization per model

### Response Generation
- Context-aware response generation
- Conversation history management
- Personality-driven responses
- System prompt integration

### Chat Processing
- Message routing to appropriate models
- Response streaming support (future)
- Error handling and fallbacks
- Request queuing and rate limiting

## System Dependencies

- **World**: For entity queries and component access
- **PersistenceSystem**: For conversation history
- **SessionSystem**: For chat session context
- **SystemPromptBuilder**: For dynamic prompt generation

## Initialization

```javascript
const agentSystem = new AgentSystem();
agentSystem.world = world;
world.addSystem(agentSystem, "agent");
await agentSystem.init();
```

## Connection Management

### Ollama Server
- Default connection to `http://localhost:11434`
- Health check endpoint monitoring
- Automatic reconnection on failure
- Connection status indicators in UI

### Model Discovery
```javascript
async discoverModels() {
  const response = await fetch('http://localhost:11434/api/tags');
  const data = await response.json();
  this.models = data.models || [];
}
```

## AI Response Processing

### Request Flow
1. Receive message from chat interface
2. Build context from conversation history
3. Apply entity personality and system prompt
4. Send request to Ollama API
5. Process and format response
6. Return formatted response to chat

### Context Building
- Recent conversation history
- Entity personality traits
- System information and capabilities
- Available commands and functions

## Brain Component Integration

### Personality Processing
```javascript
const brain = entity.getComponent("BrainComponent");
const personality = brain.personality;
const interests = brain.interests;
const expertise = brain.expertise;
```

### System Prompt Generation
- Dynamic prompt building based on entity configuration
- Personality trait integration
- Context-specific information inclusion
- Command access level management

## Error Handling

### Connection Errors
- Graceful degradation when Ollama unavailable
- User-friendly error messages
- Automatic retry mechanisms
- Fallback response generation

### Model Errors
- Invalid model handling
- Model switching on failures
- Resource exhaustion management
- Request timeout handling

## Performance Optimization

### Request Management
- Request queuing for multiple simultaneous chats
- Rate limiting to prevent API overflow
- Response caching for repeated queries
- Batching of similar requests

### Memory Management
- Conversation history truncation
- Context window optimization
- Model-specific memory limits
- Garbage collection of old contexts

## Configuration

### Model Settings
```javascript
{
  model: "llama2",
  temperature: 0.7,
  max_tokens: 2048,
  top_p: 0.9,
  context_window: 4096
}
```

### Personality Integration
```javascript
{
  personality: {
    agreeableness: 0.8,
    conscientiousness: 0.9,
    extraversion: 0.7,
    neuroticism: 0.2,
    openness: 0.8
  },
  responseStyle: "helpful",
  formality: "casual"
}
```

## API Integration

### Ollama Endpoints
- `/api/generate`: Text generation
- `/api/chat`: Chat completions
- `/api/tags`: Available models
- `/api/show`: Model information

### Request Format
```javascript
{
  model: "llama2",
  prompt: "System prompt + conversation history + user message",
  options: {
    temperature: 0.7,
    num_predict: 256
  }
}
```

## Future Enhancements

- Multi-model ensemble responses
- Fine-tuning integration
- Voice synthesis integration
- Image generation capabilities
- Plugin system for custom AI providers
- Response quality scoring
- Conversation analytics and insights