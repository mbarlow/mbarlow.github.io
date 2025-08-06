/**
 * HelpCommand - Handles /help command functionality
 * Part of Phase 5: Command System refactor
 */

import { debugLog } from '../../utils/debug.js';

export class HelpCommand {
    constructor(app, commandManager) {
        this.app = app;
        this.commandManager = commandManager;
        this.name = 'help';
        this.help = 'Show available commands and usage';
        this.category = 'info';
    }

    async execute(args) {
        debugLog.ui('Executing help command', args);
        
        let response = `**Available Commands:**\n${this.commandManager.getHelpText()}\n\n`;
        response += `Type any command followed by 'help' for detailed usage (e.g., '/delete help')`;
        
        this.app.addMessage('assistant', response);
        
        debugLog.ui('Help command completed', { 
            commandCount: this.commandManager.commands.size 
        });
    }
}