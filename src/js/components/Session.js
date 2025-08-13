import { Component } from '../core/Component.js';
import { generateUUID } from '../utils/uuid.js';

export class Session extends Component {
    constructor() {
        super();
        this.activeSessions = new Map(); // sessionId -> sessionData
    }

    createSession(connectionId, participants) {
        const sessionId = generateUUID();
        const sessionData = {
            id: sessionId,
            connectionId,
            participants: new Set(participants),
            state: 'active',
            chatLogId: generateUUID(),
            title: null,
            keywords: [],
            createdAt: Date.now(),
            lastActivityAt: Date.now(),
            messageCount: 0
        };
        
        this.activeSessions.set(sessionId, sessionData);
        return sessionData;
    }

    getSession(sessionId) {
        return this.activeSessions.get(sessionId);
    }

    updateSessionState(sessionId, state) {
        const session = this.activeSessions.get(sessionId);
        if (session) {
            session.state = state;
            session.lastActivityAt = Date.now();
        }
    }

    updateSessionTitle(sessionId, title, keywords = []) {
        const session = this.activeSessions.get(sessionId);
        if (session) {
            session.title = title;
            session.keywords = keywords;
        }
    }

    incrementMessageCount(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (session) {
            session.messageCount++;
            session.lastActivityAt = Date.now();
        }
    }

    getActiveSessionsForEntity(entityId) {
        return Array.from(this.activeSessions.values()).filter(
            session => session.participants.has(entityId) && session.state === 'active'
        );
    }

    getAllSessions() {
        return Array.from(this.activeSessions.values());
    }

    deactivateSession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (session) {
            session.state = 'inactive';
            session.lastActivityAt = Date.now();
        }
    }

    archiveSession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (session) {
            session.state = 'archived';
            return session;
        }
        return null;
    }
}