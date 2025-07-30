import { System } from '../core/System.js';
import { TransformComponent, PatrolComponent } from '../components/index.js';

/**
 * PatrolSystem - Makes entities patrol in a circle
 */
export class PatrolSystem extends System {
  constructor() {
    super();
    this.requiredComponents = [TransformComponent, PatrolComponent];
  }
  
  update(deltaTime) {
    for (const entity of this.entities) {
      const transform = entity.getComponent(TransformComponent);
      const patrol = entity.getComponent(PatrolComponent);
      
      if (!transform || !patrol) continue;
      
      // Update angle
      patrol.angle += (patrol.speed / patrol.radius) * deltaTime;
      
      // Calculate new position
      const x = patrol.centerPoint.x + Math.cos(patrol.angle) * patrol.radius;
      const z = patrol.centerPoint.z + Math.sin(patrol.angle) * patrol.radius;
      
      // Update transform position
      transform.position.x = x;
      transform.position.z = z;
      
      // Make the entity look in the direction of movement
      const lookAngle = patrol.angle + Math.PI / 2;
      transform.rotation.y = lookAngle;
    }
  }
}