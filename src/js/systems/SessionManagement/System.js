import { System } from '../../core/System.js';

/**
 * SessionManagementSystem - Handles session list UI, modals, and session operations
 * This system manages the sessions sidebar, context menus, and CRUD operations on sessions
 */
export class SessionManagementSystem extends System {
    constructor() {
        super();
        this.requiredComponents = [];
        
        // System references - will be set by app.js
        this.world = null;
        this.industrialPortfolio = null;
        
        // State for context menu and modals
        this.selectedSessionId = null;
        this.selectedSessionTitle = null;
    }

    init(world, industrialPortfolio) {
        console.log("📋 Initializing SessionManagement System...");
        this.world = world;
        this.industrialPortfolio = industrialPortfolio;
        
        this.initSessionsList();
        console.log("✅ SessionManagement System initialized");
    }

    initSessionsList() {
        console.log("💬 Initializing DMs list and channels...");
        
        // Add DM button handler
        const addDmBtn = document.getElementById("add-dm");
        if (addDmBtn) {
            addDmBtn.addEventListener("click", () => {
                // TODO: Show entity selector modal
                console.log("Add DM clicked - entity selector coming soon");
            });
        }
        
        // Initialize channel handlers
        this.initChannelHandlers();

        this.initSessionModals();

        // Load DMs after a short delay to ensure systems are ready
        setTimeout(() => {
            this.loadDMsList();
            this.loadChannelsList();
        }, 1000);
        
        console.log("✅ DMs list and channels initialized");
    }

    initSessionModals() {
        // Context menu event listeners
        const renameSessionBtn = document.getElementById('rename-session');
        const deleteSessionBtn = document.getElementById('delete-session');
        
        if (renameSessionBtn) {
            renameSessionBtn.addEventListener('click', () => {
                this.hideContextMenu();
                this.showRenameModal();
            });
        }
        
        if (deleteSessionBtn) {
            deleteSessionBtn.addEventListener('click', () => {
                this.hideContextMenu();
                this.showDeleteModal();
            });
        }

        // Rename modal event listeners
        const renameModalOverlay = document.getElementById('rename-modal-overlay');
        const renameModalClose = document.getElementById('rename-modal-close');
        const renameCancel = document.getElementById('rename-cancel');
        const renameSave = document.getElementById('rename-save');
        
        if (renameModalOverlay) {
            renameModalOverlay.addEventListener('click', (e) => {
                if (e.target === renameModalOverlay) {
                    this.hideRenameModal();
                }
            });
        }

        if (renameModalClose) {
            renameModalClose.addEventListener('click', () => {
                this.hideRenameModal();
            });
        }

        if (renameCancel) {
            renameCancel.addEventListener('click', () => {
                this.hideRenameModal();
            });
        }

        if (renameSave) {
            renameSave.addEventListener('click', () => {
                this.handleRenameSession();
            });
        }

        // Delete modal event listeners
        const deleteModalOverlay = document.getElementById('delete-modal-overlay');
        const deleteModalClose = document.getElementById('delete-modal-close');
        const deleteCancel = document.getElementById('delete-cancel');
        const deleteConfirm = document.getElementById('delete-confirm');
        
        if (deleteModalOverlay) {
            deleteModalOverlay.addEventListener('click', (e) => {
                if (e.target === deleteModalOverlay) {
                    this.hideDeleteModal();
                }
            });
        }

        if (deleteModalClose) {
            deleteModalClose.addEventListener('click', () => {
                this.hideDeleteModal();
            });
        }

        if (deleteCancel) {
            deleteCancel.addEventListener('click', () => {
                this.hideDeleteModal();
            });
        }

        if (deleteConfirm) {
            deleteConfirm.addEventListener('click', () => {
                this.handleDeleteSession();
            });
        }
    }

    async loadDMsList() {
        console.log("🔄 Loading DMs list using ConversationSystem...");
        
        try {
            const dmsList = document.getElementById("dms-list");
            if (!dmsList) {
                console.error("DMs list element not found");
                return;
            }

            // Clear existing DMs
            dmsList.innerHTML = "";

            // Get the new ConversationSystem
            const conversationSystem = this.world.getSystem("conversation");
            if (!conversationSystem) {
                console.warn("ConversationSystem not found, falling back to old method");
                dmsList.innerHTML = '<div class="dm-item">Loading...</div>';
                return;
            }
            
            // Find player entity
            const playerEntity = this.industrialPortfolio?.playerEntity || 
                                  this.world.getEntitiesByTag("player")[0];
            
            if (!playerEntity) {
                console.warn("Player entity not found");
                dmsList.innerHTML = '<div class="dm-item">Player not found</div>';
                return;
            }

            // Get all entities that can chat
            const allEntities = Array.from(this.world.entities.values());
            const messagableEntities = [];
            
            for (const entity of allEntities) {
                if (entity.hasComponent("BrainComponent") && entity.id !== playerEntity.id) {
                    // Find or create DM conversation with this entity
                    const dm = conversationSystem.findOrCreateDM(playerEntity.id, entity.id);
                    
                    // Get message count from existing session data if conversation is empty
                    let messageCount = dm.messageCount;
                    let lastActivity = dm.lastActivityAt;
                    
                    if (messageCount === 0) {
                        // Check for existing session messages to get accurate count
                        try {
                            const persistenceSystem = this.world?.getSystem("persistence");
                            if (persistenceSystem?.initialized) {
                                const allSessions = await persistenceSystem.storage.getAllSessions();
                                let totalMessages = 0;
                                let latestActivity = lastActivity;
                                
                                for (const session of allSessions) {
                                    let isMatch = false;
                                    
                                    // Check if session involves both entities
                                    if (session.participants) {
                                        const participants = Array.isArray(session.participants) ? 
                                            session.participants : Array.from(session.participants || []);
                                        
                                        if (participants.includes(playerEntity.id) && participants.includes(entity.id)) {
                                            isMatch = true;
                                        }
                                    }
                                    
                                    // Also check by title matching (legacy)
                                    if (!isMatch) {
                                        const sessionTitle = session.title || '';
                                        const entityTag = entity.tag || entity.id;
                                        if (sessionTitle.toLowerCase().includes(entityTag.toLowerCase())) {
                                            isMatch = true;
                                        }
                                    }
                                    
                                    if (isMatch && session.chatLogId) {
                                        const chatLog = await persistenceSystem.storage.loadChatLog(session.chatLogId);
                                        if (chatLog && chatLog.messages) {
                                            totalMessages += chatLog.messages.length;
                                            // Find the latest message timestamp
                                            for (const msg of chatLog.messages) {
                                                if (msg.timestamp && msg.timestamp > latestActivity) {
                                                    latestActivity = msg.timestamp;
                                                }
                                            }
                                        }
                                    }
                                }
                                
                                messageCount = totalMessages;
                                lastActivity = latestActivity;
                                
                                // Update the conversation object with the real counts
                                dm.messageCount = messageCount;
                                dm.lastActivityAt = lastActivity;
                            }
                        } catch (error) {
                            console.warn(`Failed to get message count for ${entity.tag}:`, error);
                        }
                    }
                    
                    messagableEntities.push({
                        entity: entity,
                        conversation: dm,
                        messageCount: messageCount,
                        lastActivity: lastActivity
                    });
                }
            }
            
            console.log(`💬 Found ${messagableEntities.length} messagable entities`);

            if (messagableEntities.length === 0) {
                const emptyMessage = document.createElement("div");
                emptyMessage.className = "empty-dms";
                emptyMessage.textContent = "No entities available";
                emptyMessage.style.padding = "12px";
                emptyMessage.style.textAlign = "center";
                emptyMessage.style.color = "var(--text-muted)";
                emptyMessage.style.fontSize = "12px";
                dmsList.appendChild(emptyMessage);
                return;
            }

            // Sort entities by last activity (most recent first)
            messagableEntities.sort((a, b) => {
                const aTime = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
                const bTime = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
                return bTime - aTime;
            });

            // Create DM element for each entity
            messagableEntities.forEach(({entity, messageCount, lastActivity, conversation}) => {
                const dmElement = this.createEntityDMElement(entity, messageCount, lastActivity, conversation);
                dmsList.appendChild(dmElement);
            });

        } catch (error) {
            console.error("❌ Error loading DMs:", error);
            const dmsList = document.getElementById("dms-list");
            if (dmsList) {
                dmsList.innerHTML = `<div class="error-message">Failed to load DMs: ${error.message}</div>`;
            }
        }
    }

    // Keep loadSessionsList for backward compatibility
    async loadSessionsList() {
        return this.loadDMsList();
    }

    createEntityDMElement(entity, totalMessages, lastActivity, conversation = null) {
        const dmDiv = document.createElement("div");
        dmDiv.className = "dm-item";
        dmDiv.dataset.entityId = entity.id;
        dmDiv.dataset.entityTag = entity.tag || entity.id;
        
        // Store conversation ID if provided (new conversation system)
        if (conversation) {
            dmDiv.dataset.conversationId = conversation.id;
        }

        // Create status indicator
        const statusDiv = document.createElement("div");
        statusDiv.className = "dm-status";
        // For now, all entities are "online" when the system is running
        statusDiv.classList.add("online");

        // Get entity display name
        let entityName = entity.tag || "Unknown";
        const brain = entity.getComponent("BrainComponent");
        
        // Format name for display
        if (entityName === "player") {
            entityName = "You"; // Self DM
        } else if (entityName === "origin-marker") {
            entityName = "Origin";
        } else if (entityName === "bot") {
            entityName = "Patrol Bot";
        }
        
        // Add personality or function if available
        if (brain && brain.primaryFunction && entityName !== "You") {
            // entityName += ` (${brain.primaryFunction})`;
        }

        // Create name div
        const nameDiv = document.createElement("div");
        nameDiv.className = "dm-name";
        nameDiv.textContent = entityName;

        // Create unread indicator if there are recent messages
        const unreadDiv = document.createElement("div");
        if (totalMessages > 0 && lastActivity) {
            // Show unread indicator for recent activity (within last hour)
            const hourAgo = Date.now() - (60 * 60 * 1000);
            if (new Date(lastActivity).getTime() > hourAgo) {
                unreadDiv.className = "dm-unread";
                unreadDiv.textContent = totalMessages > 99 ? "99+" : totalMessages;
            }
        }

        dmDiv.appendChild(statusDiv);
        dmDiv.appendChild(nameDiv);
        if (unreadDiv.className) {
            dmDiv.appendChild(unreadDiv);
        }

        // Add click handler to open DM with this entity
        dmDiv.addEventListener("click", async (e) => {
            e.preventDefault();
            console.log("💬 Entity DM clicked:", entity.tag || entity.id, entityName);
            
            // Remove active class from other DMs
            document.querySelectorAll('.dm-item').forEach(item => {
                item.classList.remove('active');
            });
            dmDiv.classList.add('active');
            
            // Switch to conversation with this entity
            await this.switchToEntityDM(entity);
        });

        // Add context menu handler
        dmDiv.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            console.log("🖱️ Context menu triggered for entity DM:", entity.tag || entity.id);
            // For now, disable context menu for entity DMs
            // this.showContextMenu(e, entity.id, entityName);
        });

        return dmDiv;
    }

    createDMElement(session) {
        // Legacy method - redirect to entity-based creation
        // This is kept for backward compatibility
        return this.createEntityDMElement({
            id: session.id,
            tag: session.title?.split(/[⟷↔\-–—]/)[0]?.trim() || "Unknown",
            getComponent: () => null
        }, session.messageCount || 0, session.lastActivityAt);
    }

    // Keep createSessionElement for backward compatibility
    createSessionElement(session) {
        return this.createDMElement(session);
    }

    async switchToEntityDM(targetEntity) {
        console.log("🔄 Switching to DM with entity using NEW ChatUISystem:", targetEntity.tag || targetEntity.id);
        
        if (!this.industrialPortfolio) {
            console.error("Industrial portfolio not available");
            return;
        }
        
        const player = this.industrialPortfolio.playerEntity;
        if (!player) {
            console.error("Player entity not found");
            return;
        }
        
        // Get NEW ChatUISystem instead of old ConversationSystem
        const chatUISystem = this.world.getSystem("chatUI");
        if (!chatUISystem) {
            console.warn("ChatUISystem not found, falling back to old method");
            // Fall back to old session-based method
            this.switchToEntityDMOld(targetEntity);
            return;
        }
        
        // Use the NEW ChatUISystem to switch to DM - pass entity ID (not UUID)
        // The ChatUISystem will handle UUID conversion internally
        await chatUISystem.switchToDM(targetEntity.id);
        
        console.log(`✅ Successfully switched to DM using ChatUISystem with entity: ${targetEntity.tag || targetEntity.id}`);
    }
    
    // Keep old method as fallback
    async switchToEntityDMOld(targetEntity) {
        console.log("🔄 Using old session-based DM switching for:", targetEntity.tag || targetEntity.id);
        
        // Set the current chat target
        this.industrialPortfolio.currentChatTarget = targetEntity;
        
        // Clear current chat display
        this.industrialPortfolio.clearChatDisplay();
        
        // Load all sessions between player and this entity
        const persistenceSystem = this.world?.getSystem("persistence");
        if (persistenceSystem?.initialized) {
            const allSessions = await persistenceSystem.storage.getAllSessions();
            const entityTag = targetEntity.tag || targetEntity.id;
            const allMessages = [];
            
            // Collect all messages from all sessions with this entity
            for (const session of allSessions) {
                const sessionTitle = session.title || '';
                // Check if this session involves the target entity
                if (sessionTitle.toLowerCase().includes(entityTag.toLowerCase()) ||
                    (session.participants && (session.participants.includes(targetEntity.id) || 
                     Array.from(session.participants || []).includes(targetEntity.id)))) {
                    
                    // Load chat log for this session
                    if (session.chatLogId) {
                        const chatLog = await persistenceSystem.storage.loadChatLog(session.chatLogId);
                        if (chatLog && chatLog.messages) {
                            allMessages.push(...chatLog.messages);
                        }
                    }
                }
            }
            
            // Sort all messages by timestamp
            allMessages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
            
            // Display the combined chat history
            if (allMessages.length > 0) {
                this.industrialPortfolio.displayChatHistory(allMessages, targetEntity);
            }
            
            // Find or create an active session for new messages
            const sessionSystem = this.world?.getSystem("session");
            if (sessionSystem) {
                const activeSession = await sessionSystem.findOrCreateSession(this.industrialPortfolio.playerEntity, targetEntity);
                console.log("✅ Active session ready for DM:", activeSession?.id);
            }
        }
        
        // Update UI to show active entity
        const entityName = targetEntity.tag === "origin-marker" ? "Origin" : 
                           targetEntity.tag === "bot" ? "Patrol Bot" :
                           targetEntity.tag === "player" ? "You" :
                           targetEntity.tag || "Entity";
        this.industrialPortfolio.addMessage("system", `💬 Now chatting with ${entityName}`);
    }
    
    async loadConversationMessages(conversation, targetEntity) {
        console.log(`📜 Loading messages for conversation ${conversation.id}...`);
        
        try {
            // For now, we need to bridge between the new conversation system and existing message storage
            // This is a transitional approach - we'll map conversation to sessions to load existing messages
            
            const persistenceSystem = this.world?.getSystem("persistence");
            if (!persistenceSystem?.initialized) {
                console.warn("Persistence system not ready");
                return;
            }
            
            // Get all existing sessions and find ones that match this entity pair
            const allSessions = await persistenceSystem.storage.getAllSessions();
            const allMessages = [];
            
            const player = this.industrialPortfolio.playerEntity;
            if (!player) return;
            
            // Find sessions between player and target entity (bridging old and new systems)
            for (const session of allSessions) {
                let isMatch = false;
                
                // Check if session involves both entities
                if (session.participants) {
                    const participants = Array.isArray(session.participants) ? 
                        session.participants : Array.from(session.participants || []);
                    
                    if (participants.includes(player.id) && participants.includes(targetEntity.id)) {
                        isMatch = true;
                    }
                }
                
                // Also check by title matching (legacy approach)
                if (!isMatch) {
                    const sessionTitle = session.title || '';
                    const entityTag = targetEntity.tag || targetEntity.id;
                    if (sessionTitle.toLowerCase().includes(entityTag.toLowerCase())) {
                        isMatch = true;
                    }
                }
                
                if (isMatch && session.chatLogId) {
                    const chatLog = await persistenceSystem.storage.loadChatLog(session.chatLogId);
                    if (chatLog && chatLog.messages) {
                        allMessages.push(...chatLog.messages);
                        
                        // Update conversation message count
                        conversation.messageCount = Math.max(conversation.messageCount, chatLog.messages.length);
                    }
                }
            }
            
            // Sort messages by timestamp
            allMessages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
            
            // Display messages if any exist
            if (allMessages.length > 0) {
                console.log(`📜 Displaying ${allMessages.length} messages for conversation`);
                this.industrialPortfolio.displayChatHistory(allMessages, targetEntity);
                
                // Populate the conversation object with historical messages
                if (!conversation.messages) {
                    conversation.messages = [];
                }
                
                // Convert old session messages to conversation message format
                for (const msg of allMessages) {
                    const conversationMessage = {
                        id: msg.id || `msg_${msg.timestamp}_${Math.random().toString(36).substr(2, 9)}`,
                        conversationId: conversation.id,
                        senderId: msg.senderId || msg.fromEntityId || 'unknown',
                        content: msg.content,
                        type: msg.type || 'user',
                        timestamp: msg.timestamp || Date.now()
                    };
                    
                    // Only add if not already present (avoid duplicates)
                    if (!conversation.messages.find(m => m.id === conversationMessage.id)) {
                        conversation.messages.push(conversationMessage);
                    }
                }
                
                // Update conversation's message count and last activity
                conversation.messageCount = conversation.messages.length;
                if (allMessages.length > 0) {
                    const lastMessage = allMessages[allMessages.length - 1];
                    conversation.lastActivityAt = lastMessage.timestamp || Date.now();
                }
                
                console.log(`📊 Populated conversation with ${conversation.messages.length} messages`);
            } else {
                console.log("📜 No existing messages found for this conversation");
            }
            
        } catch (error) {
            console.error("❌ Error loading conversation messages:", error);
        }
    }

    switchToSession(sessionId) {
        console.log("🔄 Switching to session:", sessionId);
        
        if (this.industrialPortfolio) {
            // Legacy method - delegate to the main app
            this.industrialPortfolio.switchToSession(sessionId);
        }
    }

    showContextMenu(event, sessionId, sessionTitle) {
        this.selectedSessionId = sessionId;
        this.selectedSessionTitle = sessionTitle;
        
        const contextMenu = document.getElementById('session-context-menu');
        if (contextMenu) {
            contextMenu.style.display = 'block';
            contextMenu.style.left = event.pageX + 'px';
            contextMenu.style.top = event.pageY + 'px';
            
            // Close context menu when clicking elsewhere
            document.addEventListener('click', () => {
                this.hideContextMenu();
            }, { once: true });
        }
    }

    hideContextMenu() {
        const contextMenu = document.getElementById('session-context-menu');
        if (contextMenu) {
            contextMenu.style.display = 'none';
        }
    }

    showRenameModal() {
        const modal = document.getElementById('rename-modal-overlay');
        const input = document.getElementById('rename-input');
        
        if (modal && input) {
            input.value = this.selectedSessionTitle || '';
            modal.style.display = 'flex';
            input.focus();
            input.select();
        }
    }

    hideRenameModal() {
        const modal = document.getElementById('rename-modal-overlay');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    showDeleteModal() {
        const modal = document.getElementById('delete-modal-overlay');
        const sessionName = document.getElementById('delete-session-name');
        
        if (modal) {
            if (sessionName) {
                sessionName.textContent = this.selectedSessionTitle || 'Unknown Session';
            }
            modal.style.display = 'flex';
        }
    }

    hideDeleteModal() {
        const modal = document.getElementById('delete-modal-overlay');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async handleRenameSession() {
        const input = document.getElementById('rename-input');
        const newTitle = input?.value?.trim();
        
        if (!newTitle || !this.selectedSessionId) {
            console.error("Invalid rename parameters");
            return;
        }

        try {
            const persistenceSystem = this.world?.getSystem("persistence");
            if (!persistenceSystem) {
                throw new Error("Persistence system not available");
            }

            await persistenceSystem.storage.updateSession(this.selectedSessionId, {
                title: newTitle
            });

            this.hideRenameModal();
            this.loadDMsList(); // Refresh the list
            
            if (this.industrialPortfolio) {
                this.industrialPortfolio.addMessage('system', `📝 DM renamed to "${newTitle}"`);
            }

        } catch (error) {
            console.error("Error renaming session:", error);
            if (this.industrialPortfolio) {
                this.industrialPortfolio.addMessage('system', '❌ Failed to rename session');
            }
        }
    }

    async handleDeleteSession() {
        if (!this.selectedSessionId) {
            console.error("No session selected for deletion");
            return;
        }

        try {
            const persistenceSystem = this.world?.getSystem("persistence");
            if (!persistenceSystem) {
                throw new Error("Persistence system not available");
            }

            const sessionTitle = this.selectedSessionTitle || 'Unknown Session';
            await persistenceSystem.storage.deleteSession(this.selectedSessionId);

            this.hideDeleteModal();
            this.loadDMsList(); // Refresh the list
            
            if (this.industrialPortfolio) {
                this.industrialPortfolio.addMessage('system', `🗑️ Deleted DM with "${sessionTitle}"`);
            }

        } catch (error) {
            console.error("Error deleting session:", error);
            if (this.industrialPortfolio) {
                this.industrialPortfolio.addMessage('system', '❌ Failed to delete session');
            }
        }
    }

    initChannelHandlers() {
        console.log("📡 Initializing channel handlers...");
        
        // Get channel elements and add click handlers
        const channelElements = document.querySelectorAll('.channel-item');
        channelElements.forEach(channelElement => {
            channelElement.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active class from all channels and DMs
                document.querySelectorAll('.channel-item, .dm-item').forEach(item => {
                    item.classList.remove('active');
                });
                channelElement.classList.add('active');
                
                // Get channel name
                const channelNameElement = channelElement.querySelector('.channel-name');
                const channelName = channelNameElement ? channelNameElement.textContent : 'unknown';
                
                console.log(`📡 Switching to channel: ${channelName}`);
                this.switchToChannel(channelName);
            });
        });
    }
    
    loadChannelsList() {
        console.log("📡 Loading channels list...");
        
        const conversationSystem = this.world.getSystem("conversation");
        if (!conversationSystem) {
            console.warn("ConversationSystem not found for loading channels");
            return;
        }
        
        // Update message counts for static channels
        const randomChannelEl = document.querySelector('[data-channel="random"]');
        const generalChannelEl = document.querySelector('[data-channel="general"]');
        
        if (randomChannelEl) {
            const randomChannel = conversationSystem.getChannel("random");
            if (randomChannel) {
                const messageCount = randomChannel.messageCount || 0;
                const countEl = randomChannelEl.querySelector('.channel-count');
                if (countEl) {
                    countEl.textContent = `(${messageCount} messages)`;
                }
                console.log(`📡 Updated random channel: ${messageCount} messages`);
            }
        }
        
        if (generalChannelEl) {
            const generalChannel = conversationSystem.getChannel("general");
            if (generalChannel) {
                const messageCount = generalChannel.messageCount || 0;
                const countEl = generalChannelEl.querySelector('.channel-count');
                if (countEl) {
                    countEl.textContent = `(${messageCount} messages)`;
                }
                console.log(`📡 Updated general channel: ${messageCount} messages`);
            }
        }
        
        console.log("📡 Channels list updated with message counts");
    }
    
    async switchToChannel(channelName) {
        console.log(`🔄 Switching to channel: ${channelName}`);
        
        if (!this.industrialPortfolio) {
            console.error("Industrial portfolio not available");
            return;
        }
        
        const conversationSystem = this.world.getSystem("conversation");
        if (!conversationSystem) {
            console.warn("ConversationSystem not found for channel switching");
            return;
        }
        
        // Clear current chat display
        this.industrialPortfolio.clearChatDisplay();
        
        // Set chat target to null for channels (not a specific entity)
        this.industrialPortfolio.currentChatTarget = null;
        
        try {
            // Get the channel
            const channel = conversationSystem.getChannel(channelName);
            if (!channel) {
                console.warn(`Channel '${channelName}' not found`);
                this.industrialPortfolio.addMessage("system", `❌ Channel '${channelName}' not found`);
                return;
            }
            
            // Set as active conversation
            conversationSystem.setActiveConversation(channel.id);
            
            // Load and display channel messages
            await this.loadChannelMessages(channel);
            
            // Update UI
            this.industrialPortfolio.addMessage("system", `📡 Switched to #${channelName} channel (${channel.messageCount} messages)`);
            
        } catch (error) {
            console.error("❌ Error switching to channel:", error);
            this.industrialPortfolio.addMessage("system", `❌ Failed to switch to channel: ${error.message}`);
        }
    }
    
    async loadChannelMessages(channel) {
        console.log(`📜 Loading messages for channel #${channel.name}...`);
        
        try {
            // Get messages from the channel
            const messages = channel.messages || [];
            
            if (messages.length === 0) {
                console.log("📜 No messages found in channel");
                this.industrialPortfolio.addMessage("system", `Welcome to #${channel.name}! ${channel.description || 'No description available.'}`);
                return;
            }
            
            // Sort messages by timestamp
            const sortedMessages = [...messages].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
            
            // Display each message
            for (const msg of sortedMessages) {
                // For autonomous messages, show the entity name
                let messageType = 'user';
                let authorName = 'Unknown';
                
                // Try to find the entity that sent this message
                const senderEntity = this.world.getEntity(msg.senderId);
                if (senderEntity) {
                    authorName = senderEntity.tag || `Entity ${msg.senderId}`;
                    messageType = 'assistant'; // Show bot messages as assistant type
                } else if (msg.options?.speaker_name) {
                    authorName = msg.options.speaker_name;
                    messageType = 'assistant';
                }
                
                // Add the message with a custom format for channel display
                this.addChannelMessage(messageType, msg.content, authorName, msg.timestamp, msg.options);
            }
            
            console.log(`📜 Displayed ${sortedMessages.length} messages from channel`);
            
        } catch (error) {
            console.error("❌ Error loading channel messages:", error);
            this.industrialPortfolio.addMessage("system", `❌ Error loading channel messages: ${error.message}`);
        }
    }
    
    addChannelMessage(type, content, authorName, timestamp, options = {}) {
        const chatInterface = this.world?.getSystem("chatInterface");
        if (!chatInterface) return;
        
        // For channel messages, we want to show the author name prominently
        const displayContent = content;
        
        // Create a modified message display for channels
        const chatMessages = document.getElementById("chat-messages");
        const welcome = chatMessages.querySelector(".chat-welcome");
        
        // Remove welcome message if it exists
        if (welcome) {
            welcome.remove();
        }
        
        // Create message element with channel-specific styling
        const messageDiv = document.createElement("div");
        messageDiv.className = `message ${type} channel-message`;
        
        // Create message header with author and time
        const headerDiv = document.createElement("div");
        headerDiv.className = "message-header";
        
        // Create avatar for the author
        const avatarDiv = document.createElement("div");
        avatarDiv.className = "message-avatar";
        avatarDiv.textContent = authorName.charAt(0).toUpperCase();
        
        const authorSpan = document.createElement("span");
        authorSpan.className = "message-author";
        authorSpan.textContent = authorName;
        
        const timeSpan = document.createElement("span");
        timeSpan.className = "message-time";
        const msgTime = timestamp ? new Date(timestamp) : new Date();
        timeSpan.textContent = msgTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        headerDiv.appendChild(avatarDiv);
        headerDiv.appendChild(authorSpan);
        headerDiv.appendChild(timeSpan);
        messageDiv.appendChild(headerDiv);
        
        // Create message body
        const bodyDiv = document.createElement("div");
        bodyDiv.className = "message-body";
        
        const messageContent = document.createElement("div");
        messageContent.className = "message-content";
        messageContent.textContent = displayContent;
        
        bodyDiv.appendChild(messageContent);
        messageDiv.appendChild(bodyDiv);
        
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // System update method (required by ECS)
    update(deltaTime) {
        // Session Management doesn't need regular updates
        // It responds to user events instead
    }
}