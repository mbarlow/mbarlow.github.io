import { System } from '../core/System.js';
import { Connection } from '../components/Connection.js';
import { TransformComponent } from '../components/index.js';

export class ConnectionSystem extends System {
    constructor(world, scene) {
        super();
        this.world = world;
        this.scene = scene;
        this.connectors = new Map(); // connectionKey -> connectorData
        
        // Materials for different connection states
        this.materials = {
            inactive: new THREE.MeshBasicMaterial({
                color: 0x666666,
                transparent: true,
                opacity: 0.3
            }),
            active: new THREE.MeshBasicMaterial({
                color: 0x00ff88,
                transparent: true,
                opacity: 0.8
            }),
            pending: new THREE.MeshBasicMaterial({
                color: 0xffaa00,
                transparent: true,
                opacity: 0.6
            })
        };
    }

    createConnectorKey(entity1Id, entity2Id) {
        // Create a consistent key regardless of order
        return [entity1Id, entity2Id].sort().join('-');
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
        
        // Generate tube geometry
        const segments = Math.max(20, Math.floor(distance * 2));
        const radius = 0.015;
        const tubeGeometry = new THREE.TubeGeometry(curve, segments, radius, 8, false);
        
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
            state: connectionData.state || 'inactive'
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
        
        // Regenerate geometry
        const newGeometry = new THREE.TubeGeometry(curve, segments, radius, 8, false);
        mesh.geometry.dispose();
        mesh.geometry = newGeometry;
    }

    updateConnectorState(entity1, entity2, state) {
        const key = this.createConnectorKey(entity1.id, entity2.id);
        const connectorData = this.connectors.get(key);
        if (!connectorData) return;
        
        connectorData.state = state;
        connectorData.mesh.material = this.materials[state];
    }

    removeConnector(entity1, entity2) {
        const key = this.createConnectorKey(entity1.id, entity2.id);
        const connectorData = this.connectors.get(key);
        if (!connectorData) return;
        
        this.scene.remove(connectorData.mesh);
        connectorData.mesh.geometry.dispose();
        this.connectors.delete(key);
    }

    update(deltaTime) {
        const entities = this.world.getEntitiesWithComponent(Connection);
        
        // Update all existing connectors
        for (const [key, connectorData] of this.connectors) {
            this.updateConnector(connectorData.entity1, connectorData.entity2);
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
            this.scene.remove(connectorData.mesh);
            connectorData.mesh.geometry.dispose();
        }
        this.connectors.clear();
    }
}