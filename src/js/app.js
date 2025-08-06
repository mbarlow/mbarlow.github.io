import { World } from "./core/index.js";
import {
  RenderSystem,
  InputSystem,
  ThreeRenderSystem,
  LevelLoader,
  AgentSystem,
  CameraSystem,
  PlayerMovementSystem,
  FPSControllerSystem,
  PatrolSystem,
  ConnectionSystem,
  SessionSystem,
  PersistenceSystem,
  VoxelIndicatorRenderSystem,
} from "./systems/index.js";
import {
  Connection,
  Session,
  ChatLog,
  BrainComponent,
  VoxelIndicatorComponent,
  TransformComponent,
} from "./components/index.js";
import { SystemPromptBuilder } from "./utils/index.js";
import { ThemeManager, FontManager, Navigation, Sidebar, ChatInterface, uiManager, templateRegistry } from "./ui/index.js";

// Main Application Controller
class IndustrialPortfolio {
  constructor() {
    this.currentTheme = "dark";
    this.currentView = "chat";
    this.sidebarCollapsed = false;
    this.currentFont = "Inter";
    this.initialized = false;
    this.world = new World();
    this.currentChatTarget = null; // Will be set to origin entity by default
    
    // Initialize UI manager and components
    this.themeManager = new ThemeManager();
    this.fontManager = new FontManager();
    this.navigation = new Navigation();
    this.sidebar = new Sidebar();
    this.chatInterface = new ChatInterface();
  }

  async init() {
    if (this.initialized) return;
    console.log("🏭 Initializing...");

    try {
      // Initialize UI manager and templates
      await this.initUI();
      
      this.initSessionsList();
      await this.initECS();
      this.initChatInterface(); // Move after ECS initialization
      this.initialized = true;
      console.log("✅ Industrial Portfolio initialized successfully");
    } catch (error) {
      console.error("❌ Error initializing portfolio:", error);
    }
  }

  async initECS() {
    console.log("🎮 Initializing ECS...");

    // Add core systems
    this.world.addSystem(new RenderSystem(), "render");
    this.world.addSystem(new InputSystem(), "input");

    // Add Three.js render system
    const threeRender = new ThreeRenderSystem();
    this.world.addSystem(threeRender, "threeRender");

    // Initialize Three.js system
    threeRender.init();

    // Add camera system BEFORE loading level (so it's ready when entities are created)
    const cameraSystem = new CameraSystem();
    this.world.addSystem(cameraSystem, "camera");
    cameraSystem.init(this.world);

    // Add level loader
    const levelLoader = new LevelLoader();
    this.world.addSystem(levelLoader, "levelLoader");

    // Load the level
    await levelLoader.loadLevel(this.world);

    // Add agent system for Ollama
    const agentSystem = new AgentSystem();
    agentSystem.world = this.world; // Set world reference
    this.world.addSystem(agentSystem, "agent");
    await agentSystem.init();

    // Initialize SystemPromptBuilder
    const promptBuilder = new SystemPromptBuilder(this.world);
    agentSystem.setPromptBuilder(promptBuilder);

    const playerMovementSystem = new PlayerMovementSystem();
    this.world.addSystem(playerMovementSystem, "playerMovement");

    const fpsControllerSystem = new FPSControllerSystem();
    this.world.addSystem(fpsControllerSystem, "fpsController");

    // Add patrol system for bots
    const patrolSystem = new PatrolSystem();
    this.world.addSystem(patrolSystem, "patrol");

    // Add connection system
    const connectionSystem = new ConnectionSystem(
      this.world,
      threeRender.scene,
    );
    this.world.addSystem(connectionSystem, "connection");

    // Add session system
    const sessionSystem = new SessionSystem(this.world);
    this.world.addSystem(sessionSystem, "session");

    // Add persistence system
    const persistenceSystem = new PersistenceSystem(this.world);
    this.world.addSystem(persistenceSystem, "persistence");
    await persistenceSystem.init();

    // Add 3D voxel indicator render system
    const voxelIndicatorRenderSystem = new VoxelIndicatorRenderSystem(
      threeRender.scene,
      cameraSystem.getActiveCamera()?.camera, // Get the Three.js camera from active CameraComponent
    );
    this.world.addSystem(voxelIndicatorRenderSystem, "voxelIndicatorRender");

    // Initialize player-origin connection after level is loaded
    this.initializeDefaultConnections();

    // Start the ECS world
    this.world.start();

    console.log("✅ ECS initialized");
  }

  async initUI() {
    console.log("🖼️ Initializing UI manager...");

    // Initialize template registry
    await templateRegistry.init();

    // Initialize UI manager
    await uiManager.init({
      debug: true // Enable debug mode during development
    });

    // Register and initialize theme manager
    uiManager.register('themeManager', this.themeManager);
    this.themeManager.init();

    // Register and initialize font manager
    uiManager.register('fontManager', this.fontManager);
    this.fontManager.init();

    // Register and initialize navigation
    uiManager.register('navigation', this.navigation);
    this.navigation.init();

    // Register and initialize sidebar
    uiManager.register('sidebar', this.sidebar);
    this.sidebar.init();

    // Register and initialize chat interface
    uiManager.register('chatInterface', this.chatInterface);
    this.chatInterface.init();

    // Update references from managers
    this.currentTheme = this.themeManager.getTheme();
    this.currentFont = this.fontManager.getFont();
    this.currentView = this.navigation.getCurrentView();
    this.sidebarCollapsed = this.sidebar.isCollapsedState();

    console.log(`✅ UI manager initialized (theme: ${this.currentTheme})`);
  }



  initializeDefaultConnections() {
    console.log("🔗 Initializing default connections...");

    // Find player and origin marker entities
    const player = this.world.getEntitiesByTag("player")[0];
    const originMarker = this.world.getEntitiesByTag("origin-marker")[0];

    if (player && originMarker) {
      // Add brain components
      const playerBrain = new BrainComponent({
        model: "human",
        primaryFunction: "user",
        personality: {
          openness: 0.8,
          extraversion: 0.7,
        },
        interests: ["exploration", "chatting", "learning"],
      });
      player.addComponent(playerBrain);

      const originBrain = new BrainComponent({
        model: "gemma3",
        primaryFunction: "Origin Marker",
        promptTemplate: "originMarker",
        personality: {
          agreeableness: 0.9,
          conscientiousness: 0.8,
          extraversion: 0.8,
          openness: 0.9,
        },
        interests: [
          "helping",
          "system guidance",
          "technical explanation",
          "ECS architecture",
        ],
        expertise: [
          "chat systems",
          "ECS patterns",
          "Three.js",
          "persistence",
          "AI integration",
        ],
        responseStyle: "helpful",
        systemPrompt: "You are the Origin Marker AI assistant.",
        contextSettings: {
          includeHistory: true,
          historyLimit: 5,
          includePersonality: true,
          includeSystemInfo: true,
          includeCommands: true,
        },
        commandAccess: [
          "search",
          "history",
          "who",
          "model",
          "context",
          "save",
          "export",
        ],
      });
      originMarker.addComponent(originBrain);

      // Ensure connection components exist
      this.world.ensureComponent(player, Connection);
      this.world.ensureComponent(originMarker, Connection);

      // Add 3D voxel indicator components (replacing 2D indicators)
      const playerIndicator = new VoxelIndicatorComponent({
        position: { x: 0, y: 1.2, z: 0 }, // Above player, closer due to smaller size
        brightness: 0.8,
        state: "idle",
        gridSize: { width: 8, height: 8, depth: 1 }, // 8x8 grid as requested
      });
      player.addComponent(playerIndicator);

      const originIndicator = new VoxelIndicatorComponent({
        position: { x: 0, y: 1.3, z: 0 }, // Above origin marker
        brightness: 1.0,
        state: "idle",
        gridSize: { width: 8, height: 8, depth: 1 },
      });
      originMarker.addComponent(originIndicator);

      // Set initial patterns after components are added
      this.setPlayerIndicatorPattern(playerIndicator);
      this.setOriginIndicatorPattern(originIndicator);

      // Store references for easy access
      this.playerEntity = player;
      this.originEntity = originMarker;
      
      // Set default chat target to origin entity
      this.currentChatTarget = this.originEntity;

      console.log("✅ Player and origin entities configured with indicators");
    } else {
      console.error("❌ Could not find player or origin marker entities");
    }
  }

  setPlayerIndicatorPattern(indicator) {
    // Create a simple smiley pattern for voxel indicator
    indicator.createPattern("smiley");
  }

  setOriginIndicatorPattern(indicator) {
    // Create AI-themed pattern for origin marker
    indicator.createPattern("idle");
  }

  initChatInterface() {
    console.log("💬 Initializing chat interface...");

    // Inject dependencies into chat interface
    const sessionSystem = this.world.getSystem("session");
    const agentSystem = this.world.getSystem("agent");
    
    this.chatInterface.injectDependencies({
      world: this.world,
      sessionSystem,
      agentSystem,
      originEntity: this.originEntity,
      appInstance: this
    });

    // Bind command handling events
    this.chatInterface.subscribe('command:executed', (data) => {
      console.log('🎯 App received chat command:', data);
    });
    
    // Bind chat input focus to activate session
    this.chatInterface.subscribe('chat:input:focused', this.handleChatInputFocus.bind(this));

    // Handle model selector (if it exists)
    const modelSelect = document.getElementById("model-select");
    if (modelSelect) {
      modelSelect.addEventListener("change", (e) => {
        if (agentSystem) {
          agentSystem.switchModel(e.target.value);
        }
      });
    }

    // Handle image upload buttons (if they exist)
    const imageUploadBtn = document.getElementById("image-upload-btn");
    const imageUpload = document.getElementById("image-upload");
    if (imageUploadBtn && imageUpload) {
      imageUploadBtn.addEventListener("click", () => {
        imageUpload.click();
      });

      imageUpload.addEventListener("change", async (e) => {
        await this.handleImageUpload(e.target.files);
      });
    }

    console.log("✅ Chat interface initialized");
  }



  /**
   * Handle chat input focus to activate session
   */
  handleChatInputFocus() {
    console.log("💬 Chat input focused, ensuring session is active");
    this.activatePlayerOriginSession();
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

    // Handle Enter key in rename input
    const sessionTitleInput = document.getElementById('session-title-input');
    if (sessionTitleInput) {
      sessionTitleInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.handleRenameSession();
        }
      });
    }
  }

  async loadSessionsList() {
    const sessionsList = document.getElementById("sessions-list");
    const sessionsLoading = document.getElementById("sessions-loading");
    
    if (!sessionsList) {
      console.warn("Sessions list element not found");
      return;
    }

    // Show loading state
    if (sessionsLoading) {
      sessionsLoading.style.display = "flex";
    }

    try {
      const persistenceSystem = this.world.getSystem("persistence");
      console.log("PersistenceSystem:", persistenceSystem);
      
      if (!persistenceSystem) {
        this.showSessionsError("Session system not available");
        return;
      }

      if (!persistenceSystem.initialized) {
        console.log("PersistenceSystem not yet initialized, retrying...");
        setTimeout(() => this.loadSessionsList(), 2000);
        return;
      }

      console.log("Loading sessions from storage...");
      const sessions = await persistenceSystem.storage.getAllSessions();
      console.log("Loaded sessions:", sessions.length);
      
      if (!sessions || sessions.length === 0) {
        this.renderSessionsList([]);
        return;
      }

      // Sort by last activity and take top 15
      const recentSessions = sessions
        .sort((a, b) => b.lastActivityAt - a.lastActivityAt)
        .slice(0, 15);

      console.log("Rendering", recentSessions.length, "recent sessions");
      await this.renderSessionsList(recentSessions);

    } catch (error) {
      console.error("Failed to load sessions:", error);
      this.showSessionsError(`Failed to load sessions: ${error.message}`);
    }
  }

  async renderSessionsList(sessions) {
    const sessionsList = document.getElementById("sessions-list");
    const sessionsLoading = document.getElementById("sessions-loading");
    
    if (!sessionsList) return;

    // Hide loading
    if (sessionsLoading) {
      sessionsLoading.style.display = "none";
    }

    // Clear existing sessions
    sessionsList.innerHTML = "";

    if (sessions.length === 0) {
      sessionsList.innerHTML = `
        <div class="sessions-loading">
          <span>No sessions found</span>
        </div>
      `;
      return;
    }

    // Create session items
    for (const session of sessions) {
      const sessionItem = await this.createSessionItem(session);
      sessionsList.appendChild(sessionItem);
    }
  }

  async createSessionItem(session) {
    const div = document.createElement("div");
    div.className = "session-item";
    div.dataset.sessionId = session.id;

    // Get participant names
    const participantNames = await this.getParticipantNames(session.participants);
    const participantList = participantNames.slice(0, 2).join(", ");
    const hasMore = participantNames.length > 2;
    
    // Format time
    const timeAgo = this.getTimeAgo(session.lastActivityAt);
    
    // Check if this is the active session
    const isActive = this.isActiveSession(session.id);
    if (isActive) {
      div.classList.add("active");
    }

    div.innerHTML = `
      <div class="session-content">
        <div class="session-title">${session.title || "Untitled Session"}</div>
        <div class="session-meta">
          <span>${timeAgo}</span>
          <span>•</span>
          <span>${session.messageCount} msg</span>
          <div class="session-participants">
            ${participantNames.map(() => '<div class="participant-indicator"></div>').join('')}
          </div>
          ${hasMore ? `<span>+${participantNames.length - 2}</span>` : ''}
        </div>
      </div>
      <button class="session-menu-btn" title="Session Options">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="1"/>
          <circle cx="12" cy="5" r="1"/>
          <circle cx="12" cy="19" r="1"/>
        </svg>
      </button>
    `;

    // Add click handler to switch to this session
    div.addEventListener("click", (e) => {
      if (!e.target.closest(".session-menu-btn")) {
        this.switchToSession(session);
      }
    });

    // Add menu button handler
    const menuBtn = div.querySelector(".session-menu-btn");
    if (menuBtn) {
      menuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.showSessionMenu(session, menuBtn);
      });
    }

    return div;
  }

  isActiveSession(sessionId) {
    // Check if this session is currently active
    const sessionSystem = this.world.getSystem("session");
    if (!sessionSystem || !this.playerEntity) return false;
    
    try {
      const existingSessions = sessionSystem.getSessionHistory(this.playerEntity);
      const activeSession = existingSessions.find(
        (s) => s && s.state === "active"
      );
      
      return activeSession && activeSession.id === sessionId;
    } catch (error) {
      console.warn("Error checking active session:", error);
      return false;
    }
  }

  async getParticipantNames(participantIds) {
    const names = [];
    
    for (const entityId of participantIds) {
      const entity = this.world.getEntity(entityId);
      if (entity) {
        // Get entity name from tag or brain component
        let name = entity.tag || `Entity ${entityId}`;
        
        const brain = entity.getComponent("BrainComponent");
        if (brain && brain.personality) {
          name = `${name} (${brain.personality})`;
        }
        
        names.push(name);
      } else {
        names.push(`Entity ${entityId}`);
      }
    }
    
    return names;
  }

  async switchToSession(session) {
    console.log("Switching to session:", session.id);
    
    // Find the target entity for this session
    const targetId = session.participants.find(id => id !== this.playerEntity?.id);
    if (!targetId) return;

    const targetEntity = this.world.getEntity(targetId);
    if (!targetEntity) return;

    // Switch chat target
    this.currentChatTarget = targetEntity;
    
    // Create or activate session with the target
    const activeSession = this.activatePlayerTargetSession();
    if (!activeSession) {
      this.addMessage("system", "❌ Failed to activate session");
      return;
    }
    
    // Load chat history
    await this.loadSessionHistory(session);
    
    // Update active session in UI
    this.updateActiveSessionUI(session.id);
    
    // Show confirmation
    const brain = targetEntity.getComponent("BrainComponent");
    const entityName = targetEntity.tag || "Entity";
    const personality = brain?.personality ? ` (${brain.personality})` : "";
    
    this.addMessage("system", `📱 Switched to session with ${entityName}${personality}`);
  }

  updateActiveSessionUI(activeSessionId) {
    // Update session list UI to show active session
    const sessionItems = document.querySelectorAll(".session-item");
    sessionItems.forEach(item => {
      if (item.dataset.sessionId === activeSessionId) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  }

  async loadSessionHistory(session) {
    try {
      const persistenceSystem = this.world.getSystem("persistence");
      if (!persistenceSystem || !session.chatLogId) return;
      
      // Load chat log from storage
      const chatLog = await persistenceSystem.storage.loadChatLog(session.chatLogId);
      if (!chatLog || !chatLog.messages) return;
      
      // Clear current chat display
      const chatContainer = document.getElementById("chat-messages");
      if (chatContainer) {
        chatContainer.innerHTML = '';
      }
      
      // Display historical messages
      for (const msg of chatLog.messages) {
        const senderEntity = this.world.getEntity(msg.senderId);
        const role = msg.senderId === this.playerEntity?.id ? "user" : "assistant";
        const senderName = senderEntity?.tag || "Unknown";
        
        this.addMessage(role, msg.content, {
          timestamp: msg.timestamp,
          senderName: senderName,
          historical: true
        });
      }
      
      console.log(`Loaded ${chatLog.messages.length} messages from session history`);
    } catch (error) {
      console.error("Failed to load session history:", error);
    }
  }

  showSessionMenu(session, menuBtn) {
    const contextMenu = document.getElementById('session-context-menu');
    if (!contextMenu) return;

    // Store current session for modal actions
    this.currentContextSession = session;

    // Position the menu near the button
    const rect = menuBtn.getBoundingClientRect();
    contextMenu.style.left = `${rect.right + 5}px`;
    contextMenu.style.top = `${rect.top}px`;
    
    // Show the menu
    contextMenu.classList.add('show');

    // Hide menu when clicking outside
    const hideMenu = (e) => {
      if (!contextMenu.contains(e.target) && !menuBtn.contains(e.target)) {
        contextMenu.classList.remove('show');
        document.removeEventListener('click', hideMenu);
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', hideMenu);
    }, 0);
  }

  hideContextMenu() {
    const contextMenu = document.getElementById('session-context-menu');
    if (contextMenu) {
      contextMenu.classList.remove('show');
    }
  }

  showRenameModal() {
    if (!this.currentContextSession) return;
    
    const modal = document.getElementById('rename-modal-overlay');
    const input = document.getElementById('session-title-input');
    
    if (modal && input) {
      // Pre-fill with current title
      input.value = this.currentContextSession.title || 'Untitled Session';
      modal.style.display = 'flex';
      
      // Focus and select the input text
      setTimeout(() => {
        input.focus();
        input.select();
      }, 100);
    }
  }

  hideRenameModal() {
    const modal = document.getElementById('rename-modal-overlay');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  showDeleteModal() {
    if (!this.currentContextSession) return;
    
    const modal = document.getElementById('delete-modal-overlay');
    const titleElement = document.getElementById('delete-session-title');
    const metaElement = document.getElementById('delete-session-meta');
    
    if (modal && titleElement && metaElement) {
      titleElement.textContent = this.currentContextSession.title || 'Untitled Session';
      
      // Calculate participants and message count
      const participantCount = this.currentContextSession.participants ? this.currentContextSession.participants.size : 0;
      const messageCount = this.currentContextSession.messageCount || 0;
      metaElement.textContent = `${messageCount} messages, ${participantCount} participants`;
      
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
    if (!this.currentContextSession) return;
    
    const input = document.getElementById('session-title-input');
    const newTitle = input?.value?.trim();
    
    if (!newTitle || newTitle === this.currentContextSession.title) {
      this.hideRenameModal();
      return;
    }

    try {
      const persistenceSystem = this.world.getSystem('persistence');
      if (!persistenceSystem) {
        console.error('Persistence system not available');
        return;
      }

      // Update the session title in storage
      await persistenceSystem.storage.updateSessionTitle(this.currentContextSession.id, newTitle);
      
      // Update local reference
      this.currentContextSession.title = newTitle;
      
      // Refresh the sessions list
      this.loadSessionsList();
      
      // Show success message
      this.addMessage('system', `📝 Session renamed to "${newTitle}"`);
      
      this.hideRenameModal();
    } catch (error) {
      console.error('Failed to rename session:', error);
      this.addMessage('system', '❌ Failed to rename session');
    }
  }

  async handleDeleteSession() {
    if (!this.currentContextSession) return;
    
    try {
      const persistenceSystem = this.world.getSystem('persistence');
      if (!persistenceSystem) {
        console.error('Persistence system not available');
        return;
      }

      const sessionId = this.currentContextSession.id;
      
      // Delete the session from storage
      await persistenceSystem.storage.deleteSession(sessionId);
      
      // If this was the active session, we need to handle that
      const sessionSystem = this.world.getSystem('session');
      if (sessionSystem) {
        // Deactivate the session if it was active
        sessionSystem.deactivateSession(sessionId);
      }
      
      // Refresh the sessions list
      this.loadSessionsList();
      
      // Show success message
      const sessionTitle = this.currentContextSession.title || 'Untitled Session';
      this.addMessage('system', `🗑️ Deleted session "${sessionTitle}"`);
      
      this.hideDeleteModal();
      this.currentContextSession = null;
    } catch (error) {
      console.error('Failed to delete session:', error);
      this.addMessage('system', '❌ Failed to delete session');
    }
  }

  getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return new Date(timestamp).toLocaleDateString();
  }

  showSessionsError(message) {
    const sessionsList = document.getElementById("sessions-list");
    const sessionsLoading = document.getElementById("sessions-loading");
    
    if (sessionsLoading) {
      sessionsLoading.style.display = "none";
    }
    
    if (sessionsList) {
      sessionsList.innerHTML = `
        <div class="sessions-loading">
          <span style="color: var(--text-muted);">${message}</span>
        </div>
      `;
    }
  }

  setTheme(theme) {
    // Delegate to theme manager component
    const success = this.themeManager?.setTheme(theme);
    if (success) {
      this.currentTheme = theme;
    }
    return success;
  }

  setFont(fontName) {
    // Delegate to font manager component
    const success = this.fontManager?.setFont(fontName);
    if (success) {
      this.currentFont = fontName;
    }
    return success;
  }

  activatePlayerOriginSession() {
    console.log("🔄 activatePlayerOriginSession called");
    
    const sessionSystem = this.world.getSystem("session");
    if (!sessionSystem || !this.playerEntity || !this.originEntity) {
      console.error(
        "Cannot activate session: missing required entities or systems",
        {
          sessionSystem: !!sessionSystem,
          playerEntity: !!this.playerEntity,
          originEntity: !!this.originEntity
        }
      );
      return null;
    }

    console.log("🔄 All systems available, checking for existing sessions");

    // Check if there's already an active session
    const existingSessions = sessionSystem.getSessionHistory(this.playerEntity);
    console.log("🔄 Existing sessions:", existingSessions);
    
    const activeSession = existingSessions.find(
      (s) => s && s.state === "active",
    );

    if (activeSession) {
      console.log("✅ Using existing active session:", activeSession.id);
      return activeSession;
    }

    // Create new session
    console.log("🔄 Creating new session between player and origin");
    const newSession = sessionSystem.createSession(
      this.playerEntity,
      this.originEntity,
    );

    if (newSession) {
      console.log("✅ Session created:", newSession.id);
      console.log("✅ Session details:", newSession);
      return newSession;
    }

    console.error("❌ Failed to create session");
    return null;
  }

  activatePlayerTargetSession() {
    const sessionSystem = this.world.getSystem("session");
    if (!sessionSystem || !this.playerEntity || !this.currentChatTarget) {
      console.error(
        "Cannot activate session: missing required entities or systems",
      );
      return null;
    }
    
    // Check if there's already an active session with this target
    const existingSessions = sessionSystem.getSessionHistory(this.playerEntity);
    const activeSession = existingSessions.find(
      (s) => s && s.state === "active" && 
      s.participants.has(this.currentChatTarget.id)
    );
    
    if (activeSession) {
      console.log("Using existing active session with target:", activeSession.id);
      return activeSession;
    }
    
    // Create new session with current target
    console.log("Creating new session between player and", this.currentChatTarget.tag || this.currentChatTarget.id);
    const newSession = sessionSystem.createSession(
      this.playerEntity,
      this.currentChatTarget,
    );
    
    if (newSession) {
      console.log("✅ Session created with target:", newSession.id);
      return newSession;
    }
    
    console.error("Failed to create session with target");
    return null;
  }



















  showFontDropdown() {
    console.log("🔤 Showing font dropdown via legacy method");
    
    // Delegate to font manager
    if (this.fontManager) {
      this.fontManager.showDropdown();
    } else {
      // Legacy fallback
      const fontDropdown = document.getElementById("font-dropdown");
      if (fontDropdown) {
        fontDropdown.classList.add("show");
      }
    }
  }

  hideFontDropdown() {
    console.log("🔤 Hiding font dropdown via legacy method");
    
    // Delegate to font manager
    if (this.fontManager) {
      this.fontManager.hideDropdown();
    } else {
      // Legacy fallback
      const fontDropdown = document.getElementById("font-dropdown");
      if (fontDropdown) {
        fontDropdown.classList.remove("show");
      }
    }
  }

  switchView(viewName) {
    // Delegate to navigation component
    const success = this.navigation?.switchView(viewName);
    if (success) {
      this.currentView = viewName;
    }
    return success;
  }

  toggleSidebar() {
    // Delegate to sidebar component
    return this.sidebar?.toggle();
  }

  collapseSidebar() {
    // Delegate to sidebar component
    return this.sidebar?.collapse();
  }

  expandSidebar() {
    // Delegate to sidebar component
    return this.sidebar?.expand();
  }


  async sendMessage() {
    // Delegate to ChatInterface component
    return this.chatInterface.sendMessage();
  }


  addMessage(type, content) {
    // Delegate to ChatInterface component
    return this.chatInterface.addMessage(type, content);
  }

  async handleImageUpload(files) {
    // Delegate to ChatInterface component
    for (const file of files) {
      if (file.type.startsWith("image/")) {
        try {
          await this.chatInterface.handleImageFile(file);
        } catch (error) {
          console.error("Failed to process image:", error);
          alert("Failed to process image: " + error.message);
        }
      }
    }
  }

  async handlePaste(event) {
    // Delegate to ChatInterface component - it handles paste events automatically
    // This method is kept for backward compatibility with any external event handlers
    const clipboardData = event.clipboardData || window.clipboardData;
    if (!clipboardData) return;

    const imageFiles = [];
    for (let i = 0; i < clipboardData.items.length; i++) {
      const item = clipboardData.items[i];
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }

    if (imageFiles.length > 0) {
      await this.handleImageUpload(imageFiles);
    }
  }

  // Debug method to access input system
  getInputSystem() {
    return this.world.getSystem("input");
  }

  // Debug method to manually refresh sessions
  debugRefreshSessions() {
    console.log("🔄 Manually refreshing sessions...");
    this.loadSessionsList();
  }

  // Cleanup
  destroy() {
    if (this.world) {
      this.world.stop();
      this.world.clear();
    }
    console.log("🧹 Portfolio cleanup completed");
  }
}

// Initialize everything when DOM is ready
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 DOM loaded, starting Industrial Portfolio...");

  // Create and initialize the app
  window.industrialPortfolio = new IndustrialPortfolio();
  await window.industrialPortfolio.init();

  // Mark as ready
  document.body.classList.add("app-ready");

  // Debug info
  console.log("🎉 Industrial Portfolio ready!");
  console.log("🎹 InputSystem loaded - Try these shortcuts:");
  console.log("  - Press '/' or Space to focus chat input");
  console.log("  - Press Escape to close dropdowns");
  console.log("  - Press 1/2/3 to switch themes");
  console.log("  - Use arrow keys for navigation");
  console.log(
    "  - Type 'window.industrialPortfolio.getInputSystem().debugKeyStates()' to see key states",
  );

  // Add test function for debugging animations
  window.testIndicatorAnimation = (state = "thinking") => {
    console.log(`Testing ${state} animation...`);

    const world = window.industrialPortfolio.world;
    if (!world) {
      console.error("World not found");
      return;
    }

    const entities = Array.from(world.entities.values());
    const originEntity = entities.find((e) => e.getComponent("BrainComponent"));

    if (originEntity) {
      const indicator = originEntity.getComponent(VoxelIndicatorComponent);
      if (indicator) {
        console.log("Found indicator, current state:", indicator.state);
        console.log("Setting state to:", state);
        indicator.setState(state);

        // Check animation after a moment
        setTimeout(() => {
          console.log("Animation info:", indicator.getInfo());
          console.log(
            "Animation manager active:",
            indicator.animationManager?.hasActiveAnimation(),
          );
          console.log(
            "Current animation:",
            indicator.animationManager.currentAnimation,
          );
        }, 100);
      } else {
        console.error("No voxel indicator component on origin entity");
      }
    } else {
      console.error("Origin entity not found");
    }
  };

  // Add function to manually sync entities with render system
  window.syncVoxelIndicators = () => {
    console.log("🧊 Manually syncing voxel indicators...");

    const world = window.industrialPortfolio.world;
    if (!world) {
      console.error("World not found");
      return;
    }

    const renderSystem = world.getSystem("voxelIndicatorRender");
    if (!renderSystem) {
      console.error("VoxelIndicatorRenderSystem not found");
      return;
    }

    const entities = Array.from(world.entities.values());
    console.log("🧊 Found entities:", entities.length);

    entities.forEach((entity) => {
      if (
        entity.hasComponent(VoxelIndicatorComponent) &&
        entity.hasComponent(TransformComponent)
      ) {
        console.log("🧊 Adding entity", entity.id, "to render system");
        renderSystem.addEntity(entity);
      }
    });

    console.log(
      "🧊 Render system now has",
      renderSystem.voxelIndicators.size,
      "indicators",
    );
  };

  // Add immediate visibility test
  window.testVoxelVisibility = () => {
    console.log("🧊 Testing immediate voxel visibility...");

    const world = window.industrialPortfolio.world;
    if (!world) {
      console.error("World not found");
      return;
    }

    const entities = Array.from(world.entities.values());
    const originEntity = entities.find((e) => e.getComponent("BrainComponent"));

    if (originEntity) {
      const indicator = originEntity.getComponent(VoxelIndicatorComponent);
      if (indicator) {
        // Force a cube to be visible immediately
        console.log("🧊 Setting center voxel visible immediately");
        indicator.setVoxel(4, 4, 0, 255, 0, 0, 1.0); // Bright red center
        const centerIndex = indicator.getVoxelIndex(4, 4, 0);
        const voxel = indicator.voxels[centerIndex];

        // Force it to be visible without animation
        voxel.visible = true;
        voxel.targetVisible = true;
        voxel.isAnimating = false;
        voxel.animationType = "pulse";
        voxel.appearProgress = 1.0;

        indicator.needsUpdate = true;

        console.log("🧊 Forced voxel state:", voxel);
        console.log("🧊 Indicator info:", indicator.getInfo());
      } else {
        console.error("No voxel indicator component on origin entity");
      }
    } else {
      console.error("Origin entity not found");
    }
  };

  // Debug functions for session management
  window.debugRefreshSessions = () => {
    console.log("🔄 Manually refreshing sessions...");
    window.industrialPortfolio.debugRefreshSessions();
  };

  // Debug function to test session activation
  window.debugTestSessionActivation = () => {
    console.log("🧪 Testing session activation...");
    const app = window.industrialPortfolio;
    if (app) {
      console.log("🧪 App instance:", app);
      console.log("🧪 Player entity:", app.playerEntity);
      console.log("🧪 Origin entity:", app.originEntity);
      console.log("🧪 Chat interface:", app.chatInterface);
      
      const result = app.activatePlayerOriginSession();
      console.log("🧪 Session activation result:", result);
      
      // Test the ChatInterface session check
      if (app.chatInterface) {
        const sessionCheck = app.chatInterface.ensureActiveSession();
        console.log("🧪 ChatInterface session check result:", sessionCheck);
      }
    }
  };

  window.debugSessions = async () => {
    console.log("🔍 Debugging sessions...");
    const persistenceSystem = window.industrialPortfolio.world.getSystem("persistence");
    if (persistenceSystem) {
      console.log("PersistenceSystem initialized:", persistenceSystem.initialized);
      if (persistenceSystem.initialized) {
        try {
          const sessions = await persistenceSystem.storage.getAllSessions();
          console.log("Raw sessions:", sessions);
          return sessions;
        } catch (error) {
          console.error("Error getting sessions:", error);
        }
      }
    } else {
      console.log("No persistence system found");
    }
  };
});

// Handle cleanup
window.addEventListener("beforeunload", () => {
  if (window.industrialPortfolio) {
    window.industrialPortfolio.destroy();
  }
});
