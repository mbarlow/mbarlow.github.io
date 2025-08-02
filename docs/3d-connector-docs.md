# 3D Bezier Connectors for ECS Systems

Visual representation of entity-to-entity message passing using dynamic S-shaped Bezier curves in THREE.js.

## Overview

This system provides real-time 3D Bezier curve connectors that visualize communication channels between entities in an ECS architecture. Each connector represents an active messaging pathway, dynamically updating as entities move through 3D space.

## Features

- **S-shaped Bezier curves** for natural, organic connection appearance
- **Real-time updates** as entities move or change position
- **Efficient geometry regeneration** with memory management
- **Configurable visual properties** (thickness, color, opacity)
- **Smooth animation** suitable for 60fps rendering

## Implementation

### Core Connector System

```javascript
class ConnectorSystem {
    constructor(scene) {
        this.scene = scene;
        this.connectors = new Map(); // connectionId -> connectorData
        this.defaultMaterial = new THREE.MeshBasicMaterial({
            color: 0x333333,
            transparent: true,
            opacity: 0.6
        });
    }

    createConnector(connectionId, startEntity, endEntity, options = {}) {
        const startPos = startEntity.position;
        const endPos = endEntity.position;

        // Calculate S-curve control points
        const direction = new THREE.Vector3().subVectors(endPos, startPos);
        const distance = startPos.distanceTo(endPos);
        const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
        const curveStrength = (options.curveStrength || 0.4) * distance;
        const heightOffset = (options.heightOffset || 0.2) * distance;

        const control1 = new THREE.Vector3()
            .addVectors(startPos, direction.clone().multiplyScalar(0.25))
            .add(perpendicular.clone().multiplyScalar(curveStrength))
            .add(new THREE.Vector3(0, heightOffset, 0));

        const control2 = new THREE.Vector3()
            .addVectors(startPos, direction.clone().multiplyScalar(0.75))
            .add(perpendicular.clone().multiplyScalar(-curveStrength))
            .add(new THREE.Vector3(0, heightOffset, 0));

        // Create Bezier curve
        const curve = new THREE.CubicBezierCurve3(
            startPos.clone(),
            control1,
            control2,
            endPos.clone()
        );

        // Generate tube geometry
        const segments = Math.max(20, Math.floor(distance * 2));
        const radius = options.radius || 0.02;
        const tubeGeometry = new THREE.TubeGeometry(curve, segments, radius, 8, false);

        // Create mesh
        const material = options.material || this.defaultMaterial;
        const mesh = new THREE.Mesh(tubeGeometry, material);
        this.scene.add(mesh);

        // Store connector data
        const connectorData = {
            mesh,
            curve,
            segments,
            radius,
            startEntity,
            endEntity,
            options
        };

        this.connectors.set(connectionId, connectorData);
        return connectorData;
    }

    updateConnector(connectionId) {
        const connectorData = this.connectors.get(connectionId);
        if (!connectorData) return;

        const { curve, mesh, segments, radius, startEntity, endEntity, options } = connectorData;
        const startPos = startEntity.position;
        const endPos = endEntity.position;

        // Recalculate S-curve
        const direction = new THREE.Vector3().subVectors(endPos, startPos);
        const distance = startPos.distanceTo(endPos);
        const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
        const curveStrength = (options.curveStrength || 0.4) * distance;
        const heightOffset = (options.heightOffset || 0.2) * distance;

        const control1 = new THREE.Vector3()
            .addVectors(startPos, direction.clone().multiplyScalar(0.25))
            .add(perpendicular.clone().multiplyScalar(curveStrength))
            .add(new THREE.Vector3(0, heightOffset, 0));

        const control2 = new THREE.Vector3()
            .addVectors(startPos, direction.clone().multiplyScalar(0.75))
            .add(perpendicular.clone().multiplyScalar(-curveStrength))
            .add(new THREE.Vector3(0, heightOffset, 0));

        // Update curve control points
        curve.v0.copy(startPos);
        curve.v1.copy(control1);
        curve.v2.copy(control2);
        curve.v3.copy(endPos);

        // Regenerate geometry
        const newGeometry = new THREE.TubeGeometry(curve, segments, radius, 8, false);
        mesh.geometry.dispose(); // Prevent memory leaks
        mesh.geometry = newGeometry;
    }

    removeConnector(connectionId) {
        const connectorData = this.connectors.get(connectionId);
        if (!connectorData) return;

        this.scene.remove(connectorData.mesh);
        connectorData.mesh.geometry.dispose();
        this.connectors.delete(connectionId);
    }

    updateAll() {
        for (const connectionId of this.connectors.keys()) {
            this.updateConnector(connectionId);
        }
    }
}
```

### ECS Integration

```javascript
// Message component for entities that can send/receive
class MessageComponent {
    constructor() {
        this.connections = new Set(); // connectionIds this entity participates in
        this.outgoing = new Map();    // targetEntityId -> connectionId
        this.incoming = new Map();    // sourceEntityId -> connectionId
    }
}

// System to manage entity connections
class EntityConnectionSystem {
    constructor(connectorSystem) {
        this.connectorSystem = connectorSystem;
        this.activeConnections = new Map(); // connectionId -> {source, target, lastActivity}
    }

    establishConnection(sourceEntity, targetEntity) {
        const connectionId = `${sourceEntity.id}->${targetEntity.id}`;

        // Create visual connector
        this.connectorSystem.createConnector(connectionId, sourceEntity, targetEntity);

        // Update entity components
        sourceEntity.getComponent(MessageComponent).outgoing.set(targetEntity.id, connectionId);
        targetEntity.getComponent(MessageComponent).incoming.set(sourceEntity.id, connectionId);

        this.activeConnections.set(connectionId, {
            source: sourceEntity,
            target: targetEntity,
            lastActivity: Date.now()
        });

        return connectionId;
    }

    sendMessage(sourceEntity, targetEntity, message) {
        const connectionId = sourceEntity.getComponent(MessageComponent).outgoing.get(targetEntity.id);
        if (!connectionId) {
            // Establish connection if it doesn't exist
            this.establishConnection(sourceEntity, targetEntity);
        }

        // Update activity timestamp
        if (this.activeConnections.has(connectionId)) {
            this.activeConnections.get(connectionId).lastActivity = Date.now();
        }

        // Animate message transmission (optional)
        this.animateMessageFlow(connectionId);

        // Handle actual message delivery
        targetEntity.receiveMessage(message, sourceEntity);
    }

    update() {
        // Update all connector visuals
        this.connectorSystem.updateAll();

        // Clean up inactive connections (optional)
        const now = Date.now();
        const timeout = 5000; // 5 seconds

        for (const [connectionId, data] of this.activeConnections) {
            if (now - data.lastActivity > timeout) {
                this.removeConnection(connectionId);
            }
        }
    }

    removeConnection(connectionId) {
        this.connectorSystem.removeConnector(connectionId);
        this.activeConnections.delete(connectionId);
    }
}
```

## Usage Example

```javascript
// Initialize systems
const connectorSystem = new ConnectorSystem(scene);
const connectionSystem = new EntityConnectionSystem(connectorSystem);

// In your main update loop
function update() {
    connectionSystem.update(); // Updates all connector visuals

    // Entity messaging
    if (entity1.needsToSendMessage) {
        connectionSystem.sendMessage(entity1, entity2, messageData);
    }
}
```

## Configuration Options

```javascript
const options = {
    radius: 0.05,           // Tube thickness
    curveStrength: 0.6,     // S-curve intensity (0.1-1.0)
    heightOffset: 0.3,      // Vertical curve offset
    material: customMaterial // Custom THREE.js material
};

connectorSystem.createConnector(id, start, end, options);
```

## Performance Considerations

- **Geometry pooling**: Reuse geometries for similar connection distances
- **LOD system**: Lower segment count for distant connections
- **Selective updates**: Only update connectors for moving entities
- **Connection culling**: Remove inactive connections after timeout
- **Instanced rendering**: For many similar connectors

## Visual Enhancements

- **Message flow animation**: Particle effects along curve paths
- **Activity indication**: Color/opacity changes based on message frequency
- **Connection types**: Different materials for different message types
- **Bandwidth visualization**: Thickness based on data flow volume
