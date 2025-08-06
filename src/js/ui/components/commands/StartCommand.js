/**
 * StartCommand - Handles /start command functionality
 * Part of Phase 5: Command System refactor
 */

import { debugLog } from '../../utils/debug.js';

export class StartCommand {
    constructor(app) {
        this.app = app;
        this.name = 'start';
        this.help = 'Enter FPS mode';
        this.category = 'navigation';
    }

    async execute(args) {
        debugLog.ui('Executing start command', args);
        
        this.app.addMessage(
            "assistant",
            `FPS mode starting! 🎮\n\n` +
            `**Controls:**\n` +
            `• WASD - Move\n` +
            `• Mouse - Look around\n` +
            `• Space - Jump\n` +
            `• Shift - Run\n` +
            `• ESC - Return to chat\n\n` +
            `Click to capture mouse pointer.`,
        );

        // Switch to FPS view
        this.app.switchView("fps");
        
        debugLog.ui('Start command completed - switched to FPS view');
    }
}