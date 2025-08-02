# mbarlow.github.io

**Version:** v0.0.1| **Build:** v0.0.1:40b1098

A local-first chat interface with ECS engine represented as a 3D (optional FPS) mode experience featuring intelligent AI entities, visual connections, and persistent session management.

## Features

### Core System
- **Entity-Component-System (ECS)** - Game engine-style architecture for modularity and performance
- **Pure Vanilla JavaScript** - No framework dependencies, using ES6 modules and modern browser APIs
- **Local-First Architecture** - Data persistence with IndexedDB, no external dependencies required

### AI & Chat System  
- **Intelligent AI Entities** - Context-aware AI assistants with personality traits and system knowledge
- **System Prompt Support** - Dynamic prompt generation with real-time context injection
- **Local Ollama Integration** - Seamless connection to local Ollama server with model switching
- **Multimodal Chat** - Image upload and processing for vision-capable models
- **Session Management** - Persistent chat sessions with automatic titles and keyword extraction

### Visual & Interactive Features
- **3D Entity Connections** - Dynamic Bezier curves connecting entities with visual state indicators
- **Particle Effects** - Flowing animations on active connections with performance optimization
- **FPS Mode** - Immersive Three.js-based 3D environment with first-person controls
- **LOD Optimization** - Level-of-detail rendering for smooth performance with many entities

### Data & Search
- **Advanced Search** - Full-text search across chat history with keyword matching
- **Data Export/Import** - JSON export of all sessions and chat logs
- **Automatic Persistence** - Real-time saving of conversations and system state
- **Session History** - Chronological view of past conversations with metadata

### UI/UX
- **Theme System** - Multiple themes (Light, Dark, Grey) with persistent preferences  
- **Font System** - Extensive font selection with categorized UI
- **Command System** - Slash commands for system interaction (/search, /history, /who, etc.)
- **Responsive Design** - Adaptive layout for different screen sizes

## Quick Start

1. **Development Server**
   ```bash
   npm install
   npm run dev
   ```
   Opens at http://localhost:3000

2. **AI Chat Setup** (Optional)
   - Install and run [Ollama](https://ollama.ai) locally
   - The chat interface will auto-detect available models

## Architecture

Built using an Entity-Component-System (ECS) pattern:
- **Entities** - Game objects with unique IDs
- **Components** - Data containers (Transform, Camera, Mesh, etc.)
- **Systems** - Logic processors (Render, Input, Movement, etc.)

## Available Commands

### Slash Commands
- `/start` - Enter FPS mode for 3D exploration
- `/search <query>` - Search chat history by keywords/titles  
- `/history` - Show recent conversation sessions
- `/save` - Force save current session state
- `/export` - Export all session data as JSON
- `/who` - Show entity information and brain details
- `/model` - Display current LLM model information
- `/context` - Show current conversation context

### Keyboard Shortcuts

#### Chat Mode
- `/` or `Space` - Focus chat input
- `Enter` - Send message (Shift+Enter for new line)
- `1/2/3` - Quick theme switching
- `Escape` - Close dropdowns
- `Ctrl+V` - Paste images from clipboard

#### FPS Mode  
- `WASD` - Movement
- `Mouse` - Look around
- `Space` - Jump
- `Shift` - Sprint
- `Ctrl` - Crouch
- `~` - Toggle chat overlay
- `Escape` - Exit FPS mode

## Development

See [CLAUDE.md](CLAUDE.md) for detailed development guidance.

### Key Components

- **Connection System** - 3D visual connections using Three.js Bezier curves
- **Session System** - Chat session lifecycle management with persistence
- **Agent System** - Local Ollama integration with context-aware prompts
- **Brain Component** - AI entity personality and behavior configuration
- **Persistence System** - IndexedDB storage with search capabilities

### Project Structure

```
src/
├── js/
│   ├── core/           # ECS foundation (World, Entity, Component, System)
│   ├── components/     # Data components (Transform, Connection, Session, etc.)
│   ├── systems/        # Logic systems (Render, Agent, Input, etc.)
│   ├── utils/          # Utilities (EntityFactory, SystemPromptBuilder)
│   └── app.js          # Main application controller
├── css/                # Styles and themes
└── index.html          # Entry point
```

## Recent Changes (v0.0.1)

### New Features
- **System Prompt Support** - AI entities now have context-aware system prompts
- **Enhanced Connection Visualization** - Particle effects and LOD optimization
- **Advanced Session Management** - Automatic titles, keywords, and search
- **Command System Expansion** - New slash commands for system interaction
- **Data Persistence** - Complete IndexedDB integration with export/import

### Architecture Improvements
- **Dynamic Prompt Generation** - SystemPromptBuilder with template system
- **Enhanced Brain Components** - Personality-driven AI behavior
- **Performance Optimizations** - LOD rendering and memory management
- **Context-Aware AI** - Real-time system state injection into prompts

## License

MIT License - see [LICENSE](LICENSE) file
