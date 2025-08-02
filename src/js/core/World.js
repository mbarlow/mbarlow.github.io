import { Entity } from './Entity.js';

/**
 * World - ECS Container
 */
export class World {
  constructor() {
    this.entities = new Map();
    this.systems = new Map();
    this.running = false;
    this.lastTime = 0;
  }

  createEntity() {
    const entity = new Entity();
    entity.world = this; // Set world reference
    this.entities.set(entity.id, entity);
    
    // Notify all systems about the new entity
    for (const system of this.systems.values()) {
      system.addEntity(entity);
    }
    
    return entity;
  }
  
  onComponentAdded(entity, component) {
    // Re-check this entity against all systems
    for (const system of this.systems.values()) {
      if (!system.entities.has(entity) && system.matchesRequirements(entity)) {
        system.addEntity(entity);
      }
    }
  }

  removeEntity(entityId) {
    const entity = this.entities.get(entityId);
    if (entity) {
      // Notify all systems about entity removal
      for (const system of this.systems.values()) {
        system.removeEntity(entity);
      }
      
      entity.destroy();
      this.entities.delete(entityId);
    }
  }

  addSystem(system, name) {
    this.systems.set(name, system);
    
    // Add existing entities to the new system
    for (const entity of this.entities.values()) {
      system.addEntity(entity);
    }
    
    return system;
  }

  getSystem(name) {
    return this.systems.get(name);
  }

  removeSystem(name) {
    const system = this.systems.get(name);
    if (system) {
      system.entities.clear();
      this.systems.delete(name);
    }
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  stop() {
    this.running = false;
  }

  gameLoop() {
    if (!this.running) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = currentTime;

    this.update(deltaTime);

    requestAnimationFrame(() => this.gameLoop());
  }

  update(deltaTime) {
    // Clean up destroyed entities
    for (const [id, entity] of this.entities) {
      if (!entity.active) {
        this.removeEntity(id);
      }
    }

    // Update all systems
    for (const system of this.systems.values()) {
      system.update(deltaTime);
    }
  }

  getEntity(entityId) {
    return this.entities.get(entityId);
  }
  
  getEntitiesByTag(tag) {
    const entities = [];
    for (const entity of this.entities.values()) {
      if (entity.tag === tag) {
        entities.push(entity);
      }
    }
    return entities;
  }
  
  getEntitiesWithComponent(ComponentClass) {
    const entities = [];
    for (const entity of this.entities.values()) {
      if (entity.hasComponent(ComponentClass)) {
        entities.push(entity);
      }
    }
    return entities;
  }
  
  ensureComponent(entity, ComponentClass) {
    if (!entity.hasComponent(ComponentClass)) {
      const component = new ComponentClass();
      entity.addComponent(component);
      return component;
    }
    return entity.getComponent(ComponentClass);
  }

  clear() {
    this.running = false;
    this.entities.clear();
    this.systems.clear();
  }
}