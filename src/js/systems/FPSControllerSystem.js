import { System } from '../core/System.js';
import { PlayerControllerComponent, CameraComponent } from '../components/index.js';

/**
 * FPSControllerSystem - Handles FPS controls, mouse look, and UI management
 */
export class FPSControllerSystem extends System {
  constructor() {
    super();
    this.requiredComponents = [PlayerControllerComponent];
    
    // UI state
    this.chatVisible = false;
    this.uiHidden = false;
    
    // Mouse look state
    this.isPointerLocked = false;
    
    // Event listeners
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);
    this.boundPointerLockChange = this.handlePointerLockChange.bind(this);
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Mouse events
    document.addEventListener('mousemove', this.boundMouseMove);
    
    // Keyboard events
    document.addEventListener('keydown', this.boundKeyDown);
    document.addEventListener('keyup', this.boundKeyUp);
    
    // Pointer lock events
    document.addEventListener('pointerlockchange', this.boundPointerLockChange);
    document.addEventListener('pointerlockerror', () => {
      console.error('❌ Pointer lock error');
    });
  }
  
  
  handleMouseMove(event) {
    if (!this.isPointerLocked) return;
    
    const deltaX = event.movementX || 0;
    const deltaY = event.movementY || 0;
    
    // Update all player controllers
    for (const entity of this.entities) {
      const controller = entity.getComponent(PlayerControllerComponent);
      if (controller && controller.isFPSMode) {
        controller.updateMouseMovement(deltaX, deltaY);
        this.updateCameraLook(entity, controller);
      }
    }
  }
  
  handleKeyDown(event) {
    // Handle toggle chat key first
    if (event.code === 'Backquote') { // ~ key
      event.preventDefault();
      this.toggleChat();
      return;
    }
    
    // Handle escape key to exit FPS mode
    if (event.code === 'Escape') {
      event.preventDefault();
      if (this.isPointerLocked) {
        this.exitFPSMode();
      }
      return;
    }
    
    // Don't process other keys if chat is visible
    if (this.chatVisible) return;
    
    // Update all player controllers
    for (const entity of this.entities) {
      const controller = entity.getComponent(PlayerControllerComponent);
      if (controller && controller.isFPSMode) {
        controller.setKeyPressed(event.code, true);
      }
    }
  }
  
  handleKeyUp(event) {
    // Don't process if chat is visible (except toggle key)
    if (this.chatVisible && event.code !== 'Backquote') return;
    
    // Update all player controllers
    for (const entity of this.entities) {
      const controller = entity.getComponent(PlayerControllerComponent);
      if (controller && controller.isFPSMode) {
        controller.setKeyPressed(event.code, false);
      }
    }
  }
  
  handlePointerLockChange() {
    this.isPointerLocked = document.pointerLockElement !== null;
    
    // Update all controllers
    for (const entity of this.entities) {
      const controller = entity.getComponent(PlayerControllerComponent);
      if (controller) {
        controller.hasPointerLock = this.isPointerLocked;
      }
    }
    
    if (!this.isPointerLocked) {
      this.exitFPSMode();
    }
  }
  
  updateCameraLook(entity, controller) {
    const camera = entity.getComponent(CameraComponent);
    if (!camera) return;
    
    // Apply mouse movement to camera rotation
    camera.yaw -= controller.mouseMovement.x;
    camera.pitch -= controller.mouseMovement.y;
    
    // Clamp pitch to prevent over-rotation
    camera.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.pitch));
    
    // Apply rotation to camera
    if (camera.camera) {
      camera.camera.rotation.order = 'YXZ';
      camera.camera.rotation.y = camera.yaw;
      camera.camera.rotation.x = camera.pitch;
    }
    
    // Clear mouse movement
    controller.clearMouseMovement();
  }
  
  enterFPSMode() {
    // Request pointer lock
    document.body.requestPointerLock();
    
    // Hide UI
    this.hideUI();
    
    // Update all controllers
    for (const entity of this.entities) {
      const controller = entity.getComponent(PlayerControllerComponent);
      if (controller) {
        controller.enterFPSMode();
      }
    }
  }
  
  exitFPSMode() {
    
    // Exit pointer lock
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    
    // Show UI
    this.showUI();
    
    // Update all controllers
    for (const entity of this.entities) {
      const controller = entity.getComponent(PlayerControllerComponent);
      if (controller) {
        controller.exitFPSMode();
      }
    }
  }
  
  toggleChat() {
    this.chatVisible = !this.chatVisible;
    
    const chatContainer = document.getElementById('chat-input-container');
    const chatMessages = document.getElementById('chat-messages');
    const sidebar = document.getElementById('sidebar');
    const ollamaStatus = document.querySelector('.ollama-status-compact');
    const fpsIndicator = document.getElementById('fps-indicator');
    
    if (this.chatVisible) {
      // Show chat and UI
      if (chatContainer) chatContainer.style.display = 'block';
      if (chatMessages) chatMessages.style.display = 'flex';
      if (sidebar) sidebar.style.display = 'flex';
      if (ollamaStatus) ollamaStatus.style.display = 'flex';
      if (fpsIndicator) fpsIndicator.style.display = 'block';
      
      // Focus chat input
      const chatInput = document.getElementById('chat-input');
      if (chatInput) {
        setTimeout(() => chatInput.focus(), 100);
      }
      
    } else {
      // Hide chat and UI
      if (chatContainer) chatContainer.style.display = 'none';
      if (chatMessages) chatMessages.style.display = 'none';
      if (sidebar) sidebar.style.display = 'none';
      if (ollamaStatus) ollamaStatus.style.display = 'none';
      if (fpsIndicator) fpsIndicator.style.display = 'none';
      
      // Blur chat input
      const chatInput = document.getElementById('chat-input');
      if (chatInput) {
        chatInput.blur();
      }
      
    }
  }
  
  hideUI() {
    this.uiHidden = true;
    this.chatVisible = false;
    
    const chatContainer = document.getElementById('chat-input-container');
    const chatMessages = document.getElementById('chat-messages');
    const sidebar = document.getElementById('sidebar');
    const ollamaStatus = document.querySelector('.ollama-status-compact');
    const fpsIndicator = document.getElementById('fps-indicator');
    
    if (chatContainer) chatContainer.style.display = 'none';
    if (chatMessages) chatMessages.style.display = 'none';
    if (sidebar) sidebar.style.display = 'none';
    if (ollamaStatus) ollamaStatus.style.display = 'none';
    if (fpsIndicator) fpsIndicator.style.display = 'none';
    
    document.body.classList.add('fps-mode');
  }
  
  showUI() {
    this.uiHidden = false;
    
    const chatContainer = document.getElementById('chat-input-container');
    const chatMessages = document.getElementById('chat-messages');
    const sidebar = document.getElementById('sidebar');
    const ollamaStatus = document.querySelector('.ollama-status-compact');
    const fpsIndicator = document.getElementById('fps-indicator');
    
    if (chatContainer) chatContainer.style.display = 'block';
    if (chatMessages) chatMessages.style.display = 'flex';
    if (sidebar) sidebar.style.display = 'flex';
    if (ollamaStatus) ollamaStatus.style.display = 'flex';
    if (fpsIndicator) fpsIndicator.style.display = 'block';
    
    document.body.classList.remove('fps-mode');
  }
  
  
  update(deltaTime) {
    // System update logic if needed
  }
  
  destroy() {
    // Clean up event listeners
    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('keydown', this.boundKeyDown);
    document.removeEventListener('keyup', this.boundKeyUp);
    document.removeEventListener('pointerlockchange', this.boundPointerLockChange);
  }
}