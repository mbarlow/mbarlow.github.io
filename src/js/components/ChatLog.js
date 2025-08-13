import { Component } from '../core/Component.js';
import { generateUUID } from '../utils/uuid.js';

export class ChatLog extends Component {
    constructor() {
        super();
        this.logs = new Map(); // chatLogId -> log data
    }

    createLog(chatLogId) {
        const log = {
            id: chatLogId,
            messages: [],
            createdAt: Date.now(),
            lastMessageAt: null
        };
        this.logs.set(chatLogId, log);
        return log;
    }

    addMessage(chatLogId, message) {
        let log = this.logs.get(chatLogId);
        if (!log) {
            log = this.createLog(chatLogId);
        }

        const messageData = {
            id: message.id || generateUUID(),
            senderId: message.senderId,
            content: message.content,
            timestamp: message.timestamp || Date.now(),
            type: message.type || 'user', // user, llm, system
            metadata: message.metadata || {}
        };

        log.messages.push(messageData);
        log.lastMessageAt = messageData.timestamp;
        
        return messageData;
    }

    getLog(chatLogId) {
        return this.logs.get(chatLogId);
    }

    getMessages(chatLogId, limit = null, offset = 0) {
        const log = this.logs.get(chatLogId);
        if (!log) return [];
        
        if (limit === null) {
            return log.messages.slice(offset);
        }
        return log.messages.slice(offset, offset + limit);
    }

    getRecentMessages(chatLogId, count = 10) {
        const log = this.logs.get(chatLogId);
        if (!log) return [];
        
        return log.messages.slice(-count);
    }

    searchMessages(chatLogId, searchTerm) {
        const log = this.logs.get(chatLogId);
        if (!log) return [];
        
        const lowerSearch = searchTerm.toLowerCase();
        return log.messages.filter(message => 
            message.content.toLowerCase().includes(lowerSearch)
        );
    }

    getMessageCount(chatLogId) {
        const log = this.logs.get(chatLogId);
        return log ? log.messages.length : 0;
    }

    clearLog(chatLogId) {
        const log = this.logs.get(chatLogId);
        if (log) {
            log.messages = [];
            log.lastMessageAt = null;
        }
    }

    deleteLog(chatLogId) {
        this.logs.delete(chatLogId);
    }

    exportLog(chatLogId) {
        const log = this.logs.get(chatLogId);
        if (!log) return null;
        
        return {
            ...log,
            exportedAt: Date.now()
        };
    }
}