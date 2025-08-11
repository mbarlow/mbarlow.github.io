import { System } from '../../core/System.js';
import { Connection } from '../../components/Connection.js';
import { TransformComponent } from '../../components/index.js';
import { CONFIG } from '../../config/index.js';

export class ConnectionSystem extends System {
    constructor(world, scene) {
        super();
        this.world = world;
        this.scene = scene;
        this.connectors = new Map(); // connectionKey -> connectorData
        this.time = 0; // Track time for organic animations
        
        // Materials for different connection states from CONFIG
        this.materials = {};
        Object.entries(CONFIG.connections.materials).forEach(([state, matConfig]) => {
            this.materials[state] = new THREE.MeshBasicMaterial({
                color: matConfig.color,
                transparent: true,
                opacity: matConfig.opacity,
                emissive: matConfig.emissive
            });
        });
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
        const lodConfig = CONFIG.connections.lod;
        let segments;
        if (cameraDistance < lodConfig.distances.close) {
            // High detail for close connections
            segments = Math.max(lodConfig.segments.close.min, Math.floor(distance * lodConfig.segments.close.multiplier));
        } else if (cameraDistance < lodConfig.distances.medium) {
            // Medium detail for medium distance
            segments = Math.max(lodConfig.segments.medium.min, Math.floor(distance * lodConfig.segments.medium.multiplier));
        } else {
            // Low detail for far connections
            segments = Math.max(lodConfig.segments.far.min, Math.floor(distance * lodConfig.segments.far.multiplier));
        }
        
        return Math.min(segments, lodConfig.segments.max); // Cap maximum segments
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
        const lodConfig = CONFIG.connections.lod;
        if (cameraDistance < lodConfig.distances.close) {
            return lodConfig.radialSegments.close; // High detail
        } else if (cameraDistance < lodConfig.distances.medium) {
            return lodConfig.radialSegments.medium;  // Medium detail
        } else {
            return lodConfig.radialSegments.far;  // Low detail
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
        
        // Calculate S-curve control points with variation
        const direction = new THREE.Vector3().subVectors(endPos, startPos);
        const distance = startPos.distanceTo(endPos);
        const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
        
        // Add randomized variation to curve parameters from CONFIG
        const curveConfig = CONFIG.connections.curve;
        const baseStrength = curveConfig.baseStrength;
        const strengthVariation = (Math.random() - 0.5) * curveConfig.strengthVariation;
        const curveStrength = (baseStrength + strengthVariation) * distance;
        
        const baseHeight = curveConfig.baseHeight;
        const heightVariation = (Math.random() - 0.5) * curveConfig.heightVariation;
        const heightOffset = (baseHeight + heightVariation) * distance;
        
        // Randomize control point positions along the curve
        const control1Pos = 0.25 + (Math.random() - 0.5) * curveConfig.controlPoint1Range;
        const control2Pos = 0.75 + (Math.random() - 0.5) * curveConfig.controlPoint2Range;
        
        // Add some asymmetry to the curve
        const asymmetryFactor = (Math.random() - 0.5) * curveConfig.asymmetryFactor;
        
        const control1 = new THREE.Vector3()
            .addVectors(startPos, direction.clone().multiplyScalar(control1Pos))
            .add(perpendicular.clone().multiplyScalar(curveStrength * (1 + asymmetryFactor)))
            .add(new THREE.Vector3(0, heightOffset, 0));
        
        const control2 = new THREE.Vector3()
            .addVectors(startPos, direction.clone().multiplyScalar(control2Pos))
            .add(perpendicular.clone().multiplyScalar(-curveStrength * (1 - asymmetryFactor)))
            .add(new THREE.Vector3(0, heightOffset * (0.5 + Math.random() * 0.3), 0));
        
        // Create Bezier curve
        const curve = new THREE.CubicBezierCurve3(
            startPos.clone(),
            control1,
            control2,
            endPos.clone()
        );
        
        // Generate tube geometry with LOD
        const segments = this.calculateLODSegments(distance, startPos, endPos);
        const radius = CONFIG.connections.curve.tubeRadius;
        const radialSegments = this.calculateLODRadialSegments(distance, startPos, endPos);
        const tubeGeometry = new THREE.TubeGeometry(curve, segments, radius, radialSegments, false);
        
        // Create mesh with appropriate material
        const material = this.materials[connectionData.state || 'inactive'];
        const mesh = new THREE.Mesh(tubeGeometry, material);
        this.scene.add(mesh);
        
        // Store connector data with curve parameters for animation
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
            particleTime: 0,
            // Store curve parameters for organic animation
            baseControl1: control1.clone(),
            baseControl2: control2.clone(),
            wavePhase: Math.random() * Math.PI * 2, // Random starting phase
            waveSpeed: CONFIG.connections.animation.waveSpeedMin + Math.random() * (CONFIG.connections.animation.waveSpeedMax - CONFIG.connections.animation.waveSpeedMin),
            waveAmplitude: CONFIG.connections.animation.waveAmplitudeMin + Math.random() * (CONFIG.connections.animation.waveAmplitudeMax - CONFIG.connections.animation.waveAmplitudeMin),
            curveParams: {
                strengthVariation,
                heightVariation,
                control1Pos,
                control2Pos,
                asymmetryFactor
            }
        };
        
        this.connectors.set(key, connectorData);
        return connectorData;
    }

    updateConnector(entity1, entity2, applyWave = true) {
        const key = this.createConnectorKey(entity1.id, entity2.id);
        const connectorData = this.connectors.get(key);
        if (!connectorData) return;
        
        const { curve, mesh, segments, radius, curveParams } = connectorData;
        
        // Get updated positions
        const transform1 = entity1.getComponent(TransformComponent);
        const transform2 = entity2.getComponent(TransformComponent);
        
        if (!transform1 || !transform2) return;
        
        const startPos = new THREE.Vector3().copy(transform1.position);
        const endPos = new THREE.Vector3().copy(transform2.position);
        
        // Recalculate base positions if entities moved
        const direction = new THREE.Vector3().subVectors(endPos, startPos);
        const distance = startPos.distanceTo(endPos);
        
        // Update base control points if positions changed significantly
        const moved = connectorData.lastUpdatePos1.distanceTo(startPos) > 0.1 || 
                     connectorData.lastUpdatePos2.distanceTo(endPos) > 0.1;
        
        if (moved || !connectorData.baseControl1) {
            // Use stored variation parameters for consistency
            const params = curveParams || {};
            const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
            const curveStrength = (0.3 + (params.strengthVariation || 0)) * distance;
            const heightOffset = (0.15 + (params.heightVariation || 0)) * distance;
            const control1Pos = params.control1Pos || 0.25;
            const control2Pos = params.control2Pos || 0.75;
            const asymmetryFactor = params.asymmetryFactor || 0;
            
            connectorData.baseControl1 = new THREE.Vector3()
                .addVectors(startPos, direction.clone().multiplyScalar(control1Pos))
                .add(perpendicular.clone().multiplyScalar(curveStrength * (1 + asymmetryFactor)))
                .add(new THREE.Vector3(0, heightOffset, 0));
            
            connectorData.baseControl2 = new THREE.Vector3()
                .addVectors(startPos, direction.clone().multiplyScalar(control2Pos))
                .add(perpendicular.clone().multiplyScalar(-curveStrength * (1 - asymmetryFactor)))
                .add(new THREE.Vector3(0, heightOffset * (0.5 + (params.heightVariation || 0) * 2), 0));
        }
        
        // Apply organic wave animation
        let control1 = connectorData.baseControl1.clone();
        let control2 = connectorData.baseControl2.clone();
        
        if (applyWave && connectorData.waveAmplitude) {
            const waveOffset = Math.sin(this.time * connectorData.waveSpeed + connectorData.wavePhase) * 
                             connectorData.waveAmplitude * distance;
            const waveOffset2 = Math.cos(this.time * connectorData.waveSpeed * 0.7 + connectorData.wavePhase) * 
                              connectorData.waveAmplitude * distance * 0.5;
            
            control1.add(new THREE.Vector3(
                waveOffset * Math.sin(connectorData.wavePhase),
                waveOffset2,
                waveOffset * Math.cos(connectorData.wavePhase)
            ));
            
            control2.add(new THREE.Vector3(
                -waveOffset2 * Math.sin(connectorData.wavePhase + 1),
                waveOffset * 0.5,
                -waveOffset2 * Math.cos(connectorData.wavePhase + 1)
            ));
        }
        
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
        const animConfig = CONFIG.connections.animation;
        const pulseSpeed = animConfig.pulseSpeed;
        const baseOpacity = animConfig.baseOpacity;
        const pulseAmount = animConfig.pulseAmount;
        
        const pulse = Math.sin(connectorData.animationTime * pulseSpeed * Math.PI * 2) * 0.5 + 0.5;
        const newOpacity = baseOpacity + (pulse * pulseAmount);
        
        connectorData.mesh.material.opacity = newOpacity;
        
        // Optional: Add slight emissive pulsing
        const matConfig = CONFIG.connections.materials.active;
        const baseBrightness = matConfig.emissive;
        const pulseBrightness = matConfig.emissivePulse || matConfig.emissive;
        const emissivePulse = Math.floor(baseBrightness + (pulse * (pulseBrightness - baseBrightness)));
        
        // Ensure the material has an emissive property and use setHex correctly
        if (connectorData.mesh.material.emissive) {
            connectorData.mesh.material.emissive.setHex(emissivePulse);
        }
        
        // Update particle effects
        this.updateParticles(connectorData, deltaTime);
    }

    createParticles(connectorData) {
        const particleConfig = CONFIG.connections.particles;
        const particleCount = particleConfig.count;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.SphereGeometry(particleConfig.radius, 4, 4);
            const material = new THREE.MeshBasicMaterial({
                color: CONFIG.connections.materials.active.color,
                transparent: true,
                opacity: particleConfig.opacity
            });
            
            const particle = new THREE.Mesh(geometry, material);
            this.scene.add(particle);
            
            particles.push({
                mesh: particle,
                progress: i / particleCount, // Distribute along curve
                speed: CONFIG.connections.particles.baseSpeed + Math.random() * CONFIG.connections.particles.speedVariation
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
            const fadeZone = CONFIG.connections.particles.fadeZone;
            let opacity = CONFIG.connections.particles.opacity;
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
        // Update time for organic animations
        this.time += deltaTime;
        
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
                const threshold = CONFIG.performance.updateThreshold;
                const moved1 = connectorData.lastUpdatePos1.distanceTo(currentPos1) > threshold;
                const moved2 = connectorData.lastUpdatePos2.distanceTo(currentPos2) > threshold;
                
                // Always update for organic movement, but only regenerate geometry if moved significantly
                const shouldRegenerateGeometry = moved1 || moved2;
                
                if (shouldRegenerateGeometry) {
                    connectorData.lastUpdatePos1.copy(currentPos1);
                    connectorData.lastUpdatePos2.copy(currentPos2);
                }
                
                // Apply organic wave animation even without movement
                this.updateConnector(connectorData.entity1, connectorData.entity2, true);
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