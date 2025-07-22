// Terrain System - Sparse Low Poly Landscape
class TerrainSystem {
  constructor(scene) {
    this.scene = scene;
    this.terrain = null;
    this.patches = [];
  }

  init() {
    console.log("🌾 Generating terrain...");
    this.createTerrain();
  }

  createTerrain() {
    // Create main ground plane
    const groundGeometry = new THREE.PlaneGeometry(80, 80, 8, 8);

    // Add subtle height variation
    const vertices = groundGeometry.attributes.position.array;
    for (let i = 2; i < vertices.length; i += 3) {
      // Only modify Y coordinates (every 3rd element)
      vertices[i] = (Math.random() - 0.5) * 2;
    }
    groundGeometry.attributes.position.needsUpdate = true;
    groundGeometry.computeVertexNormals();

    const groundMaterial = new THREE.MeshLambertMaterial({
      color: 0xdcdcdc,
      flatShading: true,
    });

    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;

    this.scene.add(ground);
    this.terrain = ground;

    // Add some sparse terrain patches
    this.createTerrainPatches();

    console.log("✅ Terrain generated");
  }

  createTerrainPatches() {
    // Create 3-4 small elevated patches
    for (let i = 0; i < 4; i++) {
      const patchGeometry = new THREE.CylinderGeometry(
        3 + Math.random() * 2, // top radius
        4 + Math.random() * 2, // bottom radius
        0.5 + Math.random() * 1, // height
        6, // segments - low poly
      );

      const patchMaterial = new THREE.MeshLambertMaterial({
        color: 0xe8e8e8,
        flatShading: true,
      });

      const patch = new THREE.Mesh(patchGeometry, patchMaterial);

      // Random position
      patch.position.set(
        (Math.random() - 0.5) * 60,
        patch.geometry.parameters.height / 2,
        (Math.random() - 0.5) * 60,
      );

      patch.castShadow = true;
      patch.receiveShadow = true;

      this.scene.add(patch);
      this.patches.push(patch);
    }
  }

  updateTheme(theme) {
    if (!this.terrain) return;

    const colors = {
      light: 0xf0f0f0,
      dark: 0x404040,
      grey: 0xa0a0a0,
      monochrome: 0xdcdcdc,
    };

    const color = colors[theme] || colors.monochrome;
    this.terrain.material.color.setHex(color);

    // Update patches
    this.patches.forEach((patch) => {
      patch.material.color.setHex(color + 0x101010); // Slightly lighter
    });
  }

  update(time, deltaTime) {
    // Static terrain - no updates needed
  }

  destroy() {
    if (this.terrain) {
      this.scene.remove(this.terrain);
      this.terrain.geometry.dispose();
      this.terrain.material.dispose();
    }

    this.patches.forEach((patch) => {
      this.scene.remove(patch);
      patch.geometry.dispose();
      patch.material.dispose();
    });

    this.patches = [];
  }
}

// Make globally available
window.TerrainSystem = TerrainSystem;
