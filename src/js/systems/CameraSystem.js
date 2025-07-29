import { System } from '../core/System.js';
import { CameraComponent, TransformComponent, PlayerControllerComponent } from '../components/index.js';

/**
 * CameraSystem - Manages camera entities and updates
 */
export class CameraSystem extends System {
  constructor() {
    super();
    this.requiredComponents = [CameraComponent, TransformComponent];
    this.activeCamera = null;
    this.threeRenderSystem = null;
  }
  
  init(world) {
    // Get reference to Three.js render system
    this.threeRenderSystem = world.getSystem('threeRender');
    if (!this.threeRenderSystem) {
      console.error('❌ CameraSystem requires ThreeRenderSystem');
    }
  }
  
  update(deltaTime) {
    if (!this.threeRenderSystem) return;
    
    // Update all cameras
    for (const entity of this.entities) {
      const camera = entity.getComponent(CameraComponent);
      const transform = entity.getComponent(TransformComponent);
      
      if (!camera || !transform) continue;
      
      // Update camera (but don't override position if it's an FPS camera)
      if (camera.camera) {
        // Check if this entity has a PlayerControllerComponent (FPS camera)
        const controller = entity.getComponent(PlayerControllerComponent);
        const isFPSCamera = controller && controller.isFPSMode;
        
        if (!isFPSCamera) {
          // Only update position/rotation for non-FPS cameras
          camera.camera.position.copy(transform.position);
          camera.camera.rotation.copy(transform.rotation);
        }
        
        // If this is the active camera, update the render system
        if (camera.isActive && this.activeCamera !== camera) {
          this.setActiveCamera(camera);
        }
      }
    }
    
    // Handle window resize
    this.handleResize();
  }
  
  setActiveCamera(cameraComponent) {
    // Deactivate previous camera
    if (this.activeCamera) {
      this.activeCamera.setActive(false);
    }
    
    // Set new active camera
    this.activeCamera = cameraComponent;
    cameraComponent.setActive(true);
    
    // Update Three.js render system camera
    if (this.threeRenderSystem && cameraComponent.camera) {
      this.threeRenderSystem.camera = cameraComponent.camera;
      console.log('📷 Active camera changed to:', cameraComponent.camera.position);
    }
  }
  
  getActiveCamera() {
    return this.activeCamera;
  }
  
  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;
    
    // Update all cameras' aspect ratio
    for (const entity of this.entities) {
      const camera = entity.getComponent(CameraComponent);
      if (camera) {
        camera.updateAspect(aspect);
      }
    }
  }
  
  onEntityAdded(entity) {
    super.onEntityAdded(entity);
    
    const camera = entity.getComponent(CameraComponent);
    console.log('📷 CameraSystem: Entity added:', entity.id, 'tag:', entity.tag, 'isActive:', camera?.isActive);
    if (camera && camera.isActive) {
      console.log('📷 Setting as active camera');
      this.setActiveCamera(camera);
    }
  }
  
  onEntityRemoved(entity) {
    super.onEntityRemoved(entity);
    
    const camera = entity.getComponent(CameraComponent);
    if (camera === this.activeCamera) {
      this.activeCamera = null;
      
      // Try to find another active camera
      for (const otherEntity of this.entities) {
        const otherCamera = otherEntity.getComponent(CameraComponent);
        if (otherCamera && otherCamera.isActive) {
          this.setActiveCamera(otherCamera);
          break;
        }
      }
    }
  }
}