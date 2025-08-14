# ECS Systems

This directory contains all the systems for the Entity-Component-System (ECS) architecture. Systems contain logic and operate on entities that have specific components. Each system follows the principle of single responsibility and processes data stored in components.

## System Architecture

Systems are organized in individual folders with their own `System.js` implementation and `index.js` export. This structure provides:

- Clear separation of concerns
- Easy testing and maintenance  
- Modular system organization
- Consistent naming conventions

## Core Systems

### [Agent System](./Agent/README.md)
Handles AI chat integration with Ollama, manages model selection, and processes AI responses. This system bridges the ECS world with external AI services.

### [Camera System](./Camera/README.md)  
Manages camera entities, view matrices, and camera controls. Handles both perspective and orthographic camera setups for the 3D environment.

### [Connection System](./Connection/README.md)
Manages entity connections and relationships. Handles visual connection lines between entities and connection state management.

### [FPS Controller System](./FPSController/README.md)
Provides first-person shooter controls including mouse look, WASD movement, and FPS mode transitions. Manages player input for 3D navigation.

### [Input System](./Input/README.md)
Handles global input management, keyboard shortcuts, and input event processing. Coordinates input between different systems.

### [Level System](./Level/README.md)
Loads and manages 3D environments, entity placement from level data, and world initialization from JSON configuration files.

### [Patrol System](./Patrol/README.md)
Manages AI entity movement patterns, pathfinding, and automated entity behaviors for non-player characters.

### [Persistence System](./Persistence/README.md)
Handles data persistence to IndexedDB, session storage, chat log management, and data import/export functionality.

### [Player Movement System](./PlayerMovement/README.md)
Processes player entity movement, physics integration, and character controller logic for smooth player navigation.

### [Render System](./Render/README.md)
Basic 2D rendering system for UI elements and overlays that don't require 3D processing.

### [Session System](./Session/README.md)
Manages chat sessions between entities, session lifecycle, message routing, and conversation state management.

### [Three Render System](./ThreeRender/README.md)
Primary 3D rendering system using Three.js. Manages the 3D scene, lighting, materials, and rendering pipeline.

### [Voxel Indicator Render System](./VoxelIndicatorRender/README.md)
Specialized rendering system for 3D voxel-based indicators that provide visual feedback above entities.

## UI Systems

### [DOM Interface System](./DOMInterface/README.md)
Manages DOM manipulation, theme switching, font management, sidebar controls, and navigation UI components.

### [Chat Interface System](./ChatInterface/README.md)
Handles chat UI interactions, message display, input processing, image handling, and chat interface state management.

### [Session Management System](./SessionManagement/README.md)
Manages the sessions sidebar, session list UI, context menus, rename/delete operations, and session selection interface.

## Specialized Systems

### [Command System](./Command/README.md)
Processes all slash commands (/search, /delete, /save, etc.), handles command routing, and manages command-specific functionality.

### [Initialization System](./Initialization/README.md)
Handles ECS bootstrap process, system initialization order, entity setup, and application startup sequence.

## System Lifecycle

1. **Initialization**: Systems are added to the world and initialized with required dependencies
2. **Update Loop**: Systems process entities with matching components during each frame
3. **Event Handling**: Systems respond to events and user interactions
4. **Cleanup**: Systems handle resource cleanup when entities are removed

## Adding New Systems

To add a new system:

1. Create a folder: `src/js/systems/NewSystem/`
2. Implement `System.js` extending the base `System` class
3. Create `index.js` to export the system
4. Add system export to `src/js/systems/index.js`
5. Create a `README.md` documenting the system
6. Initialize the system in `InitializationSystem`

## System Communication

Systems communicate through:
- **Components**: Shared data structures
- **Events**: System-to-system messaging  
- **World queries**: Finding entities with specific components
- **Direct system references**: For tightly coupled systems

## Performance Considerations

- Systems only process entities with required components
- Use component queries to filter relevant entities
- Batch operations when possible
- Avoid unnecessary entity iterations
- Cache expensive computations

## Testing

Each system should be testable independently by:
- Mocking required components and world state
- Testing system update logic in isolation
- Verifying component state changes
- Testing system event handling