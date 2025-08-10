# Session Management System

The Session Management System manages the sessions sidebar, session list UI, context menus, rename/delete operations, and session selection interface.

## Overview

This system handles all user interface interactions related to chat session management, including displaying session lists, handling session operations, and managing session-related modals and context menus.

## Components Required

- No specific ECS components (operates on session data and DOM)

## Key Features

### Session List Management
- Display of all available sessions
- Session sorting by last activity
- Session metadata display (title, message count, timestamp)
- Real-time session list updates
- Empty state handling

### Session Operations
- Session selection and switching
- Session renaming with inline editing
- Session deletion with confirmation
- Bulk operations (future enhancement)

### Context Menu System
- Right-click context menus for sessions
- Context-sensitive action options
- Keyboard navigation support
- Modal dialog management

### Session Metadata
- Session title display with fallbacks
- Message count indicators
- Last activity timestamps
- Session state indicators (active/inactive)

## System Dependencies

- **PersistenceSystem**: For session data operations
- **World**: For system communication
- **IndustrialPortfolio**: For session switching

## Initialization

```javascript
const sessionManagement = new SessionManagementSystem();
world.addSystem(sessionManagement, "sessionManagement");
sessionManagement.init(world, industrialPortfolio);
```

## Session List Interface

### Session Display Format
```javascript
{
  title: "Session Title" || "Session {id.slice(0,8)}",
  messageCount: 42,
  lastActivityAt: "2024-01-15T10:30:00Z",
  createdAt: "2024-01-15T09:00:00Z"
}
```

### Sorting Logic
Sessions sorted by last activity (most recent first):
```javascript
sessions.sort((a, b) => {
  const aTime = new Date(a.lastActivityAt || a.createdAt || 0).getTime();
  const bTime = new Date(b.lastActivityAt || b.createdAt || 0).getTime();
  return bTime - aTime;
});
```

## Context Menu Operations

### Available Actions
- **Rename**: Edit session title in-place
- **Delete**: Remove session with confirmation dialog

### Context Menu Flow
1. Right-click on session item
2. Context menu appears at cursor position
3. User selects action
4. Appropriate modal or operation triggered
5. Context menu dismissed

## Modal System

### Rename Modal
- Text input pre-filled with current title
- Save/Cancel button options
- Enter key to confirm
- Escape key to cancel
- Input validation

### Delete Confirmation Modal
- Session information display
- Confirmation message
- Delete/Cancel button options
- Destructive action warning styling

## Event Handling

### Session List Events
```javascript
// Session click for switching
sessionDiv.addEventListener("click", (e) => {
  this.switchToSession(session.id);
});

// Right-click for context menu
sessionDiv.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  this.showContextMenu(e, session.id, session.title);
});
```

### Modal Events
- Overlay clicks for dismissal
- Keyboard navigation (Tab, Enter, Escape)
- Form submission handling
- Button click processing

## Implementation Details

### DOM Structure
```html
<div class="sessions-list">
  <div class="session-item" data-session-id="123">
    <div class="session-title">Session Title</div>
    <div class="session-meta">
      <span class="message-count">5 messages</span>
      <span class="last-activity">2 hours ago</span>
    </div>
  </div>
</div>
```

### Session Switching Logic
```javascript
switchToSession(sessionId) {
  // Delegate to main application controller
  this.industrialPortfolio.switchToSession(sessionId);
}
```

### Session Operations
- **Rename**: Updates session title in persistence layer
- **Delete**: Removes session and associated chat logs
- **Refresh**: Reloads session list from storage

## Error Handling

- Graceful handling of missing sessions
- Network error recovery
- Validation error messages
- Loading state management
- Fallback content for empty states

## State Management

### Loading States
- Initial session list loading
- Individual operation loading
- Refresh operation indicators

### Selection State
- Active session highlighting
- Visual selection indicators
- Selection state persistence

### Modal State
- Modal visibility management
- Form state tracking
- Input validation state

## Accessibility

- Keyboard navigation for session list
- Screen reader compatible labels
- Focus management for modals
- High contrast mode support
- ARIA attributes for dynamic content

## Performance Considerations

- Efficient session list rendering
- Virtual scrolling for large session counts
- Debounced search and filtering
- Optimized DOM updates
- Memory management for session data

## Integration Points

### Persistence System
- Session CRUD operations
- Data consistency management
- Transaction handling

### Chat Interface
- Session activation notifications
- Message count updates
- Active session coordination

## Future Enhancements

- Session search and filtering
- Session tagging and categorization
- Bulk session operations
- Session export/import
- Session sharing and collaboration
- Keyboard shortcuts for common operations
- Session templates and cloning