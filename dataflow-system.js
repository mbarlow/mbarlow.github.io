// Data Flow Visualization System - Flowing data streams
class DataFlowSystem {
  constructor(scene) {
    this.scene = scene;
    this.flowPaths = [];
    this.particles = null;
  }

  init() {
    console.log("🌊 Initializing Data Flow System...");
    this.createFlowPaths();
    this.createFlowParticles();
  }

  createFlowPaths() {
    const pathCount = 5;

    for (let i = 0; i < pathCount; i++) {
      const points = [];
      const pathLength = 40;

      // Create organic flow paths using parametric equations
      for (let j = 0; j < pathLength; j++) {
        const t = j / pathLength;

        // Organic flow equations
        const x =
          Math.sin(t * Math.PI * 2 + i) * 8 + Math.sin(t * Math.PI * 6) * 2;
        const y =
          Math.cos(t * Math.PI * 1.5 + i * 0.5) * 4 +
          Math.sin(t * Math.PI * 4) * 1;
        const z = Math.sin(t * Math.PI * 3) * 6 - 5 + i * 2;

        points.push(new THREE.Vector3(x, y, z));
      }

      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeometry = new THREE.TubeGeometry(curve, 64, 0.05, 6, false);

      const hue = (i / pathCount) * 0.8; // Spread across color spectrum
      const flowMaterial = new THREE.MeshLambertMaterial({
        color: new THREE.Color().setHSL(hue, 0.7, 0.5),
        transparent: true,
        opacity: 0.6,
      });

      // Add emissive separately since MeshBasicMaterial doesn't support it
      flowMaterial.emissive = new THREE.Color().setHSL(hue, 0.5, 0.1);

      const flowMesh = new THREE.Mesh(tubeGeometry, flowMaterial);
      flowMesh.userData = {
        originalColor: flowMaterial.color.clone(),
        originalEmissive: flowMaterial.emissive.clone(),
        flowSpeed: 0.01 + Math.random() * 0.02,
        pathIndex: i,
        curve: curve,
      };

      this.scene.add(flowMesh);
      this.flowPaths.push(flowMesh);
    }

    console.log(`✅ Created ${pathCount} data flow paths`);
  }

  createFlowParticles() {
    // Create particles that flow along the paths
    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Random initial positions
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;

      // Bright colors for flowing data
      const hue = Math.random();
      const color = new THREE.Color().setHSL(hue, 0.8, 0.7);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = Math.random() * 3 + 1;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );
    particleGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(colors, 3),
    );
    particleGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.ShaderMaterial({
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

                    // Flowing effect
                    float flow = sin(time * 3.0 + position.x * 0.1) * 0.5 + 1.0;

                    gl_PointSize = size * flow * (100.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
      fragmentShader: `
                varying vec3 vColor;

                void main() {
                    float r = length(gl_PointCoord - vec2(0.5));
                    if (r > 0.5) discard;

                    float alpha = (1.0 - r * 2.0) * 0.8;
                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particles = new THREE.Points(particleGeometry, particleMaterial);
    this.scene.add(this.particles);
  }

  updateTheme(theme) {
    // Update flow path colors
    this.flowPaths.forEach((path) => {
      const userData = path.userData;
      const intensity = theme === "light" ? 0.3 : theme === "grey" ? 0.6 : 1.0;

      if (userData.originalColor) {
        path.material.color
          .copy(userData.originalColor)
          .multiplyScalar(intensity);
      }
      if (userData.originalEmissive && path.material.emissive) {
        path.material.emissive
          .copy(userData.originalEmissive)
          .multiplyScalar(intensity);
      }
    });

    // Update particle colors
    if (this.particles) {
      const colors = this.particles.geometry.attributes.color.array;
      const intensity = theme === "light" ? 0.4 : theme === "grey" ? 0.7 : 1.0;

      for (let i = 0; i < colors.length; i++) {
        colors[i] *= intensity;
      }

      this.particles.geometry.attributes.color.needsUpdate = true;
    }
  }

  update(time, dataMetrics) {
    // Update flow paths
    this.flowPaths.forEach((path) => {
      const userData = path.userData;
      const flow =
        Math.sin(time * userData.flowSpeed + userData.pathIndex) * 0.5 + 0.5;
      const activityMultiplier = 0.5 + dataMetrics.activity * 0.5;

      path.material.opacity = (0.4 + flow * 0.4) * activityMultiplier;

      // Only update emissive if it exists
      if (path.material.emissive) {
        const emissiveIntensity = flow * dataMetrics.connections * 0.3;
        path.material.emissive.setScalar(emissiveIntensity);
      }
    });

    // Update flowing particles
    if (this.particles) {
      this.particles.material.uniforms.time.value = time;

      // Move particles along flow direction
      const positions = this.particles.geometry.attributes.position.array;

      for (let i = 0; i < positions.length; i += 3) {
        // Simple flowing motion
        positions[i] +=
          Math.sin(time * 0.5 + i * 0.01) * 0.02 * dataMetrics.activity;
        positions[i + 1] +=
          Math.cos(time * 0.3 + i * 0.01) * 0.01 * dataMetrics.activity;
        positions[i + 2] +=
          Math.sin(time * 0.7 + i * 0.01) * 0.015 * dataMetrics.activity;

        // Wrap around boundaries
        if (positions[i] > 20) positions[i] = -20;
        if (positions[i] < -20) positions[i] = 20;
        if (positions[i + 1] > 10) positions[i + 1] = -10;
        if (positions[i + 1] < -10) positions[i + 1] = 10;
        if (positions[i + 2] > 10) positions[i + 2] = -10;
        if (positions[i + 2] < -10) positions[i + 2] = 10;
      }

      this.particles.geometry.attributes.position.needsUpdate = true;
    }
  }

  destroy() {
    // Clean up flow paths
    this.flowPaths.forEach((path) => {
      this.scene.remove(path);
      path.geometry.dispose();
      path.material.dispose();
    });
    this.flowPaths = [];

    // Clean up particles
    if (this.particles) {
      this.scene.remove(this.particles);
      this.particles.geometry.dispose();
      this.particles.material.dispose();
      this.particles = null;
    }
  }
}

// Make globally available
window.DataFlowSystem = DataFlowSystem;
