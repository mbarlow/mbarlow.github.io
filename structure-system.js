// Structure System - Sparse Minimal Buildings
class StructureSystem {
  constructor(scene) {
    this.scene = scene;
    this.structures = [];
  }

  init() {
    console.log("🏘️ Building structures...");
    this.createStructures();
  }

  createStructures() {
    // Create a few minimal structures
    this.createTower();
    this.createPlatform();
    this.createArchway();
  }

  createTower() {
    // Simple cylindrical tower
    const towerGeometry = new THREE.CylinderGeometry(1.5, 2, 12, 6);
    const towerMaterial = new THREE.MeshLambertMaterial({
      color: 0xe0e0e0,
      flatShading: true,
    });

    const tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(25, 6, -20);
    tower.castShadow = true;
    tower.receiveShadow = true;

    // Add a simple roof
    const roofGeometry = new THREE.ConeGeometry(2.5, 3, 6);
    const roofMaterial = new THREE.MeshLambertMaterial({
      color: 0xd0d0d0,
      flatShading: true,
    });

    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(25, 12.5, -20);
    roof.castShadow = true;

    this.scene.add(tower);
    this.scene.add(roof);
    this.structures.push(tower, roof);
  }

  createPlatform() {
    // Floating minimal platform
    const platformGeometry = new THREE.BoxGeometry(8, 0.5, 8);
    const platformMaterial = new THREE.MeshLambertMaterial({
      color: 0xececec,
      flatShading: true,
    });

    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(-25, 4, -15);
    platform.castShadow = true;
    platform.receiveShadow = true;

    // Add support pillars
    for (let i = 0; i < 4; i++) {
      const pillarGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4);
      const pillarMaterial = new THREE.MeshLambertMaterial({
        color: 0xd8d8d8,
        flatShading: true,
      });

      const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      const offsetX = i % 2 === 0 ? -3 : 3;
      const offsetZ = i < 2 ? -3 : 3;
      pillar.position.set(-25 + offsetX, 2, -15 + offsetZ);
      pillar.castShadow = true;

      this.scene.add(pillar);
      this.structures.push(pillar);
    }

    this.scene.add(platform);
    this.structures.push(platform);
  }

  createArchway() {
    // Simple archway structure
    const archGroup = new THREE.Group();

    // Left pillar
    const leftPillar = new THREE.Mesh(
      new THREE.BoxGeometry(1, 8, 1),
      new THREE.MeshLambertMaterial({ color: 0xdadada, flatShading: true }),
    );
    leftPillar.position.set(-2, 4, 0);
    leftPillar.castShadow = true;

    // Right pillar
    const rightPillar = new THREE.Mesh(
      new THREE.BoxGeometry(1, 8, 1),
      new THREE.MeshLambertMaterial({ color: 0xdadada, flatShading: true }),
    );
    rightPillar.position.set(2, 4, 0);
    rightPillar.castShadow = true;

    // Top beam
    const topBeam = new THREE.Mesh(
      new THREE.BoxGeometry(5, 0.8, 1),
      new THREE.MeshLambertMaterial({ color: 0xd0d0d0, flatShading: true }),
    );
    topBeam.position.set(0, 7.6, 0);
    topBeam.castShadow = true;

    archGroup.add(leftPillar, rightPillar, topBeam);
    archGroup.position.set(15, 0, 25);

    this.scene.add(archGroup);
    this.structures.push(archGroup);
  }

  updateTheme(theme) {
    const colors = {
      light: { main: 0xf0f0f0, accent: 0xe8e8e8 },
      dark: { main: 0x505050, accent: 0x404040 },
      grey: { main: 0xb0b0b0, accent: 0xa0a0a0 },
      monochrome: { main: 0xe0e0e0, accent: 0xd0d0d0 },
    };

    const themeColors = colors[theme] || colors.monochrome;

    this.structures.forEach((structure, index) => {
      if (structure.material) {
        // Alternate between main and accent colors
        const color = index % 2 === 0 ? themeColors.main : themeColors.accent;
        structure.material.color.setHex(color);
      } else if (structure.children) {
        // Handle groups
        structure.children.forEach((child, childIndex) => {
          if (child.material) {
            const color =
              childIndex % 2 === 0 ? themeColors.main : themeColors.accent;
            child.material.color.setHex(color);
          }
        });
      }
    });
  }

  update(time, deltaTime) {
    // Static structures - no animation needed
  }

  destroy() {
    this.structures.forEach((structure) => {
      this.scene.remove(structure);

      if (structure.geometry && structure.material) {
        structure.geometry.dispose();
        structure.material.dispose();
      } else if (structure.children) {
        structure.children.forEach((child) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
      }
    });
    this.structures = [];
  }
}

// Make globally available
window.StructureSystem = StructureSystem;
