import { Component } from '../core/Component.js';

/**
 * PlayerControllerComponent - Handles player input state and control mode
 */
export class PlayerControllerComponent extends Component {
  constructor(data = {}) {
    super();
    
    // Control state
    this.isEnabled = data.isEnabled !== undefined ? data.isEnabled : true;
    this.isFPSMode = data.isFPSMode !== undefined ? data.isFPSMode : false;
    this.hasPointerLock = false;
    
    // Key bindings
    this.keybinds = {
      forward: data.keybinds?.forward || ['KeyW', 'ArrowUp'],
      backward: data.keybinds?.backward || ['KeyS', 'ArrowDown'],
      left: data.keybinds?.left || ['KeyA', 'ArrowLeft'],
      right: data.keybinds?.right || ['KeyD', 'ArrowRight'],
      jump: data.keybinds?.jump || ['Space'],
      crouch: data.keybinds?.crouch || ['KeyC'],
      run: data.keybinds?.run || ['ShiftLeft', 'ShiftRight'],
      toggleChat: data.keybinds?.toggleChat || ['Backquote'] // ~ key
    };
    
    // Input state tracking
    this.pressedKeys = new Set();
    this.mouseMovement = { x: 0, y: 0 };
    this.lastMouseUpdate = 0;
    
    // Control settings
    this.mouseSensitivity = data.mouseSensitivity || 1.0;
    this.invertY = data.invertY || false;
  }
  
  isKeyPressed(action) {
    const keys = this.keybinds[action];
    return keys.some(key => this.pressedKeys.has(key));
  }
  
  setKeyPressed(keyCode, pressed) {
    if (pressed) {
      this.pressedKeys.add(keyCode);
    } else {
      this.pressedKeys.delete(keyCode);
    }
  }
  
  updateMouseMovement(deltaX, deltaY) {
    this.mouseMovement.x = deltaX * this.mouseSensitivity;
    this.mouseMovement.y = deltaY * this.mouseSensitivity * (this.invertY ? -1 : 1);
    this.lastMouseUpdate = performance.now();
  }
  
  getMovementInput() {
    const input = new THREE.Vector2(0, 0);
    
    // Forward/backward (Y axis)
    if (this.isKeyPressed('forward')) input.y += 1;
    if (this.isKeyPressed('backward')) input.y -= 1;
    
    // Left/right (X axis)  
    if (this.isKeyPressed('right')) input.x += 1;
    if (this.isKeyPressed('left')) input.x -= 1;
    
    // Normalize diagonal movement
    if (input.length() > 1) {
      input.normalize();
    }
    
    return input;
  }
  
  clearMouseMovement() {
    this.mouseMovement.x = 0;
    this.mouseMovement.y = 0;
  }
  
  enterFPSMode() {
    this.isFPSMode = true;
    console.log('🎮 Entering FPS mode');
  }
  
  exitFPSMode() {
    this.isFPSMode = false;
    this.hasPointerLock = false;
    console.log('🎮 Exiting FPS mode');
  }
}