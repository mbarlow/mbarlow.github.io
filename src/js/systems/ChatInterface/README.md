# Chat Interface System

The Chat Interface System handles chat UI interactions, message display, input processing, image handling, and chat interface state management. It manages the primary user interaction interface for the application.

## Overview

This system manages all aspects of the chat user interface, including message rendering, input handling, image uploads, and real-time chat interactions. It serves as the primary interface between users and the AI system.

## Components Required

- No specific ECS components (operates on DOM and system integration)

## Key Features

### Message Management
- Message rendering with markdown support
- Message type handling (user, assistant, system)
- Real-time message updates
- Message history display
- Auto-scrolling to latest messages

### Input Processing
- Multi-line textarea with auto-resize
- Send button state management
- Keyboard shortcuts (Enter to send, Shift+Enter for new line)
- Input validation and sanitization
- Slash command detection and routing

### Image Handling
- Drag and drop image upload
- Clipboard image paste support
- Multiple image selection
- Image preview before sending
- Base64 encoding for AI processing

### Chat State Management
- Active session indication
- Typing indicators (future)
- Connection status display
- Chat target switching

## System Dependencies

- **World**: For system communication
- **IndustrialPortfolio**: For message routing and session management
- **AgentSystem**: For AI message processing
- **SessionSystem**: For session state management

## Initialization

```javascript
const chatInterface = new ChatInterfaceSystem();
world.addSystem(chatInterface, "chatInterface");  
chatInterface.init(world, industrialPortfolio);
```

## Message Processing

### Message Types
- **User messages**: User input and commands
- **Assistant messages**: AI responses and system feedback  
- **System messages**: Status updates and notifications

### Message Flow
1. User input captured from textarea
2. Input validation and preprocessing
3. Slash command detection and routing
4. Message added to chat history
5. AI processing (if applicable)
6. Response rendering and display

## Image Processing

### Supported Formats
- PNG, JPEG, GIF, WebP
- Base64 encoding for AI vision models
- Automatic resize for optimal processing

### Upload Methods
- **File picker**: Click to select images
- **Drag & drop**: Drop images onto chat area
- **Clipboard paste**: Paste images directly

### Processing Pipeline
1. Image validation and format checking
2. Automatic resizing if needed
3. Base64 encoding
4. Preview generation
5. Integration with message content

## Input Management

### Textarea Features
- Auto-resize based on content
- Maximum height limits
- Placeholder text management
- Focus state handling

### Send Button Logic
```javascript
updateSendButton(input, button) {
  const hasContent = input.value.trim().length > 0;
  button.disabled = !hasContent;
}
```

### Keyboard Shortcuts
- `Enter`: Send message (when not in composition)
- `Shift + Enter`: Insert new line
- `Ctrl + A`: Select all text
- `Escape`: Cancel image uploads

## Event Handling

### DOM Events
- `input`: Textarea auto-resize and send button updates
- `keydown`: Keyboard shortcut processing  
- `paste`: Image paste handling
- `dragover`/`drop`: Drag and drop support
- `click`: Send button and image upload triggers

### System Events
- Message routing to appropriate handlers
- Session state changes
- Connection status updates

## Implementation Details

### DOM Selectors
- `#chat-messages`: Message container
- `#chat-input`: Main input textarea  
- `#chat-send`: Send button
- `#image-upload`: File input
- `#image-preview`: Image preview area

### Message Rendering
```javascript
addMessage(type, content) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}-message`;
  messageDiv.innerHTML = this.formatMessageContent(content);
  this.chatContainer.appendChild(messageDiv);
  this.scrollToBottom();
}
```

### Auto-resize Logic
Dynamic textarea height adjustment based on content:
```javascript
autoResizeTextarea(textarea) {
  textarea.style.height = 'auto';
  const newHeight = Math.min(textarea.scrollHeight, maxHeight);
  textarea.style.height = newHeight + 'px';
}
```

## Error Handling

- Image upload error messages
- Network connectivity indicators
- Input validation feedback
- Graceful fallbacks for missing DOM elements

## Accessibility

- Screen reader compatible message structure
- Keyboard navigation support
- Focus management for modal dialogs
- Alternative text for images
- High contrast mode support

## Performance Considerations

- Virtual scrolling for large message histories
- Debounced input processing
- Efficient DOM updates
- Image compression and optimization
- Memory management for uploaded images

## Security

- Input sanitization for XSS prevention
- Image validation and size limits
- Content Security Policy compliance
- Safe HTML rendering for messages

## Future Enhancements

- Rich text formatting toolbar
- Voice message recording
- File attachment support
- Message reactions and threading
- Real-time collaborative editing
- Message search and filtering