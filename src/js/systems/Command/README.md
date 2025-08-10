# Command System

The Command System handles all slash command processing and execution in the application. It processes commands like `/who`, `/model`, `/search`, and manages complex multi-step operations.

## Overview

This system manages all `/command` functionality, providing a centralized command processor that delegates different types of commands based on complexity:

- **Simple commands**: `/who`, `/model`, `/history`, `/save`
- **Medium commands**: `/search`, `/export`, `/context`  
- **Complex commands**: `/delete`, `/titles`, `/connect`

## Components Required

- No specific components required (operates on world/system level)

## Key Features

### Simple Commands
- **`/who`**: Shows current chat target information and personality
- **`/model`**: Lists available AI models and shows current selection
- **`/history`**: Displays recent session history 
- **`/save`**: Forces save of current session to IndexedDB

### Medium Commands  
- **`/search <query>`**: Searches sessions by keywords, titles, and IDs
- **`/export`**: Exports all session data to JSON file download
- **`/context`**: Shows comprehensive conversation context and connection status

### Complex Commands
- **`/delete`**: Multi-option session deletion with subcommands:
  - `/delete current` - Delete active session
  - `/delete <id>` - Delete session by ID
  - `/delete range <start> <end>` - Delete session range
  - `/delete all` - Delete all sessions (destructive)
  - `/delete old <days>` - Delete sessions older than X days

- **`/titles`** or **`/generate-titles`**: AI-powered title generation for untitled sessions
- **`/connect`**: Entity connection management:
  - `/connect list` - Show available entities
  - `/connect origin` - Connect to origin marker
  - `/connect <entity>` - Connect to specific entity

## System Dependencies

- **PersistenceSystem**: For session data operations
- **AgentSystem**: For AI-powered features (titles, model info)
- **SessionSystem**: For session management
- **World**: For entity queries and system access

## Usage

The Command System is automatically initialized and processes commands through:

```javascript
const commandSystem = world.getSystem("command");
await commandSystem.handleSlashCommand("/who");
```

Commands are typically triggered through the chat interface when users type messages starting with `/`.

## Command Routing

The system uses a centralized routing approach in `app.js`:

```javascript
if (cmd === "/who") {
  const commandSystem = this.world.getSystem("command");
  if (commandSystem) {
    await commandSystem.handleWhoCommand();
  }
}
```

## Error Handling

- Graceful degradation when required systems are unavailable
- User-friendly error messages for invalid commands
- Comprehensive logging for debugging
- Safe handling of destructive operations with confirmations

## Implementation Details

### Command Processing Flow
1. Parse command and arguments
2. Validate command syntax and permissions
3. Check system dependencies 
4. Execute command logic
5. Return formatted response to user

### Helper Methods
- `deleteCurrentSession()`: Handles active session deletion
- `deleteAllSessions()`: Bulk session removal
- `deleteSessionRange()`: Range-based deletion
- `deleteSessionById()`: Single session deletion
- `deleteOldSessions()`: Time-based cleanup

## Future Enhancements

- Command aliases and shortcuts
- Command history and completion
- Permission-based command access
- Custom command plugins
- Batch command processing