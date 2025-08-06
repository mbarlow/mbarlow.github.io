/**
 * ExportCommand - Handles /export command functionality
 * Part of Phase 5: Command System refactor
 */

import { debugLog } from '../../utils/debug.js';

export class ExportCommand {
    constructor(app) {
        this.app = app;
        this.name = 'export';
        this.help = 'Export all session data';
        this.category = 'session';
    }

    async execute(args) {
        debugLog.ui('Executing export command', args);
        
        const persistenceSystem = this.app.world.getSystem("persistence");
        if (!persistenceSystem) {
            this.app.addMessage("assistant", "Export system not available.");
            return;
        }

        try {
            const data = await persistenceSystem.exportData();
            if (!data) {
                this.app.addMessage("assistant", "No data to export.");
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

            this.app.addMessage(
                "assistant",
                `✅ Exported ${data.sessions.length} sessions and ${data.chatLogs.length} chat logs!`,
            );
            
            debugLog.ui('Export command completed', {
                sessionCount: data.sessions.length,
                chatLogCount: data.chatLogs.length
            });
            
        } catch (error) {
            debugLog.ui('Export command failed', { error: error.message });
            this.app.addMessage("assistant", "❌ Export failed. Please try again.");
        }
    }
}