# Template System

A powerful Jinja2-like templating engine for JavaScript with support for variables, conditionals, loops, and filters.

## Quick Start

```javascript
import { templateRegistry } from './TemplateRegistry.js';

// Initialize templates
await templateRegistry.init();

// Render a template
const html = templateRegistry.render('chatMessage', {
    type: 'user',
    sender: 'John Doe',
    content: 'Hello, world!',
    timestamp: Date.now()
});
```

## Template Syntax

### Variables
```html
<div>Hello, {{ user.name }}!</div>
<span>{{ user.email|lower }}</span>
```

### Conditionals
```html
{% if user.isOnline %}
    <span class="online">Online</span>
{% else %}
    <span class="offline">Offline</span>
{% endif %}
```

### Loops
```html
<ul>
{% for item in items %}
    <li class="{{ loop.first ? 'first' : '' }}">
        {{ loop.index1 }}. {{ item.name }}
    </li>
{% endfor %}
</ul>
```

### Comments
```html
{# This is a comment and won't appear in output #}
<div>{{ content }}</div>
```

## Built-in Filters

### String Filters
- `upper` - Convert to uppercase
- `lower` - Convert to lowercase  
- `title` - Title case
- `trim` - Remove whitespace
- `truncate` - Truncate with ellipsis

### Number Filters
- `abs` - Absolute value
- `round` - Round to decimals
- `floor` - Round down
- `ceil` - Round up

### Array Filters
- `length` - Get array length
- `first` - Get first item
- `last` - Get last item
- `join` - Join with separator
- `reverse` - Reverse array
- `sort` - Sort array

### Date Filters
- `date` - Format date string

### Utility Filters
- `default` - Provide default value
- `json` - Convert to JSON
- `keys` - Get object keys
- `values` - Get object values

## Available Templates

### Common Templates (`common.*`)
- `button` - Configurable button component
- `input` - Form input with label and validation
- `modal` - Modal dialog
- `listItem` - List item with actions
- `message` - Status/notification message
- `loading` - Loading spinner
- `card` - Content card
- `contextMenu` - Right-click context menu
- `dropdown` - Dropdown selector

### App Templates (`app.*`)
- `chatMessage` - Chat message bubble
- `sessionItem` - Session list item
- `sessionContextMenu` - Session options menu
- `sessionRenameModal` - Rename session dialog
- `sessionDeleteModal` - Delete confirmation dialog
- `themeSelector` - Theme switcher
- `fontDropdown` - Font selector
- `navigation` - Navigation menu
- `statusIndicator` - Connection status
- `commandHelp` - Command documentation
- `errorMessage` - Error display

## Examples

### Chat Message
```javascript
const messageHtml = templateRegistry.render('chatMessage', {
    type: 'user',
    id: 'msg-123',
    sender: 'Alice',
    content: 'Check out this screenshot!',
    timestamp: Date.now(),
    showAvatar: true,
    showHeader: true,
    images: [
        { url: '/screenshot.png', alt: 'Screenshot' }
    ]
});
```

### Session List Item
```javascript
const sessionHtml = templateRegistry.render('sessionItem', {
    id: 'session-456',
    title: 'Project Discussion',
    lastActivity: Date.now() - 300000, // 5 minutes ago
    active: true,
    participants: [
        { name: 'Developer', type: 'user' },
        { name: 'AI Assistant', type: 'ai' }
    ],
    messageCount: 42,
    imageCount: 3
});
```

### Modal Dialog
```javascript
const modalHtml = templateRegistry.render('common.modal', {
    show: true,
    title: 'Confirm Action',
    content: 'Are you sure you want to proceed?',
    actions: [
        { text: 'Cancel', action: 'cancel', class: 'btn-secondary' },
        { text: 'Confirm', action: 'confirm', class: 'btn-primary' }
    ]
});
```

### Button with Icon
```javascript
const buttonHtml = templateRegistry.render('common.button', {
    text: 'Save Changes',
    class: 'btn-primary',
    type: 'submit',
    icon: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>',
    disabled: false
});
```

## Advanced Usage

### Custom Filters
```javascript
import { template } from './Template.js';

// Register custom filter
template.registerFilter('currency', (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
});

// Use in template
// {{ price|currency }} -> $123.45
```

### Template Aliases
```javascript
// Create shortcuts for commonly used templates
templateRegistry.alias('msg', 'app.chatMessage');
templateRegistry.alias('btn', 'common.button');

// Use with shorter names
const html = templateRegistry.render('msg', context);
```

### Global Variables
```javascript
import { template } from './Template.js';

// Set global variables available in all templates
template.setGlobal('currentUser', { name: 'John', role: 'admin' });
template.setGlobal('appVersion', '1.0.0');

// Use in templates: {{ currentUser.name }}
```

### Performance Optimization
```javascript
// Precompile templates for better performance
templateRegistry.precompile();

// Clear cache when needed
templateRegistry.clear();
```

## Template Organization

Templates are organized into categories:

- **common** - Reusable UI components
- **app** - Application-specific templates  
- **custom** - User-defined templates

Access with dot notation: `category.templateName`

## Error Handling

Templates include comprehensive error handling:

```javascript
try {
    const html = templateRegistry.render('invalid-template', context);
} catch (error) {
    console.error('Template error:', error.message);
    // Error includes template context and original error
}
```

## Testing

Run the template test suite:

```javascript
import { testTemplateSystem } from './test.js';

// Run comprehensive tests
const results = await testTemplateSystem();
console.log('Test results:', results);
```

## Files

- `Template.js` - Core template engine
- `TemplateLoader.js` - Template loading and caching
- `TemplateRegistry.js` - Template management and organization
- `test.js` - Test suite and examples
- `../html/templates/common.js` - Common UI templates
- `../html/templates/app.js` - App-specific templates

## Debug Mode

Enable debug logging to see template compilation and rendering:

```javascript
import { Debug } from '../utils/Debug.js';

Debug.setDebugMode(true);
// Now all template operations will be logged
```