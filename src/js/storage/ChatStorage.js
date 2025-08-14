import { Message } from '../components/Message.js';
import { Channel } from '../components/Channel.js';

/**
 * Simple IndexedDB storage for messages and channels
 */
export class ChatStorage {
    constructor() {
        this.dbName = 'ChatDB';
        this.version = 1;
        this.db = null;
    }

    /**
     * Initialize IndexedDB
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.warn('IndexedDB failed, falling back to localStorage');
                this.db = null;
                resolve();
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('✅ ChatStorage IndexedDB initialized');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Messages store
                if (!db.objectStoreNames.contains('messages')) {
                    const messagesStore = db.createObjectStore('messages', { keyPath: 'id' });
                    messagesStore.createIndex('type', 'type', { unique: false });
                    messagesStore.createIndex('targetId', 'targetId', { unique: false });
                    messagesStore.createIndex('author', 'author', { unique: false });
                    messagesStore.createIndex('created', 'created', { unique: false });
                }

                // Channels store
                if (!db.objectStoreNames.contains('channels')) {
                    const channelsStore = db.createObjectStore('channels', { keyPath: 'id' });
                    channelsStore.createIndex('name', 'name', { unique: true });
                }

                console.log('📦 ChatStorage database schema created');
            };
        });
    }

    /**
     * Save a message
     */
    async saveMessage(message) {
        if (!this.db) {
            // Fallback to localStorage
            const messages = this.getLocalStorageMessages();
            messages.push(message.toObject());
            localStorage.setItem('chat_messages', JSON.stringify(messages));
            return;
        }

        const transaction = this.db.transaction(['messages'], 'readwrite');
        const store = transaction.objectStore('messages');
        await store.put(message.toObject());
    }

    /**
     * Get messages for a target (channel or DM)
     */
    async getMessages(type, targetId, limit = 100) {
        if (!this.db) {
            // Fallback to localStorage
            const messages = this.getLocalStorageMessages();
            return messages
                .filter(msg => msg.type === type && msg.targetId === targetId)
                .sort((a, b) => new Date(a.created) - new Date(b.created))
                .slice(-limit)
                .map(msg => Message.fromObject(msg));
        }

        const transaction = this.db.transaction(['messages'], 'readonly');
        const store = transaction.objectStore('messages');
        const index = store.index('targetId');
        
        const messages = [];
        const request = index.openCursor(IDBKeyRange.only(targetId));
        
        return new Promise((resolve) => {
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && cursor.value.type === type) {
                    messages.push(Message.fromObject(cursor.value));
                    cursor.continue();
                } else if (cursor) {
                    cursor.continue();
                } else {
                    // Sort by created time and limit
                    messages.sort((a, b) => new Date(a.created) - new Date(b.created));
                    resolve(messages.slice(-limit));
                }
            };
        });
    }

    /**
     * Get ALL messages of a specific type (for better filtering)
     */
    async getAllMessages(type) {
        if (!this.db) {
            // Fallback to localStorage
            const messagesData = JSON.parse(localStorage.getItem('chat_messages') || '[]');
            return messagesData
                .filter(msg => msg.type === type)
                .map(msg => Message.fromObject(msg));
        }

        const transaction = this.db.transaction(['messages'], 'readonly');
        const store = transaction.objectStore('messages');
        const typeIndex = store.index('type');
        
        const messages = [];
        const request = typeIndex.openCursor(IDBKeyRange.only(type));
        
        return new Promise((resolve) => {
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    messages.push(Message.fromObject(cursor.value));
                    cursor.continue();
                } else {
                    // Sort by created time
                    messages.sort((a, b) => new Date(a.created) - new Date(b.created));
                    resolve(messages);
                }
            };
        });
    }

    /**
     * Get recent messages for context (last N messages in a target)
     */
    async getRecentMessages(type, targetId, count = 5) {
        const messages = await this.getMessages(type, targetId, count);
        return messages.slice(-count);
    }

    /**
     * Save a channel
     */
    async saveChannel(channel) {
        if (!this.db) {
            // Fallback to localStorage
            const channels = this.getLocalStorageChannels();
            const index = channels.findIndex(c => c.id === channel.id);
            if (index >= 0) {
                channels[index] = channel.toObject();
            } else {
                channels.push(channel.toObject());
            }
            localStorage.setItem('chat_channels', JSON.stringify(channels));
            return;
        }

        const transaction = this.db.transaction(['channels'], 'readwrite');
        const store = transaction.objectStore('channels');
        await store.put(channel.toObject());
    }

    /**
     * Get all channels
     */
    async getAllChannels() {
        if (!this.db) {
            // Fallback to localStorage
            const channels = this.getLocalStorageChannels();
            return channels.map(c => Channel.fromObject(c));
        }

        const transaction = this.db.transaction(['channels'], 'readonly');
        const store = transaction.objectStore('channels');
        const request = store.getAll();
        
        return new Promise((resolve) => {
            request.onsuccess = () => {
                const channels = request.result.map(c => Channel.fromObject(c));
                resolve(channels);
            };
        });
    }

    /**
     * Get channel by name
     */
    async getChannelByName(name) {
        if (!this.db) {
            // Fallback to localStorage
            const channels = this.getLocalStorageChannels();
            const channel = channels.find(c => c.name === name);
            return channel ? Channel.fromObject(channel) : null;
        }

        const transaction = this.db.transaction(['channels'], 'readonly');
        const store = transaction.objectStore('channels');
        const index = store.index('name');
        const request = index.get(name);
        
        return new Promise((resolve) => {
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? Channel.fromObject(result) : null);
            };
        });
    }

    /**
     * Get entities that have DM history
     */
    async getDMEntities() {
        if (!this.db) {
            // Fallback to localStorage
            const messages = this.getLocalStorageMessages();
            const entityIds = new Set();
            messages.filter(msg => msg.type === 'dm').forEach(msg => {
                entityIds.add(msg.targetId);
                entityIds.add(msg.author);
            });
            return Array.from(entityIds);
        }

        const transaction = this.db.transaction(['messages'], 'readonly');
        const store = transaction.objectStore('messages');
        const request = store.getAll();
        
        return new Promise((resolve) => {
            request.onsuccess = () => {
                const entityIds = new Set();
                request.result
                    .filter(msg => msg.type === 'dm')
                    .forEach(msg => {
                        entityIds.add(msg.targetId);
                        entityIds.add(msg.author);
                    });
                resolve(Array.from(entityIds));
            };
        });
    }

    // LocalStorage fallback methods
    getLocalStorageMessages() {
        const stored = localStorage.getItem('chat_messages');
        return stored ? JSON.parse(stored) : [];
    }

    getLocalStorageChannels() {
        const stored = localStorage.getItem('chat_channels');
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Clear all data (for testing)
     */
    async clearAll() {
        if (this.db) {
            const transaction = this.db.transaction(['messages', 'channels'], 'readwrite');
            await transaction.objectStore('messages').clear();
            await transaction.objectStore('channels').clear();
        }
        
        localStorage.removeItem('chat_messages');
        localStorage.removeItem('chat_channels');
        console.log('🗑️ All chat data cleared');
    }
}