/**
 * Base System class
 */
export class System {
  constructor() {
    this.entities = new Set();
    this.requiredComponents = [];
    this.active = true;
  }

  addEntity(entity) {
    if (this.matchesRequirements(entity)) {
      this.entities.add(entity);
      this.onEntityAdded(entity);
    }
  }

  removeEntity(entity) {
    if (this.entities.has(entity)) {
      this.entities.delete(entity);
      this.onEntityRemoved(entity);
    }
  }

  matchesRequirements(entity) {
    return this.requiredComponents.every(componentType => 
      entity.hasComponent(componentType)
    );
  }

  update(deltaTime) {
    if (!this.active) return;
    
    for (const entity of this.entities) {
      if (entity.active) {
        this.updateEntity(entity, deltaTime);
      }
    }
  }

  updateEntity(entity, deltaTime) {
    // Override in subclasses
  }

  onEntityAdded(entity) {
    // Override in subclasses
  }

  onEntityRemoved(entity) {
    // Override in subclasses
  }
}