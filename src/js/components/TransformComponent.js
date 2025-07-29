import { Component } from '../core/Component.js';

/**
 * TransformComponent - Stores position, rotation, and scale for 3D entities
 */
export class TransformComponent extends Component {
  constructor(data = {}) {
    super();
    
    // Position in 3D space
    this.position = new THREE.Vector3(
      data.position?.x || 0,
      data.position?.y || 0,
      data.position?.z || 0
    );
    
    // Rotation in radians
    this.rotation = new THREE.Euler(
      data.rotation?.x || 0,
      data.rotation?.y || 0,
      data.rotation?.z || 0
    );
    
    // Scale
    this.scale = new THREE.Vector3(
      data.scale?.x || 1,
      data.scale?.y || 1,
      data.scale?.z || 1
    );
  }
  
  setPosition(x, y, z) {
    this.position.set(x, y, z);
  }
  
  setRotation(x, y, z) {
    this.rotation.set(x, y, z);
  }
  
  setScale(x, y, z) {
    this.scale.set(x, y, z);
  }
}