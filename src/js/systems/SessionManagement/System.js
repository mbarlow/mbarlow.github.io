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
        
        const persistenceSystem = this.world?.getSystem("persistence");
        if (!persistenceSystem?.initialized) {
            console.log("⏳ Persistence system not ready, retrying in 1 second...");
            setTimeout(() => this.loadDMsList(), 1000);
            return;
        }

        try {
            const dmsList = document.getElementById("dms-list");
            if (!dmsList) {
                console.error("DMs list element not found");
                return;
            }

            // Clear existing DMs
            dmsList.innerHTML = "";

            // Get all sessions from storage (they are our DMs)
            const sessions = await persistenceSystem.storage.getAllSessions();
            console.log("💬 DMs loaded:", sessions.length);

            if (sessions.length === 0) {
                const emptyMessage = document.createElement("div");
                emptyMessage.className = "empty-dms";
                emptyMessage.textContent = "No direct messages yet";
                emptyMessage.style.padding = "12px";
                emptyMessage.style.textAlign = "center";
                emptyMessage.style.color = "var(--text-muted)";
                emptyMessage.style.fontSize = "12px";
                dmsList.appendChild(emptyMessage);
                return;
            }

            // Sort sessions by last activity (most recent first)
            sessions.sort((a, b) => {
                const aTime = new Date(a.lastActivityAt || a.createdAt || 0).getTime();
                const bTime = new Date(b.lastActivityAt || b.createdAt || 0).getTime();
                return bTime - aTime;
            });

            // Create DM elements
            sessions.forEach(session => {
                const dmElement = this.createDMElement(session);
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

    createDMElement(session) {
        const dmDiv = document.createElement("div");
        dmDiv.className = "dm-item";
        dmDiv.dataset.sessionId = session.id;

        // Create status indicator
        const statusDiv = document.createElement("div");
        statusDiv.className = "dm-status";
        // For now, all entities are "online" when the system is running
        statusDiv.classList.add("online");

        // Extract entity name from session title
        // Session titles are formatted as "Entity1 ⟷ Entity2"
        let entityName = "Unknown";
        if (session.title) {
            const parts = session.title.split(/[⟷↔\-–—]/);
            // Find the non-player entity name
            for (const part of parts) {
                const trimmed = part.trim();
                if (trimmed && trimmed.toLowerCase() !== 'player' && trimmed.toLowerCase() !== 'user') {
                    entityName = trimmed;
                    break;
                }
            }
        }

        // Create name div
        const nameDiv = document.createElement("div");
        nameDiv.className = "dm-name";
        nameDiv.textContent = entityName;

        // Create unread indicator if there are recent messages
        const unreadDiv = document.createElement("div");
        if (session.messageCount > 0 && session.lastActivityAt) {
            // Show unread indicator for recent activity (within last hour)
            const hourAgo = Date.now() - (60 * 60 * 1000);
            if (new Date(session.lastActivityAt).getTime() > hourAgo) {
                unreadDiv.className = "dm-unread";
                unreadDiv.textContent = session.messageCount;
            }
        }

        dmDiv.appendChild(statusDiv);
        dmDiv.appendChild(nameDiv);
        if (unreadDiv.className) {
            dmDiv.appendChild(unreadDiv);
        }

        // Add click handler to switch to session
        dmDiv.addEventListener("click", (e) => {
            e.preventDefault();
            console.log("💬 DM clicked:", session.id, entityName);
            this.switchToSession(session.id);
            // Remove active class from other DMs
            document.querySelectorAll('.dm-item').forEach(item => {
                item.classList.remove('active');
            });
            dmDiv.classList.add('active');
        });

        // Add context menu handler
        dmDiv.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            console.log("🖱️ Context menu triggered for DM:", session.id);
            this.showContextMenu(e, session.id, entityName);
        });

        return dmDiv;
    }

    // Keep createSessionElement for backward compatibility
    createSessionElement(session) {
        return this.createDMElement(session);
    }

    switchToSession(sessionId) {
        console.log("🔄 Switching to session:", sessionId);
        
        if (this.industrialPortfolio) {
            // Delegate to the main app to handle session switching
            // This involves finding the target entity and setting currentChatTarget
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