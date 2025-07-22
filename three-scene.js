// THREE.js Scene Manager for Industrial Portfolio
class IndustrialScene {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.geometries = [];
    this.materials = {};
    this.animationId = null;
    this.clock = new THREE.Clock();
    this.mouse = new THREE.Vector2();
    this.targetMouse = new THREE.Vector2();

    // Theme-specific properties
    this.currentTheme = "dark";
    this.transitionSpeed = 0.02;

    // Floating elements
    this.floatingObjects = [];
    this.particleSystem = null;
  }

  init() {
    this.setupScene();
    this.setupCamera();
    this.setupRenderer();
    this.setupLighting();
    this.setupGeometry();
    this.setupEventListeners();
    this.animate();
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x000000, 10, 50);
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.camera.position.set(0, 0, 15);
  }

  setupRenderer() {
    const canvas = document.getElementById("three-canvas");
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
  }

  setupLighting() {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    this.scene.add(ambientLight);

    // Main directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    this.scene.add(directionalLight);

    // LED accent lights
    this.setupAccentLights();
  }

  setupAccentLights() {
    // Blue accent light
    const blueLight = new THREE.PointLight(0x3b82f6, 0.5, 20);
    blueLight.position.set(-8, 5, 8);
    this.scene.add(blueLight);

    // Green accent light
    const greenLight = new THREE.PointLight(0x10b981, 0.3, 15);
    greenLight.position.set(8, -3, 6);
    this.scene.add(greenLight);

    // Store for theme transitions
    this.accentLights = [blueLight, greenLight];
  }

  setupGeometry() {
    this.createFloatingCubes();
    this.createWireframeStructures();
    this.createParticleSystem();
    this.createLEDElements();
  }

  createFloatingCubes() {
    const cubeCount = 8;
    const materials = this.getThemeMaterials();

    for (let i = 0; i < cubeCount; i++) {
      // Create cube geometry
      const size = 0.5 + Math.random() * 1.0;
      const geometry = new THREE.BoxGeometry(size, size, size);

      // Add subtle ambient occlusion effect
      const material = materials.cube.clone();

      const cube = new THREE.Mesh(geometry, material);

      // Random positioning
      cube.position.set(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 10,
      );

      cube.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      );

      // Animation properties
      cube.userData = {
        originalPosition: cube.position.clone(),
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        floatSpeed: 0.01 + Math.random() * 0.02,
        floatRange: 2 + Math.random() * 3,
      };

      cube.castShadow = true;
      cube.receiveShadow = true;

      this.scene.add(cube);
      this.floatingObjects.push(cube);
    }
  }

  createWireframeStructures() {
    // Create geometric wireframe structures
    const structures = [
      { geometry: new THREE.IcosahedronGeometry(3, 1), position: [-12, 8, -5] },
      { geometry: new THREE.OctahedronGeometry(2.5), position: [15, -6, -8] },
      { geometry: new THREE.TetrahedronGeometry(2), position: [-10, -8, 5] },
    ];

    structures.forEach(({ geometry, position }) => {
      const wireframe = new THREE.WireframeGeometry(geometry);
      const material = new THREE.LineBasicMaterial({
        color: 0x666666,
        transparent: true,
        opacity: 0.4,
      });

      const structure = new THREE.LineSegments(wireframe, material);
      structure.position.set(...position);

      structure.userData = {
        rotationSpeed: (Math.random() - 0.5) * 0.01,
        originalPosition: structure.position.clone(),
      };

      this.scene.add(structure);
      this.floatingObjects.push(structure);
    });
  }

  createParticleSystem() {
    const particleCount = 150;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Position
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;

      // Color (subtle variation)
      const brightness = 0.3 + Math.random() * 0.4;
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness;
      colors[i * 3 + 2] = brightness;

      // Size
      sizes[i] = Math.random() * 2 + 1;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: `
                attribute float size;
                varying vec3 vColor;
                uniform float time;

                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
      fragmentShader: `
                varying vec3 vColor;

                void main() {
                    float r = length(gl_PointCoord - vec2(0.5));
                    if (r > 0.5) discard;
                    float alpha = 1.0 - (r * 2.0);
                    gl_FragColor = vec4(vColor, alpha * 0.6);
                }
            `,
      transparent: true,
      vertexColors: true,
    });

    this.particleSystem = new THREE.Points(geometry, material);
    this.scene.add(this.particleSystem);
  }

  createLEDElements() {
    // Create subtle LED-like indicators
    const ledPositions = [
      [10, 8, 2],
      [-12, 6, 3],
      [8, -10, 1],
      [-6, -8, 4],
    ];

    ledPositions.forEach((position, index) => {
      const geometry = new THREE.SphereGeometry(0.1, 8, 6);
      const material = new THREE.MeshBasicMaterial({
        color: index % 2 === 0 ? 0x10b981 : 0x3b82f6,
        transparent: true,
        opacity: 0.8,
      });

      const led = new THREE.Mesh(geometry, material);
      led.position.set(...position);

      led.userData = {
        pulseSpeed: 0.02 + Math.random() * 0.03,
        pulsePhase: Math.random() * Math.PI * 2,
      };

      this.scene.add(led);
      this.floatingObjects.push(led);
    });
  }

  getThemeMaterials() {
    const materials = {};

    switch (this.currentTheme) {
      case "light":
        materials.cube = new THREE.MeshLambertMaterial({
          color: 0xf8f9fa,
          transparent: true,
          opacity: 0.8,
        });
        break;
      case "grey":
        materials.cube = new THREE.MeshLambertMaterial({
          color: 0x6b7280,
          transparent: true,
          opacity: 0.7,
        });
        break;
      case "dark":
      default:
        materials.cube = new THREE.MeshLambertMaterial({
          color: 0x1a1a1a,
          transparent: true,
          opacity: 0.6,
        });
        break;
    }

    return materials;
  }

  updateTheme(theme) {
    this.currentTheme = theme;

    // Update fog color
    const fogColors = {
      light: 0xf8f9fa,
      dark: 0x000000,
      grey: 0x2a2a2a,
    };

    this.scene.fog.color.setHex(fogColors[theme]);
    this.renderer.setClearColor(fogColors[theme], 0);

    // Update materials
    const materials = this.getThemeMaterials();
    this.floatingObjects.forEach((obj) => {
      if (obj.material && obj.geometry.type === "BoxGeometry") {
        obj.material.color.copy(materials.cube.color);
        obj.material.opacity = materials.cube.opacity;
      }
    });
  }

  setupEventListeners() {
    // Mouse movement
    window.addEventListener("mousemove", (event) => {
      this.targetMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.targetMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    // Resize handler
    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Theme change listener
    document.addEventListener("themeChanged", (event) => {
      this.updateTheme(event.detail.theme);
    });
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    const time = this.clock.getElapsedTime();

    // Smooth mouse following
    this.mouse.lerp(this.targetMouse, 0.02);

    // Camera subtle movement based on mouse
    this.camera.position.x +=
      (this.mouse.x * 2 - this.camera.position.x) * 0.01;
    this.camera.position.y +=
      (-this.mouse.y * 2 - this.camera.position.y) * 0.01;
    this.camera.lookAt(0, 0, 0);

    // Animate floating objects
    this.floatingObjects.forEach((obj, index) => {
      if (obj.userData.rotationSpeed) {
        obj.rotation.x += obj.userData.rotationSpeed;
        obj.rotation.y += obj.userData.rotationSpeed * 0.7;
        obj.rotation.z += obj.userData.rotationSpeed * 0.3;
      }

      if (obj.userData.floatSpeed) {
        obj.position.y =
          obj.userData.originalPosition.y +
          Math.sin(time * obj.userData.floatSpeed + index) *
            obj.userData.floatRange;
      }

      if (obj.userData.pulseSpeed) {
        obj.material.opacity =
          0.5 +
          Math.sin(time * obj.userData.pulseSpeed + obj.userData.pulsePhase) *
            0.3;
      }
    });

    // Update particle system
    if (this.particleSystem) {
      this.particleSystem.material.uniforms.time.value = time;
      this.particleSystem.rotation.y += 0.001;
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    // Clean up geometries and materials
    this.geometries.forEach((geometry) => geometry.dispose());
    Object.values(this.materials).forEach((material) => material.dispose());

    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
