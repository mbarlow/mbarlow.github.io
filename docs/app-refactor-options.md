# App.js Refactoring Options (ECS-Aligned)

The `app.js` file is currently 2,287 lines and violates ECS principles by mixing UI logic, state management, and system initialization. Here are ECS-aligned strategies to refactor it:

## Current Problems with app.js
- **Violates ECS**: The IndustrialPortfolio class contains logic that should be in Systems
- **Mixed Concerns**: UI management, state, and ECS initialization all in one place
- **Not a Component or System**: It's a monolithic controller outside the ECS pattern

## Option 1: Convert UI to UISystem (Most ECS-aligned)
- **Stage 1**: Create `src/js/systems/UI/System.js`
  - Move all UI update logic into a proper System
  - UI state becomes UIComponent data
  - Chat interface, settings, themes become component data
- **Stage 2**: Create UI Components
  - `src/js/components/UIState.js` - stores UI state (theme, font, sidebar)
  - `src/js/components/ChatInterface.js` - chat UI data
  - `src/js/components/SessionList.js` - session list data
- **Benefits**: Follows ECS pattern, UI becomes queryable/observable
- **Size reduction**: ~800-1000 lines moved to systems

## Option 2: Create InitializationSystem
- **Stage 1**: Create `src/js/systems/Initialization/System.js`
  - Move all initECS() logic to this system
  - System manages bootstrap sequence
  - System ordering and dependencies handled properly
- **Stage 2**: Create `src/js/components/AppConfig.js`
  - Configuration as component data
  - Settings stored in ECS world
- **Benefits**: Initialization becomes part of ECS lifecycle
- **Size reduction**: ~200-300 lines

## Option 3: Split into Multiple Specialized Systems
- **Stage 1**: Create `src/js/systems/Theme/System.js`
  - Theme switching logic as a system
  - Theme state as component
- **Stage 2**: Create `src/js/systems/Font/System.js`
  - Font management as a system
  - Font preferences as component
- **Stage 3**: Create `src/js/systems/Chat/System.js`
  - Chat UI updates as a system
  - Separate from AgentSystem (which handles AI)
- **Benefits**: Each system has single responsibility
- **Size reduction**: ~1200+ lines total

## Option 4: Create BootstrapSystem + Multiple UI Systems
- **Stage 1**: `src/js/systems/Bootstrap/System.js`
  - Minimal app initialization
  - Creates initial entities with UI components
- **Stage 2**: Multiple UI Systems
  - `ChatUISystem` - renders chat interface
  - `SessionUISystem` - manages session list UI
  - `SettingsUISystem` - handles settings panel
- **Benefits**: Clean separation, each system focused
- **Size reduction**: ~1500+ lines

## Option 5: Command Pattern with CommandSystem
- **Stage 1**: Create `src/js/systems/Command/System.js`
  - All handleXCommand methods become command processors
  - Commands as components/events
- **Stage 2**: Create command components
  - `src/js/components/Command.js`
  - Commands become data that systems process
- **Benefits**: Decouples UI from logic, follows ECS event pattern
- **Size reduction**: ~400-500 lines

## Option 6: Minimal Refactor - Extract Non-ECS Code
- **Stage 1**: Keep app.js minimal
  - Only bootstrap code remains
  - Move everything else to systems
- **Stage 2**: Create `src/js/systems/DOMInterface/System.js`
  - Handles all DOM interactions
  - Bridge between ECS and browser
- **Benefits**: Pragmatic approach, maintains working code
- **Size reduction**: ~1800+ lines

## Recommended ECS-Aligned Approach

**Start with Option 6** (Minimal Refactor) then evolve to Option 1:
1. First extract all logic to a DOMInterfaceSystem
2. Then gradually split into specialized systems
3. Convert UI state to components over time

This approach:
- Maintains working code throughout
- Gradually moves toward pure ECS
- Allows testing at each stage
- Doesn't require massive rewrites

## Key ECS Principles to Follow
- **Systems** process logic (no state)
- **Components** hold data (no logic)
- **Entities** are just IDs with components
- UI updates should happen in systems, not standalone classes
- State should be in components, not class properties