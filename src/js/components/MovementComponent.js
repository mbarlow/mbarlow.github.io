import { Component } from '../core/Component.js';

/**
 * MovementComponent - Stores movement state and properties
 */
export class MovementComponent extends Component {
  constructor(data = {}) {
    super();
    
    // Movement properties
    this.walkSpeed = data.walkSpeed || 5.0;
    this.runSpeed = data.runSpeed || 8.0;
    this.jumpForce = data.jumpForce || 10.0;
    this.crouchSpeed = data.crouchSpeed || 2.0;
    this.friction = data.friction || 10.0;
    this.gravity = data.gravity || 20.0;
    
    // Current state
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.isOnGround = true;
    this.isCrouching = false;
    this.isRunning = false;
    this.isJumping = false;
    
    // Input state
    this.inputVector = new THREE.Vector2(0, 0); // Forward/back, left/right
    this.wantsCrouch = false;
    this.wantsJump = false;
    this.wantsRun = false;
    
    // Ground detection
    this.groundHeight = data.groundHeight || 0;
    this.characterHeight = data.characterHeight || 1.8;
    this.crouchHeight = data.crouchHeight || 1.2;
    this.currentHeight = this.characterHeight;
    
    // Movement vectors (calculated each frame)
    this.forward = new THREE.Vector3(0, 0, -1);
    this.right = new THREE.Vector3(1, 0, 0);
    this.up = new THREE.Vector3(0, 1, 0);
  }
  
  getCurrentSpeed() {
    if (this.isCrouching) return this.crouchSpeed;
    if (this.isRunning) return this.runSpeed;
    return this.walkSpeed;
  }
  
  updateMovementVectors(yaw) {
    // Update forward and right vectors based on camera yaw
    this.forward.set(
      Math.sin(yaw),
      0,
      Math.cos(yaw)
    ).normalize();
    
    this.right.set(
      Math.cos(yaw),
      0,
      -Math.sin(yaw)
    ).normalize();
  }
  
  reset() {
    this.velocity.set(0, 0, 0);
    this.inputVector.set(0, 0);
    this.isRunning = false;
    this.isCrouching = false;
    this.isJumping = false;
    this.wantsCrouch = false;
    this.wantsJump = false;
    this.wantsRun = false;
  }
}