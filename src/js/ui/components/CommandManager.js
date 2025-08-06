/**
 * CommandManager - Handles chat command parsing and execution
 * Part of Phase 5: Command System refactor
 */

import { debugLog } from '../utils/debug.js';
import { HistoryCommand } from './commands/HistoryCommand.js';
import { DeleteCommand } from './commands/DeleteCommand.js';
import { ConnectCommand } from './commands/ConnectCommand.js';
import { TitlesCommand } from './commands/TitlesCommand.js';
import { HelpCommand } from './commands/HelpCommand.js';

export class CommandManager {
    constructor(appInstance) {
        this.app = appInstance;
        this.commands = new Map();
        this.debug = true;
        
        debugLog.ui('CommandManager initialized', {
            commands: this.commands.size,
            app: !!this.app
        });
        
        this.registerDefaultCommands();
    }

    /**
     * Register a command with the manager
     * @param {string} name - Command name (without /)
     * @param {Function} handler - Command handler function
     * @param {Object} options - Command options (help text, aliases, etc.)
     */
    registerCommand(name, handler, options = {}) {
        const command = {
            name,
            handler,
            help: options.help || `Execute ${name} command`,
            aliases: options.aliases || [],
            category: options.category || 'general'
        };
        
        this.commands.set(name, command);
        
        // Register aliases
        if (command.aliases) {
            command.aliases.forEach(alias => {
                this.commands.set(alias, command);
            });
        }
        
        debugLog.ui(`Command registered: ${name}`, {
            aliases: command.aliases,
            category: command.category
        });
    }

    /**
     * Parse and execute a command
     * @param {string} input - Full command string (including /)
     * @returns {Promise<boolean>} - True if command was handled
     */
    async executeCommand(input) {
        debugLog.ui('Executing command', { input });
        
        if (!input.startsWith('/')) {
            debugLog.ui('Not a command (no / prefix)');
            return false;
        }
        
        const parts = input.trim().split(/\s+/);
        const commandName = parts[0].substring(1).toLowerCase(); // Remove /
        const args = {
            parts,
            fullCommand: input,
            commandName,
            subCommand: parts[1]?.toLowerCase(),
            params: parts.slice(1)
        };
        
        debugLog.ui('Command parsed', {
            commandName,
            subCommand: args.subCommand,
            paramCount: args.params.length
        });
        
        const command = this.commands.get(commandName);
        if (!command) {
            debugLog.ui(`Unknown command: ${commandName}`);
            this.app.addMessage('assistant', 
                `Unknown command: ${commandName}\n\n` +
                `Available commands:\n${this.getHelpText()}`
            );
            return true;
        }
        
        try {
            await command.handler.call(this.app, args);
            debugLog.ui(`Command executed successfully: ${commandName}`);
            return true;
        } catch (error) {
            debugLog.ui(`Command execution failed: ${commandName}`, { error: error.message });
            this.app.addMessage('assistant', `❌ Command failed: ${error.message}`);
            return true;
        }
    }

    /**
     * Get help text for all commands
     * @returns {string} - Formatted help text
     */
    getHelpText() {
        const categories = {};
        
        // Group commands by category
        this.commands.forEach((command, name) => {
            // Skip aliases in help
            if (command.name !== name) return;
            
            if (!categories[command.category]) {
                categories[command.category] = [];
            }
            categories[command.category].push(command);
        });
        
        let helpText = '';
        Object.keys(categories).forEach(category => {
            helpText += `\n**${category.charAt(0).toUpperCase() + category.slice(1)} Commands:**\n`;
            categories[category].forEach(command => {
                helpText += `/${command.name} - ${command.help}\n`;
            });
        });
        
        return helpText;
    }

    /**
     * Register default commands (moved from app.js)
     */
    registerDefaultCommands() {
        // Create command instances
        const historyCommand = new HistoryCommand(this.app);
        const deleteCommand = new DeleteCommand(this.app);
        const connectCommand = new ConnectCommand(this.app);
        const titlesCommand = new TitlesCommand(this.app);
        const helpCommand = new HelpCommand(this.app, this);

        // Register extracted commands
        this.registerCommand('history', historyCommand.execute.bind(historyCommand), {
            help: historyCommand.help,
            category: historyCommand.category
        });

        this.registerCommand('delete', deleteCommand.execute.bind(deleteCommand), {
            help: deleteCommand.help,
            category: deleteCommand.category
        });

        this.registerCommand('connect', connectCommand.execute.bind(connectCommand), {
            help: connectCommand.help,
            category: connectCommand.category
        });

        this.registerCommand('titles', titlesCommand.execute.bind(titlesCommand), {
            help: titlesCommand.help,
            category: titlesCommand.category
        });

        this.registerCommand('help', helpCommand.execute.bind(helpCommand), {
            help: helpCommand.help,
            category: helpCommand.category
        });

        // Register commands that still delegate to app.js
        this.registerCommand('start', this.handleStartCommand.bind(this), {
            help: 'Enter FPS mode',
            category: 'navigation'
        });

        this.registerCommand('search', this.handleSearchCommand.bind(this), {
            help: 'Search chat history',
            category: 'chat'
        });

        this.registerCommand('save', this.handleSaveCommand.bind(this), {
            help: 'Force save current session',
            category: 'session'
        });

        this.registerCommand('export', this.handleExportCommand.bind(this), {
            help: 'Export all session data',
            category: 'session'
        });

        this.registerCommand('who', this.handleWhoCommand.bind(this), {
            help: 'Show entity information',
            category: 'info'
        });

        this.registerCommand('model', this.handleModelCommand.bind(this), {
            help: 'Display current LLM model',
            category: 'info'
        });

        this.registerCommand('context', this.handleContextCommand.bind(this), {
            help: 'Show conversation context',
            category: 'info'
        });

        debugLog.ui('Default commands registered', {
            totalCommands: this.commands.size
        });
    }

    // Command handlers that still delegate to app.js methods
    async handleStartCommand(args) {
        if (this.app.handleStartGameCommand) {
            return this.app.handleStartGameCommand();
        }
        return this.app.addMessage('assistant', 'FPS mode not available');
    }

    async handleSearchCommand(args) {
        return this.app.handleSearchCommand(args.fullCommand);
    }

    async handleSaveCommand(args) {
        return this.app.handleSaveCommand();
    }

    async handleExportCommand(args) {
        return this.app.handleExportCommand();
    }

    async handleWhoCommand(args) {
        return this.app.handleWhoCommand();
    }

    async handleModelCommand(args) {
        return this.app.handleModelCommand();
    }

    async handleContextCommand(args) {
        return this.app.handleContextCommand();
    }
}