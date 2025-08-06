/**
 * WhoCommand - Handles /who command functionality
 * Part of Phase 5: Command System refactor
 */

import { debugLog } from '../../utils/debug.js';

export class WhoCommand {
    constructor(app) {
        this.app = app;
        this.name = 'who';
        this.help = 'Show entity information';
        this.category = 'info';
    }

    async execute(args) {
        debugLog.ui('Executing who command', args);
        
        if (!this.app.originEntity) {
            this.app.addMessage("assistant", "Origin entity not available.");
            return;
        }

        const brain = this.app.originEntity.getComponent("BrainComponent");
        if (!brain) {
            this.app.addMessage("assistant", "Brain component not found.");
            return;
        }

        let response = `🤖 **Origin Marker Entity Information**\n\n`;
        response += `**Identity:**\n`;
        response += `- Entity ID: ${this.app.originEntity.id}\n`;
        response += `- Tag: ${this.app.originEntity.tag}\n`;
        response += `- Primary Function: ${brain.primaryFunction}\n`;
        response += `- LLM Model: ${brain.model}\n`;
        response += `- Response Style: ${brain.responseStyle}\n\n`;

        response += `**Personality Traits:**\n`;
        Object.entries(brain.personality).forEach(([trait, value]) => {
            const percentage = (value * 100).toFixed(0);
            response += `- ${trait}: ${percentage}%\n`;
        });

        response += `\n**Interests:** ${brain.interests.join(", ")}\n`;
        response += `**Expertise:** ${brain.expertise.join(", ")}\n`;
        response += `**Session History:** ${brain.sessionHistory.length} previous sessions\n`;
        response += `**Command Access:** ${brain.commandAccess.join(", ")}\n`;

        this.app.addMessage("assistant", response);
        
        debugLog.ui('Who command completed', {
            entityId: this.app.originEntity.id,
            entityTag: this.app.originEntity.tag
        });
    }
}