import { System } from '../core/System.js';
import { PlayerControllerComponent, CameraComponent, MeshComponent } from '../components/index.js';

/**
 * FPSControllerSystem - Handles FPS controls, mouse look, and UI management
 */
export class FPSControllerSystem extends System {
  constructor() {
    super();
    this.requiredComponents = [PlayerControllerComponent];
    console.log('🎮 FPSControllerSystem created, required components:', this.requiredComponents);
    
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
    document.addEventListener('pointerlockerror', (e) => {
      console.error('❌ Pointer lock error:', e);
      console.error('Make sure to click on the page first before using /start');
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
    
    // Update all player controllers (allow movement in both FPS and 3rd person modes)
    for (const entity of this.entities) {
      const controller = entity.getComponent(PlayerControllerComponent);
      if (controller) {
        controller.setKeyPressed(event.code, true);
      }
    }
  }
  
  handleKeyUp(event) {
    // Don't process if chat is visible (except toggle key)
    if (this.chatVisible && event.code !== 'Backquote') return;
    
    // Update all player controllers (allow movement in both FPS and 3rd person modes)
    for (const entity of this.entities) {
      const controller = entity.getComponent(PlayerControllerComponent);
      if (controller) {
        controller.setKeyPressed(event.code, false);
      }
    }
  }
  
  handlePointerLockChange() {
    this.isPointerLocked = document.pointerLockElement !== null;
    console.log('🔒 Pointer lock changed:', this.isPointerLocked, 'Element:', document.pointerLockElement);
    
    // Update all controllers
    for (const entity of this.entities) {
      const controller = entity.getComponent(PlayerControllerComponent);
      if (controller) {
        controller.hasPointerLock = this.isPointerLocked;
      }
    }
    
    if (!this.isPointerLocked && this.uiHidden) {
      console.log('🔓 Pointer lock lost, exiting FPS mode');
      this.exitFPSMode();
    }
  }
  
  updateCameraLook(entity, controller) {
    const camera = entity.getComponent(CameraComponent);
    if (!camera) return;
    
    // Apply mouse movement to camera rotation with proper sensitivity scaling
    const sensitivity = 0.002; // Reduced sensitivity for smoother control
    camera.yaw -= controller.mouseMovement.x * sensitivity;
    camera.pitch -= controller.mouseMovement.y * sensitivity;
    
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
    console.log('🎮 Entering FPS mode...');
    console.log('🎮 Entities count:', this.entities.size);
    
    // Get the Three.js canvas
    const canvas = document.querySelector('canvas');
    if (canvas) {
      // Bring canvas to front for FPS mode
      canvas.style.zIndex = '1000';
      canvas.style.pointerEvents = 'auto';
      canvas.style.cursor = 'pointer';
      
      // Hide UI first
      this.hideUI();
      
      // Show instructions
      this.showFPSInstructions();
      
      // Add click listener to request pointer lock
      const clickHandler = () => {
        canvas.requestPointerLock();
        canvas.removeEventListener('click', clickHandler);
        this.hideFPSInstructions();
      };
      canvas.addEventListener('click', clickHandler);
      
    } else {
      console.error('❌ Canvas not found! Cannot enter FPS mode.');
      return;
    }
    
    // Update all controllers
    let controllersFound = 0;
    for (const entity of this.entities) {
      const controller = entity.getComponent(PlayerControllerComponent);
      if (controller) {
        console.log('🎮 Found player controller, enabling FPS mode');
        controller.enterFPSMode();
        controllersFound++;
        
        // Hide player mesh in FPS mode (so we don't see it from inside)
        const mesh = entity.getComponent(MeshComponent);
        if (mesh && mesh.mesh) {
          mesh.mesh.visible = false;
        }
      }
    }
    
    if (controllersFound === 0) {
      console.error('❌ No player controllers found! Cannot enter FPS mode.');
    } else {
      console.log(`✅ FPS mode enabled for ${controllersFound} player(s)`);
    }
  }
  
  exitFPSMode() {
    console.log('🎮 Exiting FPS mode...');
    
    // Exit pointer lock
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    
    // Restore canvas to background
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.style.zIndex = '-1';
      canvas.style.pointerEvents = 'none';
      canvas.style.cursor = 'auto';
    }
    
    // Hide instructions if still showing
    this.hideFPSInstructions();
    
    // Show UI
    this.showUI();
    
    // Update all controllers
    for (const entity of this.entities) {
      const controller = entity.getComponent(PlayerControllerComponent);
      if (controller) {
        controller.exitFPSMode();
        
        // Show player mesh again when exiting FPS mode
        const mesh = entity.getComponent(MeshComponent);
        if (mesh && mesh.mesh) {
          mesh.mesh.visible = true;
        }
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
  
  showFPSInstructions() {
    // Create or show instructions overlay
    let instructions = document.getElementById('fps-instructions');
    if (!instructions) {
      instructions = document.createElement('div');
      instructions.id = 'fps-instructions';
      instructions.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 2rem;
        border-radius: 10px;
        font-family: monospace;
        font-size: 1.2rem;
        text-align: center;
        z-index: 2000;
      `;
      instructions.innerHTML = `
        <h2 style="margin-top: 0;">FPS Mode</h2>
        <p>Click anywhere to start</p>
        <p style="font-size: 0.9rem; opacity: 0.8;">
          WASD - Move<br>
          Mouse - Look<br>
          Space - Jump<br>
          Shift - Sprint<br>
          ~ - Toggle Chat<br>
          ESC - Exit
        </p>
      `;
      document.body.appendChild(instructions);
    }
    instructions.style.display = 'block';
  }
  
  hideFPSInstructions() {
    const instructions = document.getElementById('fps-instructions');
    if (instructions) {
      instructions.style.display = 'none';
    }
  }
  
  
  update(deltaTime) {
    // System update logic if needed
  }
  
  onEntityAdded(entity) {
    console.log('🎮 FPSControllerSystem: Entity added', entity);
    const controller = entity.getComponent(PlayerControllerComponent);
    if (controller) {
      console.log('✅ Entity has PlayerControllerComponent');
    }
  }
  
  destroy() {
    // Clean up event listeners
    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('keydown', this.boundKeyDown);
    document.removeEventListener('keyup', this.boundKeyUp);
    document.removeEventListener('pointerlockchange', this.boundPointerLockChange);
  }
}