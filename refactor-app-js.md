# App.js Refactoring Plan

## Current State Analysis
- **File size**: 2,287 lines (WAY too large!)
- **Issues**: 
  - UI logic mixed with core application logic
  - Single massive class handling everything
  - Hard to maintain, test, and extend
  - No clear separation of concerns
  - Difficult to find and modify specific functionality

## Proposed Architecture

### 1. Core Application Layer (`src/js/app/`)
**Main App Controller** - Slim orchestrator focused on initialization and coordination

```
src/js/app/
├── App.js                 # Main app controller (< 200 lines)
├── AppConfig.js           # Configuration management
├── AppState.js            # Global application state
└── AppLifecycle.js        # Initialization and cleanup logic
```

### 2. UI Management Layer (`src/js/ui/`)
**HTML UI Components** - All DOM manipulation and UI logic

```
src/js/ui/
├── UIManager.js           # Main UI coordinator
├── components/
│   ├── ChatInterface.js   # Chat UI logic
│   ├── SessionsList.js    # Sessions sidebar management
│   ├── ThemeManager.js    # Theme switching
│   ├── FontManager.js     # Font management
│   ├── Navigation.js      # View switching and navigation
│   ├── Sidebar.js         # Sidebar collapse/expand
│   └── modals/
│       ├── SessionModals.js    # Session rename/delete modals
│       ├── ModalManager.js     # Base modal functionality
│       └── ContextMenu.js      # Context menu component
├── utils/
│   ├── DOMHelpers.js      # DOM utility functions
│   ├── EventBus.js        # UI event coordination
└── html/
    ├── templates/         # HTML template strings
    │   ├── sessionItem.js
    │   ├── chatMessage.js
    │   └── modalTemplates.js
    └── builders/          # HTML builders
        ├── SessionItemBuilder.js
        └── MessageBuilder.js
```

### 3. Command System (`src/js/commands/`)
**Chat Commands** - Clean command pattern implementation

```
src/js/commands/
├── CommandManager.js      # Command dispatcher
├── commands/
│   ├── BaseCommand.js     # Abstract base class
│   ├── HistoryCommand.js  # /history command
│   ├── DeleteCommand.js   # /delete command
│   ├── ConnectCommand.js  # /connect command
│   ├── TitlesCommand.js   # /titles command
│   └── HelpCommand.js     # /help command
└── parsers/
    └── CommandParser.js   # Parse command strings
```

### 4. Session Management (`src/js/session/`)
**Session Logic** - Clean session handling separate from UI

```
src/js/session/
├── SessionManager.js      # High-level session operations
├── SessionActions.js      # CRUD operations (rename, delete, etc.)
├── SessionHistory.js      # History and search functionality
└── SessionUtils.js        # Session utility functions
```

### 5. Integration Layer (`src/js/integration/`)
**ECS Integration** - Bridge between UI and ECS systems

```
src/js/integration/
├── ECSBridge.js          # Main ECS integration
├── EntityManager.js      # Entity operations for UI
├── SystemIntegration.js  # System-specific integrations
└── MessageHandler.js     # Handle messages between UI and ECS
```

## Detailed Refactoring Steps

### Phase 1: Foundation Setup
1. **Create base structure**
   - Set up new directory structure
   - Create base classes and interfaces
   - Implement EventBus for UI communication

2. **Extract Configuration**
   - Move theme/font settings to AppConfig
   - Create AppState for reactive state management
   - Implement state change notifications

### Phase 2: UI Layer Extraction
3. **Theme & Font Management**
   - Extract `initThemeSystem()` → `ThemeManager.js`
   - Extract `initFontSystem()` → `FontManager.js`
   - Extract `setTheme()`, `setFont()` methods

4. **Navigation & Sidebar**
   - Extract `initNavigation()` → `Navigation.js`
   - Extract `initSidebar()` → `Sidebar.js`
   - Extract view switching logic

5. **Chat Interface**
   - Extract `initChatInterface()` → `ChatInterface.js`
   - Extract message rendering logic
   - Extract input handling and validation

### Phase 3: Session Management
6. **Sessions List UI**
   - Extract `initSessionsList()` → `SessionsList.js`
   - Extract `loadSessionsList()` → `SessionManager.js`
   - Create `SessionItemBuilder.js` for HTML generation

7. **Session Modals**
   - Extract all modal logic → `SessionModals.js`
   - Create `ModalManager.js` base class
   - Extract context menu → `ContextMenu.js`

8. **Session Actions**
   - Extract rename/delete logic → `SessionActions.js`
   - Create proper error handling and validation
   - Implement undo functionality

### Phase 4: Command System
9. **Command Pattern**
   - Extract all `/command` handlers → individual command classes
   - Implement `CommandManager.js` with registration system
   - Add command validation and help system

10. **Message System**
    - Extract message handling → `MessageHandler.js`
    - Create message builders for different types
    - Implement message formatting and sanitization

### Phase 5: Integration & Cleanup
11. **ECS Integration**
    - Create clean bridge between UI and ECS
    - Implement proper entity lifecycle management
    - Add proper error boundaries

12. **Final App.js**
    - Slim down to < 200 lines
    - Focus on initialization and coordination
    - Implement proper dependency injection

## Benefits of This Refactoring

### Maintainability
- **Single Responsibility**: Each class has one clear purpose
- **Easy to Find**: Logic is organized by feature/concern
- **Testable**: Small, focused classes are easier to unit test

### Extensibility
- **Plugin System**: Commands can be easily added/removed
- **UI Components**: New UI features follow established patterns
- **State Management**: Reactive state makes UI updates automatic

### Developer Experience
- **Clear Structure**: New developers can easily understand the codebase
- **Debugging**: Issues are easier to locate and fix
- **Hot Reloading**: Smaller files reload faster during development

## Migration Strategy

### Option A: Big Bang Refactor
- Refactor everything at once
- Higher risk but faster completion
- Requires thorough testing

### Option B: Incremental Migration
- Refactor one subsystem at a time
- Lower risk, gradual migration
- Keep both systems running during transition

### Option C: New Parallel System
- Build new architecture alongside old
- Migrate features one by one
- Safest but most time-consuming

## File Size Targets

| Component | Current (est.) | Target | Notes |
|-----------|----------------|---------|--------|
| App.js | 2,287 lines | < 200 lines | Main coordinator only |
| ChatInterface.js | - | < 300 lines | Chat UI logic |
| SessionsList.js | - | < 200 lines | Sessions sidebar |
| SessionModals.js | - | < 150 lines | Modal management |
| ThemeManager.js | - | < 100 lines | Theme switching |
| Commands/* | - | < 100 lines each | Individual commands |

## Decisions Made

1. **Architecture Preference**: ✅ UI component approach
2. **Migration Strategy**: ✅ Incremental migration
3. **State Management**: ✅ Keep it simple (no reactive system for now)
4. **Command System**: ✅ Simple function mapping
5. **Template System**: ✅ Sophisticated templating (Jinja2-like)
6. **Testing Strategy**: ✅ Debug messages with var/object dumps at crucial areas
7. **Dependency Injection**: ✅ Simple constructor injection

## Template System Design

Based on your preference for a Jinja2-like system, we'll implement:

```javascript
// Example template syntax
const messageTemplate = `
<div class="message {{ messageClass }}">
  {% if showAvatar %}
    <img src="{{ avatar }}" class="avatar">
  {% endif %}
  
  <div class="content">
    <div class="header">{{ sender }} - {{ timestamp }}</div>
    <div class="text">{{ content }}</div>
    
    {% for image in images %}
      <img src="{{ image.url }}" alt="{{ image.alt }}">
    {% endfor %}
  </div>
</div>
`;

// Usage
const html = Template.render(messageTemplate, {
  messageClass: 'user-message',
  showAvatar: true,
  avatar: '/path/to/avatar.png',
  sender: 'User',
  timestamp: '2:30 PM',
  content: 'Hello world',
  images: [{url: '/img1.png', alt: 'Image 1'}]
});
```

## Debug System Design

Strategic debug points with object dumps:

```javascript
class Debug {
  static log(component, action, data) {
    if (DEBUG_MODE) {
      console.group(`🔍 [${component}] ${action}`);
      console.log('Timestamp:', new Date().toISOString());
      console.log('Data:', data);
      console.trace('Stack trace');
      console.groupEnd();
    }
  }
  
  static dump(obj, label = 'Object Dump') {
    console.group(`📦 ${label}`);
    console.table(obj);
    console.groupEnd();
  }
}
```

## Next Steps

Once you approve the direction:

1. I'll create the base structure and key interfaces
2. Start with the safest migration (Theme/Font management)
3. Progressively move more complex systems
4. Update imports and ensure everything still works
5. Add proper error handling and validation
6. Document the new architecture

**Estimated Effort**: 2-3 days for complete refactoring depending on chosen approach.