/**
 * ModelCommand - Handles /model command functionality
 * Part of Phase 5: Command System refactor
 */

import { debugLog } from '../../utils/debug.js';

export class ModelCommand {
    constructor(app) {
        this.app = app;
        this.name = 'model';
        this.help = 'Display current LLM model';
        this.category = 'info';
    }

    async execute(args) {
        debugLog.ui('Executing model command', args);
        
        const agentSystem = this.app.world.getSystem("agent");
        if (!agentSystem) {
            this.app.addMessage("assistant", "Agent system not available.");
            return;
        }

        let response = `🧠 **LLM Model Information**\n\n`;
        response += `**Current Model:** ${agentSystem.currentModel}\n`;
        response += `**Connection Status:** ${agentSystem.isConnected ? "✅ Connected" : "❌ Disconnected"}\n`;
        response += `**Ollama URL:** ${agentSystem.ollamaUrl}\n`;
        response += `**Image Support:** ${agentSystem.supportsImages ? "✅ Yes" : "❌ No"}\n`;
        response += `**Available Models:** ${agentSystem.availableModels.length}\n\n`;

        if (agentSystem.availableModels.length > 0) {
            response += `**Model List:**\n`;
            agentSystem.availableModels.slice(0, 10).forEach((model) => {
                const indicator = model.name === agentSystem.currentModel ? "→" : "  ";
                response += `${indicator} ${model.name}\n`;
            });

            if (agentSystem.availableModels.length > 10) {
                response += `... and ${agentSystem.availableModels.length - 10} more models\n`;
            }
        }

        this.app.addMessage("assistant", response);
        
        debugLog.ui('Model command completed', {
            currentModel: agentSystem.currentModel,
            isConnected: agentSystem.isConnected,
            modelCount: agentSystem.availableModels.length
        });
    }
}