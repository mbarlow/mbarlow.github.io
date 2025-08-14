import { World } from "./core/index.js";
import {
  InitializationSystem,
} from "./systems/index.js";
import {
  Session,
  ChatLog,
  BrainComponent,
  VoxelIndicatorComponent,
  TransformComponent,
} from "./components/index.js";

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
      // Create and initialize the InitializationSystem
      const initSystem = new InitializationSystem();
      initSystem.init(this.world, this);
      
      // Use InitializationSystem to bootstrap the ECS
      await initSystem.initializeECS();
      
      this.initialized = true;
      console.log("✅ Industrial Portfolio initialized successfully");
    } catch (error) {
      console.error("❌ Error initializing portfolio:", error);
      throw error;
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
      let targetEntity = null;
      
      // First try to find by entity ID (in case entities still exist)
      const targetId = session.participants.find(id => id !== this.playerEntity?.id);
      if (targetId) {
        targetEntity = this.world.getEntity(targetId);
      }
      
      // If not found by ID, try to match by session title/tag
      if (!targetEntity && session.title) {
        // Session titles are usually formatted as "Entity1 ⟷ Entity2" or contain entity names
        const titleLower = session.title.toLowerCase();
        
        // Try to find common entities
        if (titleLower.includes('origin')) {
          const originEntities = this.world.getEntitiesByTag('origin-marker');
          if (originEntities && originEntities.length > 0) {
            targetEntity = originEntities[0];
          }
        } else if (titleLower.includes('bot') || titleLower.includes('patrol')) {
          const botEntities = this.world.getEntitiesByTag('bot');
          if (botEntities && botEntities.length > 0) {
            targetEntity = botEntities[0];
          }
        } else {
          // Try to extract entity name from title
          const titleParts = session.title.split(/[⟷↔\-–—]/);
          for (const part of titleParts) {
            const entityName = part.trim();
            if (entityName && entityName.toLowerCase() !== 'player' && entityName.toLowerCase() !== 'user') {
              // Try to find entity by tag
              const entities = this.world.getEntitiesByTag(entityName.toLowerCase());
              if (entities && entities.length > 0) {
                targetEntity = entities[0];
                break;
              }
            }
          }
        }
      }
      
      if (!targetEntity) {
        this.addMessage("system", "Target entity not found - entities may have been recreated. Try starting a new chat with the entity.");
        return;
      }

      // Switch chat target
      this.currentChatTarget = targetEntity;
      
      // Clear current chat display
      this.clearChatDisplay();
      
      // Load and display chat history
      if (session.chatLogId) {
        const chatLog = await persistenceSystem.storage.loadChatLog(session.chatLogId);
        if (chatLog && chatLog.messages) {
          this.displayChatHistory(chatLog.messages, targetEntity);
        }
      }
      
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

  // Clear the chat display
  clearChatDisplay() {
    const chatMessages = document.getElementById("chat-messages");
    if (chatMessages) {
      // Keep only the welcome message if it exists, otherwise clear all
      const welcome = chatMessages.querySelector(".chat-welcome");
      chatMessages.innerHTML = '';
      if (welcome) {
        chatMessages.appendChild(welcome);
      }
    }
  }

  // Display chat history from loaded session
  displayChatHistory(messages, targetEntity) {
    if (!messages || messages.length === 0) return;
    
    const chatInterface = this.world?.getSystem("chatInterface");
    if (!chatInterface) return;
    
    // Sort messages by timestamp
    const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);
    
    // Display each message
    for (const msg of sortedMessages) {
      // Determine message type based on sender
      let messageType = 'user';
      if (msg.senderId === targetEntity.id) {
        messageType = 'assistant';
      } else if (msg.type === 'system') {
        messageType = 'system';
      }
      
      // Add the message to the display
      chatInterface.addMessage(messageType, msg.content);
    }
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
      const commandSystem = this.world.getSystem("command");
      if (commandSystem) {
        await commandSystem.handleSearchCommand(query);
      }
    } else if (cmd === "/history") {
      const commandSystem = this.world.getSystem("command");
      if (commandSystem) {
        await commandSystem.handleHistoryCommand();
      }
    } else if (cmd === "/save") {
      const commandSystem = this.world.getSystem("command");
      if (commandSystem) {
        await commandSystem.handleSaveCommand();
      }
    } else if (cmd === "/export") {
      const commandSystem = this.world.getSystem("command");
      if (commandSystem) {
        await commandSystem.handleExportCommand();
      }
    } else if (cmd === "/who") {
      const commandSystem = this.world.getSystem("command");
      if (commandSystem) {
        await commandSystem.handleWhoCommand();
      }
    } else if (cmd === "/model") {
      const commandSystem = this.world.getSystem("command");
      if (commandSystem) {
        await commandSystem.handleModelCommand();
      }
    } else if (cmd === "/context") {
      const commandSystem = this.world.getSystem("command");
      if (commandSystem) {
        await commandSystem.handleContextCommand();
      }
    } else if (cmd.startsWith("/delete")) {
      const commandSystem = this.world.getSystem("command");
      if (commandSystem) {
        await commandSystem.handleDeleteCommand(command);
      }
    } else if (cmd === "/titles" || cmd === "/generate-titles") {
      const commandSystem = this.world.getSystem("command");
      if (commandSystem) {
        await commandSystem.handleGenerateTitlesCommand();
      }
    } else if (cmd.startsWith("/connect")) {
      const commandSystem = this.world.getSystem("command");
      if (commandSystem) {
        await commandSystem.handleConnectCommand(command);
      }
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

  // Autonomous Chat System Controls
  window.autonomousChat = {
    enable: () => {
      const system = window.industrialPortfolio.world.getSystem("autonomousChat");
      if (system) system.enable();
    },
    disable: () => {
      const system = window.industrialPortfolio.world.getSystem("autonomousChat");
      if (system) system.disable();
    },
    trigger: () => {
      const system = window.industrialPortfolio.world.getSystem("autonomousChat");
      if (system) system.triggerConversation();
    },
    status: () => {
      const system = window.industrialPortfolio.world.getSystem("autonomousChat");
      if (system) return system.getStatus();
    },
    setRate: (interval) => {
      const system = window.industrialPortfolio.world.getSystem("autonomousChat");
      if (system) system.setConversationRate(interval);
    }
  };
});

// Handle cleanup
window.addEventListener("beforeunload", () => {
  if (window.industrialPortfolio) {
    window.industrialPortfolio.destroy();
  }
});
