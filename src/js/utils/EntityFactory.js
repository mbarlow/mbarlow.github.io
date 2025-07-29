import { Transform, Renderable } from '../components/index.js';

export class EntityFactory {
  static createDOMEntity(world, element, x = 0, y = 0) {
    const entity = world.createEntity();
    
    entity.addComponent(new Transform(x, y));
    entity.addComponent(new Renderable(element, true));
    
    return entity;
  }

  static createSimpleEntity(world, x = 0, y = 0) {
    const entity = world.createEntity();
    entity.addComponent(new Transform(x, y));
    return entity;
  }
}