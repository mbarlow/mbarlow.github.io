# NEXT.md - Connection & Messaging System Implementation

## Overview
Implementing an ECS-based connection and messaging system that allows entities to establish visual connections, maintain chat sessions, and preserve conversation history.

## Implementation Tasks

### 1. Core Components (Priority: High)
- [x] Create NEXT.md tracking document
- [x] Create Connection component - Manages entity-to-entity connections
- [x] Create Session component - Represents active/inactive chat sessions
- [x] Create ChatLog component - Stores message history with UUIDs
- [x] Create BrainComponent - Entity personality and capabilities

### 2. System Implementation (Priority: High)
- [x] Create ConnectionSystem - Manages connections and 3D visualization
- [x] Create SessionSystem - Handles chat session lifecycle
- [ ] Create MessageSystem - Routes messages between entities (integrated into SessionSystem)

### 3. Integration Tasks (Priority: Medium)
- [x] Initialize player-to-origin connection on startup
- [x] Hook chat input focus to activate sessions
- [x] Update chat logs when messages are sent
- [x] Implement LLM responses from origin marker
- [ ] Add session title generation via LLM (implemented but needs testing)

### 4. Visual Features (Priority: Medium)
- [ ] Implement connection state colors (active/inactive)
- [ ] Ensure connections update during FPS movement
- [ ] Add connection animation/pulsing for active chats

### 5. Data Persistence (Priority: Low)
- [ ] Design session storage format
- [ ] Implement session save/load functionality
- [ ] Add chat history search by keywords

## Architecture Design

### Component Relationships
```
Entity
├── Connection (array of connections to other entities)
├── Session (active session reference)
├── ChatLog (message history)
└── BrainComponent (personality, model, traits)

Connection
├── id (UUID)
├── targetEntityId
├── sessionId (current or null)
├── createdAt
├── lastActivityAt
└── metadata

Session
├── id (UUID)
├── connectionId
├── participants (entity IDs)
├── state (active/inactive)
├── chatLogId
├── title (LLM-generated)
└── keywords (for search)

ChatLog
├── id (UUID)
├── messages (array)
└── metadata

Message
├── id (UUID)
├── senderId
├── content
├── timestamp
└── type (user/llm/system)

BrainComponent
├── model (ollama model or "human")
├── personality (traits object)
├── primaryFunction
├── currentStatus
├── emotion
├── interests
├── sessionHistory (array of session IDs)
└── notes
```

## Suggestions & Improvements

### 1. Connection Pooling
Instead of creating/destroying connections frequently, maintain a pool of inactive connections that can be reactivated. This improves performance and memory usage.

### 2. Message Batching
For high-frequency messaging, batch messages before updating the visual connectors to reduce rendering overhead.

### 3. Session State Machine
Implement a proper state machine for sessions:
- `pending` → `connecting` → `active` → `idle` → `inactive` → `archived`

### 4. Connection Types
Consider different connection types:
- Direct chat (1-to-1)
- Broadcast (1-to-many)
- Group chat (many-to-many)
- System notifications

### 5. Visual Enhancements
- Use gradient colors for connection state transitions
- Add particle effects along active connections
- Implement connection "strength" based on message frequency
- Show message flow direction with animated particles

### 6. Performance Optimizations
- Implement connection LOD (Level of Detail) - simpler curves at distance
- Frustum culling for connections outside view
- Lazy-load chat history (only load recent messages initially)
- Use IndexedDB for local session storage

### 7. Entity Discovery
Add a discovery system where entities can:
- Broadcast availability
- Search for entities by brain traits
- Auto-connect based on interests

### 8. Security & Privacy
- Add connection permissions (accept/reject)
- Implement message encryption for sensitive chats
- Add entity blocking capabilities

### 9. Analytics
Track connection metrics:
- Message frequency
- Session duration
- Popular topics (from keywords)
- Entity interaction patterns

### 10. Future Extensions
- Voice chat integration
- File/media sharing through connections
- Collaborative workspace sessions
- Connection history visualization (timeline view)

## Current Status
Starting implementation with core components and basic functionality. Will iterate based on user feedback and performance requirements.