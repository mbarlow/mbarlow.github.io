/**
 * Entity - Unique identifier with components
 */
export class Entity {
  static nextId = 0;

  constructor() {
    this.id = Entity.nextId++;
    this.components = new Map();
    this.active = true;
    this.world = null; // Reference to the world
  }

  addComponent(component) {
    this.components.set(component.constructor.name, component);
    
    // Notify world systems about component addition
    if (this.world) {
      this.world.onComponentAdded(this, component);
    }
    
    return this;
  }

  getComponent(componentType) {
    const name = typeof componentType === 'string' ? componentType : componentType.name;
    return this.components.get(name);
  }

  hasComponent(componentType) {
    const name = typeof componentType === 'string' ? componentType : componentType.name;
    return this.components.has(name);
  }

  removeComponent(componentType) {
    const name = typeof componentType === 'string' ? componentType : componentType.name;
    return this.components.delete(name);
  }

  destroy() {
    this.active = false;
    this.components.clear();
  }
}