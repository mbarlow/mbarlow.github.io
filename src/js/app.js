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
  DOMInterfaceSystem,
  ChatInterfaceSystem,
  SessionManagementSystem,
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

// Main Application Controller
class IndustrialPortfolio {
  constructor() {
    // Theme, font, navigation, and sidebar now managed by DOMInterfaceSystem
    this.initialized = false;
    this.world = new World();
    this.currentChatTarget = null; // Will be set to origin entity by default
  }

  async init() {
    if (this.initialized) return;
    console.log("🏭 Initializing...");

    try {
      // Theme, Font, Navigation, and Sidebar now handled by DOMInterfaceSystem
      // Chat interface now handled by ChatInterfaceSystem
      // Session management now handled by SessionManagementSystem
      await this.initECS();
      this.initialized = true;
      console.log("✅ Industrial Portfolio initialized successfully");
    } catch (error) {
      console.error("❌ Error initializing portfolio:", error);
    }
  }

  // Helper methods to delegate to ChatInterfaceSystem
  addMessage(type, content) {
    const chatInterface = this.world?.getSystem("chatInterface");
    if (chatInterface) {
      chatInterface.addMessage(type, content);
    }
  }

  autoResizeTextarea(textarea) {
    const chatInterface = this.world?.getSystem("chatInterface");
    if (chatInterface) {
      chatInterface.autoResizeTextarea(textarea);
    }
  }

  updateSendButton(input, button) {
    const chatInterface = this.world?.getSystem("chatInterface");
    if (chatInterface) {
      chatInterface.updateSendButton(input, button);
    }
  }

  // Helper method to delegate to SessionManagementSystem
  loadSessionsList() {
    const sessionManagement = this.world?.getSystem("sessionManagement");
    if (sessionManagement) {
      sessionManagement.loadSessionsList();
    }
  }

  // Session switching method - finds target entity and sets currentChatTarget
  async switchToSession(sessionId) {
    console.log("🔄 Switching to session:", sessionId);
    
    try {
      const persistenceSystem = this.world?.getSystem("persistence");
      if (!persistenceSystem?.initialized) {
        this.addMessage("system", "Persistence system not ready");
        return;
      }

      // Get session data to find participants
      const session = await persistenceSystem.storage.loadSession(sessionId);
      if (!session) {
        this.addMessage("system", "Session not found");
        return;
      }

      // Find the target entity (not the player)
      const targetId = session.participants.find(id => id !== this.playerEntity?.id);
      if (!targetId) {
        this.addMessage("system", "No valid chat target in session");
        return;
      }

      const targetEntity = this.world.getEntity(targetId);
      if (!targetEntity) {
        this.addMessage("system", "Target entity not found");
        return;
      }

      // Switch chat target
      this.currentChatTarget = targetEntity;
      
      // Get entity info for confirmation message
      const brain = targetEntity.getComponent("BrainComponent");
      const entityName = targetEntity.tag || "Entity";
      const personality = brain?.personality ? ` (${brain.personality})` : "";
      
      this.addMessage("system", `📱 Switched to session with ${entityName}${personality}`);

    } catch (error) {
      console.error("Error switching to session:", error);
      this.addMessage("system", "Failed to switch to session");
    }
  }

  async initECS() {
    console.log("🎮 Initializing ECS...");

    // Add DOM Interface system for UI management
    const domInterface = new DOMInterfaceSystem();
    this.world.addSystem(domInterface, "domInterface");
    domInterface.init();

    // Add Chat Interface system for chat UI management
    const chatInterface = new ChatInterfaceSystem();
    this.world.addSystem(chatInterface, "chatInterface");
    chatInterface.init(this.world, this);

    // Add Session Management system for session list UI
    const sessionManagement = new SessionManagementSystem();
    this.world.addSystem(sessionManagement, "sessionManagement");
    sessionManagement.init(this.world, this);

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

  // Chat interface now handled by ChatInterfaceSystem
  // Session management now handled by SessionManagementSystem

  // Old session management methods removed - now handled by SessionManagementSystem




















  activatePlayerOriginSession() {
    const sessionSystem = this.world.getSystem("session");
    if (!sessionSystem || !this.playerEntity || !this.originEntity) {
      console.error(
        "Cannot activate session: missing required entities or systems",
      );
      return null;
    }

    // Check if there's already an active session
    const existingSessions = sessionSystem.getSessionHistory(this.playerEntity);
    const activeSession = existingSessions.find(
      (s) => s && s.state === "active",
    );

    if (activeSession) {
      console.log("Using existing active session:", activeSession.id);
      return activeSession;
    }

    // Create new session
    console.log("Creating new session between player and origin");
    const newSession = sessionSystem.createSession(
      this.playerEntity,
      this.originEntity,
    );

    if (newSession) {
      console.log("✅ Session created:", newSession.id);
      return newSession;
    }

    console.error("Failed to create session");
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

  async handleSearchCommand(query) {
    const persistenceSystem = this.world.getSystem("persistence");
    if (!persistenceSystem) {
      this.addMessage("assistant", "Search system not available.");
      return;
    }

    try {
      const results = await persistenceSystem.searchSessions(query);

      if (results.length === 0) {
        this.addMessage("assistant", `No sessions found matching "${query}"`);
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

      this.addMessage("assistant", response);
    } catch (error) {
      this.addMessage("assistant", "Search failed. Please try again.");
      console.error("Search error:", error);
    }
  }

  async handleHistoryCommand() {
    const persistenceSystem = this.world.getSystem("persistence");
    if (!persistenceSystem) {
      this.addMessage("assistant", "History system not available.");
      return;
    }

    try {
      const sessions = await persistenceSystem.storage.getAllSessions();
      
      if (sessions.length === 0) {
        this.addMessage("assistant", "No session history found.");
        return;
      }

      // Sort by last activity and take top 10
      const recentSessions = sessions
        .sort((a, b) => b.lastActivityAt - a.lastActivityAt)
        .slice(0, 10);

      let response = "Recent session history:\n\n";
      
      for (let i = 0; i < recentSessions.length; i++) {
        const session = recentSessions[i];
        const index = i + 1;
        
        // Get participant names
        const participantNames = await this.getParticipantNames(session.participants);
        
        // Get chat log to check for images
        const chatLog = await persistenceSystem.storage.loadChatLog(session.chatLogId);
        const imageCount = this.countImagesInChatLog(chatLog);
        
        response += `${index}. **${session.title || 'Untitled Session'}** (${new Date(session.lastActivityAt).toLocaleString()})\n`;
        response += `   📝 ${session.messageCount} messages | 👥 ${participantNames.join(', ')}\n`;
        
        if (imageCount > 0) {
          response += `   🖼️ ${imageCount} image${imageCount > 1 ? 's' : ''}\n`;
        }
        
        if (session.keywords?.length > 0) {
          response += `   🏷️ ${session.keywords.join(', ')}\n`;
        }
        
        response += "\n";
      }

      this.addMessage("assistant", response);
    } catch (error) {
      this.addMessage("assistant", "Failed to load history. Please try again.");
      console.error("History error:", error);
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

  countImagesInChatLog(chatLog) {
    if (!chatLog || !chatLog.messages) return 0;
    
    return chatLog.messages.filter(message => 
      message.images && message.images.length > 0
    ).length;
  }

  async handleSaveCommand() {
    const persistenceSystem = this.world.getSystem("persistence");
    if (!persistenceSystem) {
      this.addMessage("assistant", "Save system not available.");
      return;
    }

    try {
      await persistenceSystem.forceSave();
      this.addMessage("assistant", "✅ Current session saved successfully!");
    } catch (error) {
      this.addMessage(
        "assistant",
        "❌ Failed to save session. Please try again.",
      );
      console.error("Save error:", error);
    }
  }

  async handleExportCommand() {
    const persistenceSystem = this.world.getSystem("persistence");
    if (!persistenceSystem) {
      this.addMessage("assistant", "Export system not available.");
      return;
    }

    try {
      const data = await persistenceSystem.exportData();
      if (!data) {
        this.addMessage("assistant", "No data to export.");
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

      this.addMessage(
        "assistant",
        `✅ Exported ${data.sessions.length} sessions and ${data.chatLogs.length} chat logs!`,
      );
    } catch (error) {
      this.addMessage("assistant", "❌ Export failed. Please try again.");
      console.error("Export error:", error);
    }
  }

  async handleWhoCommand() {
    if (!this.originEntity) {
      this.addMessage("assistant", "Origin entity not available.");
      return;
    }

    const brain = this.originEntity.getComponent(BrainComponent);
    if (!brain) {
      this.addMessage("assistant", "Brain component not found.");
      return;
    }

    let response = `🤖 **Origin Marker Entity Information**\n\n`;
    response += `**Identity:**\n`;
    response += `- Entity ID: ${this.originEntity.id}\n`;
    response += `- Tag: ${this.originEntity.tag}\n`;
    response += `- Primary Function: ${brain.primaryFunction}\n`;
    response += `- LLM Model: ${brain.model}\n`;
    response += `- Response Style: ${brain.responseStyle}\n\n`;

    response += `**Personality Traits:**\n`;
    Object.entries(brain.personality).forEach(([trait, value]) => {
      const percentage = (value * 100).toFixed(0);
      response += `- ${trait}: ${percentage}%\n`;
    });

    response += `\n**Interests:** ${brain.interests.join(", ")}\n`;
    response += `**Expertise:** ${brain.expertise.join(", ")}\n`;
    response += `**Session History:** ${brain.sessionHistory.length} previous sessions\n`;
    response += `**Command Access:** ${brain.commandAccess.join(", ")}\n`;

    this.addMessage("assistant", response);
  }

  async handleModelCommand() {
    const agentSystem = this.world.getSystem("agent");
    if (!agentSystem) {
      this.addMessage("assistant", "Agent system not available.");
      return;
    }

    let response = `🧠 **LLM Model Information**\n\n`;
    response += `**Current Model:** ${agentSystem.currentModel}\n`;
    response += `**Connection Status:** ${agentSystem.isConnected ? "✅ Connected" : "❌ Disconnected"}\n`;
    response += `**Ollama URL:** ${agentSystem.ollamaUrl}\n`;
    response += `**Image Support:** ${agentSystem.supportsImages ? "✅ Yes" : "❌ No"}\n`;
    response += `**Available Models:** ${agentSystem.availableModels.length}\n\n`;

    if (agentSystem.availableModels.length > 0) {
      response += `**Model List:**\n`;
      agentSystem.availableModels.slice(0, 10).forEach((model) => {
        const indicator = model.name === agentSystem.currentModel ? "→" : "  ";
        response += `${indicator} ${model.name}\n`;
      });

      if (agentSystem.availableModels.length > 10) {
        response += `... and ${agentSystem.availableModels.length - 10} more models\n`;
      }
    }

    this.addMessage("assistant", response);
  }

  async handleContextCommand() {
    const sessionSystem = this.world.getSystem("session");
    if (!sessionSystem || !this.playerEntity || !this.originEntity) {
      this.addMessage("assistant", "Session context not available.");
      return;
    }

    // Get current session
    const activeSessions = sessionSystem.getSessionHistory(this.playerEntity);
    const activeSession = activeSessions.find((s) => s && s.state === "active");

    let response = `📋 **Current Conversation Context**\n\n`;

    if (activeSession) {
      response += `**Active Session:**\n`;
      response += `- Session ID: ${activeSession.id}\n`;
      response += `- Participants: ${activeSession.participants.size}\n`;
      response += `- State: ${activeSession.state}\n`;
      response += `- Message Count: ${activeSession.messageCount}\n`;
      response += `- Title: ${activeSession.title || "Not yet generated"}\n`;
      response += `- Keywords: ${activeSession.keywords?.join(", ") || "None"}\n`;
      response += `- Created: ${new Date(activeSession.createdAt).toLocaleString()}\n`;
      response += `- Last Activity: ${new Date(activeSession.lastActivityAt).toLocaleString()}\n\n`;
    } else {
      response += `**No Active Session**\n\n`;
    }

    // Connection info
    const connectionSystem = this.world.getSystem("connection");
    if (connectionSystem) {
      const connectionCount = connectionSystem.connectors.size;
      response += `**Connection Status:**\n`;
      response += `- Active Connections: ${connectionCount}\n`;
      response += `- Visual State: ${connectionCount > 0 ? "Connected" : "Disconnected"}\n\n`;
    }

    // Entity brain context
    const originBrain = this.originEntity.getComponent(BrainComponent);
    if (originBrain) {
      response += `**Origin Marker Context:**\n`;
      response += `- Current Emotion: ${originBrain.emotion}\n`;
      response += `- Energy Level: ${(originBrain.energy * 100).toFixed(0)}%\n`;
      response += `- Short-term Memories: ${originBrain.shortTermMemory.length}\n`;
      response += `- Context Window: ${originBrain.contextWindow} messages\n`;
    }

    this.addMessage("assistant", response);
  }

  async handleDeleteCommand(command) {
    const parts = command.trim().split(/\s+/);
    const subCommand = parts[1]?.toLowerCase();

    if (!subCommand || subCommand === "help") {
      this.addMessage(
        "assistant",
        `**Delete Command Usage:**\n\n` +
          `\`/delete help\` - Show this help\n` +
          `\`/delete current\` - Delete current active session\n` +
          `\`/delete <id>\` - Delete session by ID\n` +
          `\`/delete range <start> <end>\` - Delete sessions by index range (from /history list)\n` +
          `\`/delete all\` - Delete ALL sessions for this connection (⚠️ PERMANENT)\n` +
          `\`/delete old <days>\` - Delete sessions older than X days\n\n` +
          `**Examples:**\n` +
          `\`/delete current\` - Delete the current session\n` +
          `\`/delete range 1 5\` - Delete sessions 1-5 from history list\n` +
          `\`/delete old 30\` - Delete sessions older than 30 days`,
      );
      return;
    }

    const persistenceSystem = this.world.getSystem("persistence");
    const sessionSystem = this.world.getSystem("session");

    if (!persistenceSystem || !sessionSystem) {
      this.addMessage("assistant", "❌ Session management not available.");
      return;
    }

    try {
      let deletedCount = 0;
      let response = "";

      switch (subCommand) {
        case "current":
          deletedCount = await this.deleteCurrentSession(
            sessionSystem,
            persistenceSystem,
          );
          response =
            deletedCount > 0
              ? "✅ Current session deleted."
              : "❌ No active session to delete.";
          break;

        case "all":
          deletedCount = await this.deleteAllSessions(persistenceSystem);
          response = `✅ Deleted ${deletedCount} sessions.`;
          break;

        case "range":
          const startIdx = parseInt(parts[2]);
          const endIdx = parseInt(parts[3]);
          if (isNaN(startIdx) || isNaN(endIdx)) {
            response = "❌ Invalid range. Use: /delete range <start> <end>";
          } else {
            deletedCount = await this.deleteSessionRange(
              persistenceSystem,
              startIdx,
              endIdx,
            );
            response = `✅ Deleted ${deletedCount} sessions from range ${startIdx}-${endIdx}.`;
          }
          break;

        case "old":
          const days = parseInt(parts[2]);
          if (isNaN(days) || days < 1) {
            response = "❌ Invalid days. Use: /delete old <days>";
          } else {
            deletedCount = await this.deleteOldSessions(
              persistenceSystem,
              days,
            );
            response = `✅ Deleted ${deletedCount} sessions older than ${days} days.`;
          }
          break;

        default:
          // Check if it's numeric arguments (range without "range" keyword)
          const rangeStart = parseInt(parts[1]);
          const rangeEnd = parseInt(parts[2]);
          if (!isNaN(rangeStart) && !isNaN(rangeEnd)) {
            // Handle as range command
            deletedCount = await this.deleteSessionRange(
              persistenceSystem,
              rangeStart,
              rangeEnd,
            );
            response = `✅ Deleted ${deletedCount} sessions from range ${rangeStart}-${rangeEnd}.`;
          } else {
            // Try to delete by session ID
            const sessionId = parts[1];
            deletedCount = await this.deleteSessionById(
              persistenceSystem,
              sessionId,
            );
            response =
              deletedCount > 0
                ? `✅ Deleted session ${sessionId}.`
                : `❌ Session ${sessionId} not found.`;
          }
          break;
      }

      this.addMessage("assistant", response);

      // Auto-save after deletion
      if (deletedCount > 0) {
        await persistenceSystem.forceSave();
      }
    } catch (error) {
      console.error("Delete command error:", error);
      this.addMessage("assistant", `❌ Delete failed: ${error.message}`);
    }
  }

  async deleteCurrentSession(sessionSystem, persistenceSystem) {
    const activeSession = sessionSystem.getActiveSession(
      this.playerEntity,
      this.originEntity,
    );
    if (!activeSession) return 0;

    // Delete session and associated data
    await persistenceSystem.storage.deleteSession(activeSession.id);
    if (activeSession.chatLogId) {
      await persistenceSystem.storage.deleteChatLog(activeSession.chatLogId);
    }

    // Clear active session
    sessionSystem.endSession(this.playerEntity, this.originEntity);

    return 1;
  }

  async deleteAllSessions(persistenceSystem) {
    const sessions = await persistenceSystem.storage.getAllSessions();
    const count = sessions.length;

    for (const session of sessions) {
      await persistenceSystem.storage.deleteSession(session.id);
      if (session.chatLogId) {
        await persistenceSystem.storage.deleteChatLog(session.chatLogId);
      }
    }

    return count;
  }

  async deleteSessionRange(persistenceSystem, startIdx, endIdx) {
    const sessions = await persistenceSystem.storage.getAllSessions();
    const sortedSessions = sessions.sort(
      (a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt),
    );

    let deletedCount = 0;
    for (
      let i = startIdx - 1;
      i < Math.min(endIdx, sortedSessions.length);
      i++
    ) {
      if (i >= 0 && sortedSessions[i]) {
        const session = sortedSessions[i];
        // Delete session and associated data
        await persistenceSystem.storage.deleteSession(session.id);
        if (session.chatLogId) {
          await persistenceSystem.storage.deleteChatLog(session.chatLogId);
        }
        deletedCount++;
      }
    }

    return deletedCount;
  }

  async deleteSessionById(persistenceSystem, sessionId) {
    try {
      const session = await persistenceSystem.storage.loadSession(sessionId);
      if (session) {
        // Delete session and associated data
        await persistenceSystem.storage.deleteSession(sessionId);
        if (session.chatLogId) {
          await persistenceSystem.storage.deleteChatLog(session.chatLogId);
        }
        return 1;
      }
      return 0;
    } catch (error) {
      console.error("Error deleting session:", error);
      return 0;
    }
  }

  async deleteOldSessions(persistenceSystem, days) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const sessions = await persistenceSystem.storage.getAllSessions();

    let deletedCount = 0;
    for (const session of sessions) {
      if (new Date(session.lastActivityAt) < cutoffDate) {
        await persistenceSystem.storage.deleteSession(session.id);
        if (session.chatLogId) {
          await persistenceSystem.storage.deleteChatLog(session.chatLogId);
        }
        deletedCount++;
      }
    }

    return deletedCount;
  }

  async handleGenerateTitlesCommand() {
    const persistenceSystem = this.world.getSystem("persistence");
    const agentSystem = this.world.getSystem("agent");

    if (!persistenceSystem || !agentSystem) {
      this.addMessage("assistant", "❌ Required systems not available.");
      return;
    }

    if (!agentSystem.isConnected) {
      this.addMessage(
        "assistant",
        "❌ LLM not connected. Cannot generate titles.",
      );
      return;
    }

    try {
      this.addMessage(
        "assistant",
        "🤖 Generating titles for untitled sessions...",
      );

      const sessions = await persistenceSystem.storage.getAllSessions();
      let generatedCount = 0;
      let processedCount = 0;

      for (const session of sessions) {
        // Skip if already has title or not enough messages
        if (session.title || session.messageCount < 3) {
          continue;
        }

        processedCount++;

        try {
          // Get chat messages for this session by loading the chat log
          const chatLog = await persistenceSystem.storage.loadChatLog(
            session.chatLogId,
          );
          if (!chatLog || !chatLog.messages || chatLog.messages.length < 3)
            continue;

          // Create context from first few messages
          const context = chatLog.messages
            .slice(0, 6)
            .map((m) => `${m.sender}: ${m.content}`)
            .join("\n");

          // Generate title
          const prompt = `Summarize this conversation in one short sentence (max 8 words):\n${context}`;
          const title = await agentSystem.generateResponse(prompt, {
            temperature: 0.3,
          });

          // Generate keywords
          const keywordPrompt = `List 3-5 keywords from this conversation (comma separated):\n${context}`;
          const keywordsResponse = await agentSystem.generateResponse(
            keywordPrompt,
            {
              temperature: 0.3,
            },
          );
          const keywords = keywordsResponse
            .split(",")
            .map((k) => k.trim())
            .filter((k) => k);

          // Update session
          session.title = title.trim();
          session.keywords = keywords;

          // Save the updated session
          await persistenceSystem.storage.saveSession(session);

          generatedCount++;

          console.log(`✅ Generated title for ${session.id}: ${title.trim()}`);

          // Add small delay to avoid overwhelming the LLM
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          console.warn(
            `Failed to generate title for session ${session.id}:`,
            error,
          );
        }
      }

      this.addMessage(
        "assistant",
        `✅ Title generation complete!\n` +
          `- Processed: ${processedCount} sessions\n` +
          `- Generated: ${generatedCount} new titles\n` +
          `- Skipped: ${processedCount - generatedCount} sessions (errors or already titled)\n\n` +
          `Use \`/history\` to see the updated titles.`,
      );
    } catch (error) {
      console.error("Title generation error:", error);
      this.addMessage(
        "assistant",
        `❌ Title generation failed: ${error.message}`,
      );
    }
  }

  async handleConnectCommand(command) {
    const parts = command.trim().split(/\s+/);
    const subCommand = parts[1]?.toLowerCase();

    if (!subCommand || subCommand === "help") {
      this.addMessage(
        "assistant",
        `**Connect Command Usage:**\n\n` +
        `\`/connect help\` - Show this help\n` +
        `\`/connect list\` - List available entities\n` +
        `\`/connect origin\` - Connect to origin marker (default)\n` +
        `\`/connect patrol\` - Connect to patrol bot\n` +
        `\`/connect <entity>\` - Connect to specific entity by tag\n\n` +
        `**Examples:**\n` +
        `\`/connect patrol\` - Start chatting with patrol bot\n` +
        `\`/connect origin\` - Return to origin marker chat`
      );
      return;
    }

    const sessionSystem = this.world.getSystem("session");
    if (!sessionSystem || !this.playerEntity) {
      this.addMessage("assistant", "❌ Session system not available.");
      return;
    }

    try {
      let targetEntity = null;
      let entityName = "";

      switch (subCommand) {
        case "list":
          await this.listAvailableEntities();
          return;

        case "origin":
          targetEntity = this.originEntity;
          entityName = "Origin Marker";
          break;

        case "patrol":
        case "bot":
          // Find patrol bot entity
          const entities = Array.from(this.world.entities.values());
          targetEntity = entities.find(e => e.tag === "bot" && e.getComponent("BrainComponent"));
          entityName = "Patrol Bot";
          break;

        default:
          // Try to find entity by tag
          const allEntities = Array.from(this.world.entities.values());
          targetEntity = allEntities.find(e => e.tag === subCommand && e.getComponent("BrainComponent"));
          entityName = subCommand;
          break;
      }

      if (!targetEntity) {
        this.addMessage("assistant", `❌ Entity "${subCommand}" not found or doesn't support chat.`);
        return;
      }

      // Switch the active target for chat
      this.currentChatTarget = targetEntity;
      
      this.addMessage("assistant", `✅ Connected to ${entityName}! Your messages will now go to this entity.`);

    } catch (error) {
      console.error("Connect command error:", error);
      this.addMessage("assistant", `❌ Connection failed: ${error.message}`);
    }
  }

  async listAvailableEntities() {
    const entities = Array.from(this.world.entities.values());
    const chatEntities = entities.filter(e => e.getComponent("BrainComponent"));
    
    let response = "**Available Entities:**\n\n";
    
    chatEntities.forEach(entity => {
      const brain = entity.getComponent("BrainComponent");
      const tag = entity.tag || `Entity ${entity.id}`;
      const personality = brain.personality || "unknown";
      response += `• **${tag}** - ${personality} (ID: ${entity.id})\n`;
    });

    if (chatEntities.length === 0) {
      response += "No entities with chat capabilities found.";
    }

    this.addMessage("assistant", response);
  }





  // autoResizeTextarea and updateSendButton now handled by ChatInterfaceSystem

  // sendMessage now handled by ChatInterfaceSystem

  async handleSlashCommand(command) {
    const chatInput = document.getElementById("chat-input");

    // Clear input
    chatInput.value = "";
    this.autoResizeTextarea(chatInput);
    this.updateSendButton(chatInput, document.getElementById("chat-send"));

    // Add command to chat history
    this.addMessage("user", command);

    const cmd = command.toLowerCase();

    if (cmd === "/start") {
      this.addMessage(
        "assistant",
        "Starting FPS mode... Use WASD to move, mouse to look around, ~ to toggle chat, Esc to exit.",
      );

      // Enter FPS mode
      const fpsControllerSystem = this.world.getSystem("fpsController");
      if (fpsControllerSystem) {
        fpsControllerSystem.enterFPSMode();
      } else {
        this.addMessage("assistant", "Error: FPS system not available.");
      }
    } else if (cmd.startsWith("/search ")) {
      const query = command.substring(8);
      await this.handleSearchCommand(query);
    } else if (cmd === "/history") {
      await this.handleHistoryCommand();
    } else if (cmd === "/save") {
      await this.handleSaveCommand();
    } else if (cmd === "/export") {
      await this.handleExportCommand();
    } else if (cmd === "/who") {
      await this.handleWhoCommand();
    } else if (cmd === "/model") {
      await this.handleModelCommand();
    } else if (cmd === "/context") {
      await this.handleContextCommand();
    } else if (cmd.startsWith("/delete")) {
      await this.handleDeleteCommand(command);
    } else if (cmd === "/titles" || cmd === "/generate-titles") {
      await this.handleGenerateTitlesCommand();
    } else if (cmd.startsWith("/connect")) {
      await this.handleConnectCommand(command);
    } else {
      this.addMessage(
        "assistant",
        `Unknown command: ${command}\n\nAvailable commands:\n/start - Enter FPS mode\n/search <query> - Search chat history\n/history - Show recent sessions\n/save - Force save current session\n/export - Export all session data\n/who - Show entity information\n/model - Display current LLM model\n/context - Show conversation context\n/delete - Delete sessions (see /delete help)\n/titles - Generate titles for untitled sessions\n/connect - Connect to entities (see /connect help)`,
      );
    }
  }

  // addMessage now handled by ChatInterfaceSystem via helper method above

  // handleImageUpload now handled by ChatInterfaceSystem

  // handlePaste now handled by ChatInterfaceSystem

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
