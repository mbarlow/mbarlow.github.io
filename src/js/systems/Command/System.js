import { System } from '../../core/System.js';

/**
 * CommandSystem - Handles slash command processing and execution
 * This system manages all /command functionality like /who, /model, /history, /save, etc.
 */
export class CommandSystem extends System {
    constructor() {
        super();
        this.requiredComponents = [];
        
        // System references - will be set by app.js
        this.world = null;
        this.industrialPortfolio = null;
    }

    init(world, industrialPortfolio) {
        console.log("🎮 Initializing Command System...");
        this.world = world;
        this.industrialPortfolio = industrialPortfolio;
        console.log("✅ Command System initialized");
    }




    // Handle /save command - saves current session to IndexedDB
    async handleSaveCommand() {
        const persistenceSystem = this.world?.getSystem("persistence");
        if (!persistenceSystem) {
            this.industrialPortfolio?.addMessage("assistant", "Save system not available.");
            return;
        }

        if (!persistenceSystem.initialized) {
            this.industrialPortfolio?.addMessage("assistant", "Persistence system not initialized.");
            return;
        }

        try {
            // Force a save of current session data to IndexedDB
            if (typeof persistenceSystem.forceSave === 'function') {
                await persistenceSystem.forceSave();
                this.industrialPortfolio?.addMessage("assistant", "✅ Current session saved to local storage (IndexedDB)!");
            } else {
                // Alternative: trigger a manual save
                await persistenceSystem.update(0); // Force an update
                this.industrialPortfolio?.addMessage("assistant", "✅ Session data synchronized to local storage!");
            }
        } catch (error) {
            console.error("Error saving session:", error);
            this.industrialPortfolio?.addMessage(
                "assistant", 
                "❌ Failed to save session to local storage. Please try again."
            );
        }
    }

    // Handle /search command - search sessions by query
    async handleSearchCommand(query) {
        const persistenceSystem = this.world?.getSystem("persistence");
        if (!persistenceSystem) {
            this.industrialPortfolio?.addMessage("assistant", "Search system not available.");
            return;
        }

        try {
            const results = await persistenceSystem.searchSessions(query);

            if (results.length === 0) {
                this.industrialPortfolio?.addMessage("assistant", `No sessions found matching "${query}"`);
                return;
            }

            let response = `Found ${results.length} session(s) matching "${query}":\n\n`;
            results.slice(0, 5).forEach((session, index) => {
                const date = new Date(session.lastActivityAt).toLocaleDateString();
                const title = session.title || "Untitled Session";
                response += `${index + 1}. ${title} (${date}) - ${session.messageCount} messages\n`;
                if (session.keywords?.length > 0) {
                    response += `   Keywords: ${session.keywords.join(", ")}\n`;
                }
            });

            if (results.length > 5) {
                response += `\n...and ${results.length - 5} more results.`;
            }

            this.industrialPortfolio?.addMessage("assistant", response);
        } catch (error) {
            console.error("Search error:", error);
            this.industrialPortfolio?.addMessage("assistant", "Search failed. Please try again.");
        }
    }

    // Handle /export command - export session data to JSON file
    async handleExportCommand() {
        const persistenceSystem = this.world?.getSystem("persistence");
        if (!persistenceSystem) {
            this.industrialPortfolio?.addMessage("assistant", "Export system not available.");
            return;
        }

        try {
            const data = await persistenceSystem.exportData();
            if (!data) {
                this.industrialPortfolio?.addMessage("assistant", "No data to export.");
                return;
            }

            // Create download
            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `ecs-sessions-${new Date().toISOString().split("T")[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.industrialPortfolio?.addMessage(
                "assistant",
                `✅ Exported ${data.sessions.length} sessions and ${data.chatLogs.length} chat logs!`,
            );
        } catch (error) {
            this.industrialPortfolio?.addMessage("assistant", "❌ Export failed. Please try again.");
            console.error("Export error:", error);
        }
    }


    // Handle /delete command - deletes sessions with confirmation
    async handleDeleteCommand(command) {
        const parts = command.trim().split(/\s+/);
        const subCommand = parts[1]?.toLowerCase();

        if (!subCommand || subCommand === "help") {
            this.industrialPortfolio?.addMessage(
                "assistant",
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
            return;
        }

        const persistenceSystem = this.world?.getSystem("persistence");
        const sessionSystem = this.world?.getSystem("session");

        if (!persistenceSystem || !sessionSystem) {
            this.industrialPortfolio?.addMessage("assistant", "❌ Session management not available.");
            return;
        }

        try {
            let deletedCount = 0;
            let response = "";

            switch (subCommand) {
                case "current":
                    deletedCount = await this.deleteCurrentSession(sessionSystem, persistenceSystem);
                    response = deletedCount > 0 ? "✅ Current session deleted." : "❌ No active session to delete.";
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
                        // Handle as range command
                        deletedCount = await this.deleteSessionRange(persistenceSystem, rangeStart, rangeEnd);
                        response = `✅ Deleted ${deletedCount} sessions from range ${rangeStart}-${rangeEnd}.`;
                    } else {
                        // Try to delete by session ID
                        const sessionId = parts[1];
                        deletedCount = await this.deleteSessionById(persistenceSystem, sessionId);
                        response = deletedCount > 0 ? `✅ Deleted session ${sessionId}.` : `❌ Session ${sessionId} not found.`;
                    }
                    break;
            }

            this.industrialPortfolio?.addMessage("assistant", response);

            // Auto-save after deletion
            if (deletedCount > 0) {
                await persistenceSystem.forceSave();
            }
        } catch (error) {
            console.error("Delete command error:", error);
            this.industrialPortfolio?.addMessage("assistant", `❌ Delete failed: ${error.message}`);
        }
    }

    async deleteCurrentSession(sessionSystem, persistenceSystem) {
        const activeSession = sessionSystem.getActiveSession(
            this.industrialPortfolio?.playerEntity,
            this.industrialPortfolio?.originEntity
        );
        if (!activeSession) return 0;

        // Delete session and associated data
        await persistenceSystem.storage.deleteSession(activeSession.id);
        if (activeSession.chatLogId) {
            await persistenceSystem.storage.deleteChatLog(activeSession.chatLogId);
        }

        // Clear active session
        sessionSystem.endSession(this.industrialPortfolio?.playerEntity, this.industrialPortfolio?.originEntity);

        return 1;
    }

    async deleteAllSessions(persistenceSystem) {
        const sessions = await persistenceSystem.storage.getAllSessions();
        const count = sessions.length;

        for (const session of sessions) {
            await persistenceSystem.storage.deleteSession(session.id);
            if (session.chatLogId) {
                await persistenceSystem.storage.deleteChatLog(session.chatLogId);
            }
        }

        return count;
    }

    async deleteSessionRange(persistenceSystem, startIdx, endIdx) {
        const sessions = await persistenceSystem.storage.getAllSessions();
        const sortedSessions = sessions.sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt));

        let deletedCount = 0;
        for (let i = startIdx - 1; i < Math.min(endIdx, sortedSessions.length); i++) {
            if (i >= 0 && sortedSessions[i]) {
                const session = sortedSessions[i];
                // Delete session and associated data
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
                // Delete session and associated data
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

        let deletedCount = 0;
        for (const session of sessions) {
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

    // Handle /titles or /generate-titles command - generates titles for untitled sessions using AI
    async handleGenerateTitlesCommand() {
        const persistenceSystem = this.world?.getSystem("persistence");
        const agentSystem = this.world?.getSystem("agent");

        if (!persistenceSystem || !agentSystem) {
            this.industrialPortfolio?.addMessage("assistant", "❌ Required systems not available.");
            return;
        }

        if (!agentSystem.isConnected) {
            this.industrialPortfolio?.addMessage(
                "assistant",
                "❌ LLM not connected. Cannot generate titles."
            );
            return;
        }

        try {
            this.industrialPortfolio?.addMessage(
                "assistant",
                "🤖 Generating titles for untitled sessions..."
            );

            const sessions = await persistenceSystem.storage.getAllSessions();
            let generatedCount = 0;
            let processedCount = 0;

            for (const session of sessions) {
                // Skip if already has title or not enough messages
                if (session.title || session.messageCount < 3) {
                    continue;
                }

                processedCount++;

                try {
                    // Get chat messages for this session by loading the chat log
                    const chatLog = await persistenceSystem.storage.loadChatLog(session.chatLogId);
                    if (!chatLog || !chatLog.messages || chatLog.messages.length < 3) continue;

                    // Create context from first few messages
                    const context = chatLog.messages
                        .slice(0, 6)
                        .map((m) => `${m.sender}: ${m.content}`)
                        .join("\n");

                    // Generate title
                    const prompt = `Summarize this conversation in one short sentence (max 8 words):\n${context}`;
                    const title = await agentSystem.generateResponse(prompt, {
                        temperature: 0.3,
                    });

                    // Generate keywords
                    const keywordPrompt = `List 3-5 keywords from this conversation (comma separated):\n${context}`;
                    const keywordsResponse = await agentSystem.generateResponse(keywordPrompt, {
                        temperature: 0.3,
                    });
                    const keywords = keywordsResponse
                        .split(",")
                        .map((k) => k.trim())
                        .filter((k) => k);

                    // Update session
                    session.title = title.trim();
                    session.keywords = keywords;

                    // Save the updated session
                    await persistenceSystem.storage.saveSession(session);

                    generatedCount++;

                    console.log(`✅ Generated title for ${session.id}: ${title.trim()}`);

                    // Add small delay to avoid overwhelming the LLM
                    await new Promise((resolve) => setTimeout(resolve, 100));
                } catch (error) {
                    console.warn(`Failed to generate title for session ${session.id}:`, error);
                }
            }

            this.industrialPortfolio?.addMessage(
                "assistant",
                `✅ Title generation complete!\n` +
                `- Processed: ${processedCount} sessions\n` +
                `- Generated: ${generatedCount} new titles\n` +
                `- Skipped: ${processedCount - generatedCount} sessions (errors or already titled)\n\n` +
                `Use \`/history\` to see the updated titles.`
            );
        } catch (error) {
            console.error("Title generation error:", error);
            this.industrialPortfolio?.addMessage(
                "assistant",
                `❌ Title generation failed: ${error.message}`
            );
        }
    }

    // Handle /connect command - manages entity connections
    async handleConnectCommand(command) {
        const parts = command.trim().split(/\s+/);
        const subCommand = parts[1]?.toLowerCase();

        if (!subCommand || subCommand === "help") {
            this.industrialPortfolio?.addMessage(
                "assistant",
                `**Connect Command Usage:**\n\n` +
                `\`/connect help\` - Show this help\n` +
                `\`/connect list\` - List available entities\n` +
                `\`/connect origin\` - Connect to origin marker (default)\n` +
                `\`/connect patrol\` - Connect to patrol bot\n` +
                `\`/connect <entity>\` - Connect to specific entity by tag\n\n` +
                `**Examples:**\n` +
                `\`/connect patrol\` - Start chatting with patrol bot\n` +
                `\`/connect origin\` - Return to origin marker chat`
            );
            return;
        }

        const sessionSystem = this.world?.getSystem("session");
        if (!sessionSystem || !this.industrialPortfolio?.playerEntity) {
            this.industrialPortfolio?.addMessage("assistant", "❌ Session system not available.");
            return;
        }

        try {
            let targetEntity = null;
            let entityName = "";

            switch (subCommand) {
                case "list":
                    await this.listAvailableEntities();
                    return;

                case "origin":
                    targetEntity = this.industrialPortfolio?.originEntity;
                    entityName = "Origin Marker";
                    break;

                case "patrol":
                case "bot":
                    // Find patrol bot entity
                    const entities = Array.from(this.world.entities.values());
                    targetEntity = entities.find(e => e.tag === "bot" && e.getComponent("BrainComponent"));
                    entityName = "Patrol Bot";
                    break;

                default:
                    // Try to find entity by tag
                    const allEntities = Array.from(this.world.entities.values());
                    targetEntity = allEntities.find(e => e.tag === subCommand && e.getComponent("BrainComponent"));
                    entityName = subCommand;
                    break;
            }

            if (!targetEntity) {
                this.industrialPortfolio?.addMessage("assistant", `❌ Entity "${subCommand}" not found or doesn't support chat.`);
                return;
            }

            // Switch the active target for chat
            if (this.industrialPortfolio) {
                this.industrialPortfolio.currentChatTarget = targetEntity;
            }
            
            this.industrialPortfolio?.addMessage("assistant", `✅ Connected to ${entityName}! Your messages will now go to this entity.`);

        } catch (error) {
            console.error("Connect command error:", error);
            this.industrialPortfolio?.addMessage("assistant", `❌ Connection failed: ${error.message}`);
        }
    }

    async listAvailableEntities() {
        const entities = Array.from(this.world.entities.values());
        const chatEntities = entities.filter(e => e.getComponent("BrainComponent"));
        
        let response = "**Available Entities:**\n\n";
        
        chatEntities.forEach(entity => {
            const brain = entity.getComponent("BrainComponent");
            const tag = entity.tag || `Entity ${entity.id}`;
            const personality = brain.personality || "unknown";
            response += `• **${tag}** - ${personality} (ID: ${entity.id})\n`;
        });

        if (chatEntities.length === 0) {
            response += "No entities with chat capabilities found.";
        }

        this.industrialPortfolio?.addMessage("assistant", response);
    }

    // System update method (required by ECS)
    update(deltaTime) {
        // Command System doesn't need regular updates
        // It responds to slash commands instead
    }
}