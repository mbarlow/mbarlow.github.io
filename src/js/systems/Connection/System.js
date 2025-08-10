import { System } from '../../core/System.js';
import { Connection } from '../../components/Connection.js';
import { TransformComponent } from '../../components/index.js';

export class ConnectionSystem extends System {
    constructor(world, scene) {
        super();
        this.world = world;
        this.scene = scene;
        this.connectors = new Map(); // connectionKey -> connectorData
        
        // Materials for different connection states
        this.materials = {
            inactive: new THREE.MeshBasicMaterial({
                color: 0x444444,
                transparent: true,
                opacity: 0.2,
                emissive: 0x111111
            }),
            active: new THREE.MeshBasicMaterial({
                color: 0x00ff88,
                transparent: true,
                opacity: 0.9,
                emissive: 0x004422
            }),
            pending: new THREE.MeshBasicMaterial({
                color: 0xffaa00,
                transparent: true,
                opacity: 0.7,
                emissive: 0x442200
            }),
            connecting: new THREE.MeshBasicMaterial({
                color: 0x4488ff,
                transparent: true,
                opacity: 0.6,
                emissive: 0x002244
            }),
            error: new THREE.MeshBasicMaterial({
                color: 0xff4444,
                transparent: true,
                opacity: 0.5,
                emissive: 0x441111
            })
        };
    }

    createConnectorKey(entity1Id, entity2Id) {
        // Create a consistent key regardless of order
        return [entity1Id, entity2Id].sort().join('-');
    }

    calculateLODSegments(distance, startPos, endPos) {
        // Get camera position for distance calculation
        const cameraSystem = this.world.getSystem('camera');
        let cameraDistance = distance; // fallback
        
        if (cameraSystem && cameraSystem.camera) {
            const cameraPos = cameraSystem.camera.position;
            const connectionMidpoint = new THREE.Vector3()
                .addVectors(startPos, endPos)
                .multiplyScalar(0.5);
            cameraDistance = cameraPos.distanceTo(connectionMidpoint);
        }
        
        // LOD calculation based on distance from camera
        let segments;
        if (cameraDistance < 10) {
            // High detail for close connections
            segments = Math.max(24, Math.floor(distance * 3));
        } else if (cameraDistance < 30) {
            // Medium detail for medium distance
            segments = Math.max(16, Math.floor(distance * 2));
        } else {
            // Low detail for far connections
            segments = Math.max(8, Math.floor(distance * 1));
        }
        
        return Math.min(segments, 60); // Cap maximum segments
    }

    calculateLODRadialSegments(distance, startPos, endPos) {
        // Get camera position for distance calculation
        const cameraSystem = this.world.getSystem('camera');
        let cameraDistance = distance; // fallback
        
        if (cameraSystem && cameraSystem.camera) {
            const cameraPos = cameraSystem.camera.position;
            const connectionMidpoint = new THREE.Vector3()
                .addVectors(startPos, endPos)
                .multiplyScalar(0.5);
            cameraDistance = cameraPos.distanceTo(connectionMidpoint);
        }
        
        // Radial segments LOD
        if (cameraDistance < 10) {
            return 12; // High detail
        } else if (cameraDistance < 30) {
            return 8;  // Medium detail
        } else {
            return 6;  // Low detail
        }
    }

    createConnector(entity1, entity2, connectionData) {
        const key = this.createConnectorKey(entity1.id, entity2.id);
        
        // Get positions
        const transform1 = entity1.getComponent(TransformComponent);
        const transform2 = entity2.getComponent(TransformComponent);
        
        if (!transform1 || !transform2) return null;
        
        const startPos = new THREE.Vector3().copy(transform1.position);
        const endPos = new THREE.Vector3().copy(transform2.position);
        
        // Calculate S-curve control points
        const direction = new THREE.Vector3().subVectors(endPos, startPos);
        const distance = startPos.distanceTo(endPos);
        const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
        const curveStrength = 0.3 * distance;
        const heightOffset = 0.15 * distance;
        
        const control1 = new THREE.Vector3()
            .addVectors(startPos, direction.clone().multiplyScalar(0.25))
            .add(perpendicular.clone().multiplyScalar(curveStrength))
            .add(new THREE.Vector3(0, heightOffset, 0));
        
        const control2 = new THREE.Vector3()
            .addVectors(startPos, direction.clone().multiplyScalar(0.75))
            .add(perpendicular.clone().multiplyScalar(-curveStrength))
            .add(new THREE.Vector3(0, heightOffset * 0.5, 0));
        
        // Create Bezier curve
        const curve = new THREE.CubicBezierCurve3(
            startPos.clone(),
            control1,
            control2,
            endPos.clone()
        );
        
        // Generate tube geometry with LOD
        const segments = this.calculateLODSegments(distance, startPos, endPos);
        const radius = 0.015;
        const radialSegments = this.calculateLODRadialSegments(distance, startPos, endPos);
        const tubeGeometry = new THREE.TubeGeometry(curve, segments, radius, radialSegments, false);
        
        // Create mesh with appropriate material
        const material = this.materials[connectionData.state || 'inactive'];
        const mesh = new THREE.Mesh(tubeGeometry, material);
        this.scene.add(mesh);
        
        // Store connector data
        const connectorData = {
            mesh,
            curve,
            segments,
            radius,
            entity1,
            entity2,
            state: connectionData.state || 'inactive',
            lastUpdatePos1: startPos.clone(),
            lastUpdatePos2: endPos.clone(),
            particles: null,
            particleTime: 0
        };
        
        this.connectors.set(key, connectorData);
        return connectorData;
    }

    updateConnector(entity1, entity2) {
        const key = this.createConnectorKey(entity1.id, entity2.id);
        const connectorData = this.connectors.get(key);
        if (!connectorData) return;
        
        const { curve, mesh, segments, radius } = connectorData;
        
        // Get updated positions
        const transform1 = entity1.getComponent(TransformComponent);
        const transform2 = entity2.getComponent(TransformComponent);
        
        if (!transform1 || !transform2) return;
        
        const startPos = new THREE.Vector3().copy(transform1.position);
        const endPos = new THREE.Vector3().copy(transform2.position);
        
        // Recalculate S-curve
        const direction = new THREE.Vector3().subVectors(endPos, startPos);
        const distance = startPos.distanceTo(endPos);
        const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
        const curveStrength = 0.3 * distance;
        const heightOffset = 0.15 * distance;
        
        const control1 = new THREE.Vector3()
            .addVectors(startPos, direction.clone().multiplyScalar(0.25))
            .add(perpendicular.clone().multiplyScalar(curveStrength))
            .add(new THREE.Vector3(0, heightOffset, 0));
        
        const control2 = new THREE.Vector3()
            .addVectors(startPos, direction.clone().multiplyScalar(0.75))
            .add(perpendicular.clone().multiplyScalar(-curveStrength))
            .add(new THREE.Vector3(0, heightOffset * 0.5, 0));
        
        // Update curve control points
        curve.v0.copy(startPos);
        curve.v1.copy(control1);
        curve.v2.copy(control2);
        curve.v3.copy(endPos);
        
        // Regenerate geometry with LOD
        const newSegments = this.calculateLODSegments(distance, startPos, endPos);
        const newRadialSegments = this.calculateLODRadialSegments(distance, startPos, endPos);
        const newGeometry = new THREE.TubeGeometry(curve, newSegments, radius, newRadialSegments, false);
        mesh.geometry.dispose();
        mesh.geometry = newGeometry;
    }

    updateConnectorState(entity1, entity2, state) {
        const key = this.createConnectorKey(entity1.id, entity2.id);
        const connectorData = this.connectors.get(key);
        if (!connectorData) return;
        
        const wasActive = connectorData.state === 'active';
        connectorData.state = state;
        connectorData.mesh.material = this.materials[state];
        
        // Initialize animation time for new active connections
        if (state === 'active' && !connectorData.animationTime) {
            connectorData.animationTime = 0;
        }
        
        // Handle particle effects based on state
        if (state === 'active' && !wasActive) {
            // Create particles when becoming active
            this.createParticles(connectorData);
        } else if (state !== 'active' && wasActive) {
            // Remove particles when becoming inactive
            this.removeParticles(connectorData);
        }
    }
    
    updateActivePulse(connectorData, deltaTime) {
        if (!connectorData.animationTime) {
            connectorData.animationTime = 0;
        }
        
        connectorData.animationTime += deltaTime;
        
        // Create pulsing effect by modulating opacity
        const pulseSpeed = 2.0; // 2 pulses per second
        const baseOpacity = 0.9;
        const pulseAmount = 0.3;
        
        const pulse = Math.sin(connectorData.animationTime * pulseSpeed * Math.PI * 2) * 0.5 + 0.5;
        const newOpacity = baseOpacity + (pulse * pulseAmount);
        
        connectorData.mesh.material.opacity = newOpacity;
        
        // Optional: Add slight emissive pulsing
        const baseBrightness = 0x004422;
        const pulseBrightness = 0x006633;
        const emissivePulse = Math.floor(baseBrightness + (pulse * (pulseBrightness - baseBrightness)));
        
        // Ensure the material has an emissive property and use setHex correctly
        if (connectorData.mesh.material.emissive) {
            connectorData.mesh.material.emissive.setHex(emissivePulse);
        }
        
        // Update particle effects
        this.updateParticles(connectorData, deltaTime);
    }

    createParticles(connectorData) {
        const particleCount = 8;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.SphereGeometry(0.005, 4, 4);
            const material = new THREE.MeshBasicMaterial({
                color: 0x00ff88,
                transparent: true,
                opacity: 0.8
            });
            
            const particle = new THREE.Mesh(geometry, material);
            this.scene.add(particle);
            
            particles.push({
                mesh: particle,
                progress: i / particleCount, // Distribute along curve
                speed: 0.5 + Math.random() * 0.3 // Slight speed variation
            });
        }
        
        connectorData.particles = particles;
    }

    updateParticles(connectorData, deltaTime) {
        if (!connectorData.particles) {
            this.createParticles(connectorData);
        }
        
        const particles = connectorData.particles;
        if (!particles) return;
        
        // Animate particles along the curve
        particles.forEach(particle => {
            particle.progress += particle.speed * deltaTime;
            
            // Loop the particle when it reaches the end
            if (particle.progress > 1) {
                particle.progress = 0;
            }
            
            // Get position along curve
            const position = connectorData.curve.getPoint(particle.progress);
            particle.mesh.position.copy(position);
            
            // Fade particles based on distance from endpoints
            const fadeZone = 0.1; // 10% of curve length
            let opacity = 0.8;
            if (particle.progress < fadeZone) {
                opacity *= particle.progress / fadeZone;
            } else if (particle.progress > 1 - fadeZone) {
                opacity *= (1 - particle.progress) / fadeZone;
            }
            
            particle.mesh.material.opacity = opacity;
        });
    }

    removeParticles(connectorData) {
        if (connectorData.particles) {
            connectorData.particles.forEach(particle => {
                this.scene.remove(particle.mesh);
                particle.mesh.geometry.dispose();
                particle.mesh.material.dispose();
            });
            connectorData.particles = null;
        }
    }

    removeConnector(entity1, entity2) {
        const key = this.createConnectorKey(entity1.id, entity2.id);
        const connectorData = this.connectors.get(key);
        if (!connectorData) return;
        
        // Clean up particles
        this.removeParticles(connectorData);
        
        // Clean up mesh
        this.scene.remove(connectorData.mesh);
        connectorData.mesh.geometry.dispose();
        connectorData.mesh.material.dispose();
        
        this.connectors.delete(key);
    }

    update(deltaTime) {
        const entities = this.world.getEntitiesWithComponent(Connection);
        
        // Update all existing connectors
        for (const [key, connectorData] of this.connectors) {
            // Check if entities have moved
            const transform1 = connectorData.entity1.getComponent(TransformComponent);
            const transform2 = connectorData.entity2.getComponent(TransformComponent);
            
            if (transform1 && transform2) {
                const currentPos1 = new THREE.Vector3().copy(transform1.position);
                const currentPos2 = new THREE.Vector3().copy(transform2.position);
                
                // Only update if positions have changed significantly (optimization)
                const threshold = 0.01; // 1cm movement threshold
                const moved1 = connectorData.lastUpdatePos1.distanceTo(currentPos1) > threshold;
                const moved2 = connectorData.lastUpdatePos2.distanceTo(currentPos2) > threshold;
                
                if (moved1 || moved2) {
                    this.updateConnector(connectorData.entity1, connectorData.entity2);
                    connectorData.lastUpdatePos1.copy(currentPos1);
                    connectorData.lastUpdatePos2.copy(currentPos2);
                }
            }
            
            // Add pulsing animation for active connections
            if (connectorData.state === 'active') {
                this.updateActivePulse(connectorData, deltaTime);
            }
        }
        
        // Check for new connections or state changes
        for (const entity of entities) {
            const connectionComp = entity.getComponent(Connection);
            const connections = connectionComp.getAllConnections();
            
            for (const connection of connections) {
                const targetEntity = this.world.getEntity(connection.targetEntityId);
                if (!targetEntity) continue;
                
                const key = this.createConnectorKey(entity.id, targetEntity.id);
                const existingConnector = this.connectors.get(key);
                
                if (!existingConnector) {
                    // Create new connector
                    this.createConnector(entity, targetEntity, connection);
                } else if (existingConnector.state !== connection.state) {
                    // Update state
                    this.updateConnectorState(entity, targetEntity, connection.state);
                }
            }
        }
        
        // Remove connectors for deleted connections
        const activeKeys = new Set();
        for (const entity of entities) {
            const connectionComp = entity.getComponent(Connection);
            const connections = connectionComp.getAllConnections();
            
            for (const connection of connections) {
                const key = this.createConnectorKey(entity.id, connection.targetEntityId);
                activeKeys.add(key);
            }
        }
        
        for (const key of this.connectors.keys()) {
            if (!activeKeys.has(key)) {
                const connectorData = this.connectors.get(key);
                this.removeConnector(connectorData.entity1, connectorData.entity2);
            }
        }
    }

    cleanup() {
        for (const connectorData of this.connectors.values()) {
            this.removeParticles(connectorData);
            this.scene.remove(connectorData.mesh);
            connectorData.mesh.geometry.dispose();
            connectorData.mesh.material.dispose();
        }
        this.connectors.clear();
    }
}