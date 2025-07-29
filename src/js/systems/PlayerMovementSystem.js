import { System } from '../core/System.js';
import { TransformComponent, MovementComponent, PlayerControllerComponent, CameraComponent } from '../components/index.js';

/**
 * PlayerMovementSystem - Handles player movement physics and logic
 */
export class PlayerMovementSystem extends System {
  constructor() {
    super();
    this.requiredComponents = [TransformComponent, MovementComponent, PlayerControllerComponent];
  }
  
  update(deltaTime) {
    for (const entity of this.entities) {
      const transform = entity.getComponent(TransformComponent);
      const movement = entity.getComponent(MovementComponent);
      const controller = entity.getComponent(PlayerControllerComponent);
      
      if (!transform || !movement || !controller) continue;
      if (!controller.isEnabled || !controller.isFPSMode) continue;
      
      // Update movement input
      movement.inputVector = controller.getMovementInput();
      
      // Update movement state from input
      this.updateMovementState(movement, controller);
      
      // Apply movement physics
      this.applyMovementPhysics(entity, transform, movement, controller, deltaTime);
      
      // Update camera attached to this entity
      this.updateAttachedCamera(entity, transform, movement);
    }
  }
  
  updateMovementState(movement, controller) {
    // Update movement flags based on input
    movement.wantsRun = controller.isKeyPressed('run');
    movement.wantsCrouch = controller.isKeyPressed('crouch');
    movement.wantsJump = controller.isKeyPressed('jump');
    
    // Apply state changes
    movement.isRunning = movement.wantsRun && !movement.isCrouching && movement.isOnGround;
    
    // Handle crouching
    if (movement.wantsCrouch && !movement.isCrouching) {
      movement.isCrouching = true;
      movement.currentHeight = movement.crouchHeight;
    } else if (!movement.wantsCrouch && movement.isCrouching) {
      movement.isCrouching = false;
      movement.currentHeight = movement.characterHeight;
    }
    
    // Handle jumping
    if (movement.wantsJump && movement.isOnGround && !movement.isJumping) {
      movement.velocity.y = movement.jumpForce;
      movement.isJumping = true;
      movement.isOnGround = false;
    }
  }
  
  applyMovementPhysics(entity, transform, movement, controller, deltaTime) {
    // Get camera for movement direction
    const camera = this.getCameraComponentFromEntity(entity);
    if (camera) {
      movement.updateMovementVectors(camera.yaw);
    }
    
    // Calculate desired velocity
    const inputMagnitude = movement.inputVector.length();
    if (inputMagnitude > 0) {
      const speed = movement.getCurrentSpeed();
      
      // Calculate movement direction
      const moveDirection = new THREE.Vector3();
      moveDirection.addScaledVector(movement.forward, -movement.inputVector.y);
      moveDirection.addScaledVector(movement.right, movement.inputVector.x);
      moveDirection.normalize();
      
      // Apply horizontal movement
      const targetVelocity = moveDirection.multiplyScalar(speed);
      
      // Smoothly interpolate to target velocity (air control)
      const acceleration = movement.isOnGround ? movement.friction : movement.friction * 0.1;
      movement.velocity.x = THREE.MathUtils.lerp(movement.velocity.x, targetVelocity.x, acceleration * deltaTime);
      movement.velocity.z = THREE.MathUtils.lerp(movement.velocity.z, targetVelocity.z, acceleration * deltaTime);
    } else {
      // Apply friction when no input
      const friction = movement.isOnGround ? movement.friction : movement.friction * 0.1;
      movement.velocity.x = THREE.MathUtils.lerp(movement.velocity.x, 0, friction * deltaTime);
      movement.velocity.z = THREE.MathUtils.lerp(movement.velocity.z, 0, friction * deltaTime);
    }
    
    // Apply gravity
    if (!movement.isOnGround) {
      movement.velocity.y -= movement.gravity * deltaTime;
    }
    
    // Apply velocity to position
    transform.position.add(movement.velocity.clone().multiplyScalar(deltaTime));
    
    // Ground collision
    this.handleGroundCollision(transform, movement);
  }
  
  handleGroundCollision(transform, movement) {
    const groundY = movement.groundHeight;
    const playerBottom = transform.position.y - movement.currentHeight / 2;
    
    if (playerBottom <= groundY) {
      // Snap to ground
      transform.position.y = groundY + movement.currentHeight / 2;
      
      // Stop downward velocity
      if (movement.velocity.y < 0) {
        movement.velocity.y = 0;
      }
      
      // Player is on ground
      if (!movement.isOnGround) {
        movement.isOnGround = true;
        movement.isJumping = false;
      }
    } else {
      movement.isOnGround = false;
    }
  }
  
  getCameraComponentFromEntity(entity) {
    // Look for camera component on the same entity
    if (entity && entity.getComponent) {
      return entity.getComponent(CameraComponent);
    }
    return null;
  }
  
  updateAttachedCamera(entity, transform, movement) {
    const camera = entity.getComponent(CameraComponent);
    if (camera) {
      // Camera follows player position with height offset
      const eyeHeight = movement.currentHeight * 0.9; // 90% of character height
      camera.camera.position.copy(transform.position);
      camera.camera.position.y += eyeHeight - movement.currentHeight / 2;
    }
  }
}