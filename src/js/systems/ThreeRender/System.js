import { System } from '../../core/System.js';
import { TransformComponent, MeshComponent, AnimationComponent } from '../../components/index.js';
import { CONFIG } from '../../config/index.js';

/**
 * ThreeRenderSystem - Handles 3D rendering using Three.js
 */
export class ThreeRenderSystem extends System {
  constructor() {
    super();
    this.requiredComponents = [TransformComponent, MeshComponent];
    
    // Three.js core objects
    this.scene = null;
    this.camera = null; // This will be set by CameraSystem
    this.defaultCamera = null; // Fallback camera
    this.renderer = null;
    this.clock = null;
    
    // Scene helpers
    this.gridHelper = null;
    this.ambientLight = null;
    this.directionalLight = null;
    
    // Theme colors from CONFIG
    this.themeColors = CONFIG.rendering.themes;
    
    this.currentTheme = 'dark';
    this.initialized = false;
    
    // FPS tracking
    this.frameCount = 0;
    this.lastFpsUpdate = 0;
    this.fps = 0;
  }
  
  init() {
    if (this.initialized) return;
    
    console.log('🎮 Initializing ThreeRenderSystem...');
    
    // Create scene
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    
    // Setup default/fallback camera
    const aspect = window.innerWidth / window.innerHeight;
    this.defaultCamera = new THREE.PerspectiveCamera(
      CONFIG.rendering.camera.orbit.fov, 
      aspect, 
      CONFIG.rendering.camera.orbit.near, 
      CONFIG.rendering.camera.orbit.far
    );
    this.defaultCamera.position.set(10, 10, 10);
    this.defaultCamera.lookAt(0, 0, 0);
    
    // Initially use default camera until CameraSystem sets an active one
    this.camera = this.defaultCamera;
    
    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Insert renderer as background
    this.renderer.domElement.style.position = 'fixed';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.zIndex = '-1';
    document.body.prepend(this.renderer.domElement);
    
    // Setup lighting
    this.setupLighting();
    
    // Create grid
    this.createGrid();
    
    // Apply initial theme
    this.updateTheme();
    
    // Handle resize
    window.addEventListener('resize', () => this.handleResize());
    
    // Listen for theme changes
    this.setupThemeListener();
    
    this.initialized = true;
    console.log('✅ ThreeRenderSystem initialized');
  }
  
  setupLighting() {
    // Ambient light for overall illumination
    this.ambientLight = new THREE.AmbientLight(
      CONFIG.rendering.lighting.ambient.color, 
      CONFIG.rendering.lighting.ambient.intensity
    );
    this.scene.add(this.ambientLight);
    
    // Directional light for shadows
    const dirConfig = CONFIG.rendering.lighting.directional;
    this.directionalLight = new THREE.DirectionalLight(0xffffff, dirConfig.intensity);
    this.directionalLight.position.set(
      dirConfig.position.x, 
      dirConfig.position.y, 
      dirConfig.position.z
    );
    this.directionalLight.castShadow = true;
    
    // Shadow configuration
    const shadowConfig = dirConfig.shadow;
    this.directionalLight.shadow.mapSize.width = shadowConfig.mapSize;
    this.directionalLight.shadow.mapSize.height = shadowConfig.mapSize;
    this.directionalLight.shadow.camera.near = shadowConfig.camera.near;
    this.directionalLight.shadow.camera.far = shadowConfig.camera.far;
    this.directionalLight.shadow.camera.left = shadowConfig.camera.left;
    this.directionalLight.shadow.camera.right = shadowConfig.camera.right;
    this.directionalLight.shadow.camera.top = shadowConfig.camera.top;
    this.directionalLight.shadow.camera.bottom = shadowConfig.camera.bottom;
    
    this.scene.add(this.directionalLight);
  }
  
  createGrid() {
    // Remove old grid if exists
    if (this.gridHelper) {
      this.scene.remove(this.gridHelper);
    }
    
    // Create new grid with unit spacing
    this.gridHelper = new THREE.GridHelper(
      CONFIG.rendering.grid.size, 
      CONFIG.rendering.grid.divisions
    );
    this.gridHelper.material.opacity = 0.3;
    this.gridHelper.material.transparent = true;
    this.scene.add(this.gridHelper);
  }
  
  updateTheme() {
    const theme = document.body.getAttribute('data-theme') || 'dark';
    this.currentTheme = theme;
    const colors = this.themeColors[theme];
    
    // Update background
    this.scene.background = new THREE.Color(colors.background);
    
    // Update fog for depth
    this.scene.fog = new THREE.Fog(
      colors.fog || colors.background, 
      CONFIG.rendering.fog.near, 
      CONFIG.rendering.fog.far
    );
    
    // Update grid color
    if (this.gridHelper) {
      this.gridHelper.material.color = new THREE.Color(colors.grid);
    }
    
    // Update ambient light
    if (this.ambientLight) {
      this.ambientLight.color = new THREE.Color(colors.ambient);
    }
    
    console.log(`🎨 ThreeRenderSystem theme updated to: ${theme}`);
  }
  
  setupThemeListener() {
    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          this.updateTheme();
        }
      });
    });
    
    observer.observe(document.body, { attributes: true });
  }
  
  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Update both cameras
    if (this.camera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
    if (this.defaultCamera) {
      this.defaultCamera.aspect = width / height;
      this.defaultCamera.updateProjectionMatrix();
    }
    
    this.renderer.setSize(width, height);
  }
  
  update(deltaTime) {
    if (!this.initialized) return;
    
    // Update FPS counter
    this.updateFPS();
    
    // Update all entities with mesh components
    for (const entity of this.entities) {
      const transform = entity.getComponent(TransformComponent);
      const mesh = entity.getComponent(MeshComponent);
      
      if (!transform || !mesh || !mesh.mesh) continue;
      
      // Handle animations first (before updating mesh position)
      const animation = entity.getComponent(AnimationComponent);
      if (animation && animation.enabled) {
        this.updateAnimation(entity, animation, deltaTime);
      }
      
      // Update mesh transform from component
      mesh.mesh.position.copy(transform.position);
      mesh.mesh.rotation.copy(transform.rotation);
      mesh.mesh.scale.copy(transform.scale);
    }
    
    // Render the scene
    this.renderer.render(this.scene, this.camera || this.defaultCamera);
  }
  
  updateAnimation(entity, animation, deltaTime) {
    const transform = entity.getComponent(TransformComponent);
    
    // Update animation time
    animation.time += deltaTime;
    
    // Rotation animation
    if (animation.rotate) {
      transform.rotation.y += animation.rotateSpeed * deltaTime;
    }
    
    // Float animation
    if (animation.float) {
      const floatOffset = Math.sin(animation.time * animation.floatSpeed) * animation.floatAmplitude;
      transform.position.y = animation.baseY + floatOffset;
    }
  }
  
  addMeshToScene(mesh) {
    if (mesh && this.scene) {
      this.scene.add(mesh);
    }
  }
  
  removeMeshFromScene(mesh) {
    if (mesh && this.scene) {
      this.scene.remove(mesh);
    }
  }
  
  getThemeColor(colorType) {
    return this.themeColors[this.currentTheme][colorType];
  }
  
  updateFPS() {
    this.frameCount++;
    const now = performance.now();
    
    // Update FPS every second
    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
      
      // Update FPS display
      const fpsElement = document.getElementById('fps-value');
      if (fpsElement) {
        fpsElement.textContent = this.fps;
      }
    }
  }
  
  destroy() {
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }
    
    // Clean up Three.js resources
    if (this.scene) {
      this.scene.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }
    
    window.removeEventListener('resize', this.handleResize);
  }
}