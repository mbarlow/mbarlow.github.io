# mbarlow.github.io

A local first chat interface with ecs engine represented as a 3D (optional FPS) mode experience.

## Features

- **AI Chat Interface** - Integration with local Ollama server for conversational AI
- **3D/FPS Mode** - Immersive Three.js-based 3D environment with first-person controls
- **Theme System** - Multiple themes (Light, Dark, Grey) with persistent preferences
- **Font System** - Extensive font selection with categorized UI
- **Entity-Component-System (ECS)** - Game engine-style architecture for modularity
- **Pure Vanilla JavaScript** - No framework dependencies, using ES6 modules

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

## Controls

### Chat Mode
- `/` or `Space` - Focus chat input
- `1/2/3` - Quick theme switching
- `Escape` - Close dropdowns

### FPS Mode
- `WASD` - Movement
- `Mouse` - Look around
- `Space` - Jump
- `Shift` - Sprint
- `Ctrl` - Crouch

## Development

See [CLAUDE.md](CLAUDE.md) for detailed development guidance.

## License

MIT License - see [LICENSE](LICENSE) file
