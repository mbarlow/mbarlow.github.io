# Persistence System

The Persistence System handles data persistence to IndexedDB, session storage, chat log management, and data import/export functionality. It ensures all application data is reliably stored and retrievable.

## Overview

This system provides comprehensive data persistence capabilities using IndexedDB as the primary storage mechanism, with localStorage fallbacks. It manages sessions, chat logs, entity brain data, and provides robust data import/export functionality.

## Components Required

- **SessionStorage**: Custom component for IndexedDB operations

## Key Features

### IndexedDB Management
- Database schema management and migrations
- Object store creation and indexing
- Transaction management for data consistency
- Error handling and recovery mechanisms

### Data Persistence
- **Sessions**: Chat session metadata and state
- **Chat Logs**: Complete message histories
- **Brain Data**: Entity AI configurations and memories
- **User Preferences**: Settings and customizations

### Search and Query
- Full-text search across sessions
- Keyword-based session filtering
- Date range queries
- Participant-based searches

### Import/Export
- Complete data export to JSON format
- Selective data export options
- Data import with validation
- Backup and restore functionality

## System Dependencies

- **World**: For entity queries and system coordination
- **SessionSystem**: For active session management
- Browser IndexedDB API and localStorage fallback

## Initialization

```javascript
const persistenceSystem = new PersistenceSystem(world);
world.addSystem(persistenceSystem, "persistence");
await persistenceSystem.init();
```

## Database Schema

### Sessions Store
```javascript
{
  keyPath: 'id',
  indexes: {
    'timestamp': { unique: false },
    'participants': { unique: false, multiEntry: true }
  }
}
```

### Chat Logs Store
```javascript
{
  keyPath: 'id', 
  indexes: {
    'sessionId': { unique: false }
  }
}
```

### Brains Store
```javascript
{
  keyPath: 'entityId',
  indexes: {
    'model': { unique: false }
  }
}
```

## Session Management

### Session Data Structure
```javascript
{
  id: "unique-session-id",
  connectionId: "connection-identifier", 
  participants: ["player-id", "ai-id"],
  state: "active" | "inactive" | "archived",
  title: "Generated Session Title",
  keywords: ["keyword1", "keyword2"],
  createdAt: timestamp,
  lastActivityAt: timestamp,
  messageCount: 42,
  chatLogId: "associated-chatlog-id"
}
```

### Session Operations
- Create new sessions with metadata
- Update session state and activity timestamps
- Archive old sessions automatically
- Delete sessions with cascade to chat logs

## Chat Log Management

### Message Structure
```javascript
{
  id: "message-uuid",
  senderId: "entity-id",
  content: "message content",
  timestamp: timestamp,
  type: "user" | "assistant" | "system",
  metadata: {
    images: ["base64-data"],
    commands: ["executed-commands"],
    context: {...}
  }
}
```

### Chat Log Operations
- Append messages to existing logs
- Batch message insertions for performance
- Message search and retrieval
- Automatic cleanup of old messages

## Search Functionality

### Session Search
```javascript
async searchSessions(query) {
  // Search by title
  const titleResults = await this.storage.searchByTitle(query);
  
  // Search by keywords  
  const keywords = query.split(' ').filter(k => k.length > 2);
  const keywordResults = await this.storage.searchSessions(keywords);
  
  return deduplicatedResults;
}
```

### Search Capabilities
- Case-insensitive title search
- Keyword matching with partial matches
- Session ID prefix matching
- Date range filtering
- Participant filtering

## Data Export/Import

### Export Format
```javascript
{
  version: 1,
  exportedAt: timestamp,
  sessions: [...sessionData],
  chatLogs: [...chatLogData], 
  brains: [...brainData]
}
```

### Export Operations
- Full database export
- Selective session export
- Date range exports
- Participant-specific exports

### Import Validation
- Schema version compatibility checking
- Data integrity validation
- Duplicate detection and handling
- Incremental import support

## Performance Optimization

### Indexing Strategy
- Composite indexes for common queries
- Covering indexes to avoid lookups
- Partial indexes for filtered queries
- Index maintenance and optimization

### Caching
- In-memory caching of frequently accessed data
- Lazy loading of large chat histories
- Prefetching of likely-needed data
- Cache invalidation on data changes

### Batch Operations
```javascript
async saveBatch(operations) {
  const transaction = this.db.transaction(stores, 'readwrite');
  
  for (const operation of operations) {
    await this.executeOperation(transaction, operation);
  }
  
  await transaction.complete;
}
```

## Error Handling

### Database Errors
- Connection failure recovery
- Transaction rollback on errors
- Quota exceeded handling
- Corruption detection and recovery

### Fallback Mechanisms
- localStorage fallback for critical data
- Graceful degradation when IndexedDB unavailable
- Data recovery from partial failures
- User notification of data issues

## Data Consistency

### Transaction Management
- ACID compliance for critical operations
- Rollback mechanisms for failed operations
- Consistency checks on startup
- Data validation before persistence

### Conflict Resolution
- Last-write-wins for simple conflicts
- Merge strategies for complex data
- User-guided conflict resolution
- Automatic conflict detection

## Security and Privacy

### Data Encryption
- Optional client-side encryption
- Key derivation from user passwords
- Secure key storage mechanisms
- Encryption key rotation

### Privacy Protection
- Local-only data storage
- No external data transmission
- User data anonymization options
- GDPR compliance features

## Monitoring and Analytics

### Performance Metrics
- Query performance monitoring
- Database size tracking
- Index usage statistics
- Error rate monitoring

### Usage Analytics
- Session creation patterns
- Message volume statistics
- Feature usage tracking
- Performance bottleneck identification

## Future Enhancements

- Real-time data synchronization
- Multi-device data sync
- Cloud backup integration
- Advanced analytics and insights
- Data visualization tools
- Automated data archival
- Performance optimization ML