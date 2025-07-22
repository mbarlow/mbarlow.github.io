// Main THREE.js Scene Manager - Core Setup Only
class IndustrialScene {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animationId = null;
    this.clock = new THREE.Clock();
    this.mouse = new THREE.Vector2();
    this.targetMouse = new THREE.Vector2();

    // Visual systems
    this.voxelSystem = null;
    this.organicSystem = null;
    this.dataFlowSystem = null;
    this.splatSystem = null;

    // Theme and metrics
    this.currentTheme = "dark";
    this.dataMetrics = {
      complexity: 0.5,
      activity: 0.3,
      connections: 0.7,
    };
  }

  init() {
    console.log("🎮 Initializing THREE.js scene...");

    try {
      this.setupCore();
      this.setupLighting();
      this.initializeSystems();
      this.setupEventListeners();
      this.animate();
      console.log("✅ THREE.js scene initialized successfully");
    } catch (error) {
      console.error("❌ THREE.js initialization failed:", error);
      throw error;
    }
  }

  setupCore() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x0a0a0a, 15, 60);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.camera.position.set(0, 5, 25);

    // Renderer
    const canvas = document.getElementById("three-canvas");
    if (!canvas) {
      throw new Error("THREE.js canvas not found");
    }

    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
  }

  setupLighting() {
    // Ambient
    const ambientLight = new THREE.AmbientLight(0x202040, 0.4);
    this.scene.add(ambientLight);

    // Primary directional
    const primaryLight = new THREE.DirectionalLight(0x4080ff, 0.6);
    primaryLight.position.set(15, 20, 10);
    primaryLight.castShadow = true;
    primaryLight.shadow.mapSize.width = 2048;
    primaryLight.shadow.mapSize.height = 2048;
    this.scene.add(primaryLight);

    // Accent lights
    const accentLight = new THREE.PointLight(0xff6040, 0.3, 30);
    accentLight.position.set(-10, 8, 15);
    this.scene.add(accentLight);

    this.rimLight = new THREE.PointLight(0x40ff80, 0.4, 25);
    this.rimLight.position.set(8, -5, 12);
    this.scene.add(this.rimLight);
  }

  initializeSystems() {
    // Initialize visual systems safely
    try {
      if (window.VoxelSystem) {
        this.voxelSystem = new VoxelSystem(this.scene);
        this.voxelSystem.init();
      }
    } catch (e) {
      console.warn("VoxelSystem failed:", e);
    }

    try {
      if (window.OrganicSystem) {
        this.organicSystem = new OrganicSystem(this.scene);
        this.organicSystem.init();
      }
    } catch (e) {
      console.warn("OrganicSystem failed:", e);
    }

    try {
      if (window.DataFlowSystem) {
        this.dataFlowSystem = new DataFlowSystem(this.scene);
        this.dataFlowSystem.init();
      }
    } catch (e) {
      console.warn("DataFlowSystem failed:", e);
    }

    try {
      if (window.SplatSystem) {
        this.splatSystem = new SplatSystem(this.scene);
        this.splatSystem.init();
      }
    } catch (e) {
      console.warn("SplatSystem failed:", e);
    }
  }

  updateTheme(theme) {
    this.currentTheme = theme;

    // Update fog
    const fogColors = {
      light: 0xf0f0f0,
      dark: 0x0a0a0a,
      grey: 0x2a2a2a,
    };

    this.scene.fog.color.setHex(fogColors[theme]);

    // Update systems
    if (this.voxelSystem && this.voxelSystem.updateTheme) {
      this.voxelSystem.updateTheme(theme);
    }
    if (this.organicSystem && this.organicSystem.updateTheme) {
      this.organicSystem.updateTheme(theme);
    }
    if (this.dataFlowSystem && this.dataFlowSystem.updateTheme) {
      this.dataFlowSystem.updateTheme(theme);
    }
    if (this.splatSystem && this.splatSystem.updateTheme) {
      this.splatSystem.updateTheme(theme);
    }
  }

  updateDataMetrics(data) {
    if (data.repos) this.dataMetrics.complexity = Math.min(1, data.repos / 50);
    if (data.commits)
      this.dataMetrics.activity = Math.min(1, data.commits / 100);
    if (data.languages)
      this.dataMetrics.connections = data.languages.length / 10;
  }

  setupEventListeners() {
    window.addEventListener("mousemove", (event) => {
      this.targetMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.targetMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      this.dataMetrics.activity = Math.min(1, this.dataMetrics.activity + 0.05);
    });

    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    document.addEventListener("portfolioDataUpdate", (event) => {
      this.updateDataMetrics(event.detail);
    });
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    const time = this.clock.getElapsedTime();

    // Smooth mouse following
    this.mouse.lerp(this.targetMouse, 0.02);

    // Dynamic camera movement
    this.camera.position.x +=
      (this.mouse.x * 3 - this.camera.position.x) * 0.01;
    this.camera.position.y +=
      (-this.mouse.y * 3 - this.camera.position.y) * 0.01;
    this.camera.lookAt(0, 0, 0);

    // Update systems
    if (this.voxelSystem && this.voxelSystem.update) {
      this.voxelSystem.update(time, this.dataMetrics);
    }
    if (this.organicSystem && this.organicSystem.update) {
      this.organicSystem.update(time, this.dataMetrics);
    }
    if (this.dataFlowSystem && this.dataFlowSystem.update) {
      this.dataFlowSystem.update(time, this.dataMetrics);
    }
    if (this.splatSystem && this.splatSystem.update) {
      this.splatSystem.update(time, this.dataMetrics);
    }

    // Decay activity
    this.dataMetrics.activity = Math.max(
      0.1,
      this.dataMetrics.activity * 0.995,
    );

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    // Clean up systems
    if (this.voxelSystem && this.voxelSystem.destroy) {
      this.voxelSystem.destroy();
    }
    if (this.organicSystem && this.organicSystem.destroy) {
      this.organicSystem.destroy();
    }
    if (this.dataFlowSystem && this.dataFlowSystem.destroy) {
      this.dataFlowSystem.destroy();
    }
    if (this.splatSystem && this.splatSystem.destroy) {
      this.splatSystem.destroy();
    }

    // Clean up THREE.js
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
