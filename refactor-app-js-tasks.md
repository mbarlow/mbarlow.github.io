# App.js Refactoring Task Tracker

## Overview
Incremental refactoring of 2,287-line app.js into modular UI components.

**Preferences:**
- ✅ UI component approach
- ✅ Incremental migration
- ✅ Simple state management (no reactive system for now)
- ✅ Simple function mapping for commands
- ✅ Sophisticated templating system (Jinja2-like)
- ✅ Debug logging at crucial points
- ✅ Simple constructor injection

## Phase 1: Foundation (Week 1)

### Task 1.1: Create Base Structure ✅
- [x] Create `/src/js/ui/` directory structure
- [x] Create `/src/js/ui/components/` for UI components
- [x] Create `/src/js/ui/templates/` for template system
- [x] Create `/src/js/ui/utils/` for helpers
- [x] Add debug utility for object dumps

### Task 1.2: Implement Templating System ✅
- [x] Create `Template.js` - Jinja2-like templating engine
- [x] Support variable interpolation: `{{ variable }}`
- [x] Support conditionals: `{% if condition %} ... {% endif %}`
- [x] Support loops: `{% for item in items %} ... {% endfor %}`
- [x] Create template loader/cache system
- [x] Add debug mode for template rendering

### Task 1.3: Create UI Base Classes ✅
- [x] `UIComponent.js` - Base class for all UI components
- [x] `UIManager.js` - Main UI coordinator
- [x] `EventBus.js` - Simple event system
- [x] Add debug logging framework

## Phase 2: Easy Wins (Week 1-2)

### Task 2.1: Extract Theme Management ✅
- [x] Create `ThemeManager.js`
- [x] Move theme-related methods from app.js
- [x] Create theme template for theme switcher UI
- [x] Update app.js to use ThemeManager
- [x] Test theme switching still works
- [x] Add debug logging for theme changes

### Task 2.2: Extract Font Management ✅
- [x] Create `FontManager.js`
- [x] Move font-related methods from app.js
- [x] Create font dropdown template
- [x] Update app.js to use FontManager
- [x] Test font switching still works
- [x] Add debug logging for font changes

### Task 2.3: Extract Navigation ⏳
- [ ] Create `Navigation.js`
- [ ] Move view switching logic from app.js
- [ ] Create navigation templates
- [ ] Update app.js to use Navigation
- [ ] Test view switching still works

## Phase 3: Core UI Components (Week 2)

### Task 3.1: Extract Sidebar ⏳
- [ ] Create `Sidebar.js`
- [ ] Move sidebar collapse/expand logic
- [ ] Create sidebar templates
- [ ] Update app.js to use Sidebar
- [ ] Test sidebar functionality

### Task 3.2: Extract Chat Interface ⏳
- [ ] Create `ChatInterface.js`
- [ ] Move chat initialization logic
- [ ] Create message templates:
  - [ ] User message template
  - [ ] System message template
  - [ ] AI message template
  - [ ] Error message template
- [ ] Move message rendering logic
- [ ] Move input handling logic
- [ ] Add comprehensive debug logging
- [ ] Test chat functionality

### Task 3.3: Extract Sessions List ⏳
- [ ] Create `SessionsList.js`
- [ ] Move session list rendering logic
- [ ] Create session item template
- [ ] Move session click handlers
- [ ] Test session list functionality

## Phase 4: Modal System (Week 2-3)

### Task 4.1: Create Modal Base System ⏳
- [ ] Create `ModalManager.js`
- [ ] Implement show/hide logic
- [ ] Create base modal template
- [ ] Add modal event handling

### Task 4.2: Extract Session Modals ⏳
- [ ] Create `SessionModals.js`
- [ ] Move rename modal logic
- [ ] Move delete modal logic
- [ ] Create modal templates
- [ ] Test modal functionality

### Task 4.3: Extract Context Menu ⏳
- [ ] Create `ContextMenu.js`
- [ ] Move context menu logic
- [ ] Create context menu template
- [ ] Test context menu functionality

## Phase 5: Command System (Week 3)

### Task 5.1: Create Command System ⏳
- [ ] Create `CommandManager.js`
- [ ] Implement simple function mapping
- [ ] Move command parsing logic
- [ ] Add command registration system

### Task 5.2: Extract Individual Commands ⏳
- [ ] Move `/history` command logic
- [ ] Move `/delete` command logic
- [ ] Move `/connect` command logic
- [ ] Move `/titles` command logic
- [ ] Move `/help` command logic
- [ ] Test all commands still work

## Phase 6: Integration Layer (Week 3-4)

### Task 6.1: Create ECS Bridge ⏳
- [ ] Create `ECSBridge.js`
- [ ] Move ECS initialization logic
- [ ] Create clean interfaces for UI-ECS communication
- [ ] Add comprehensive debug logging

### Task 6.2: Create Message Handler ⏳
- [ ] Create `MessageHandler.js`
- [ ] Move message sending logic
- [ ] Move message receiving logic
- [ ] Create clean API for UI components

## Phase 7: Final Cleanup (Week 4)

### Task 7.1: Slim Down App.js ⏳
- [ ] Remove all extracted code
- [ ] Keep only initialization and coordination
- [ ] Ensure < 200 lines
- [ ] Add proper error handling
- [ ] Document the new structure

### Task 7.2: Update Documentation ⏳
- [ ] Update CLAUDE.md with new structure
- [ ] Create architecture diagram
- [ ] Document debug points
- [ ] Create developer guide

## Debug Points to Add

1. **State Changes**: Log all theme, font, view changes
2. **Event Flow**: Log all events through EventBus
3. **Template Rendering**: Log template data and output
4. **Command Execution**: Log command parsing and execution
5. **ECS Communication**: Log all UI-ECS interactions
6. **Error Boundaries**: Comprehensive error logging

## Success Metrics

- [ ] App.js reduced from 2,287 to < 200 lines
- [ ] All functionality still works
- [ ] Clear separation of concerns
- [ ] Easy to find and modify code
- [ ] Comprehensive debug logging
- [ ] No performance degradation

## Current Status

**Phase**: Not Started
**Next Task**: Create base UI structure
**Estimated Completion**: 4 weeks with incremental approach

---

## Notes

- Each task should be tested before moving to the next
- Keep old code working during migration
- Add debug logging as we go
- Regular commits after each successful task