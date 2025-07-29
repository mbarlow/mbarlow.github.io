import { System } from '../core/System.js';
import { TransformComponent, MeshComponent, AnimationComponent, CameraComponent, MovementComponent, PlayerControllerComponent } from '../components/index.js';

/**
 * LevelLoader - Loads level data from JSON or creates default environment
 */
export class LevelLoader extends System {
  constructor() {
    super();
    this.requiredComponents = [];
    this.levelPath = '/data/world/level.json';
    this.loaded = false;
  }
  
  async loadLevel(world) {
    console.log('🗺️ Loading level data...');
    
    try {
      // Try to load level data
      const response = await fetch(this.levelPath);
      
      if (response.ok) {
        const levelData = await response.json();
        console.log('✅ Level data loaded:', levelData);
        await this.createLevelFromData(world, levelData);
      } else {
        console.log('📦 No level data found, creating default environment');
        await this.createDefaultEnvironment(world);
      }
    } catch (error) {
      console.log('📦 Creating default environment (error loading level):', error.message);
      await this.createDefaultEnvironment(world);
    }
    
    this.loaded = true;
  }
  
  async createDefaultEnvironment(world) {
    // Create origin marker entity
    this.createOriginMarker(world);
    
    // Create floor plane for shadow receiving
    this.createFloorPlane(world);
    
    // Create player entity
    this.createPlayer(world);
    
    console.log('✅ Default environment created');
  }
  
  createOriginMarker(world) {
    console.log('🎯 Creating origin marker...');
    
    // Get the render system to access theme colors
    const renderSystem = world.getSystem('threeRender');
    const cubeColor = renderSystem ? renderSystem.getThemeColor('cube') : 0xffffff;
    
    // Create origin marker entity
    const originMarker = world.createEntity();
    
    // Add transform component (1 unit above ground)
    const transform = new TransformComponent({
      position: { x: 0, y: 1, z: 0 }
    });
    originMarker.addComponent(transform);
    
    // Create cube geometry and material
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const material = new THREE.MeshStandardMaterial({
      color: cubeColor,
      metalness: 0.4,
      roughness: 0.6
    });
    
    // Add mesh component
    const mesh = new MeshComponent({
      geometry: geometry,
      material: material,
      castShadow: true,
      receiveShadow: true
    });
    originMarker.addComponent(mesh);
    
    // Add animation component for rotation and floating
    const animation = new AnimationComponent({
      enabled: true,
      rotate: true,
      rotateSpeed: 0.5, // Slow rotation
      float: true,
      floatSpeed: 1.0, // 1 oscillation per second
      floatAmplitude: 0.2, // Float 0.2 units up and down
      baseY: 1 // Base height of 1 unit
    });
    originMarker.addComponent(animation);
    
    // Add mesh to scene
    if (renderSystem) {
      renderSystem.addMeshToScene(mesh.mesh);
    }
    
    // Tag the entity for easy reference
    originMarker.tag = 'origin-marker';
    
    console.log('✅ Origin marker created');
  }
  
  createFloorPlane(world) {
    console.log('🏗️ Creating floor plane...');
    
    const renderSystem = world.getSystem('threeRender');
    
    // Create invisible floor plane for shadows
    const floorGeometry = new THREE.PlaneGeometry(40, 40);
    const floorMaterial = new THREE.ShadowMaterial({
      opacity: 0.3
    });
    
    const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = 0;
    floorMesh.receiveShadow = true;
    
    // Add directly to scene (not as entity since it's just for shadows)
    if (renderSystem && renderSystem.scene) {
      renderSystem.scene.add(floorMesh);
    }
    
    console.log('✅ Floor plane created');
  }
  
  createPlayer(world) {
    console.log('🎮 Creating player...');
    
    // Create player entity
    const player = world.createEntity();
    
    // Add transform component (spawn position)
    const transform = new TransformComponent({
      position: { x: 0, y: 2, z: 5 } // Start 5 units back from origin, 2 units up
    });
    player.addComponent(transform);
    
    // Add movement component
    const movement = new MovementComponent({
      walkSpeed: 5.0,
      runSpeed: 8.0,
      jumpForce: 10.0,
      crouchSpeed: 2.0,
      characterHeight: 1.8,
      crouchHeight: 1.2,
      groundHeight: 0
    });
    player.addComponent(movement);
    
    // Add player controller component
    const controller = new PlayerControllerComponent({
      isEnabled: true,
      isFPSMode: false,
      mouseSensitivity: 1.0
    });
    player.addComponent(controller);
    
    // Add camera component
    const camera = new CameraComponent({
      fov: 75,
      isActive: true,
      sensitivity: 0.002
    });
    player.addComponent(camera);
    
    // Tag the entity for easy reference
    player.tag = 'player';
    
    return player;
  }
  
  async createLevelFromData(world, levelData) {
    // TODO: Implement level data parsing
    console.log('🏗️ Creating level from data...');
    
    // For now, create default environment
    await this.createDefaultEnvironment(world);
  }
  
  update(deltaTime) {
    // Level loader doesn't need regular updates
  }
}