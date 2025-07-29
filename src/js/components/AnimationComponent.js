import { Component } from '../core/Component.js';

/**
 * AnimationComponent - Handles entity animations like rotation and floating
 */
export class AnimationComponent extends Component {
  constructor(data = {}) {
    super();
    
    this.enabled = data.enabled !== undefined ? data.enabled : true;
    this.time = 0;
    
    // Rotation animation
    this.rotate = data.rotate !== undefined ? data.rotate : false;
    this.rotateSpeed = data.rotateSpeed || 1.0; // radians per second
    
    // Float animation
    this.float = data.float !== undefined ? data.float : false;
    this.floatSpeed = data.floatSpeed || 2.0; // oscillations per second
    this.floatAmplitude = data.floatAmplitude || 0.5; // units
    this.baseY = data.baseY || 0; // base Y position
  }
  
  reset() {
    this.time = 0;
  }
  
  setBaseY(y) {
    this.baseY = y;
  }
}