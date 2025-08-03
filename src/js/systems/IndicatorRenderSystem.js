import { System } from '../core/System.js';
import { IndicatorComponent } from '../components/IndicatorComponent.js';
import { TransformComponent } from '../components/TransformComponent.js';

/**
 * IndicatorRenderSystem - Renders RGB indicator displays in 3D space
 * Uses Three.js DataTexture for efficient pixel-perfect rendering
 * Implements billboard behavior to keep indicators facing the camera
 */
export class IndicatorRenderSystem extends System {
    constructor(scene, camera) {
        super();
        this.requiredComponents = [IndicatorComponent, TransformComponent];
        
        this.scene = scene;
        this.camera = camera;
        
        // Indicator tracking
        this.indicators = new Map(); // entity.id -> indicator mesh
        this.textureCache = new Map(); // for shared textures
        
        // Performance settings
        this.maxRenderDistance = 50;
        this.lodDistances = {
            high: 10,   // Full resolution
            medium: 25, // Half resolution
            low: 50     // Quarter resolution or hidden
        };
        
        // Shared resources
        this.geometries = new Map();
        this.materials = new Map();
        
        this.initializeSharedResources();
    }

    initializeSharedResources() {
        // Create geometries for different LOD levels
        this.createGeometry('high', 1.0);
        this.createGeometry('medium', 0.8);
        this.createGeometry('low', 0.6);
        
        // Create billboard shader material
        this.createBillboardMaterial();
    }

    createGeometry(lod, scale) {
        const geometry = new THREE.PlaneGeometry(scale, scale);
        
        // Center the geometry
        geometry.translate(0, 0, 0);
        
        this.geometries.set(lod, geometry);
    }

    createBillboardMaterial() {
        // Custom shader for billboard behavior and pixel-perfect rendering
        const vertexShader = `
            varying vec2 vUv;
            
            void main() {
                vUv = uv;
                
                // Billboard behavior - always face camera
                vec3 worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                vec3 cameraDirection = normalize(cameraPosition - worldPosition);
                
                // Create billboard matrix
                vec3 up = vec3(0.0, 1.0, 0.0);
                vec3 right = normalize(cross(up, cameraDirection));
                up = cross(cameraDirection, right);
                
                mat3 billboardMatrix = mat3(right, up, cameraDirection);
                
                // Apply billboard transformation
                vec3 billboardPosition = billboardMatrix * position;
                vec4 worldPos = modelMatrix * vec4(billboardPosition, 1.0);
                
                gl_Position = projectionMatrix * viewMatrix * worldPos;
            }
        `;
        
        const fragmentShader = `
            uniform sampler2D indicatorTexture;
            uniform float brightness;
            uniform float opacity;
            varying vec2 vUv;
            
            void main() {
                vec4 texColor = texture2D(indicatorTexture, vUv);
                
                // Apply brightness
                texColor.rgb *= brightness;
                
                // Handle transparency
                if (texColor.a < 0.1) discard;
                
                gl_FragColor = vec4(texColor.rgb, texColor.a * opacity);
            }
        `;
        
        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                indicatorTexture: { value: null },
                brightness: { value: 1.0 },
                opacity: { value: 1.0 }
            },
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        
        this.materials.set('billboard', material);
    }

    createIndicatorMesh(entity, indicatorComponent) {
        const size = indicatorComponent.size;
        
        // Create DataTexture for the indicator
        const texture = new THREE.DataTexture(
            indicatorComponent.getRenderData(),
            size.width,
            size.height,
            THREE.RGBFormat,
            THREE.UnsignedByteType
        );
        
        texture.magFilter = THREE.NearestFilter; // Pixel-perfect scaling
        texture.minFilter = THREE.NearestFilter;
        texture.needsUpdate = true;
        
        // Clone material and set texture
        const material = this.materials.get('billboard').clone();
        material.uniforms.indicatorTexture.value = texture;
        material.uniforms.brightness.value = indicatorComponent.brightness;
        material.uniforms.opacity.value = indicatorComponent.visible ? 1.0 : 0.0;
        
        // Create mesh with appropriate geometry
        const geometry = this.geometries.get('high');
        const mesh = new THREE.Mesh(geometry, material);
        
        // Set initial position relative to entity
        const transform = entity.getComponent(TransformComponent);
        if (transform) {
            mesh.position.copy(transform.position);
            mesh.position.x += indicatorComponent.position.x;
            mesh.position.y += indicatorComponent.position.y;
            mesh.position.z += indicatorComponent.position.z;
        }
        
        mesh.scale.setScalar(indicatorComponent.scale);
        
        // Store references
        mesh.userData = {
            entity: entity,
            indicator: indicatorComponent,
            texture: texture,
            lastLOD: 'high'
        };
        
        return mesh;
    }

    addEntity(entity) {
        const indicator = entity.getComponent(IndicatorComponent);
        if (!indicator) return;
        
        const mesh = this.createIndicatorMesh(entity, indicator);
        this.indicators.set(entity.id, mesh);
        this.scene.add(mesh);
        
        console.log(`🎨 Added indicator for entity ${entity.id}`);
    }

    removeEntity(entity) {
        const mesh = this.indicators.get(entity.id);
        if (mesh) {
            this.scene.remove(mesh);
            
            // Clean up resources
            if (mesh.userData.texture) {
                mesh.userData.texture.dispose();
            }
            mesh.material.dispose();
            
            this.indicators.delete(entity.id);
            console.log(`🗑️ Removed indicator for entity ${entity.id}`);
        }
    }

    updateIndicator(entity, mesh) {
        const indicator = entity.getComponent(IndicatorComponent);
        const transform = entity.getComponent(TransformComponent);
        
        if (!indicator || !transform) return;
        
        // Update position relative to entity
        mesh.position.copy(transform.position);
        mesh.position.x += indicator.position.x;
        mesh.position.y += indicator.position.y;
        mesh.position.z += indicator.position.z;
        
        // Update scale
        mesh.scale.setScalar(indicator.scale);
        
        // Update visibility
        const targetOpacity = indicator.visible ? 1.0 : 0.0;
        mesh.material.uniforms.opacity.value = targetOpacity;
        
        // Update brightness
        mesh.material.uniforms.brightness.value = indicator.brightness;
        
        // Update texture if needed
        if (indicator.update()) {
            mesh.userData.texture.image.data = indicator.getRenderData();
            mesh.userData.texture.needsUpdate = true;
        }
    }

    updateLOD(mesh, distance) {
        const userData = mesh.userData;
        let newLOD = 'high';
        
        if (distance > this.lodDistances.low) {
            newLOD = 'hidden';
        } else if (distance > this.lodDistances.medium) {
            newLOD = 'low';
        } else if (distance > this.lodDistances.high) {
            newLOD = 'medium';
        }
        
        // Update LOD if changed
        if (newLOD !== userData.lastLOD) {
            userData.lastLOD = newLOD;
            
            if (newLOD === 'hidden') {
                mesh.visible = false;
            } else {
                mesh.visible = userData.indicator.visible;
                
                // Switch geometry if needed
                if (newLOD !== 'high') {
                    mesh.geometry = this.geometries.get(newLOD);
                } else {
                    mesh.geometry = this.geometries.get('high');
                }
            }
        }
    }

    update(deltaTime) {
        if (!this.camera) return;
        
        const cameraPosition = this.camera.position;
        
        // Update all indicator meshes
        for (const [entityId, mesh] of this.indicators) {
            const entity = mesh.userData.entity;
            
            // Check if entity still exists and has required components
            if (!entity || !entity.hasComponent(IndicatorComponent) || !entity.hasComponent(TransformComponent)) {
                this.removeEntity(entity);
                continue;
            }
            
            // Calculate distance for LOD
            const distance = mesh.position.distanceTo(cameraPosition);
            
            // Skip updates for very distant indicators
            if (distance > this.maxRenderDistance) {
                mesh.visible = false;
                continue;
            }
            
            // Update LOD
            this.updateLOD(mesh, distance);
            
            // Update indicator if visible
            if (mesh.visible) {
                this.updateIndicator(entity, mesh);
            }
        }
    }

    // Utility methods for external control
    
    /**
     * Get indicator mesh for an entity
     */
    getIndicatorMesh(entity) {
        return this.indicators.get(entity.id);
    }

    /**
     * Force update an indicator texture
     */
    forceUpdateTexture(entity) {
        const mesh = this.indicators.get(entity.id);
        if (mesh) {
            const indicator = entity.getComponent(IndicatorComponent);
            if (indicator) {
                mesh.userData.texture.image.data = indicator.getRenderData();
                mesh.userData.texture.needsUpdate = true;
            }
        }
    }

    /**
     * Set global brightness for all indicators
     */
    setGlobalBrightness(brightness) {
        for (const mesh of this.indicators.values()) {
            mesh.material.uniforms.brightness.value = brightness;
        }
    }

    /**
     * Get render statistics
     */
    getStats() {
        let visible = 0;
        let total = this.indicators.size;
        let lodCounts = { high: 0, medium: 0, low: 0, hidden: 0 };
        
        for (const mesh of this.indicators.values()) {
            if (mesh.visible) visible++;
            
            const lod = mesh.userData.lastLOD || 'high';
            lodCounts[lod]++;
        }
        
        return {
            total,
            visible,
            lod: lodCounts,
            texturesInCache: this.textureCache.size
        };
    }

    /**
     * Cleanup resources
     */
    destroy() {
        // Remove all indicators
        for (const [entityId, mesh] of this.indicators) {
            this.scene.remove(mesh);
            
            if (mesh.userData.texture) {
                mesh.userData.texture.dispose();
            }
            mesh.material.dispose();
        }
        
        this.indicators.clear();
        
        // Dispose shared resources
        for (const geometry of this.geometries.values()) {
            geometry.dispose();
        }
        
        for (const material of this.materials.values()) {
            material.dispose();
        }
        
        this.geometries.clear();
        this.materials.clear();
        this.textureCache.clear();
        
        console.log('🧹 IndicatorRenderSystem resources cleaned up');
    }
}