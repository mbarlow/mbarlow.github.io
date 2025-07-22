// Voxel Data Field System - 3D volumetric data representation
class VoxelSystem {
  constructor(scene) {
    this.scene = scene;
    this.voxelField = null;
    this.voxels = [];
  }

  init() {
    console.log("🧊 Initializing Voxel System...");
    this.createVoxelField();
  }

  createVoxelField() {
    const voxelSize = 0.4;
    const fieldSize = 10;
    const voxelGeometry = new THREE.BoxGeometry(
      voxelSize,
      voxelSize,
      voxelSize,
    );

    this.voxelField = new THREE.Group();

    for (let x = -fieldSize; x <= fieldSize; x += 2) {
      for (let y = -fieldSize; y <= fieldSize; y += 2) {
        for (let z = -fieldSize; z <= fieldSize; z += 2) {
          // Create voxels based on noise function
          const density = this.noiseFunction(x * 0.1, y * 0.1, z * 0.1);

          if (density > 0.3) {
            const material = new THREE.MeshLambertMaterial({
              color: this.getVoxelColor(density),
              transparent: true,
              opacity: 0.3 + density * 0.4,
            });

            const voxel = new THREE.Mesh(voxelGeometry, material);
            voxel.position.set(x, y, z);

            // Store animation data
            voxel.userData = {
              originalPosition: new THREE.Vector3(x, y, z),
              density: density,
              phase: Math.random() * Math.PI * 2,
              frequency: 0.01 + Math.random() * 0.02,
            };

            this.voxelField.add(voxel);
            this.voxels.push(voxel);
          }
        }
      }
    }

    this.scene.add(this.voxelField);
    console.log(`✅ Created ${this.voxels.length} voxels`);
  }

  noiseFunction(x, y, z) {
    return (Math.sin(x * 4) * Math.sin(y * 4) * Math.sin(z * 4) + 1) / 2;
  }

  getVoxelColor(density) {
    const hue = 0.6 - density * 0.3; // Blue to cyan based on density
    return new THREE.Color().setHSL(hue, 0.7, 0.4 + density * 0.3);
  }

  updateTheme(theme) {
    if (!this.voxels) return;

    this.voxels.forEach((voxel) => {
      const baseColor =
        theme === "light" ? 0x8090a0 : theme === "grey" ? 0x606070 : 0x304060;
      voxel.material.color.setHex(baseColor);
    });
  }

  update(time, dataMetrics) {
    if (!this.voxels) return;

    this.voxels.forEach((voxel, index) => {
      const userData = voxel.userData;
      const pulse = Math.sin(time * userData.frequency + userData.phase) * 0.5;

      // Organic pulsing movement
      voxel.position.y =
        userData.originalPosition.y + pulse * dataMetrics.complexity;
      voxel.material.opacity =
        0.3 + Math.abs(pulse) * 0.4 * dataMetrics.activity;

      // Subtle rotation
      voxel.rotation.x += 0.005 * dataMetrics.activity;
      voxel.rotation.y += 0.007 * dataMetrics.activity;
    });
  }

  destroy() {
    if (this.voxelField) {
      this.scene.remove(this.voxelField);

      this.voxels.forEach((voxel) => {
        voxel.geometry.dispose();
        voxel.material.dispose();
      });

      this.voxels = [];
      this.voxelField = null;
    }
  }
}

// Make globally available
window.VoxelSystem = VoxelSystem;
