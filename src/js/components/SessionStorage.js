import { Component } from '../core/Component.js';

export class SessionStorage extends Component {
    constructor() {
        super();
        this.storageKey = 'ecs-session-data';
        this.dbName = 'ECSSessionDB';
        this.dbVersion = 1;
        this.db = null;
    }

    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Sessions object store
                if (!db.objectStoreNames.contains('sessions')) {
                    const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
                    sessionStore.createIndex('timestamp', 'timestamp', { unique: false });
                    sessionStore.createIndex('participants', 'participants', { unique: false, multiEntry: true });
                }
                
                // Chat logs object store
                if (!db.objectStoreNames.contains('chatLogs')) {
                    const chatStore = db.createObjectStore('chatLogs', { keyPath: 'id' });
                    sessionStore.createIndex('sessionId', 'sessionId', { unique: false });
                }
                
                // Entity brains object store
                if (!db.objectStoreNames.contains('brains')) {
                    const brainStore = db.createObjectStore('brains', { keyPath: 'entityId' });
                    brainStore.createIndex('model', 'model', { unique: false });
                }
            };
        });
    }

    // Session storage format
    createSessionData(session, chatLog, participants) {
        return {
            id: session.id,
            connectionId: session.connectionId,
            participants: Array.from(session.participants),
            state: session.state,
            title: session.title,
            keywords: session.keywords,
            createdAt: session.createdAt,
            lastActivityAt: session.lastActivityAt,
            messageCount: session.messageCount,
            chatLogId: session.chatLogId,
            timestamp: Date.now()
        };
    }

    createChatLogData(chatLog) {
        return {
            id: chatLog.id,
            messages: chatLog.messages.map(msg => ({
                id: msg.id,
                senderId: msg.senderId,
                content: msg.content,
                timestamp: msg.timestamp,
                type: msg.type,
                metadata: msg.metadata || {}
            })),
            createdAt: chatLog.createdAt,
            lastMessageAt: chatLog.lastMessageAt,
            timestamp: Date.now()
        };
    }

    createBrainData(entityId, brain) {
        return {
            entityId,
            model: brain.model,
            primaryFunction: brain.primaryFunction,
            personality: brain.personality,
            interests: brain.interests,
            expertise: brain.expertise,
            sessionHistory: brain.sessionHistory,
            notes: brain.notes,
            timestamp: Date.now()
        };
    }

    // IndexedDB operations
    async saveSession(sessionData) {
        if (!this.db) await this.initIndexedDB();
        
        const transaction = this.db.transaction(['sessions'], 'readwrite');
        const store = transaction.objectStore('sessions');
        return store.put(sessionData);
    }

    async saveChatLog(chatLogData) {
        if (!this.db) await this.initIndexedDB();
        
        const transaction = this.db.transaction(['chatLogs'], 'readwrite');
        const store = transaction.objectStore('chatLogs');
        return store.put(chatLogData);
    }

    async saveBrain(brainData) {
        if (!this.db) await this.initIndexedDB();
        
        const transaction = this.db.transaction(['brains'], 'readwrite');
        const store = transaction.objectStore('brains');
        return store.put(brainData);
    }

    async loadSession(sessionId) {
        if (!this.db) await this.initIndexedDB();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['sessions'], 'readonly');
            const store = transaction.objectStore('sessions');
            const request = store.get(sessionId);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async loadChatLog(chatLogId) {
        if (!this.db) await this.initIndexedDB();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['chatLogs'], 'readonly');
            const store = transaction.objectStore('chatLogs');
            const request = store.get(chatLogId);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async loadBrain(entityId) {
        if (!this.db) await this.initIndexedDB();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['brains'], 'readonly');
            const store = transaction.objectStore('brains');
            const request = store.get(entityId);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllSessions() {
        if (!this.db) await this.initIndexedDB();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['sessions'], 'readonly');
            const store = transaction.objectStore('sessions');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async searchSessions(keywords) {
        const sessions = await this.getAllSessions();
        const lowerKeywords = keywords.map(k => k.toLowerCase());
        
        return sessions.filter(session => {
            if (!session.keywords) return false;
            return session.keywords.some(keyword => 
                lowerKeywords.some(search => keyword.toLowerCase().includes(search))
            );
        });
    }

    async searchByTitle(searchTerm) {
        const sessions = await this.getAllSessions();
        const lowerSearch = searchTerm.toLowerCase();
        
        return sessions.filter(session => 
            session.title && session.title.toLowerCase().includes(lowerSearch)
        );
    }

    // Fallback localStorage methods for browsers without IndexedDB
    saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            return false;
        }
    }

    loadFromLocalStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            return null;
        }
    }

    // Export/Import functionality
    async exportAllData() {
        const sessions = await this.getAllSessions();
        const chatLogs = [];
        const brains = [];
        
        // Get all chat logs for sessions
        for (const session of sessions) {
            const chatLog = await this.loadChatLog(session.chatLogId);
            if (chatLog) chatLogs.push(chatLog);
        }
        
        // Get all brain data
        const transaction = this.db.transaction(['brains'], 'readonly');
        const store = transaction.objectStore('brains');
        const brainRequest = store.getAll();
        
        return new Promise((resolve) => {
            brainRequest.onsuccess = () => {
                resolve({
                    sessions,
                    chatLogs,
                    brains: brainRequest.result,
                    exportedAt: Date.now(),
                    version: 1
                });
            };
        });
    }

    async importData(data) {
        if (!data.version || data.version !== 1) {
            throw new Error('Unsupported data format version');
        }
        
        // Import sessions
        for (const session of data.sessions) {
            await this.saveSession(session);
        }
        
        // Import chat logs
        for (const chatLog of data.chatLogs) {
            await this.saveChatLog(chatLog);
        }
        
        // Import brains
        for (const brain of data.brains) {
            await this.saveBrain(brain);
        }
        
        console.log('✅ Data import completed');
    }
}