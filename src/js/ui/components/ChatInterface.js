import { UIComponent } from './UIComponent.js';
import { Debug } from '../utils/Debug.js';
import { UIEvents } from '../utils/EventBus.js';
import { DOMHelpers } from '../utils/DOMHelpers.js';

/**
 * Chat Interface Component
 * Handles all chat-related functionality including message display, input handling, and command processing
 */
export class ChatInterface extends UIComponent {
    constructor(options = {}) {
        super('ChatInterface', options);
        
        // Default configuration
        this.config = {
            selectors: {
                chatMessages: '#chat-messages',
                chatInput: '#chat-input',
                chatSend: '#chat-send',
                chatContainer: '.chat-container',
                chatInputContainer: '.chat-input-container',
                chatInputWrapper: '.chat-input-wrapper',
                welcome: '.chat-welcome'
            },
            classes: {
                message: 'message',
                messageContent: 'message-content',
                active: 'active'
            },
            maxImageSize: 5 * 1024 * 1024, // 5MB
            supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            autoResize: {
                minHeight: 40,
                maxHeight: 200
            },
            ...options.config
        };
        
        // Chat state
        this.currentChatTarget = null;
        this.currentContextSession = null;
        this.images = [];
        
        // References to external systems (will be injected)
        this.world = null;
        this.sessionSystem = null;
        this.agentSystem = null;
        
        Debug.log(this.name, 'Created with config', this.config);
    }

    /**
     * Initialize chat interface
     */
    setup() {
        Debug.methodEntry(this.name, 'setup');
        
        // Initialize auto-resize and button state
        this.initializeInputState();
        
        Debug.success(this.name, 'Chat interface initialized');
    }

    /**
     * Bind chat interface events
     */
    bindEvents() {
        Debug.methodEntry(this.name, 'bindEvents');
        
        this.bindInputEvents();
        this.bindPasteEvents();
        
        // Listen for session change events
        this.subscribe(UIEvents.SESSION_CHANGED, this.handleSessionChange);
        
        Debug.success(this.name, 'Events bound');
    }

    /**
     * Inject external dependencies
     * @param {Object} dependencies - Required systems and entities
     */
    injectDependencies(dependencies) {
        this.world = dependencies.world;
        this.sessionSystem = dependencies.sessionSystem;
        this.agentSystem = dependencies.agentSystem;
        this.originEntity = dependencies.originEntity;
        this.appInstance = dependencies.appInstance; // Add reference to main app
        
        // Set default chat target to origin entity
        if (this.originEntity) {
            this.currentChatTarget = this.originEntity;
        }
        
        Debug.log(this.name, 'Dependencies injected', {
            hasWorld: !!this.world,
            hasSessionSystem: !!this.sessionSystem,
            hasAgentSystem: !!this.agentSystem,
            hasOriginEntity: !!this.originEntity,
            hasAppInstance: !!this.appInstance
        });
    }

    /**
     * Initialize input state
     */
    initializeInputState() {
        const chatInput = this.getChatInput();
        const chatSend = this.getChatSend();
        
        if (chatInput && chatSend) {
            this.autoResizeTextarea(chatInput);
            this.updateSendButton(chatInput, chatSend);
            
            // Set initial focus behavior
            chatInput.addEventListener("focus", () => {
                this.emit(UIEvents.CHAT_INPUT_FOCUSED, { timestamp: Date.now() });
            });
        }
    }

    /**
     * Bind input-related events
     */
    bindInputEvents() {
        const chatInput = this.getChatInput();
        const chatSend = this.getChatSend();
        
        if (chatInput && chatSend) {
            Debug.log(this.name, 'Binding input events');
            
            // Input change events
            this.addEventListener(chatInput, 'input', () => {
                this.autoResizeTextarea(chatInput);
                this.updateSendButton(chatInput, chatSend);
            });
            
            // Enter key handling
            this.addEventListener(chatInput, 'keydown', (e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            // Send button click
            this.addEventListener(chatSend, 'click', () => {
                this.sendMessage();
            });
        } else {
            Debug.warn(this.name, 'Chat input or send button not found', {
                input: !!chatInput,
                send: !!chatSend
            });
        }
    }

    /**
     * Bind paste events for image handling
     */
    bindPasteEvents() {
        const chatInput = this.getChatInput();
        
        if (chatInput) {
            this.addEventListener(chatInput, 'paste', async (e) => {
                const items = Array.from(e.clipboardData.items);
                const imageItems = items.filter(item => item.type.startsWith('image/'));
                
                if (imageItems.length > 0) {
                    Debug.log(this.name, `Found ${imageItems.length} image(s) in paste`);
                    
                    for (const item of imageItems) {
                        try {
                            const file = item.getAsFile();
                            await this.handleImageFile(file);
                        } catch (error) {
                            Debug.error(this.name, 'Image paste error', error);
                            this.addMessage('system', '❌ Failed to process pasted image');
                        }
                    }
                }
            });
        }
    }

    /**
     * Handle session change events
     * @param {Object} data - Session change data
     */
    handleSessionChange = (data) => {
        Debug.log(this.name, 'Session changed', data);
        this.currentContextSession = data.session;
        this.currentChatTarget = data.target;
    };

    /**
     * Send a message
     */
    async sendMessage() {
        const chatInput = this.getChatInput();
        const message = chatInput.value.trim();
        
        if (!message) return;
        
        Debug.log(this.name, 'Sending message', { message: message.substring(0, 50) + '...' });
        
        // Handle slash commands
        if (message.startsWith("/")) {
            await this.handleSlashCommand(message);
            return;
        }
        
        // Ensure session is active with current chat target
        Debug.log(this.name, 'Checking session before sending message', {
            hasSessionSystem: !!this.sessionSystem,
            hasChatTarget: !!this.currentChatTarget,
            hasAppInstance: !!this.appInstance,
            chatTargetId: this.currentChatTarget?.id
        });
        
        if (!this.ensureActiveSession()) {
            this.addMessage('system', '❌ No active chat session. Please wait for initialization.');
            return;
        }
        
        // Clear input
        this.clearInput();
        
        // Process message with or without images
        try {
            await this.processUserMessage(message);
        } catch (error) {
            Debug.error(this.name, 'Message processing error', error);
            this.addMessage('system', '❌ Failed to send message. Please try again.');
        }
    }

    /**
     * Process user message with session system
     * @param {string} message - User message
     */
    async processUserMessage(message) {
        if (!this.sessionSystem) {
            this.addMessage("user", message);
            this.addMessage("assistant", "Session system not initialized.");
            return;
        }
        
        // Get the active session
        const playerEntity = this.appInstance.playerEntity;
        const existingSessions = this.sessionSystem.getSessionHistory(playerEntity);
        const activeSession = existingSessions.find(s => s && s.state === "active");
        
        if (!activeSession) {
            Debug.error(this.name, 'No active session found for message sending');
            this.addMessage('system', '❌ No active session available');
            return;
        }
        
        Debug.log(this.name, 'Using active session for message', { sessionId: activeSession.id });

        // Send message through session system
        try {
            if (this.images.length > 0) {
                Debug.log(this.name, `Sending message with ${this.images.length} images`);
                
                // Add user message to session with images
                this.sessionSystem.sendMessage(
                    activeSession.id,
                    playerEntity.id,
                    message,
                    "user",
                    { images: this.images }
                );
                
                // Display user message
                this.addMessage("user", message);
                
                // Get agent response with images
                const response = await this.agentSystem.generateResponseWithContext(
                    message,
                    this.currentChatTarget,
                    { images: this.images, userMessage: message }
                );
                
                // Add agent response to session
                this.sessionSystem.sendMessage(
                    activeSession.id,
                    this.currentChatTarget.id,
                    response,
                    "assistant"
                );
                
                this.addMessage("assistant", response);
                
                // Clear images after sending
                this.clearImages();
            } else {
                // Regular text message
                const response = await this.agentSystem.generateResponseWithContext(
                    message,
                    this.currentChatTarget,
                    {}
                );
                
                // Add both messages to session
                this.sessionSystem.sendMessage(
                    activeSession.id,
                    playerEntity.id,
                    message,
                    "user"
                );
                
                this.sessionSystem.sendMessage(
                    activeSession.id,
                    this.currentChatTarget.id,
                    response,
                    "assistant"
                );
                
                this.addMessage("user", message);
                this.addMessage("assistant", response);
            }
        } catch (error) {
            Debug.error(this.name, 'Agent processing error', error);
            
            const fallbackResponse = "I apologize, but I'm having trouble processing your message right now. Please try again.";
            
            this.sessionSystem.sendMessage(
                this.currentChatTarget.id,
                "user",
                message
            );
            this.sessionSystem.sendMessage(
                this.currentChatTarget.id,
                "assistant",
                fallbackResponse
            );
            
            this.addMessage("user", message);
            this.addMessage("assistant", fallbackResponse);
        }
    }

    /**
     * Handle slash commands
     * @param {string} command - Command string
     */
    async handleSlashCommand(command) {
        this.clearInput();
        this.addMessage("user", command);
        
        const [cmd, ...args] = command.slice(1).split(" ");
        const subCommand = args.join(" ");
        
        Debug.log(this.name, 'Processing slash command', { cmd, subCommand });
        
        switch (cmd) {
            case "start":
                await this.handleStartCommand();
                break;
            case "search":
                await this.handleSearchCommand(subCommand);
                break;
            case "history":
                await this.handleHistoryCommand();
                break;
            case "save":
                await this.handleSaveCommand();
                break;
            case "export":
                await this.handleExportCommand();
                break;
            case "who":
                await this.handleWhoCommand();
                break;
            case "model":
                await this.handleModelCommand();
                break;
            case "context":
                await this.handleContextCommand();
                break;
            case "delete":
                await this.handleDeleteCommand(subCommand);
                break;
            case "titles":
                await this.handleTitlesCommand();
                break;
            case "connect":
                await this.handleConnectCommand(subCommand);
                break;
            default:
                this.addMessage(
                    "assistant",
                    `Unknown command: ${command}\n\nAvailable commands:\n/start - Enter FPS mode\n/search <query> - Search chat history\n/history - Show recent sessions\n/save - Force save current session\n/export - Export all session data\n/who - Show entity information\n/model - Display current LLM model\n/context - Show conversation context\n/delete - Delete sessions (see /delete help)\n/titles - Generate titles for untitled sessions\n/connect - Connect to entities (see /connect help)`
                );
        }
    }

    /**
     * Add a message to the chat display
     * @param {string} type - Message type (user, assistant, system)
     * @param {string} content - Message content
     */
    addMessage(type, content) {
        const chatMessages = this.getChatMessages();
        if (!chatMessages) {
            Debug.error(this.name, 'Chat messages container not found');
            return;
        }
        
        const welcome = chatMessages.querySelector(this.config.selectors.welcome);
        
        // Remove welcome message if it exists
        if (welcome) {
            welcome.remove();
        }
        
        // Create message element
        const messageDiv = document.createElement("div");
        messageDiv.className = `${this.config.classes.message} ${type}`;
        
        const messageContent = document.createElement("div");
        messageContent.className = this.config.classes.messageContent;
        messageContent.textContent = content;
        
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);
        
        // Auto-scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Emit message added event
        this.emit(UIEvents.MESSAGE_ADDED, {
            type,
            content,
            timestamp: Date.now()
        });
        
        Debug.log(this.name, `Added ${type} message`, { 
            contentLength: content.length,
            totalMessages: chatMessages.children.length
        });
    }

    /**
     * Clear the chat input
     */
    clearInput() {
        const chatInput = this.getChatInput();
        const chatSend = this.getChatSend();
        
        if (chatInput) {
            chatInput.value = "";
            this.autoResizeTextarea(chatInput);
            
            if (chatSend) {
                this.updateSendButton(chatInput, chatSend);
            }
        }
    }

    /**
     * Auto-resize textarea based on content
     * @param {HTMLTextAreaElement} textarea - Textarea element
     */
    autoResizeTextarea(textarea) {
        if (!textarea) return;
        
        const { minHeight, maxHeight } = this.config.autoResize;
        
        textarea.style.height = 'auto';
        const scrollHeight = textarea.scrollHeight;
        
        if (scrollHeight <= maxHeight) {
            textarea.style.height = Math.max(scrollHeight, minHeight) + 'px';
            textarea.style.overflowY = 'hidden';
        } else {
            textarea.style.height = maxHeight + 'px';
            textarea.style.overflowY = 'auto';
        }
    }

    /**
     * Update send button state based on input
     * @param {HTMLTextAreaElement} input - Input element
     * @param {HTMLButtonElement} button - Send button element
     */
    updateSendButton(input, button) {
        if (!input || !button) return;
        
        const hasContent = input.value.trim().length > 0;
        const hasImages = this.images.length > 0;
        
        button.disabled = !hasContent && !hasImages;
        
        // Update button appearance
        if (hasContent || hasImages) {
            button.classList.add(this.config.classes.active);
        } else {
            button.classList.remove(this.config.classes.active);
        }
    }

    /**
     * Handle image file processing
     * @param {File} file - Image file
     */
    async handleImageFile(file) {
        // Validate file type
        if (!this.config.supportedImageTypes.includes(file.type)) {
            throw new Error(`Unsupported image type: ${file.type}`);
        }
        
        // Validate file size
        if (file.size > this.config.maxImageSize) {
            throw new Error(`Image too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max: ${this.config.maxImageSize / 1024 / 1024}MB)`);
        }
        
        // Convert to base64
        const base64 = await this.fileToBase64(file);
        
        // Add to images array
        this.images.push({
            data: base64,
            type: file.type,
            size: file.size,
            name: file.name || 'pasted-image'
        });
        
        Debug.log(this.name, 'Image added', {
            type: file.type,
            size: file.size,
            totalImages: this.images.length
        });
        
        // Update send button state
        const chatInput = this.getChatInput();
        const chatSend = this.getChatSend();
        if (chatInput && chatSend) {
            this.updateSendButton(chatInput, chatSend);
        }
        
        // Emit image added event
        this.emit(UIEvents.IMAGE_ADDED, {
            imageCount: this.images.length,
            lastImage: {
                type: file.type,
                size: file.size,
                name: file.name
            }
        });
    }

    /**
     * Convert file to base64
     * @param {File} file - File to convert
     * @returns {Promise<string>} Base64 string
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }

    /**
     * Clear all images
     */
    clearImages() {
        const imageCount = this.images.length;
        this.images = [];
        
        // Update send button state
        const chatInput = this.getChatInput();
        const chatSend = this.getChatSend();
        if (chatInput && chatSend) {
            this.updateSendButton(chatInput, chatSend);
        }
        
        Debug.log(this.name, `Cleared ${imageCount} images`);
        
        // Emit images cleared event
        this.emit(UIEvents.IMAGES_CLEARED, {
            clearedCount: imageCount,
            timestamp: Date.now()
        });
    }

    /**
     * Ensure active session exists
     * @returns {boolean} True if session is active
     */
    ensureActiveSession() {
        Debug.log(this.name, 'ensureActiveSession called', {
            hasSessionSystem: !!this.sessionSystem,
            hasChatTarget: !!this.currentChatTarget,
            hasAppInstance: !!this.appInstance,
            chatTargetId: this.currentChatTarget?.id,
            originEntityId: this.originEntity?.id
        });
        
        if (!this.sessionSystem || !this.currentChatTarget || !this.appInstance) {
            Debug.error(this.name, 'Missing required dependencies for session activation', {
                sessionSystem: !!this.sessionSystem,
                currentChatTarget: !!this.currentChatTarget,
                appInstance: !!this.appInstance
            });
            return false;
        }
        
        // Check if we have an active session (using the same logic as activatePlayerOriginSession)
        const playerEntity = this.appInstance.playerEntity;
        if (!playerEntity) {
            Debug.error(this.name, 'Player entity not available');
            return false;
        }
        
        const existingSessions = this.sessionSystem.getSessionHistory(playerEntity);
        const activeSession = existingSessions.find(s => s && s.state === "active");
        const hasSession = !!activeSession;
        
        Debug.log(this.name, 'Session check result', { 
            hasSession, 
            targetId: this.currentChatTarget.id,
            existingSessions: existingSessions.length,
            activeSessionId: activeSession?.id
        });
        
        if (!hasSession) {
            Debug.log(this.name, 'No active session found, attempting to create one');
            
            // Use app's session activation method to create/activate session
            let session = null;
            if (this.currentChatTarget === this.originEntity) {
                Debug.log(this.name, 'Activating player-origin session');
                session = this.appInstance.activatePlayerOriginSession();
            } else {
                Debug.log(this.name, 'Activating player-target session');
                session = this.appInstance.activatePlayerTargetSession();
            }
            
            if (!session) {
                Debug.error(this.name, 'Failed to create/activate session');
                return false;
            }
            
            Debug.success(this.name, 'Session activated', { sessionId: session.id });
            
            // Double-check that the session is now active
            const existingSessionsAfter = this.sessionSystem.getSessionHistory(playerEntity);
            const activeSessionAfter = existingSessionsAfter.find(s => s && s.state === "active");
            const hasSessionAfter = !!activeSessionAfter;
            
            Debug.log(this.name, 'Session check after activation', { 
                hasSessionAfter,
                activeSessionId: activeSessionAfter?.id
            });
            
            return hasSessionAfter;
        }
        
        Debug.success(this.name, 'Session already active');
        return true;
    }

    /**
     * Focus chat input
     */
    focusInput() {
        const chatInput = this.getChatInput();
        if (chatInput) {
            chatInput.focus();
        }
    }

    /**
     * Clear all messages
     */
    clearMessages() {
        const chatMessages = this.getChatMessages();
        if (chatMessages) {
            chatMessages.innerHTML = '';
            
            // Add welcome message back
            const welcome = document.createElement('div');
            welcome.className = 'chat-welcome';
            welcome.innerHTML = `
                <div class="welcome-content">
                    <h2>Welcome to ECS Chat</h2>
                    <p>Start a conversation or try these commands:</p>
                    <ul>
                        <li><code>/who</code> - Show entity information</li>
                        <li><code>/history</code> - View recent sessions</li>
                        <li><code>/connect</code> - Connect to different entities</li>
                    </ul>
                    <p><strong>Tip:</strong> You can paste images directly into the chat!</p>
                </div>
            `;
            
            chatMessages.appendChild(welcome);
            
            Debug.log(this.name, 'Messages cleared and welcome restored');
            
            this.emit(UIEvents.MESSAGES_CLEARED, { timestamp: Date.now() });
        }
    }

    // Command handlers (these will call the original methods on the app instance)
    async handleStartCommand() {
        this.emit(UIEvents.COMMAND_EXECUTED, { command: 'start' });
    }

    async handleSearchCommand(query) {
        this.emit(UIEvents.COMMAND_EXECUTED, { command: 'search', args: { query } });
    }

    async handleHistoryCommand() {
        this.emit(UIEvents.COMMAND_EXECUTED, { command: 'history' });
    }

    async handleSaveCommand() {
        this.emit(UIEvents.COMMAND_EXECUTED, { command: 'save' });
    }

    async handleExportCommand() {
        this.emit(UIEvents.COMMAND_EXECUTED, { command: 'export' });
    }

    async handleWhoCommand() {
        this.emit(UIEvents.COMMAND_EXECUTED, { command: 'who' });
    }

    async handleModelCommand() {
        this.emit(UIEvents.COMMAND_EXECUTED, { command: 'model' });
    }

    async handleContextCommand() {
        this.emit(UIEvents.COMMAND_EXECUTED, { command: 'context' });
    }

    async handleDeleteCommand(subCommand) {
        this.emit(UIEvents.COMMAND_EXECUTED, { command: 'delete', args: { subCommand } });
    }

    async handleTitlesCommand() {
        this.emit(UIEvents.COMMAND_EXECUTED, { command: 'titles' });
    }

    async handleConnectCommand(subCommand) {
        this.emit(UIEvents.COMMAND_EXECUTED, { command: 'connect', args: { subCommand } });
    }

    // Getter methods for DOM elements
    getChatMessages() {
        return document.querySelector(this.config.selectors.chatMessages);
    }

    getChatInput() {
        return document.querySelector(this.config.selectors.chatInput);
    }

    getChatSend() {
        return document.querySelector(this.config.selectors.chatSend);
    }

    getChatContainer() {
        return document.querySelector(this.config.selectors.chatContainer);
    }

    /**
     * Get current chat state
     * @returns {Object} Current state
     */
    getState() {
        const chatMessages = this.getChatMessages();
        const messageCount = chatMessages ? chatMessages.children.length : 0;
        
        return {
            currentChatTarget: this.currentChatTarget?.id || null,
            currentSession: this.currentContextSession?.id || null,
            messageCount,
            imageCount: this.images.length,
            hasActiveSession: this.ensureActiveSession()
        };
    }

    /**
     * Set chat target
     * @param {Object} target - Target entity
     */
    setChatTarget(target) {
        const oldTarget = this.currentChatTarget;
        this.currentChatTarget = target;
        
        Debug.log(this.name, 'Chat target changed', {
            from: oldTarget?.id,
            to: target?.id
        });
        
        this.emit(UIEvents.CHAT_TARGET_CHANGED, {
            oldTarget,
            newTarget: target,
            timestamp: Date.now()
        });
    }

    /**
     * Get current images
     * @returns {Array} Current images
     */
    getImages() {
        return [...this.images];
    }

    /**
     * Get message count
     * @returns {number} Number of messages
     */
    getMessageCount() {
        const chatMessages = this.getChatMessages();
        return chatMessages ? chatMessages.children.length : 0;
    }
}