# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server on port 3000
- `npm run serve` - Start live-server with default settings

### Git Operations (Slash Commands)
- `/save` - Git add all changes, write a conventional commit message, commit and push to remote
  - Automatically stages all changes
  - Generates appropriate conventional commit message based on changes
  - Commits with co-author attribution
  - Pushes to current branch

## Architecture Overview

This is a chat interface with ecs engine represented as a 3D (optional FPS) mode experience:
- **Chat interface** with AI integration (Ollama)
- **3D/FPS mode** using Three.js
- **Pure vanilla JavaScript** with ES6 modules (no framework)
- **Entity-Component-System (ECS)** architecture

### ECS Architecture

The project uses a game engine-style ECS pattern:

1. **Core** (`src/js/core/`):
   - `World.js` - Manages entities and systems
   - `Entity.js` - Unique IDs with component references
   - `Component.js` - Data containers
   - `System.js` - Logic processors

2. **Components** (`src/js/components/`) - Data only:
   - Transform, Camera, Mesh, Movement, Animation, etc.

3. **Systems** (`src/js/systems/`) - Logic only:
   - `AgentSystem.js` - Ollama AI chat integration
   - `ThreeRenderSystem.js` - 3D rendering
   - `InputSystem.js` - Keyboard/mouse handling
   - `PlayerMovementSystem.js` - FPS controls

### Key Implementation Details

- **No build step** - Direct ES6 modules in browser
- **Three.js** loaded from CDN
- **AI Chat** requires local Ollama server running
- **GitHub Pages** deployment (static site)
- **Theme system** using CSS custom properties
- **Font system** with categorized font switching

### Working with the Codebase

When modifying:
- Follow the ECS pattern - data in Components, logic in Systems
- Use ES6 modules and modern JavaScript features
- Maintain the no-framework approach
- Test in browser with `npm run dev`
- Check console for errors (no test suite available)

## Debugging with Chrome DevTools

The user runs a debug Chrome instance with the alias `chrome-debug`. If debugging is needed and it's not running, remind the user to start it.

### Connecting to Chrome DevTools WebSocket

To view console logs and debug interactively:

1. First, ensure `ws` package is installed: `npm install ws`

2. Check available DevTools endpoints:
   ```bash
   curl -s http://127.0.0.1:9222/json
   ```

3. Connect to the page WebSocket (replace the ID with the actual page ID):
   ```javascript
   node -e "
   const WebSocket = require('ws');
   const ws = new WebSocket('ws://127.0.0.1:9222/devtools/page/[PAGE_ID]');

   ws.on('open', function open() {
     ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
     ws.send(JSON.stringify({ id: 2, method: 'Console.enable' }));
   });

   ws.on('message', function message(data) {
     const msg = JSON.parse(data);
     if (msg.method === 'Console.messageAdded') {
       console.log('[Console]', msg.params.message.level + ':', msg.params.message.text);
     } else if (msg.method === 'Runtime.consoleAPICalled') {
       const args = msg.params.args || [];
       const text = args.map(arg => arg.value || arg.description || JSON.stringify(arg)).join(' ');
       console.log('[Console]', msg.params.type + ':', text);
     }
   });

   setTimeout(() => { ws.close(); process.exit(0); }, 5000);
   "
   ```

This allows real-time monitoring of console logs during development and debugging.
