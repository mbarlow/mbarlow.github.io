// Organic Tessellation System - Morphing geometric forms
class OrganicSystem {
  constructor(scene) {
    this.scene = scene;
    this.tessellationMesh = null;
    this.networkNodes = [];
  }

  init() {
    console.log("🌿 Initializing Organic System...");
    this.createTessellatingGeometry();
    this.createNetworkNodes();
  }

  createTessellatingGeometry() {
    // Create an icosphere that morphs with data
    const baseGeometry = new THREE.IcosahedronGeometry(4, 2);

    // Simple material that responds to data
    const material = new THREE.MeshLambertMaterial({
      color: 0x4080ff,
      transparent: true,
      opacity: 0.7,
      wireframe: false,
    });

    this.tessellationMesh = new THREE.Mesh(baseGeometry, material);
    this.tessellationMesh.position.set(-15, 5, -8);

    // Store original vertices for morphing
    const positions = baseGeometry.attributes.position.array;
    this.originalVertices = [];

    for (let i = 0; i < positions.length; i += 3) {
      this.originalVertices.push({
        x: positions[i],
        y: positions[i + 1],
        z: positions[i + 2],
      });
    }

    this.scene.add(this.tessellationMesh);
  }

  createNetworkNodes() {
    const nodeCount = 12;

    for (let i = 0; i < nodeCount; i++) {
      const nodeGeometry = new THREE.SphereGeometry(0.3, 16, 16);
      const nodeMaterial = new THREE.MeshLambertMaterial({
        color: 0x4080ff,
        transparent: true,
        opacity: 0.8,
        emissive: 0x102040,
      });

      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);

      // Position nodes in organic formation
      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = 12 + Math.sin(i * 0.7) * 4;
      const height = Math.sin(i * 1.3) * 6;

      node.position.set(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius,
      );

      node.userData = {
        originalPosition: node.position.clone(),
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.03,
        connections: [],
      };

      this.networkNodes.push(node);
      this.scene.add(node);
    }

    // Create connections between nearby nodes
    this.createConnections();
    console.log(`✅ Created ${this.networkNodes.length} network nodes`);
  }

  createConnections() {
    for (let i = 0; i < this.networkNodes.length; i++) {
      for (let j = i + 1; j < this.networkNodes.length; j++) {
        const distance = this.networkNodes[i].position.distanceTo(
          this.networkNodes[j].position,
        );

        if (distance < 8 && Math.random() > 0.6) {
          const connectionGeometry = new THREE.BufferGeometry().setFromPoints([
            this.networkNodes[i].position,
            this.networkNodes[j].position,
          ]);

          const connectionMaterial = new THREE.LineBasicMaterial({
            color: 0x406080,
            transparent: true,
            opacity: 0.3,
          });

          const connection = new THREE.Line(
            connectionGeometry,
            connectionMaterial,
          );
          connection.userData = {
            nodeA: this.networkNodes[i],
            nodeB: this.networkNodes[j],
            pulseOffset: Math.random() * Math.PI * 2,
          };

          this.scene.add(connection);
          this.networkNodes[i].userData.connections.push(connection);
          this.networkNodes[j].userData.connections.push(connection);
        }
      }
    }
  }

  updateTheme(theme) {
    // Update tessellation mesh
    if (this.tessellationMesh) {
      const colors = {
        light: 0x6080a0,
        dark: 0x4080ff,
        grey: 0x6080a0,
      };
      this.tessellationMesh.material.color.setHex(colors[theme] || colors.dark);
    }

    // Update network nodes
    this.networkNodes.forEach((node) => {
      const colors = {
        light: 0x6080a0,
        dark: 0x4080ff,
        grey: 0x6080a0,
      };
      node.material.color.setHex(colors[theme] || colors.dark);
    });
  }

  update(time, dataMetrics) {
    // Animate tessellation mesh
    if (this.tessellationMesh) {
      // Simple morphing based on data
      const positions =
        this.tessellationMesh.geometry.attributes.position.array;

      for (let i = 0; i < this.originalVertices.length; i++) {
        const vertex = this.originalVertices[i];
        const displacement =
          Math.sin(time * 2 + vertex.x * 0.5) *
          Math.sin(time * 1.7 + vertex.y * 0.3) *
          dataMetrics.complexity *
          0.5;

        positions[i * 3] = vertex.x + vertex.x * displacement * 0.1;
        positions[i * 3 + 1] = vertex.y + vertex.y * displacement * 0.1;
        positions[i * 3 + 2] = vertex.z + vertex.z * displacement * 0.1;
      }

      this.tessellationMesh.geometry.attributes.position.needsUpdate = true;
      this.tessellationMesh.rotation.y += 0.005 * dataMetrics.activity;
    }

    // Animate network nodes
    this.networkNodes.forEach((node) => {
      const userData = node.userData;
      const pulse = Math.sin(time * userData.pulseSpeed + userData.pulsePhase);

      // Pulsing scale
      node.scale.setScalar(1 + pulse * 0.2 * dataMetrics.activity);

      // Update emissive based on pulse
      const emissiveIntensity =
        0.1 + Math.abs(pulse) * 0.1 * dataMetrics.connections;
      node.material.emissive.setScalar(emissiveIntensity);

      // Update connections
      userData.connections.forEach((connection) => {
        const opacity = 0.3 + Math.abs(pulse) * 0.3 * dataMetrics.connections;
        connection.material.opacity = opacity;
      });
    });
  }

  destroy() {
    // Clean up tessellation mesh
    if (this.tessellationMesh) {
      this.scene.remove(this.tessellationMesh);
      this.tessellationMesh.geometry.dispose();
      this.tessellationMesh.material.dispose();
      this.tessellationMesh = null;
    }

    // Clean up network nodes
    this.networkNodes.forEach((node) => {
      this.scene.remove(node);
      node.geometry.dispose();
      node.material.dispose();

      // Clean up connections
      node.userData.connections.forEach((connection) => {
        this.scene.remove(connection);
        connection.geometry.dispose();
        connection.material.dispose();
      });
    });

    this.networkNodes = [];
  }
}

// Make globally available
window.OrganicSystem = OrganicSystem;
