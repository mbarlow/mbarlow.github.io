import { Component } from '../core/Component.js';

/**
 * PatrolComponent - Simple patrol behavior
 */
export class PatrolComponent extends Component {
  constructor(data = {}) {
    super();
    
    // Patrol settings
    this.radius = data.radius || 10;
    this.speed = data.speed || 2;
    this.angle = data.angle || 0;
    this.centerPoint = data.centerPoint || { x: 0, y: 0, z: 0 };
    
    // Current target
    this.targetPosition = { x: 0, y: 0, z: 0 };
  }
}