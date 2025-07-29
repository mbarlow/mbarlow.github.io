import { Component } from '../core/Component.js';

/**
 * MeshComponent - Stores Three.js mesh data for rendering
 */
export class MeshComponent extends Component {
  constructor(data = {}) {
    super();
    
    this.mesh = null;
    this.geometry = data.geometry || null;
    this.material = data.material || null;
    this.castShadow = data.castShadow !== undefined ? data.castShadow : true;
    this.receiveShadow = data.receiveShadow !== undefined ? data.receiveShadow : true;
    
    // Create mesh if geometry and material provided
    if (this.geometry && this.material) {
      this.createMesh();
    }
  }
  
  createMesh() {
    if (!this.geometry || !this.material) return;
    
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.castShadow = this.castShadow;
    this.mesh.receiveShadow = this.receiveShadow;
  }
  
  setGeometry(geometry) {
    this.geometry = geometry;
    if (this.mesh) {
      this.mesh.geometry = geometry;
    } else if (this.material) {
      this.createMesh();
    }
  }
  
  setMaterial(material) {
    this.material = material;
    if (this.mesh) {
      this.mesh.material = material;
    } else if (this.geometry) {
      this.createMesh();
    }
  }
  
  dispose() {
    if (this.mesh) {
      if (this.mesh.geometry) this.mesh.geometry.dispose();
      if (this.mesh.material) {
        if (Array.isArray(this.mesh.material)) {
          this.mesh.material.forEach(m => m.dispose());
        } else {
          this.mesh.material.dispose();
        }
      }
    }
  }
}