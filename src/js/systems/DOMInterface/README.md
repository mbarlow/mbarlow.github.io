# DOM Interface System

The DOM Interface System manages DOM manipulation, theme switching, font management, sidebar controls, and navigation UI components. It serves as the bridge between the ECS world and browser DOM.

## Overview

This system handles all DOM-related UI interactions that don't directly involve chat or session management. It provides a centralized interface for theme management, font selection, navigation, and sidebar functionality.

## Components Required

- No specific components required (operates on DOM elements)

## Key Features

### Theme Management
- Light, Dark, and Grey theme switching
- Persistent theme preferences in localStorage
- Dynamic CSS custom property updates
- Theme state synchronization across UI elements

### Font System
- Monospace fonts: JetBrains Mono, Fira Code, Source Code Pro, Roboto Mono, Ubuntu Mono
- Sans-serif fonts: Inter, Source Sans Pro, Roboto, Open Sans, Lato, Poppins, Nunito
- Font dropdown interface with categorized options
- Persistent font preferences
- Real-time font application

### Navigation System
- View switching between Chat, Projects, and About
- Active view state management
- Navigation event handling
- View state persistence

### Sidebar Management
- Sidebar toggle functionality
- Responsive sidebar behavior
- Sidebar state persistence
- Mobile-friendly sidebar interactions

## System Dependencies

- No ECS system dependencies (pure DOM manipulation)
- Browser localStorage for persistence
- CSS custom properties for theming

## Initialization

The system initializes all UI components during startup:

```javascript
const domInterface = new DOMInterfaceSystem();
world.addSystem(domInterface, "domInterface");
domInterface.init();
```

## Theme System

### Available Themes
- **Light**: High contrast light theme
- **Dark**: Default dark theme with blue accents
- **Grey**: Neutral grey theme

### Theme Structure
```css
:root[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d; 
  --text-primary: #ffffff;
  --accent: #3b82f6;
  /* ... more variables */
}
```

## Font System

### Font Categories
- **Monospace**: For code display and technical content
- **Sans-serif**: For general UI and readability

### Font Application
Fonts are applied through CSS custom properties:
```css
:root {
  --font-family: 'JetBrains Mono', monospace;
}
```

## Navigation System

### View Management
- Chat View: Primary chat interface
- Projects View: Project listings and details  
- About View: Application information

### State Persistence
Navigation state is maintained through:
- CSS classes for active states
- Local storage for session persistence
- URL hash navigation (future enhancement)

## Implementation Details

### Initialization Flow
1. Initialize theme system with saved preferences
2. Set up font system with dropdown interface
3. Configure navigation event handlers
4. Initialize sidebar toggle functionality

### Event Handling
- Theme button clicks
- Font selection changes
- Navigation view switches
- Sidebar toggle interactions

### DOM Selectors
Key DOM elements managed:
- `body[data-theme]`: Theme container
- `.theme-btn`: Theme selection buttons
- `.nav-item`: Navigation items
- `.sidebar-toggle`: Sidebar control
- `#font-dropdown`: Font selection interface

## Error Handling

- Graceful fallbacks for missing DOM elements
- Default theme/font when preferences fail to load
- Console warnings for initialization issues
- Robust event listener attachment

## Usage

The DOM Interface System operates automatically once initialized. Other systems can interact with it through:

```javascript
const domInterface = world.getSystem("domInterface");
// System handles all DOM interactions internally
```

## Accessibility

- Keyboard navigation support
- High contrast theme options
- Screen reader compatible markup
- Focus management for dropdowns

## Performance Considerations

- Minimal DOM queries with element caching
- Efficient CSS custom property updates
- Debounced theme/font switching
- Lazy loading of font resources

## Future Enhancements

- Custom theme creation interface
- Font size adjustment controls
- Keyboard shortcut customization
- Advanced accessibility options
- Theme import/export functionality