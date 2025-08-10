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

    // Handle /who command - shows current chat target info
    async handleWhoCommand() {
        if (!this.industrialPortfolio?.originEntity) {
            this.industrialPortfolio?.addMessage("assistant", "Origin entity not available.");
            return;
        }

        if (!this.industrialPortfolio?.currentChatTarget) {
            this.industrialPortfolio?.addMessage("assistant", "No active chat target. Use /connect to connect to an entity.");
            return;
        }

        const brain = this.industrialPortfolio.currentChatTarget.getComponent("BrainComponent");
        const entityName = this.industrialPortfolio.currentChatTarget.tag || "Unknown Entity";
        
        // Handle personality - it might be an object
        let personality = "No personality set";
        if (brain?.personality) {
            if (typeof brain.personality === 'string') {
                personality = brain.personality;
            } else if (brain.personality.description) {
                personality = brain.personality.description;
            } else if (brain.personality.name) {
                personality = brain.personality.name;
            } else {
                personality = JSON.stringify(brain.personality);
            }
        }

        let response = `🤖 Currently chatting with: **${entityName}**\n`;
        response += `🧠 Personality: ${personality}\n`;
        
        if (brain?.model) {
            response += `⚙️ AI Model: ${brain.model}\n`;
        }
        
        if (brain?.systemPrompt) {
            const promptPreview = brain.systemPrompt.length > 100 
                ? brain.systemPrompt.substring(0, 100) + "..."
                : brain.systemPrompt;
            response += `📝 System Prompt: ${promptPreview}`;
        }

        this.industrialPortfolio?.addMessage("assistant", response);
    }

    // Handle /model command - lists available AI models
    async handleModelCommand() {
        const agentSystem = this.world?.getSystem("agent");
        if (!agentSystem) {
            this.industrialPortfolio?.addMessage("assistant", "Agent system not available.");
            return;
        }

        console.log("AgentSystem debug:", {
            connected: agentSystem.connected,
            isConnected: agentSystem.isConnected,
            currentModel: agentSystem.currentModel,
            models: agentSystem.models,
            availableModels: agentSystem.availableModels
        });

        let response = "🤖 Available AI Models:\n\n";
        
        // Try different property names for models
        const modelsList = agentSystem.models || agentSystem.availableModels || [];
        
        if (modelsList && modelsList.length > 0) {
            modelsList.forEach((model, index) => {
                // Handle both string and object models
                const modelName = typeof model === 'string' ? model : (model.name || model.model || model.id || JSON.stringify(model));
                const isCurrent = modelName === agentSystem.currentModel || model === agentSystem.currentModel;
                const marker = isCurrent ? "➤ " : "  ";
                response += `${marker}${modelName}${isCurrent ? " (current)" : ""}\n`;
            });
            response += "\nUse the model dropdown to switch between models.";
        } else {
            response += "No models available. Please check if Ollama is running and has models installed.\n";
            response += `Connection status: ${agentSystem.connected || agentSystem.isConnected ? 'Connected' : 'Disconnected'}`;
        }

        this.industrialPortfolio?.addMessage("assistant", response);
    }

    // Handle /history command - shows session history
    async handleHistoryCommand() {
        const persistenceSystem = this.world?.getSystem("persistence");
        if (!persistenceSystem) {
            this.industrialPortfolio?.addMessage("assistant", "History system not available.");
            return;
        }

        if (!persistenceSystem.initialized) {
            this.industrialPortfolio?.addMessage("assistant", "No session history found.");
            return;
        }

        try {
            const sessions = await persistenceSystem.storage.getAllSessions();
            
            if (!sessions || sessions.length === 0) {
                this.industrialPortfolio?.addMessage("assistant", "No session history found.");
                return;
            }

            // Sort by last activity
            sessions.sort((a, b) => {
                const aTime = new Date(a.lastActivityAt || a.createdAt || 0).getTime();
                const bTime = new Date(b.lastActivityAt || b.createdAt || 0).getTime();
                return bTime - aTime;
            });

            let response = `📊 Session History (${sessions.length} sessions):\n\n`;
            
            sessions.slice(0, 10).forEach((session, index) => {
                const title = session.title || `Session ${session.id.slice(0, 8)}`;
                const messageCount = session.messageCount || 0;
                const lastActivity = session.lastActivityAt ? 
                    new Date(session.lastActivityAt).toLocaleDateString() : 
                    'No activity';
                
                response += `${index + 1}. **${title}**\n`;
                response += `   💬 ${messageCount} messages | 📅 ${lastActivity}\n\n`;
            });

            if (sessions.length > 10) {
                response += `... and ${sessions.length - 10} more sessions.\nUse the sessions panel to see all sessions.`;
            }

            this.industrialPortfolio?.addMessage("assistant", response);
        } catch (error) {
            console.error("Error loading history:", error);
            this.industrialPortfolio?.addMessage("assistant", "Failed to load history. Please try again.");
        }
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

    // Handle /context command - show current conversation context
    async handleContextCommand() {
        const sessionSystem = this.world?.getSystem("session");
        if (!sessionSystem || !this.industrialPortfolio?.playerEntity || !this.industrialPortfolio?.originEntity) {
            this.industrialPortfolio?.addMessage("assistant", "Session context not available.");
            return;
        }

        // Get current session
        const activeSessions = sessionSystem.getSessionHistory(this.industrialPortfolio.playerEntity);
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
        const connectionSystem = this.world?.getSystem("connection");
        if (connectionSystem) {
            const connectionCount = connectionSystem.connectors?.size || 0;
            response += `**Connection Status:**\n`;
            response += `- Active Connections: ${connectionCount}\n`;
            response += `- Visual State: ${connectionCount > 0 ? "Connected" : "Disconnected"}\n\n`;
        }

        // Entity brain context (need to import BrainComponent)
        const originBrain = this.industrialPortfolio.originEntity.getComponent("BrainComponent");
        if (originBrain) {
            response += `**Origin Marker Context:**\n`;
            response += `- Personality: ${originBrain.personality?.description || originBrain.personality || "None"}\n`;
            response += `- Model: ${originBrain.model || "Not set"}\n`;
            response += `- System Prompt: ${originBrain.systemPrompt ? "Set" : "Not set"}\n`;
        }

        this.industrialPortfolio?.addMessage("assistant", response);
    }

    // System update method (required by ECS)
    update(deltaTime) {
        // Command System doesn't need regular updates
        // It responds to slash commands instead
    }
}