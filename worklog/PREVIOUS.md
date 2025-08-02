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
- [x] Add session title generation via LLM (implemented and ready for testing)

### 4. Visual Features (Priority: Medium)
- [x] Implement connection state colors (active/inactive/pending/connecting/error)
- [x] Ensure connections update during FPS movement (with optimization)
- [x] Add connection animation/pulsing for active chats

### 5. Data Persistence (Priority: Low)
- [x] Design session storage format (IndexedDB + localStorage fallback)
- [x] Implement session save/load functionality (automatic + manual)
- [x] Add chat history search by keywords and titles

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

### ✅ COMPLETED - Core Implementation
The connection and messaging system is now **fully functional** with the following features:

#### Core Architecture
- **ECS-based design** with proper separation of data (components) and logic (systems)
- **UUID-based identification** for all entities, sessions, and messages
- **Shared data structures** between connected entities for efficient messaging

#### Visual Features
- **Dynamic 3D Bezier connectors** that update in real-time as entities move
- **State-based visual feedback** with distinct colors and effects:
  - 🔴 Inactive: Dark gray with low opacity
  - 🟢 Active: Bright green with pulsing animation and emissive glow
  - 🟡 Pending: Orange with medium opacity
  - 🔵 Connecting: Blue with emissive effect
  - 🔴 Error: Red for failed connections
- **Performance optimized** updates (only when entities move significantly)
- **Smooth animations** suitable for 60fps rendering

#### Messaging System
- **Session management** with automatic creation/activation
- **Message routing** through proper ECS channels
- **Chat history preservation** with searchable logs
- **LLM integration** for AI responses from origin marker
- **Automatic title generation** after 3+ messages exchanged

#### Brain System
- **Entity personalities** with configurable traits (openness, conscientiousness, etc.)
- **Model assignments** (human users vs LLM entities)
- **Interest tracking** and expertise systems
- **Memory management** (short-term and long-term)
- **Session history** tracking per entity

#### Interactive Features
- **Focus-to-activate** sessions when clicking chat input
- **Real-time visual feedback** showing connection states
- **FPS mode compatibility** - connections persist and update during movement
- **Automatic cleanup** of inactive sessions

### 🎯 Ready for Use
The system is now production-ready for:
1. **Chat between player and origin marker** with visual connection
2. **FPS mode exploration** with persistent visual connections
3. **Session management** with automatic titles and keywords
4. **Expandable architecture** for additional entities and connection types

### ⚡ NEW ENHANCEMENTS COMPLETED

#### Data Persistence System
- **Full IndexedDB integration** with localStorage fallback
- **Automatic saving** every 30 seconds + manual save commands
- **Session search** by title and keywords with `/search <query>`
- **Session history** management with `/history`
- **Export/Import** functionality with `/export`
- **Structured storage** for sessions, chat logs, and brain data

#### Performance Optimizations
- **Connection LOD** (Level of Detail) - simpler geometry at distance
- **Camera-distance based** segment calculation (8-60 segments)
- **Optimized updates** - only when entities move significantly
- **Memory management** with proper disposal of geometries/materials

#### Advanced Visual Effects
- **Particle flow animation** along active connections
- **8 flowing particles** per active connection with speed variation
- **Fade-in/fade-out** at connection endpoints
- **State-based particle creation** (only for active connections)
- **Smooth looping** particle animation

#### Slash Commands
- `/search <query>` - Search chat history by title/keywords
- `/history` - Show recent session history
- `/save` - Force save current session
- `/export` - Export all session data as JSON
- `/start` - Enter FPS mode (existing)

### 🔄 Future Enhancements (Optional)
- Multi-entity connections (group chats)
- Voice chat integration
- File/media sharing through connections
- Entity discovery and auto-connection systems
- Collaborative workspace sessions
- Advanced analytics and metrics