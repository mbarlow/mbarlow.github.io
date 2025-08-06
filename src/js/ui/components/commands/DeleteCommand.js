/**
 * DeleteCommand - Handles /delete command functionality
 * Part of Phase 5: Command System refactor
 */

import { debugLog } from '../../utils/debug.js';

export class DeleteCommand {
    constructor(app) {
        this.app = app;
        this.name = 'delete';
        this.help = 'Delete chat sessions (see /delete help)';
        this.category = 'session';
    }

    async execute(args) {
        debugLog.ui('Executing delete command', args);
        
        const parts = args.fullCommand.trim().split(/\s+/);
        const subCommand = parts[1]?.toLowerCase();

        if (!subCommand || subCommand === "help") {
            this.showHelp();
            return;
        }

        const persistenceSystem = this.app.world.getSystem("persistence");
        const sessionSystem = this.app.world.getSystem("session");

        if (!persistenceSystem || !sessionSystem) {
            this.app.addMessage("assistant", "❌ Session management not available.");
            return;
        }

        try {
            let deletedCount = 0;
            let response = "";

            switch (subCommand) {
                case "current":
                    deletedCount = await this.deleteCurrentSession(sessionSystem, persistenceSystem);
                    response = deletedCount > 0 
                        ? "✅ Current session deleted." 
                        : "❌ No active session to delete.";
                    break;

                case "all":
                    deletedCount = await this.deleteAllSessions(persistenceSystem);
                    response = `✅ Deleted ${deletedCount} sessions.`;
                    break;

                case "range":
                    const startIdx = parseInt(parts[2]);
                    const endIdx = parseInt(parts[3]);
                    if (isNaN(startIdx) || isNaN(endIdx)) {
                        response = "❌ Invalid range. Use: /delete range <start> <end>";
                    } else {
                        deletedCount = await this.deleteSessionRange(persistenceSystem, startIdx, endIdx);
                        response = `✅ Deleted ${deletedCount} sessions from range ${startIdx}-${endIdx}.`;
                    }
                    break;

                case "old":
                    const days = parseInt(parts[2]);
                    if (isNaN(days) || days < 1) {
                        response = "❌ Invalid days. Use: /delete old <days>";
                    } else {
                        deletedCount = await this.deleteOldSessions(persistenceSystem, days);
                        response = `✅ Deleted ${deletedCount} sessions older than ${days} days.`;
                    }
                    break;

                default:
                    // Check if it's numeric arguments (range without "range" keyword)
                    const rangeStart = parseInt(parts[1]);
                    const rangeEnd = parseInt(parts[2]);
                    if (!isNaN(rangeStart) && !isNaN(rangeEnd)) {
                        deletedCount = await this.deleteSessionRange(persistenceSystem, rangeStart, rangeEnd);
                        response = `✅ Deleted ${deletedCount} sessions from range ${rangeStart}-${rangeEnd}.`;
                    } else {
                        // Try to delete by session ID
                        const sessionId = parts[1];
                        deletedCount = await this.deleteSessionById(persistenceSystem, sessionId);
                        response = deletedCount > 0 
                            ? `✅ Deleted session ${sessionId}.` 
                            : `❌ Session ${sessionId} not found.`;
                    }
                    break;
            }

            this.app.addMessage("assistant", response);

            // Auto-save after deletion
            if (deletedCount > 0) {
                await persistenceSystem.forceSave();
            }
            
            debugLog.ui('Delete command completed', { deletedCount, subCommand });
            
        } catch (error) {
            debugLog.ui('Delete command failed', { error: error.message });
            this.app.addMessage("assistant", `❌ Delete failed: ${error.message}`);
        }
    }

    showHelp() {
        this.app.addMessage("assistant",
            `**Delete Command Usage:**\n\n` +
            `\`/delete help\` - Show this help\n` +
            `\`/delete current\` - Delete current active session\n` +
            `\`/delete <id>\` - Delete session by ID\n` +
            `\`/delete range <start> <end>\` - Delete sessions by index range (from /history list)\n` +
            `\`/delete all\` - Delete ALL sessions for this connection (⚠️ PERMANENT)\n` +
            `\`/delete old <days>\` - Delete sessions older than X days\n\n` +
            `**Examples:**\n` +
            `\`/delete current\` - Delete the current session\n` +
            `\`/delete range 1 5\` - Delete sessions 1-5 from history list\n` +
            `\`/delete old 30\` - Delete sessions older than 30 days`
        );
    }

    async deleteCurrentSession(sessionSystem, persistenceSystem) {
        const activeSession = sessionSystem.getActiveSession(
            this.app.playerEntity,
            this.app.originEntity,
        );
        if (!activeSession) return 0;

        await persistenceSystem.storage.deleteSession(activeSession.id);
        if (activeSession.chatLogId) {
            await persistenceSystem.storage.deleteChatLog(activeSession.chatLogId);
        }

        sessionSystem.endSession(this.app.playerEntity, this.app.originEntity);
        return 1;
    }

    async deleteAllSessions(persistenceSystem) {
        const sessions = await persistenceSystem.storage.getAllSessions();
        const connectionSessions = sessions.filter(session => 
            session.participants && 
            session.participants.includes(this.app.playerEntity?.id) &&
            session.participants.includes(this.app.originEntity?.id)
        );
        
        const count = connectionSessions.length;

        for (const session of connectionSessions) {
            await persistenceSystem.storage.deleteSession(session.id);
            if (session.chatLogId) {
                await persistenceSystem.storage.deleteChatLog(session.chatLogId);
            }
        }

        return count;
    }

    async deleteSessionRange(persistenceSystem, startIdx, endIdx) {
        const sessions = await persistenceSystem.storage.getAllSessions();
        const connectionSessions = sessions.filter(session => 
            session.participants && 
            session.participants.includes(this.app.playerEntity?.id) &&
            session.participants.includes(this.app.originEntity?.id)
        );
        
        const sortedSessions = connectionSessions.sort(
            (a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt),
        );

        let deletedCount = 0;
        for (let i = startIdx - 1; i < Math.min(endIdx, sortedSessions.length); i++) {
            if (i >= 0 && sortedSessions[i]) {
                const session = sortedSessions[i];
                await persistenceSystem.storage.deleteSession(session.id);
                if (session.chatLogId) {
                    await persistenceSystem.storage.deleteChatLog(session.chatLogId);
                }
                deletedCount++;
            }
        }

        return deletedCount;
    }

    async deleteSessionById(persistenceSystem, sessionId) {
        try {
            const session = await persistenceSystem.storage.loadSession(sessionId);
            if (session) {
                // Check if session belongs to current connection
                if (!session.participants || 
                    !session.participants.includes(this.app.playerEntity?.id) ||
                    !session.participants.includes(this.app.originEntity?.id)) {
                    return 0;
                }
                
                await persistenceSystem.storage.deleteSession(sessionId);
                if (session.chatLogId) {
                    await persistenceSystem.storage.deleteChatLog(session.chatLogId);
                }
                return 1;
            }
            return 0;
        } catch (error) {
            console.error("Error deleting session:", error);
            return 0;
        }
    }

    async deleteOldSessions(persistenceSystem, days) {
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const sessions = await persistenceSystem.storage.getAllSessions();
        const connectionSessions = sessions.filter(session => 
            session.participants && 
            session.participants.includes(this.app.playerEntity?.id) &&
            session.participants.includes(this.app.originEntity?.id)
        );

        let deletedCount = 0;
        for (const session of connectionSessions) {
            if (new Date(session.lastActivityAt) < cutoffDate) {
                await persistenceSystem.storage.deleteSession(session.id);
                if (session.chatLogId) {
                    await persistenceSystem.storage.deleteChatLog(session.chatLogId);
                }
                deletedCount++;
            }
        }

        return deletedCount;
    }
}