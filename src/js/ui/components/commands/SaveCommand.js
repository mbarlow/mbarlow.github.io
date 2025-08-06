/**
 * SaveCommand - Handles /save command functionality
 * Part of Phase 5: Command System refactor
 */

import { debugLog } from '../../utils/debug.js';

export class SaveCommand {
    constructor(app) {
        this.app = app;
        this.name = 'save';
        this.help = 'Force save current session';
        this.category = 'session';
    }

    async execute(args) {
        debugLog.ui('Executing save command', args);
        
        const persistenceSystem = this.app.world.getSystem("persistence");
        if (!persistenceSystem) {
            this.app.addMessage("assistant", "Save system not available.");
            return;
        }

        try {
            await persistenceSystem.forceSave();
            this.app.addMessage("assistant", "✅ Current session saved successfully!");
            
            debugLog.ui('Save command completed');
            
        } catch (error) {
            debugLog.ui('Save command failed', { error: error.message });
            this.app.addMessage("assistant", "❌ Failed to save session. Please try again.");
        }
    }
}