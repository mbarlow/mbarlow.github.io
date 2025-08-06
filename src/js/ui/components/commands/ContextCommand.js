/**
 * ContextCommand - Handles /context command functionality
 * Part of Phase 5: Command System refactor
 */

import { debugLog } from '../../utils/debug.js';

export class ContextCommand {
    constructor(app) {
        this.app = app;
        this.name = 'context';
        this.help = 'Show conversation context';
        this.category = 'info';
    }

    async execute(args) {
        debugLog.ui('Executing context command', args);
        
        const sessionSystem = this.app.world.getSystem("session");
        if (!sessionSystem || !this.app.playerEntity || !this.app.originEntity) {
            this.app.addMessage("assistant", "Session context not available.");
            return;
        }

        // Get current session
        const activeSessions = sessionSystem.getSessionHistory(this.app.playerEntity);
        const activeSession = activeSessions.find((s) => s && s.state === "active");

        let response = `📋 **Current Conversation Context**\n\n`;

        if (activeSession) {
            response += `**Active Session:**\n`;
            response += `- Session ID: ${activeSession.id}\n`;
            response += `- Participants: ${activeSession.participants.size}\n`;
            response += `- State: ${activeSession.state}\n`;
            response += `- Message Count: ${activeSession.messageCount}\n`;
            response += `- Title: ${activeSession.title || "Not yet generated"}\n`;
            response += `- Keywords: ${activeSession.keywords?.join(", ") || "None"}\n`;
            response += `- Created: ${new Date(activeSession.createdAt).toLocaleString()}\n`;
            response += `- Last Activity: ${new Date(activeSession.lastActivityAt).toLocaleString()}\n\n`;
        } else {
            response += `**No Active Session**\n\n`;
        }

        // Connection info
        const connectionSystem = this.app.world.getSystem("connection");
        if (connectionSystem) {
            const connectionCount = connectionSystem.connectors.size;
            response += `**Connection Status:**\n`;
            response += `- Active Connections: ${connectionCount}\n`;
            response += `- Visual State: ${connectionCount > 0 ? "Connected" : "Disconnected"}\n\n`;
        }

        // Entity brain context
        const originBrain = this.app.originEntity.getComponent("BrainComponent");
        if (originBrain) {
            response += `**Origin Marker Context:**\n`;
            response += `- Current Emotion: ${originBrain.emotion}\n`;
            response += `- Energy Level: ${(originBrain.energy * 100).toFixed(0)}%\n`;
            response += `- Short-term Memories: ${originBrain.shortTermMemory.length}\n`;
            response += `- Context Window: ${originBrain.contextWindow} messages\n`;
        }

        this.app.addMessage("assistant", response);
        
        debugLog.ui('Context command completed', {
            hasActiveSession: !!activeSession,
            sessionId: activeSession?.id
        });
    }
}