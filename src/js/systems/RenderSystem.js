import { System } from '../core/System.js';
import { Transform } from '../components/Transform.js';
import { Renderable } from '../components/Renderable.js';

export class RenderSystem extends System {
  constructor() {
    super();
    this.requiredComponents = [Transform, Renderable];
  }

  updateEntity(entity, deltaTime) {
    const transform = entity.getComponent('Transform');
    const renderable = entity.getComponent('Renderable');

    if (!renderable.visible || !renderable.element) return;

    // Update DOM element position and transform
    const element = renderable.element;
    element.style.transform = `translate(${transform.x}px, ${transform.y}px) rotate(${transform.rotation}rad) scale(${transform.scale})`;
    element.style.zIndex = renderable.zIndex;
  }
}