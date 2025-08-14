import { System } from "../../core/System.js";
import { VoxelIndicatorComponent } from "../../components/VoxelIndicatorComponent.js";
import { TransformComponent } from "../../components/TransformComponent.js";

/**
 * VoxelIndicatorRenderSystem - Renders 3D voxel indicators
 * Each voxel is a small cube that can appear, pulse, and disappear with smooth animations
 * Much more visually impressive than flat 2D billboards
 */
export class VoxelIndicatorRenderSystem extends System {
  constructor(scene, camera) {
    super();
    this.requiredComponents = [VoxelIndicatorComponent, TransformComponent];

    this.scene = scene;
    this.camera = camera;

    console.log(
      "🧊 VoxelIndicatorRenderSystem created with:",
      "scene:",
      !!scene,
      "camera:",
      !!camera,
    );

    // Voxel tracking - each indicator has multiple cube meshes
    this.voxelIndicators = new Map(); // entity.id -> { component, group, cubes[] }

    // Performance settings
    this.maxRenderDistance = 30;
    this.lodDistances = {
      high: 8, // Full detail
      medium: 15, // Reduced detail
      low: 30, // Very simple or hidden
    };

    // Shared resources for efficiency
    this.geometries = new Map();
    this.materials = new Map();

    this.initializeSharedResources();

    console.log("🧊 VoxelIndicatorRenderSystem initialized");
  }

  initializeSharedResources() {
    // Create cube geometries for different LOD levels
    this.createCubeGeometry("high", 1.0);
    this.createCubeGeometry("medium", 0.8);
    this.createCubeGeometry("low", 0.6);

    // Create materials for different effects
    this.createVoxelMaterials();
  }

  createCubeGeometry(lod, scale) {
    const size = 0.12 * scale; // Much larger cubes for visibility
    const geometry = new THREE.BoxGeometry(size, size, size);

    // Slightly rounded edges for better visual appeal
    geometry.computeBoundingBox();

    this.geometries.set(lod, geometry);
  }

  createVoxelMaterials() {
    // Base material for voxels with emissive properties (LED-like)
    const baseMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: 0x111111,
      shininess: 100,
      transparent: true,
      opacity: 1.0,
    });

    this.materials.set("base", baseMaterial);

    // Pulsing material shader for LED effects
    const pulsingVertexShader = `
            varying vec3 vPosition;
            varying vec3 vNormal;

            void main() {
                vPosition = position;
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

    const pulsingFragmentShader = `
            uniform vec3 baseColor;
            uniform float brightness;
            uniform float pulsePhase;
            uniform float opacity;

            varying vec3 vPosition;
            varying vec3 vNormal;

            void main() {
                // LED-style pulsing effect
                float pulse = 0.7 + 0.3 * sin(pulsePhase);

                // Basic lighting
                vec3 lightDirection = normalize(vec3(1.0, 1.0, 1.0));
                float lightIntensity = max(0.3, dot(vNormal, lightDirection));

                // Combine color with pulsing and lighting
                vec3 finalColor = baseColor * brightness * pulse * lightIntensity;

                // Add emissive glow
                finalColor += baseColor * brightness * 0.2;

                gl_FragColor = vec4(finalColor, opacity);
            }
        `;

    const pulsingMaterial = new THREE.ShaderMaterial({
      vertexShader: pulsingVertexShader,
      fragmentShader: pulsingFragmentShader,
      uniforms: {
        baseColor: { value: new THREE.Color(1, 1, 1) },
        brightness: { value: 1.0 },
        pulsePhase: { value: 0.0 },
        opacity: { value: 1.0 },
      },
      transparent: true,
    });

    this.materials.set("pulsing", pulsingMaterial);
  }

  createVoxelIndicatorGroup(entity, voxelComponent) {
    const group = new THREE.Group();
    group.userData = {}; // Initialize userData
    const cubes = [];

    // Create cube meshes for each potential voxel position
    for (let i = 0; i < voxelComponent.voxelCount; i++) {
      const coords = voxelComponent.getVoxelCoords(i);
      const worldPos = voxelComponent.getVoxelWorldPosition(
        coords.x,
        coords.y,
        coords.z,
      );

      // Create cube mesh
      const geometry = this.geometries.get("high");
      const material = this.materials.get("pulsing").clone();
      const cube = new THREE.Mesh(geometry, material);

      // Position the cube
      cube.position.set(worldPos.x, worldPos.y, worldPos.z);

      // Initially hidden
      cube.visible = false;
      cube.scale.setScalar(0);

      // Store voxel data reference
      cube.userData = {
        voxelIndex: i,
        coords: coords,
        originalScale: 1.0,
        entity: entity,
      };

      cubes.push(cube);
      group.add(cube);
    }

    // Position the group relative to entity
    const transform = entity.getComponent(TransformComponent);
    if (transform) {
      group.position.copy(transform.position);
      group.position.x += voxelComponent.position.x;
      group.position.y += voxelComponent.position.y;
      group.position.z += voxelComponent.position.z;
    }

    group.scale.setScalar(voxelComponent.scale);

    // Store entity reference in group userData
    group.userData.entity = entity;

    return { component: voxelComponent, group, cubes };
  }

  addEntity(entity) {
    const voxelComponent = entity.getComponent(VoxelIndicatorComponent);
    if (!voxelComponent) return;

    // Check if indicator already exists
    if (this.voxelIndicators.has(entity.id)) {
      console.log(
        `⚠️ VoxelIndicator already exists for entity ${entity.id}, skipping`,
      );
      return;
    }

    const indicatorData = this.createVoxelIndicatorGroup(
      entity,
      voxelComponent,
    );
    this.voxelIndicators.set(entity.id, indicatorData);
    this.scene.add(indicatorData.group);

    console.log(
      `🧊 Added voxel indicator for entity ${entity.id} (${voxelComponent.voxelCount} voxels)`,
    );
  }

  removeEntity(entity) {
    if (!entity || !entity.id) {
      console.warn("🧊 removeEntity called with invalid entity");
      return;
    }

    const indicatorData = this.voxelIndicators.get(entity.id);
    if (indicatorData) {
      this.scene.remove(indicatorData.group);

      // Clean up materials
      indicatorData.cubes.forEach((cube) => {
        cube.material.dispose();
      });

      this.voxelIndicators.delete(entity.id);
      console.log(`🗑️ Removed voxel indicator for entity ${entity.id}`);
    }
  }

  updateVoxelIndicator(entity, indicatorData, deltaTime) {
    const { component, group, cubes } = indicatorData;
    const transform = entity.getComponent(TransformComponent);

    if (!component || !transform) return;

    // Update group position relative to entity
    group.position.copy(transform.position);
    group.position.x += component.position.x;
    group.position.y += component.position.y;
    group.position.z += component.position.z;

    // Update group scale
    group.scale.setScalar(component.scale);

    // Update individual voxel cubes
    const voxelData = component.getRenderData();
    const currentTime = Date.now();

    cubes.forEach((cube, index) => {
      const voxel = voxelData[index];
      if (!voxel) return;

      // Update material color and properties
      const material = cube.material;
      if (material.uniforms) {
        // Update color
        const r = voxel.color[0] / 255;
        const g = voxel.color[1] / 255;
        const b = voxel.color[2] / 255;
        material.uniforms.baseColor.value.setRGB(r, g, b);

        // Update brightness
        material.uniforms.brightness.value =
          voxel.brightness * component.brightness;

        // Update pulsing phase for LED effect
        if (voxel.animationType === "pulse") {
          material.uniforms.pulsePhase.value = voxel.animationPhase;
        }

        // Handle appear/disappear animations
        let targetScale = 0;
        let targetOpacity = 0;

        if (voxel.animationType === "appear") {
          // Bouncy appear animation
          const progress = voxel.appearProgress;
          targetScale = this.easeOutBounce(progress);
          targetOpacity = Math.min(1, progress * 2);
          cube.visible = true;

          if (index === 0) {
            // Debug first cube only
            console.log("🧊 Cube appearing:", progress, "scale:", targetScale);
          }
        } else if (voxel.animationType === "disappear") {
          // Quick scale-down disappear
          const progress = 1 - voxel.disappearProgress;
          targetScale = progress * progress; // Ease in
          targetOpacity = progress;
        } else if (voxel.visible) {
          // Steady state
          targetScale = 1.0;
          targetOpacity = 1.0;
          cube.visible = true;
        } else {
          // Hidden
          cube.visible = false;
          targetScale = 0;
          targetOpacity = 0;
        }

        // Smooth transitions
        const lerpFactor = Math.min(1, deltaTime / 50); // 50ms smooth transition

        const currentScale = cube.scale.x;
        const newScale = this.lerp(currentScale, targetScale, lerpFactor);
        cube.scale.setScalar(newScale);

        const currentOpacity = material.uniforms.opacity.value;
        const newOpacity = this.lerp(
          currentOpacity,
          targetOpacity * 0.8,
          lerpFactor,
        ); // 0.8 max opacity
        material.uniforms.opacity.value = newOpacity;

        // Hide cube if scale is too small
        if (newScale < 0.01) {
          cube.visible = false;
        }
      }
    });

    // Update component animations
    const hasUpdates = component.update(deltaTime);
  }

  updateLOD(indicatorData, distance) {
    const { group, cubes } = indicatorData;
    let newLOD = "high";

    if (distance > this.lodDistances.low) {
      newLOD = "hidden";
    } else if (distance > this.lodDistances.medium) {
      newLOD = "low";
    } else if (distance > this.lodDistances.high) {
      newLOD = "medium";
    }

    // Update LOD if changed
    if (newLOD !== group.userData.lastLOD) {
      group.userData.lastLOD = newLOD;

      if (newLOD === "hidden") {
        group.visible = false;
      } else {
        group.visible = true;

        // Switch geometry for LOD
        const geometry = this.geometries.get(newLOD);
        cubes.forEach((cube) => {
          cube.geometry = geometry;
        });
      }
    }
  }

  update(deltaTime) {
    if (!this.camera) {
      // Try to get camera from world if not set
      if (this.world) {
        const cameraSystem = this.world.getSystem("camera");
        if (cameraSystem) {
          const activeCamera = cameraSystem.getActiveCamera();
          this.camera = activeCamera?.camera;
        }
      }
      if (!this.camera) return;
    }

    const cameraPosition = this.camera.position;

    // Update all voxel indicators
    for (const [entityId, indicatorData] of this.voxelIndicators) {
      const entity =
        indicatorData.group.userData.entity ||
        Array.from(this.world?.entities?.values() || []).find(
          (e) => e.id === entityId,
        );

      // Check if entity still exists and has required components
      if (
        !entity ||
        !entity.hasComponent(VoxelIndicatorComponent) ||
        !entity.hasComponent(TransformComponent)
      ) {
        console.log(
          "🧊 Entity",
          entityId,
          "missing components:",
          "entity exists:",
          !!entity,
          "has VoxelIndicator:",
          entity?.hasComponent(VoxelIndicatorComponent),
          "has Transform:",
          entity?.hasComponent(TransformComponent),
        );
        // Remove by entity ID instead of entity object
        const mesh = this.voxelIndicators.get(entityId);
        if (mesh) {
          this.scene.remove(mesh.group);

          // Clean up materials
          mesh.cubes.forEach((cube) => {
            cube.material.dispose();
          });

          this.voxelIndicators.delete(entityId);
          console.log(`🗑️ Removed voxel indicator for entity ${entityId}`);
        }
        continue;
      }

      // Calculate distance for LOD
      const distance = indicatorData.group.position.distanceTo(cameraPosition);

      // Skip updates for very distant indicators
      if (distance > this.maxRenderDistance) {
        indicatorData.group.visible = false;
        continue;
      }

      // Update LOD
      this.updateLOD(indicatorData, distance);

      // Update indicator if visible
      if (indicatorData.group.visible) {
        this.updateVoxelIndicator(entity, indicatorData, deltaTime);
      }
    }
  }

  // Utility methods

  lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  easeOutBounce(x) {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (x < 1 / d1) {
      return n1 * x * x;
    } else if (x < 2 / d1) {
      return n1 * (x -= 1.5 / d1) * x + 0.75;
    } else if (x < 2.5 / d1) {
      return n1 * (x -= 2.25 / d1) * x + 0.9375;
    } else {
      return n1 * (x -= 2.625 / d1) * x + 0.984375;
    }
  }

  /**
   * Get indicator data for an entity
   */
  getIndicatorData(entity) {
    return this.voxelIndicators.get(entity.id);
  }

  /**
   * Force update an indicator
   */
  forceUpdate(entity) {
    const indicatorData = this.voxelIndicators.get(entity.id);
    if (indicatorData) {
      this.updateVoxelIndicator(entity, indicatorData, 16); // Force 16ms update
    }
  }

  /**
   * Get render statistics
   */
  getStats() {
    let totalCubes = 0;
    let visibleCubes = 0;
    let animatingCubes = 0;

    for (const indicatorData of this.voxelIndicators.values()) {
      totalCubes += indicatorData.cubes.length;

      indicatorData.cubes.forEach((cube) => {
        if (cube.visible) visibleCubes++;

        const voxel = indicatorData.component.voxels[cube.userData.voxelIndex];
        if (voxel && voxel.isAnimating) animatingCubes++;
      });
    }

    return {
      indicators: this.voxelIndicators.size,
      totalCubes,
      visibleCubes,
      animatingCubes,
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    // Remove all indicators
    for (const [entityId, indicatorData] of this.voxelIndicators) {
      this.scene.remove(indicatorData.group);

      indicatorData.cubes.forEach((cube) => {
        cube.material.dispose();
      });
    }

    this.voxelIndicators.clear();

    // Dispose shared resources
    for (const geometry of this.geometries.values()) {
      geometry.dispose();
    }

    for (const material of this.materials.values()) {
      material.dispose();
    }

    this.geometries.clear();
    this.materials.clear();

    console.log("🧹 VoxelIndicatorRenderSystem resources cleaned up");
  }
}
