/**
 * SearchCommand - Handles /search command functionality
 * Part of Phase 5: Command System refactor
 */

import { debugLog } from '../../utils/debug.js';

export class SearchCommand {
    constructor(app) {
        this.app = app;
        this.name = 'search';
        this.help = 'Search chat history';
        this.category = 'chat';
    }

    async execute(args) {
        debugLog.ui('Executing search command', args);
        
        const query = args.params.join(' ').trim();
        
        if (!query) {
            this.app.addMessage("assistant", "❌ Please provide a search query. Usage: /search <query>");
            return;
        }
        
        const persistenceSystem = this.app.world.getSystem("persistence");
        if (!persistenceSystem) {
            this.app.addMessage("assistant", "Search system not available.");
            return;
        }

        try {
            const results = await persistenceSystem.searchSessions(query);

            if (results.length === 0) {
                this.app.addMessage("assistant", `No sessions found matching "${query}"`);
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

            this.app.addMessage("assistant", response);
            
            debugLog.ui('Search command completed', {
                query,
                resultCount: results.length
            });
            
        } catch (error) {
            debugLog.ui('Search command failed', { error: error.message });
            this.app.addMessage("assistant", "Search failed. Please try again.");
        }
    }
}