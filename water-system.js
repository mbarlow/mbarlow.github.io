// Water System - Simple Low Poly Water Features
class WaterSystem {
  constructor(scene) {
    this.scene = scene;
    this.waterBodies = [];
  }

  init() {
    console.log("💧 Creating water features...");
    this.createWaterBodies();
  }

  createWaterBodies() {
    // Create a small pond
    const pondGeometry = new THREE.CircleGeometry(8, 8);
    const pondMaterial = new THREE.MeshLambertMaterial({
      color: 0xb8b8b8,
      transparent: true,
      opacity: 0.7,
      flatShading: true,
    });

    const pond = new THREE.Mesh(pondGeometry, pondMaterial);
    pond.rotation.x = -Math.PI / 2;
    pond.position.set(-15, 0.01, 10);

    this.scene.add(pond);
    this.waterBodies.push(pond);

    // Create a small stream (series of connected circles)
    for (let i = 0; i < 5; i++) {
      const streamGeometry = new THREE.CircleGeometry(2 + Math.random(), 6);
      const streamMaterial = new THREE.MeshLambertMaterial({
        color: 0xc0c0c0,
        transparent: true,
        opacity: 0.6,
        flatShading: true,
      });

      const streamPart = new THREE.Mesh(streamGeometry, streamMaterial);
      streamPart.rotation.x = -Math.PI / 2;
      streamPart.position.set(20 + i * 3, 0.01, -10 + Math.sin(i * 0.8) * 4);

      this.scene.add(streamPart);
      this.waterBodies.push(streamPart);
    }

    console.log("✅ Water features created");
  }

  updateTheme(theme) {
    const colors = {
      light: 0xd0d0d0,
      dark: 0x606060,
      grey: 0x909090,
      monochrome: 0xb8b8b8,
    };

    const color = colors[theme] || colors.monochrome;

    this.waterBodies.forEach((water) => {
      water.material.color.setHex(color);
    });
  }

  update(time, deltaTime) {
    // Subtle water animation
    this.waterBodies.forEach((water, index) => {
      const ripple = Math.sin(time * 0.5 + index) * 0.02;
      water.position.y = 0.01 + ripple;

      // Very subtle opacity variation
      water.material.opacity = 0.6 + Math.sin(time * 0.3 + index) * 0.1;
    });
  }

  destroy() {
    this.waterBodies.forEach((water) => {
      this.scene.remove(water);
      water.geometry.dispose();
      water.material.dispose();
    });
    this.waterBodies = [];
  }
}

// Make globally available
window.WaterSystem = WaterSystem;
