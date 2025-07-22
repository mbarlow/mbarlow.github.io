// Liminal Landscape Scene Manager - Core Setup
class IndustrialScene {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animationId = null;
    this.clock = new THREE.Clock();
    this.mouse = new THREE.Vector2();

    // Landscape systems
    this.terrain = null;
    this.water = null;
    this.structures = [];
    this.vegetation = [];
    this.cardinal = null;

    // Theme and atmosphere
    this.currentTheme = "monochrome";
    this.fog = null;
  }

  init() {
    console.log("🌾 Initializing Liminal Landscape...");

    try {
      this.setupCore();
      this.setupLighting();
      this.initializeLandscape();
      this.setupEventListeners();
      this.animate();
      console.log("✅ Landscape ready");
    } catch (error) {
      console.error("❌ Landscape initialization failed:", error);
      throw error;
    }
  }

  setupCore() {
    // Scene with atmospheric fog
    this.scene = new THREE.Scene();
    this.fog = new THREE.Fog(0xf5f5f5, 20, 100);
    this.scene.fog = this.fog;

    // Camera positioned for landscape view
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.camera.position.set(8, 12, 25);
    this.camera.lookAt(0, 0, 0);

    // Minimal renderer setup
    const canvas = document.getElementById("three-canvas");
    if (!canvas) throw new Error("Canvas not found");

    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: false, // Low-fi aesthetic
      powerPreference: "default",
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap; // Low-fi shadows
    this.renderer.outputEncoding = THREE.LinearEncoding; // Flat lighting
  }

  setupLighting() {
    // Soft ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Single directional sun
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(20, 30, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    this.scene.add(sunLight);

    this.sunLight = sunLight;
  }

  initializeLandscape() {
    // Initialize all landscape systems
    if (window.TerrainSystem) {
      this.terrain = new TerrainSystem(this.scene);
      this.terrain.init();
    }

    if (window.WaterSystem) {
      this.water = new WaterSystem(this.scene);
      this.water.init();
    }

    if (window.StructureSystem) {
      this.structureSystem = new StructureSystem(this.scene);
      this.structureSystem.init();
    }

    if (window.VegetationSystem) {
      this.vegetationSystem = new VegetationSystem(this.scene);
      this.vegetationSystem.init();
    }

    if (window.CardinalSystem) {
      this.cardinal = new CardinalSystem(this.scene);
      this.cardinal.init();
    }
  }

  updateTheme(theme) {
    this.currentTheme = theme;

    // Update fog and lighting based on theme
    const themes = {
      light: { fog: 0xf8f8f8, ambient: 0.7 },
      dark: { fog: 0x2a2a2a, ambient: 0.4 },
      grey: { fog: 0xe0e0e0, ambient: 0.5 },
      monochrome: { fog: 0xf5f5f5, ambient: 0.6 },
    };

    const currentTheme = themes[theme] || themes.monochrome;
    this.scene.fog.color.setHex(currentTheme.fog);

    // Update all systems
    if (this.terrain?.updateTheme) this.terrain.updateTheme(theme);
    if (this.water?.updateTheme) this.water.updateTheme(theme);
    if (this.structureSystem?.updateTheme)
      this.structureSystem.updateTheme(theme);
    if (this.vegetationSystem?.updateTheme)
      this.vegetationSystem.updateTheme(theme);
    if (this.cardinal?.updateTheme) this.cardinal.updateTheme(theme);
  }

  setupEventListeners() {
    window.addEventListener("mousemove", (event) => {
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Click to make cardinal move
    window.addEventListener("click", () => {
      if (this.cardinal && this.cardinal.triggerMovement) {
        this.cardinal.triggerMovement();
      }
    });
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    const time = this.clock.getElapsedTime();
    const deltaTime = this.clock.getDelta();

    // Gentle camera drift
    this.camera.position.x +=
      (this.mouse.x * 2 - this.camera.position.x) * 0.003;
    this.camera.position.y +=
      (-this.mouse.y * 2 + 12 - this.camera.position.y) * 0.003;
    this.camera.lookAt(0, 0, 0);

    // Update all systems
    if (this.terrain?.update) this.terrain.update(time, deltaTime);
    if (this.water?.update) this.water.update(time, deltaTime);
    if (this.structureSystem?.update)
      this.structureSystem.update(time, deltaTime);
    if (this.vegetationSystem?.update)
      this.vegetationSystem.update(time, deltaTime);
    if (this.cardinal?.update) this.cardinal.update(time, deltaTime);

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    // Clean up all systems
    if (this.terrain?.destroy) this.terrain.destroy();
    if (this.water?.destroy) this.water.destroy();
    if (this.structureSystem?.destroy) this.structureSystem.destroy();
    if (this.vegetationSystem?.destroy) this.vegetationSystem.destroy();
    if (this.cardinal?.destroy) this.cardinal.destroy();

    this.scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
