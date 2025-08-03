# NEXT.md - Entity RGB Indicator System

## Overview
Implementing a pixel-art RGB indicator system for entities that displays emoji art, animations, and state feedback. The system will use a configurable LED array (starting with 16x16) that appears near entities, facing the camera, with smooth animations and state-driven visual feedback.

## Core Concept
Each entity can have an RGB indicator display that:
- Shows emoji faces, symbols, characters, and custom animations
- Responds to entity state changes (idle, thinking, responding, error)
- Appears/animates during chat interactions
- Uses pixel-art style rendering with smooth color transitions
- Stays camera-facing (billboard behavior)
- Minimal performance impact with efficient rendering

## Implementation Tasks

### 1. Core Indicator Component (Priority: High) ✅ COMPLETED
- [x] Create `IndicatorComponent.js` with RGB array data structure
- [x] Implement 16x16 pixel array with RGB values (0-255 per channel)
- [x] Add configuration options (size, brightness, update rate)
- [x] Include animation state management (current frame, transition data)
- [x] Support for smooth transitions and state changes

### 2. Three.js Rendering System (Priority: High) ✅ COMPLETED
- [x] Create `IndicatorRenderSystem.js` for Three.js integration
- [x] Implement efficient texture-based rendering using `DataTexture`
- [x] Add billboard behavior (always face camera)
- [x] Create hover/proximity positioning relative to entity
- [x] Optimize rendering with LOD system and distance culling

### 3. Animation Engine (Priority: High) ✅ COMPLETED
- [x] Implement frame-based animation system with `IndicatorAnimation`
- [x] Add easing functions (linear, easeIn, easeOut, bounce, elastic)
- [x] Create pulse, fade, breathing, spinning, and wave effects
- [x] Support for custom animation sequences with `IndicatorAnimationPresets`
- [x] Add animation queuing and management with `IndicatorAnimationManager`

### 4. Emoji & Character Mapping (Priority: Medium)
- [ ] Research and integrate pixel-perfect emoji webfont
- [ ] Create emoji-to-pixel converter utility
- [ ] Build character map for common symbols and letters
- [ ] Add font rasterization for custom text display
- [ ] Support for multi-color emoji rendering

### 5. State-Driven Behaviors (Priority: Medium) ✅ COMPLETED
- [x] Integrate with AgentSystem for chat state indicators
- [x] Add message received animations (notification pop-up)
- [x] Implement thinking/processing state (animated dots)
- [x] Add response completion feedback (success pulse)
- [x] Create error state indicators (red pulse)

### 6. Configuration & Presets (Priority: Low)
- [ ] Create indicator preset system (personalities, moods)
- [ ] Add entity-specific customization options
- [ ] Implement user preference controls
- [ ] Create indicator editor/preview tool
- [ ] Add import/export for custom indicators

## Technical Architecture

### IndicatorComponent Structure
```javascript
class IndicatorComponent extends Component {
  constructor(config = {}) {
    super();
    this.size = config.size || { width: 16, height: 16 };
    this.pixelData = new Uint8Array(this.size.width * this.size.height * 3); // RGB
    this.brightness = config.brightness || 1.0;
    this.position = config.position || { x: 0, y: 2, z: 0 }; // Relative to entity
    this.visible = config.visible !== false;
    this.currentAnimation = null;
    this.animationQueue = [];
    this.state = 'idle';
  }
}
```

### Animation System
```javascript
class IndicatorAnimation {
  constructor(frames, duration, options = {}) {
    this.frames = frames; // Array of pixel data arrays
    this.duration = duration;
    this.loop = options.loop || false;
    this.easing = options.easing || 'linear';
    this.onComplete = options.onComplete || null;
  }
}
```

### Rendering Strategy
- **DataTexture Approach**: Use Three.js DataTexture for efficient pixel updates
- **Billboard Shader**: Custom shader material for camera-facing behavior
- **Instance Management**: Shared geometry with per-entity texture updates
- **LOD System**: Reduce resolution/disable at distance for performance

## Emoji & Font Integration

### Research Priority
1. **Noto Emoji** - Google's comprehensive emoji set
2. **Twemoji** - Twitter's open-source emoji
3. **OpenMoji** - Open-source emoji with consistent design
4. **Pixel Art Fonts** - Specialized fonts for retro/pixel aesthetics

### Conversion Pipeline
```javascript
class EmojiPixelConverter {
  constructor(fontSize = 16) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = fontSize;
    this.canvas.height = fontSize;
    this.ctx = this.canvas.getContext('2d');
  }
  
  convertEmoji(emoji) {
    // Render emoji to canvas, extract pixel data
    // Convert to RGB array suitable for indicator
  }
}
```

## State Integration Points

### AgentSystem Integration
```javascript
// In AgentSystem.generateResponseWithContext()
const indicator = entity.getComponent('IndicatorComponent');
if (indicator) {
  indicator.setState('thinking');
  indicator.playAnimation('thinkingDots');
}

// After response received
indicator.setState('responding');
indicator.playAnimation('messageReceived');
```

### Session System Integration
```javascript
// In SessionSystem.sendMessage()
if (recipientEntity.hasComponent('IndicatorComponent')) {
  const indicator = recipientEntity.getComponent('IndicatorComponent');
  indicator.triggerNotification(messageType);
}
```

## Performance Considerations

### Optimization Strategies
- **Texture Pooling**: Reuse texture objects to minimize GPU memory allocation
- **Update Batching**: Group pixel updates and apply once per frame
- **Distance Culling**: Disable updates for off-screen or distant indicators
- **Animation Caching**: Pre-compute common animations to reduce CPU load
- **Selective Updates**: Only update changed pixels during animations

### Memory Management
- **16x16 RGB = 768 bytes** per indicator (very lightweight)
- **Texture sharing** for identical states across entities
- **Animation compression** using keyframes and interpolation
- **Garbage collection** friendly update patterns

## Visual Design Guidelines

### Pixel Art Aesthetics
- **Clean, bold colors** for visibility at small scale
- **High contrast** between foreground and background
- **Simple, recognizable shapes** that read well at 16x16
- **Smooth animations** with 2-4 frame cycles for basic states

### State Visual Language
- **Idle**: Gentle breathing/pulse effect
- **Thinking**: Animated dots or spinning indicator
- **Receiving**: Pop-up animation with message icon
- **Responding**: Typing indicator or speech bubble
- **Error**: Red pulse with warning symbol
- **Success**: Green checkmark with brief glow

## File Structure
```
src/js/components/
├── IndicatorComponent.js          # Core indicator data structure
└── index.js                       # Export updates

src/js/systems/
├── IndicatorRenderSystem.js       # Three.js rendering logic
└── index.js                       # Export updates

src/js/utils/
├── EmojiPixelConverter.js         # Emoji to pixel conversion
├── IndicatorAnimations.js         # Animation presets and utilities
├── IndicatorPresets.js            # Pre-defined indicator configurations
└── index.js                       # Export updates
```

## Implementation Phases

### Phase 1: Foundation (1-2 days)
- Basic IndicatorComponent with RGB array
- Simple Three.js rendering with DataTexture
- Billboard behavior and positioning
- Basic color setting and display

### Phase 2: Animation (1-2 days)
- Animation system with frame interpolation
- Basic transitions (fade, pulse, color shift)
- State-driven animation triggers
- Integration with AgentSystem states

### Phase 3: Content & Polish (2-3 days)
- Emoji conversion and character mapping
- Animation presets and personality expressions
- Performance optimization and LOD
- Configuration system and presets

## Success Criteria

### Functional Requirements
- [ ] 16x16 RGB indicators render correctly in 3D space
- [ ] Smooth animations with configurable timing
- [ ] Emoji and character display with pixel-perfect conversion
- [ ] Real-time state feedback during chat interactions
- [ ] Camera-facing behavior in all viewing angles

### Performance Requirements
- [ ] <1ms update time for single indicator animation frame
- [ ] Support for 50+ simultaneous indicators without lag
- [ ] Memory usage <1KB per indicator (excluding shared resources)
- [ ] No visible frame drops during complex animations

### Visual Requirements
- [ ] Clear, readable pixel art at standard viewing distances
- [ ] Consistent visual language across different states
- [ ] Smooth color transitions without jarring changes
- [ ] Appropriate brightness and contrast for all themes

## Future Enhancements

### Advanced Features
- **Dynamic sizing** (8x8, 32x32 options)
- **Multi-layer rendering** (background, main, effects, overlay)
- **Sound integration** (optional audio feedback for state changes)
- **User customization** (personal emoji sets, custom animations)
- **Network sync** (shared indicators in multiplayer scenarios)

### Integration Opportunities
- **Brain personality** expression through indicator style
- **Connection state** visualization (indicators sync during active chat)
- **System health** indicators for technical status
- **Achievement system** with celebratory animations
- **Ambient mode** with subtle environmental responses

This indicator system will add a delightful layer of visual personality and feedback to the ECS environment, making entities feel more alive and responsive! 🎨✨

## 🚀 PHASE 1 IMPLEMENTATION COMPLETE!

### ✅ Successfully Implemented Features

#### Core System
- **IndicatorComponent** - Full RGB 16x16 pixel array with state management
- **IndicatorRenderSystem** - Three.js DataTexture rendering with billboard behavior  
- **Animation Engine** - Complete frame-based system with easing and effects

#### Visual Features
- **Pixel-perfect rendering** with `THREE.NearestFilter` for crisp display
- **Billboard behavior** - indicators always face the camera
- **LOD optimization** - dynamic quality based on distance
- **Smooth transitions** between states and patterns

#### Animation Presets
- **Breathing/Pulsing** - gentle idle animation
- **Thinking Dots** - sequential dot animation for processing
- **Spinning** - rotating dots for active states  
- **Pulse** - rapid flash for notifications and errors
- **Wave** - flowing wave patterns
- **Notification Pop** - expanding/contracting circle

#### State Integration
- **AgentSystem Integration** - automatic state changes during LLM requests:
  - `thinking` state when processing requests
  - `success` state when responses complete
  - `error` state when requests fail
- **SessionSystem Integration** - notification animations when messages received
- **Automatic State Recovery** - timers to return to idle state

#### Entity Integration
- **Player Entity** - blue smiley face indicator 
- **Origin Marker** - AI-themed pattern with data points
- **Configurable positioning** - relative to entity transform
- **Performance optimized** - <1KB memory per indicator

### 🎯 Ready for Use

The indicator system is now fully functional and integrated! Entities will show:

1. **Idle** - gentle breathing patterns
2. **Thinking** - animated dots when processing LLM requests
3. **Notification** - pop-up animation when receiving messages
4. **Success** - green pulse when tasks complete
5. **Error** - red pulse when errors occur

### 🧪 Test the System

1. Start the development server: `npm run dev`
2. Open chat and send a message to the Origin Marker
3. Watch the indicators animate through the conversation states:
   - Origin marker shows **notification** when it receives your message
   - Origin marker shows **thinking** dots while generating response
   - Origin marker shows **success** pulse when response is ready
   - Player indicator can be customized for different states

The RGB indicator system adds immediate visual feedback that makes the ECS entities feel alive and responsive! 🎉