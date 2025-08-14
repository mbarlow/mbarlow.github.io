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
        console.log("💬 Initializing DMs list...");
        
        // Add DM button handler
        const addDmBtn = document.getElementById("add-dm");
        if (addDmBtn) {
            addDmBtn.addEventListener("click", () => {
                // TODO: Show entity selector modal
                console.log("Add DM clicked - entity selector coming soon");
            });
        }

        this.initSessionModals();

        // Load DMs after a short delay to ensure systems are ready
        setTimeout(() => {
            this.loadDMsList();
        }, 1000);
        
        console.log("✅ DMs list initialized");
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
        console.log("🔄 Loading DMs list...");
        console.log("SessionManagementSystem initialized:", !!this.world, !!this.industrialPortfolio);
        
        try {
            const dmsList = document.getElementById("dms-list");
            if (!dmsList) {
                console.error("DMs list element not found");
                return;
            }

            // Clear existing DMs
            dmsList.innerHTML = "";

            // Get all entities in the world that can be messaged
            const allEntities = Array.from(this.world.entities.values());
            const messagableEntities = [];
            
            // Find player entity
            const playerEntity = this.industrialPortfolio?.playerEntity || 
                                  this.world.getEntitiesByTag("player")[0];
            
            // Add all entities that have brain components (can chat)
            for (const entity of allEntities) {
                if (entity.hasComponent("BrainComponent")) {
                    // Get all sessions involving this entity
                    const persistenceSystem = this.world?.getSystem("persistence");
                    let messageCount = 0;
                    let lastActivity = null;
                    
                    if (persistenceSystem?.initialized) {
                        const sessions = await persistenceSystem.storage.getAllSessions();
                        // Count messages across all sessions with this entity
                        for (const session of sessions) {
                            // Check if session involves this entity
                            const entityTag = entity.tag || entity.id;
                            const sessionTitle = session.title || '';
                            if (sessionTitle.toLowerCase().includes(entityTag.toLowerCase())) {
                                messageCount += session.messageCount || 0;
                                if (!lastActivity || (session.lastActivityAt && new Date(session.lastActivityAt) > new Date(lastActivity))) {
                                    lastActivity = session.lastActivityAt;
                                }
                            }
                        }
                    }
                    
                    messagableEntities.push({
                        entity: entity,
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
            messagableEntities.forEach(({entity, messageCount, lastActivity}) => {
                const dmElement = this.createEntityDMElement(entity, messageCount, lastActivity);
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

    createEntityDMElement(entity, totalMessages, lastActivity) {
        const dmDiv = document.createElement("div");
        dmDiv.className = "dm-item";
        dmDiv.dataset.entityId = entity.id;
        dmDiv.dataset.entityTag = entity.tag || entity.id;

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
        console.log("🔄 Switching to DM with entity:", targetEntity.tag || targetEntity.id);
        
        if (!this.industrialPortfolio) {
            console.error("Industrial portfolio not available");
            return;
        }
        
        const player = this.industrialPortfolio.playerEntity;
        if (!player) {
            console.error("Player entity not found");
            return;
        }
        
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
                const activeSession = await sessionSystem.findOrCreateSession(player, targetEntity);
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

    // System update method (required by ECS)
    update(deltaTime) {
        // Session Management doesn't need regular updates
        // It responds to user events instead
    }
}