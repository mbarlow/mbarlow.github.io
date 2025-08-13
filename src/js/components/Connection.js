import { Component } from '../core/Component.js';
import { generateUUID } from '../utils/uuid.js';

export class Connection extends Component {
    constructor() {
        super();
        this.connections = new Map(); // targetEntityId -> connectionData
    }

    addConnection(targetEntityId, connectionData) {
        this.connections.set(targetEntityId, {
            id: connectionData.id || generateUUID(),
            targetEntityId,
            sessionId: connectionData.sessionId || null,
            createdAt: connectionData.createdAt || Date.now(),
            lastActivityAt: connectionData.lastActivityAt || Date.now(),
            state: connectionData.state || 'inactive', // inactive, active, pending
            metadata: connectionData.metadata || {}
        });
    }

    removeConnection(targetEntityId) {
        this.connections.delete(targetEntityId);
    }

    getConnection(targetEntityId) {
        return this.connections.get(targetEntityId);
    }

    updateConnectionState(targetEntityId, state) {
        const connection = this.connections.get(targetEntityId);
        if (connection) {
            connection.state = state;
            connection.lastActivityAt = Date.now();
        }
    }

    updateConnectionSession(targetEntityId, sessionId) {
        const connection = this.connections.get(targetEntityId);
        if (connection) {
            connection.sessionId = sessionId;
            connection.lastActivityAt = Date.now();
        }
    }

    getAllConnections() {
        return Array.from(this.connections.values());
    }

    hasConnectionTo(targetEntityId) {
        return this.connections.has(targetEntityId);
    }
}