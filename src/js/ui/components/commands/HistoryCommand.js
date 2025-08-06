/**
 * HistoryCommand - Handles /history command functionality
 * Part of Phase 5: Command System refactor
 */

import { debugLog } from '../../utils/debug.js';

export class HistoryCommand {
    constructor(app) {
        this.app = app;
        this.name = 'history';
        this.help = 'Show recent chat sessions';
        this.category = 'chat';
    }

    async execute(args) {
        debugLog.ui('Executing history command', args);
        
        const persistenceSystem = this.app.world.getSystem("persistence");
        if (!persistenceSystem) {
            this.app.addMessage("assistant", "History system not available.");
            return;
        }

        try {
            const sessions = await persistenceSystem.storage.getAllSessions();
            
            // Filter sessions for current connection
            const connectionSessions = sessions.filter(session => 
                session.participants && 
                session.participants.includes(this.app.playerEntity?.id) &&
                session.participants.includes(this.app.originEntity?.id)
            );
            
            if (connectionSessions.length === 0) {
                this.app.addMessage("assistant", "No session history found.");
                return;
            }

            // Sort by last activity and take top 10
            const recentSessions = connectionSessions
                .sort((a, b) => b.lastActivityAt - a.lastActivityAt)
                .slice(0, 10);

            let response = "Recent session history:\n\n";
            
            for (let i = 0; i < recentSessions.length; i++) {
                const session = recentSessions[i];
                const index = i + 1;
                
                // Get participant names
                const participantNames = await this.app.getParticipantNames(session.participants);
                
                // Get chat log to check for images
                const chatLog = await persistenceSystem.storage.loadChatLog(session.chatLogId);
                const imageCount = this.app.countImagesInChatLog(chatLog);
                
                response += `${index}. **${session.title || 'Untitled Session'}** (${new Date(session.lastActivityAt).toLocaleString()})\n`;
                response += `   📝 ${session.messageCount} messages | 👥 ${participantNames.join(', ')}\n`;
                
                if (imageCount > 0) {
                    response += `   🖼️ ${imageCount} image${imageCount > 1 ? 's' : ''}\n`;
                }
                
                if (session.keywords?.length > 0) {
                    response += `   🏷️ ${session.keywords.join(', ')}\n`;
                }
                
                response += "\n";
            }

            this.app.addMessage("assistant", response);
            
            debugLog.ui('History command completed', {
                sessionCount: recentSessions.length
            });
            
        } catch (error) {
            debugLog.ui('History command failed', { error: error.message });
            this.app.addMessage("assistant", "Failed to load history. Please try again.");
        }
    }
}