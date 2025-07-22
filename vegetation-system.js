// Vegetation System - Minimal Low Poly Plants
class VegetationSystem {
  constructor(scene) {
    this.scene = scene;
    this.plants = [];
    this.trees = [];
  }

  init() {
    console.log("🌱 Growing vegetation...");
    this.createVegetation();
  }

  createVegetation() {
    this.createTrees();
    this.createBushes();
    this.createGrass();
  }

  createTrees() {
    // Create 2-3 minimal trees
    for (let i = 0; i < 3; i++) {
      const tree = this.createSingleTree();

      // Position trees sparsely
      tree.position.set(
        (Math.random() - 0.5) * 60,
        0,
        (Math.random() - 0.5) * 60,
      );

      // Avoid water areas (rough check)
      if (
        tree.position.x > -20 &&
        tree.position.x < -10 &&
        tree.position.z > 5 &&
        tree.position.z < 15
      ) {
        tree.position.x += 20; // Move away from pond
      }

      this.scene.add(tree);
      this.trees.push(tree);
    }
  }

  createSingleTree() {
    const treeGroup = new THREE.Group();

    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 4, 6);
    const trunkMaterial = new THREE.MeshLambertMaterial({
      color: 0xc0c0c0,
      flatShading: true,
    });

    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 2;
    trunk.castShadow = true;

    // Canopy - simple low poly
    const canopyGeometry = new THREE.SphereGeometry(2.5, 6, 4);
    const canopyMaterial = new THREE.MeshLambertMaterial({
      color: 0xb8b8b8,
      flatShading: true,
    });

    const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
    canopy.position.y = 5.5;
    canopy.castShadow = true;

    treeGroup.add(trunk, canopy);
    return treeGroup;
  }

  createBushes() {
    // Small scattered bushes
    for (let i = 0; i < 8; i++) {
      const bushGeometry = new THREE.SphereGeometry(
        0.8 + Math.random() * 0.5,
        5,
        3,
      );
      const bushMaterial = new THREE.MeshLambertMaterial({
        color: 0xc8c8c8,
        flatShading: true,
      });

      const bush = new THREE.Mesh(bushGeometry, bushMaterial);
      bush.position.set(
        (Math.random() - 0.5) * 70,
        bush.geometry.parameters.radius * 0.7,
        (Math.random() - 0.5) * 70,
      );

      bush.castShadow = true;
      bush.receiveShadow = true;

      this.scene.add(bush);
      this.plants.push(bush);
    }
  }

  createGrass() {
    // Very sparse grass patches
    for (let i = 0; i < 15; i++) {
      const grassGroup = new THREE.Group();

      // Create small cluster of grass blades
      for (let j = 0; j < 3; j++) {
        const grassGeometry = new THREE.ConeGeometry(0.1, 0.8, 3);
        const grassMaterial = new THREE.MeshLambertMaterial({
          color: 0xd0d0d0,
          flatShading: true,
        });

        const grass = new THREE.Mesh(grassGeometry, grassMaterial);
        grass.position.set(
          (Math.random() - 0.5) * 1,
          0.4,
          (Math.random() - 0.5) * 1,
        );
        grass.rotation.z = (Math.random() - 0.5) * 0.3;

        grassGroup.add(grass);
      }

      grassGroup.position.set(
        (Math.random() - 0.5) * 80,
        0,
        (Math.random() - 0.5) * 80,
      );

      this.scene.add(grassGroup);
      this.plants.push(grassGroup);
    }
  }

  updateTheme(theme) {
    const colors = {
      light: { trunk: 0xd8d8d8, foliage: 0xe0e0e0 },
      dark: { trunk: 0x606060, foliage: 0x707070 },
      grey: { trunk: 0xa8a8a8, foliage: 0xb8b8b8 },
      monochrome: { trunk: 0xc0c0c0, foliage: 0xb8b8b8 },
    };

    const themeColors = colors[theme] || colors.monochrome;

    // Update trees
    this.trees.forEach((tree) => {
      tree.children.forEach((part, index) => {
        if (index === 0) {
          // trunk
          part.material.color.setHex(themeColors.trunk);
        } else {
          // canopy
          part.material.color.setHex(themeColors.foliage);
        }
      });
    });

    // Update other plants
    this.plants.forEach((plant) => {
      if (plant.material) {
        plant.material.color.setHex(themeColors.foliage);
      } else if (plant.children) {
        plant.children.forEach((child) => {
          if (child.material) {
            child.material.color.setHex(themeColors.foliage);
          }
        });
      }
    });
  }

  update(time, deltaTime) {
    // Gentle swaying animation
    this.trees.forEach((tree, index) => {
      const sway = Math.sin(time * 0.5 + index) * 0.02;
      tree.rotation.z = sway;
    });

    // Grass swaying
    this.plants.forEach((plant, index) => {
      if (plant.children && plant.children.length > 1) {
        // grass clusters
        const grassSway = Math.sin(time * 0.8 + index * 0.3) * 0.05;
        plant.rotation.z = grassSway;
      }
    });
  }

  // Get random landing spot for cardinal
  getRandomLandingSpot() {
    if (this.trees.length === 0) {
      return new THREE.Vector3(0, 2, 0);
    }

    const randomTree =
      this.trees[Math.floor(Math.random() * this.trees.length)];
    return new THREE.Vector3(
      randomTree.position.x + (Math.random() - 0.5) * 3,
      randomTree.position.y + 6 + Math.random() * 2,
      randomTree.position.z + (Math.random() - 0.5) * 3,
    );
  }

  destroy() {
    [...this.trees, ...this.plants].forEach((plant) => {
      this.scene.remove(plant);

      if (plant.geometry && plant.material) {
        plant.geometry.dispose();
        plant.material.dispose();
      } else if (plant.children) {
        plant.children.forEach((child) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
      }
    });

    this.trees = [];
    this.plants = [];
  }
}

// Make globally available
window.VegetationSystem = VegetationSystem;
