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
        console.log("💬 Initializing sessions list...");
        
        const refreshBtn = document.getElementById("refresh-sessions");
        if (refreshBtn) {
            refreshBtn.addEventListener("click", () => {
                this.loadSessionsList();
            });
        }

        this.initSessionModals();

        // Load sessions after a short delay to ensure systems are ready
        setTimeout(() => {
            this.loadSessionsList();
        }, 1000);
        
        console.log("✅ Sessions list initialized");
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

    async loadSessionsList() {
        console.log("🔄 Loading sessions list...");
        console.log("SessionManagementSystem initialized:", !!this.world, !!this.industrialPortfolio);
        
        const persistenceSystem = this.world?.getSystem("persistence");
        if (!persistenceSystem?.initialized) {
            console.log("⏳ Persistence system not ready, retrying in 1 second...");
            setTimeout(() => this.loadSessionsList(), 1000);
            return;
        }

        try {
            const sessionsList = document.getElementById("sessions-list");
            if (!sessionsList) {
                console.error("Sessions list element not found");
                return;
            }

            // Clear existing sessions
            sessionsList.innerHTML = "";

            // Get all sessions from storage
            const sessions = await persistenceSystem.storage.getAllSessions();
            console.log("📋 Sessions loaded:", sessions.length);
            console.log("📋 Sample session data:", sessions[0]);

            if (sessions.length === 0) {
                const emptyMessage = document.createElement("div");
                emptyMessage.className = "empty-sessions";
                emptyMessage.textContent = "No sessions yet";
                sessionsList.appendChild(emptyMessage);
                return;
            }

            // Sort sessions by last activity (most recent first)
            sessions.sort((a, b) => {
                const aTime = new Date(a.lastActivity || a.createdAt || 0).getTime();
                const bTime = new Date(b.lastActivity || b.createdAt || 0).getTime();
                return bTime - aTime;
            });

            // Create session elements
            sessions.forEach(session => {
                const sessionElement = this.createSessionElement(session);
                sessionsList.appendChild(sessionElement);
            });

        } catch (error) {
            console.error("❌ Error loading sessions:", error);
            const sessionsList = document.getElementById("sessions-list");
            if (sessionsList) {
                sessionsList.innerHTML = `<div class="error-message">Failed to load sessions: ${error.message}</div>`;
            }
        }
    }

    createSessionElement(session) {
        const sessionDiv = document.createElement("div");
        sessionDiv.className = "session-item";
        sessionDiv.dataset.sessionId = session.id;

        // Create session title
        const titleDiv = document.createElement("div");
        titleDiv.className = "session-title";
        titleDiv.textContent = session.title || `Session ${session.id.slice(0, 8)}`;

        // Create session metadata
        const metaDiv = document.createElement("div");
        metaDiv.className = "session-meta";
        
        const messageCount = session.messages ? session.messages.length : 0;
        const lastActivity = session.lastActivity ? 
            new Date(session.lastActivity).toLocaleString() : 
            'No activity';
        
        metaDiv.innerHTML = `
            <span class="message-count">${messageCount} messages</span>
            <span class="last-activity">${lastActivity}</span>
        `;

        sessionDiv.appendChild(titleDiv);
        sessionDiv.appendChild(metaDiv);

        // Add click handler to switch to session
        sessionDiv.addEventListener("click", (e) => {
            e.preventDefault();
            console.log("🔄 Session clicked:", session.id);
            this.switchToSession(session.id);
        });

        // Add context menu handler
        sessionDiv.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            console.log("🖱️ Context menu triggered for session:", session.id);
            this.showContextMenu(e, session.id, session.title || `Session ${session.id.slice(0, 8)}`);
        });

        return sessionDiv;
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
            this.loadSessionsList(); // Refresh the list
            
            if (this.industrialPortfolio) {
                this.industrialPortfolio.addMessage('system', `📝 Session renamed to "${newTitle}"`);
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
            this.loadSessionsList(); // Refresh the list
            
            if (this.industrialPortfolio) {
                this.industrialPortfolio.addMessage('system', `🗑️ Deleted session "${sessionTitle}"`);
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