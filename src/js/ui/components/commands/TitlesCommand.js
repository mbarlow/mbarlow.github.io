/**
 * TitlesCommand - Handles /titles command functionality
 * Part of Phase 5: Command System refactor
 */

import { debugLog } from '../../utils/debug.js';

export class TitlesCommand {
    constructor(app) {
        this.app = app;
        this.name = 'titles';
        this.help = 'Generate titles for untitled sessions';
        this.category = 'session';
    }

    async execute(args) {
        debugLog.ui('Executing titles command', args);
        
        const persistenceSystem = this.app.world.getSystem("persistence");
        const agentSystem = this.app.world.getSystem("agent");

        if (!persistenceSystem || !agentSystem) {
            this.app.addMessage("assistant", "❌ Required systems not available.");
            return;
        }

        try {
            const sessions = await persistenceSystem.storage.getAllSessions();
            
            // Filter for untitled sessions in current connection
            const untitledSessions = sessions.filter(session => 
                (!session.title || session.title === "Untitled Session") &&
                session.participants &&
                session.participants.includes(this.app.playerEntity?.id) &&
                session.participants.includes(this.app.originEntity?.id) &&
                session.messageCount > 0
            );

            if (untitledSessions.length === 0) {
                this.app.addMessage("assistant", "✅ No untitled sessions found that need titles.");
                return;
            }

            this.app.addMessage("assistant", `🔄 Generating titles for ${untitledSessions.length} untitled sessions...`);

            let successCount = 0;
            let errorCount = 0;

            for (const session of untitledSessions) {
                try {
                    await this.generateTitleForSession(session, persistenceSystem, agentSystem);
                    successCount++;
                } catch (error) {
                    debugLog.ui('Failed to generate title for session', { 
                        sessionId: session.id, 
                        error: error.message 
                    });
                    errorCount++;
                }
            }

            // Report results
            let response = `✅ Title generation complete!\n\n`;
            response += `📊 **Results:**\n`;
            response += `• Generated: ${successCount} titles\n`;
            if (errorCount > 0) {
                response += `• Failed: ${errorCount} sessions\n`;
            }
            response += `\nUse \`/history\` to see the updated session titles.`;

            this.app.addMessage("assistant", response);
            
            debugLog.ui('Titles command completed', { successCount, errorCount });

        } catch (error) {
            debugLog.ui('Titles command failed', { error: error.message });
            this.app.addMessage("assistant", `❌ Title generation failed: ${error.message}`);
        }
    }

    async generateTitleForSession(session, persistenceSystem, agentSystem) {
        // Load chat log
        const chatLog = await persistenceSystem.storage.loadChatLog(session.chatLogId);
        if (!chatLog || !chatLog.messages || chatLog.messages.length === 0) {
            throw new Error("No messages found in session");
        }

        // Get first few messages to generate title from
        const messagesToAnalyze = chatLog.messages.slice(0, 5);
        let context = "";
        
        for (const msg of messagesToAnalyze) {
            const senderEntity = this.app.world.getEntity(msg.senderId);
            const senderName = senderEntity?.tag || "Unknown";
            context += `${senderName}: ${msg.content}\n`;
        }

        // Generate title using AI
        const titlePrompt = `Based on this conversation, generate a short, descriptive title (max 6 words):\n\n${context}\n\nTitle:`;
        
        try {
            const response = await agentSystem.sendMessage(
                this.app.originEntity.id,
                titlePrompt,
                { 
                    systemContext: "You are helping generate concise, descriptive titles for chat sessions. Respond with only the title, no extra text or quotes.",
                    maxTokens: 20
                }
            );

            if (response && response.trim()) {
                let title = response.trim();
                
                // Clean up the title
                title = title.replace(/^["']|["']$/g, ''); // Remove quotes
                title = title.replace(/^Title:\s*/i, ''); // Remove "Title:" prefix
                title = title.slice(0, 60); // Limit length
                
                // Update session with new title
                session.title = title;
                await persistenceSystem.storage.saveSession(session);
                
                debugLog.ui('Generated title for session', { 
                    sessionId: session.id, 
                    title: title 
                });
            } else {
                throw new Error("Empty response from AI");
            }
        } catch (error) {
            throw new Error(`AI title generation failed: ${error.message}`);
        }
    }
}