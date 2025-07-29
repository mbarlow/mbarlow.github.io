import { Component } from '../core/Component.js';

/**
 * CameraComponent - Stores camera properties and state
 */
export class CameraComponent extends Component {
  constructor(data = {}) {
    super();
    
    // Camera reference (Three.js camera)
    this.camera = null;
    
    // Camera properties
    this.fov = data.fov || 75;
    this.near = data.near || 0.1;
    this.far = data.far || 1000;
    this.aspect = data.aspect || window.innerWidth / window.innerHeight;
    
    // Camera state
    this.isActive = data.isActive !== undefined ? data.isActive : false;
    this.target = data.target || null; // Entity this camera should follow/look at
    
    // Mouse look properties
    this.pitch = 0; // Up/down rotation
    this.yaw = 0;   // Left/right rotation
    this.sensitivity = data.sensitivity || 0.002;
    
    // Create Three.js camera
    this.createCamera();
  }
  
  createCamera() {
    this.camera = new THREE.PerspectiveCamera(
      this.fov,
      this.aspect,
      this.near,
      this.far
    );
  }
  
  updateAspect(aspect) {
    this.aspect = aspect;
    if (this.camera) {
      this.camera.aspect = aspect;
      this.camera.updateProjectionMatrix();
    }
  }
  
  lookAt(x, y, z) {
    if (this.camera) {
      this.camera.lookAt(x, y, z);
    }
  }
  
  setActive(active) {
    this.isActive = active;
  }
}