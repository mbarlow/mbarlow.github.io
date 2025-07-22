// Cardinal System - Simple Low Poly Bird
class CardinalSystem {
  constructor(scene) {
    this.scene = scene;
    this.cardinal = null;
    this.currentPosition = new THREE.Vector3(0, 8, 0);
    this.targetPosition = new THREE.Vector3(0, 8, 0);
    this.isFlying = false;
    this.landingTimer = 0;
    this.nextMoveTime = 5000; // 5 seconds
    this.wingPhase = 0;
  }

  init() {
    console.log("🐦 Creating cardinal...");
    this.createCardinal();
    this.findLandingSpot();
  }

  createCardinal() {
    const cardinalGroup = new THREE.Group();

    // Body - simple ellipsoid
    const bodyGeometry = new THREE.SphereGeometry(0.3, 6, 4);
    bodyGeometry.scale(1, 0.8, 1.4);
    const bodyMaterial = new THREE.MeshLambertMaterial({
      color: 0xa0a0a0, // Monochrome red hint
      flatShading: true,
    });

    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    cardinalGroup.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.2, 5, 4);
    const headMaterial = new THREE.MeshLambertMaterial({
      color: 0xa8a8a8,
      flatShading: true,
    });

    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 0.1, 0.35);
    head.castShadow = true;
    cardinalGroup.add(head);

    // Beak - tiny cone
    const beakGeometry = new THREE.ConeGeometry(0.03, 0.15, 4);
    const beakMaterial = new THREE.MeshLambertMaterial({
      color: 0x888888,
      flatShading: true,
    });

    const beak = new THREE.Mesh(beakGeometry, beakMaterial);
    beak.position.set(0, 0.05, 0.5);
    beak.rotation.x = Math.PI / 2;
    cardinalGroup.add(beak);

    // Wings - simple flat triangles
    this.leftWing = this.createWing();
    this.leftWing.position.set(-0.25, 0, 0);
    this.leftWing.rotation.z = 0.3;
    cardinalGroup.add(this.leftWing);

    this.rightWing = this.createWing();
    this.rightWing.position.set(0.25, 0, 0);
    this.rightWing.rotation.z = -0.3;
    this.rightWing.scale.x = -1; // Mirror
    cardinalGroup.add(this.rightWing);

    // Tail - simple triangle
    const tailGeometry = new THREE.ConeGeometry(0.1, 0.6, 3);
    const tailMaterial = new THREE.MeshLambertMaterial({
      color: 0x989898,
      flatShading: true,
    });

    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.set(0, 0, -0.4);
    tail.rotation.x = Math.PI / 2;
    cardinalGroup.add(tail);

    // Position cardinal
    cardinalGroup.position.copy(this.currentPosition);
    cardinalGroup.scale.setScalar(1.2);

    this.scene.add(cardinalGroup);
    this.cardinal = cardinalGroup;

    console.log("✅ Cardinal created");
  }

  createWing() {
    const wingGeometry = new THREE.ConeGeometry(0.15, 0.4, 3);
    const wingMaterial = new THREE.MeshLambertMaterial({
      color: 0x959595,
      flatShading: true,
    });

    const wing = new THREE.Mesh(wingGeometry, wingMaterial);
    wing.rotation.x = Math.PI / 2;
    wing.rotation.z = Math.PI / 4;

    return wing;
  }

  findLandingSpot() {
    // Get random position - could be tree, ground, or structure
    const spots = [
      // Tree spots (if vegetation system exists)
      ...(window.industrialPortfolio?.scene?.vegetationSystem
        ?.getRandomLandingSpot
        ? [
            window.industrialPortfolio.scene.vegetationSystem.getRandomLandingSpot(),
          ]
        : []),

      // Ground spots
      new THREE.Vector3(
        (Math.random() - 0.5) * 30,
        1,
        (Math.random() - 0.5) * 30,
      ),
      new THREE.Vector3(
        (Math.random() - 0.5) * 40,
        1.5,
        (Math.random() - 0.5) * 40,
      ),

      // Structure spots (elevated)
      new THREE.Vector3(25, 15, -20), // Tower top
      new THREE.Vector3(-25, 5, -15), // Platform
      new THREE.Vector3(15, 8, 25), // Archway

      // Random elevated spots
      new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        3 + Math.random() * 5,
        (Math.random() - 0.5) * 20,
      ),
    ];

    this.targetPosition = spots[Math.floor(Math.random() * spots.length)];

    // Ensure minimum height
    this.targetPosition.y = Math.max(this.targetPosition.y, 1);
  }

  triggerMovement() {
    if (!this.isFlying) {
      this.findLandingSpot();
      this.isFlying = true;
      this.landingTimer = 0;
      console.log("🐦 Cardinal taking flight...");
    }
  }

  updateTheme(theme) {
    if (!this.cardinal) return;

    // Cardinal gets subtle color hint even in monochrome
    const colors = {
      light: { body: 0xb0b0b0, accent: 0xa8a8a8 },
      dark: { body: 0x505050, accent: 0x606060 },
      grey: { body: 0x808080, accent: 0x909090 },
      monochrome: { body: 0xa0a0a0, accent: 0xa8a8a8 },
    };

    const themeColors = colors[theme] || colors.monochrome;

    this.cardinal.children.forEach((part, index) => {
      if (part.material) {
        const color = index === 0 ? themeColors.body : themeColors.accent;
        part.material.color.setHex(color);
      }
    });
  }

  update(time, deltaTime) {
    if (!this.cardinal) return;

    this.landingTimer += deltaTime * 1000;

    // Automatic movement every 8-12 seconds
    if (!this.isFlying && this.landingTimer > this.nextMoveTime) {
      this.triggerMovement();
      this.nextMoveTime = 8000 + Math.random() * 4000; // 8-12 seconds
    }

    if (this.isFlying) {
      // Fly towards target
      const direction = this.targetPosition.clone().sub(this.currentPosition);
      const distance = direction.length();

      if (distance > 0.5) {
        // Still flying
        direction.normalize();
        const speed = 8; // units per second
        this.currentPosition.add(direction.multiplyScalar(speed * deltaTime));

        // Wing flapping animation
        this.wingPhase += deltaTime * 15;
        const flapIntensity = Math.sin(this.wingPhase) * 0.8;
        this.leftWing.rotation.z = 0.3 + flapIntensity;
        this.rightWing.rotation.z = -0.3 - flapIntensity;

        // Bird looks in flight direction
        this.cardinal.lookAt(this.targetPosition);
        this.cardinal.rotateY(Math.PI); // Fix orientation
      } else {
        // Landed
        this.isFlying = false;
        this.landingTimer = 0;
        this.currentPosition.copy(this.targetPosition);

        // Reset wings
        this.leftWing.rotation.z = 0.3;
        this.rightWing.rotation.z = -0.3;

        console.log("🐦 Cardinal landed");
      }
    } else {
      // Perched - subtle idle animation
      const idle = Math.sin(time * 2) * 0.02;
      this.cardinal.rotation.y = idle;

      // Occasional head turn
      const headTurn = Math.sin(time * 0.3) * 0.5;
      this.cardinal.rotation.y += headTurn * 0.1;
    }

    // Update cardinal position
    this.cardinal.position.copy(this.currentPosition);

    // Add slight bobbing when perched
    if (!this.isFlying) {
      this.cardinal.position.y += Math.sin(time * 1.5) * 0.05;
    }
  }

  destroy() {
    if (this.cardinal) {
      this.scene.remove(this.cardinal);

      this.cardinal.children.forEach((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });

      this.cardinal = null;
    }
  }
}

// Make globally available
window.CardinalSystem = CardinalSystem;
