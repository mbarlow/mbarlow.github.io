/**
 * ConnectCommand - Handles /connect command functionality
 * Part of Phase 5: Command System refactor
 */

import { debugLog } from '../../utils/debug.js';

export class ConnectCommand {
    constructor(app) {
        this.app = app;
        this.name = 'connect';
        this.help = 'Connect to entities (see /connect help)';
        this.category = 'chat';
    }

    async execute(args) {
        debugLog.ui('Executing connect command', args);
        
        const parts = args.fullCommand.trim().split(/\s+/);
        const subCommand = parts[1]?.toLowerCase();

        if (!subCommand || subCommand === "help") {
            this.showHelp();
            return;
        }

        const sessionSystem = this.app.world.getSystem("session");
        if (!sessionSystem || !this.app.playerEntity) {
            this.app.addMessage("assistant", "❌ Session system not available.");
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
                    targetEntity = this.app.originEntity;
                    entityName = "Origin Marker";
                    break;

                case "patrol":
                case "bot":
                    // Find patrol bot entity
                    const entities = Array.from(this.app.world.entities.values());
                    targetEntity = entities.find(e => e.tag === "bot" && e.getComponent("BrainComponent"));
                    entityName = "Patrol Bot";
                    break;

                default:
                    // Try to find entity by tag
                    const allEntities = Array.from(this.app.world.entities.values());
                    targetEntity = allEntities.find(e => e.tag === subCommand && e.getComponent("BrainComponent"));
                    entityName = subCommand;
                    break;
            }

            if (!targetEntity) {
                this.app.addMessage("assistant", `❌ Entity "${subCommand}" not found or doesn't support chat.`);
                return;
            }

            // Switch the active target for chat
            this.app.currentChatTarget = targetEntity;
            
            // Create or activate session with the new target
            const activeSession = this.app.activatePlayerTargetSession();
            if (!activeSession) {
                this.app.addMessage("assistant", `❌ Failed to create session with ${entityName}.`);
                return;
            }
            
            // Load existing chat history if available
            await this.app.loadSessionHistory(activeSession);
            
            this.app.addMessage("assistant", `✅ Connected to ${entityName}! Your messages will now go to this entity.`);
            
            debugLog.ui('Connect command completed', { entityName, targetId: targetEntity.id });

        } catch (error) {
            debugLog.ui('Connect command failed', { error: error.message });
            this.app.addMessage("assistant", `❌ Connection failed: ${error.message}`);
        }
    }

    showHelp() {
        this.app.addMessage("assistant",
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
    }

    async listAvailableEntities() {
        const entities = Array.from(this.app.world.entities.values());
        const chatEntities = entities.filter(e => e.getComponent("BrainComponent"));
        
        let response = "**Available Entities:**\n\n";
        
        chatEntities.forEach(entity => {
            const brain = entity.getComponent("BrainComponent");
            const tag = entity.tag || `Entity ${entity.id}`;
            const personality = brain.personality || "unknown";
            const isActive = this.app.currentChatTarget && this.app.currentChatTarget.id === entity.id;
            const activeIndicator = isActive ? " 🔗 **ACTIVE**" : "";
            response += `• **${tag}** - ${personality} (ID: ${entity.id})${activeIndicator}\n`;
        });

        if (chatEntities.length === 0) {
            response += "No entities with chat capabilities found.";
        } else {
            response += `\n*Currently connected to: ${this.app.currentChatTarget?.tag || "None"}*`;
        }

        this.app.addMessage("assistant", response);
        
        debugLog.ui('Listed available entities', { 
            entityCount: chatEntities.length,
            currentTarget: this.app.currentChatTarget?.tag
        });
    }
}