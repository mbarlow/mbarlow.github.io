import { System } from '../../core/System.js';
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
  CommandSystem,
} from "../index.js";
import {
  Connection,
  Session,
  ChatLog,
  BrainComponent,
  VoxelIndicatorComponent,
  TransformComponent,
} from "../../components/index.js";
import { SystemPromptBuilder } from "../../utils/index.js";

/**
 * InitializationSystem - Handles ECS bootstrap and system initialization
 * This system manages the complex process of initializing all other systems
 * in the correct order with proper dependencies
 */
export class InitializationSystem extends System {
    constructor() {
        super();
        this.requiredComponents = [];
        
        // System references - will be set during initialization
        this.world = null;
        this.industrialPortfolio = null;
    }

    init(world, industrialPortfolio) {
        console.log("🔧 Initializing InitializationSystem...");
        this.world = world;
        this.industrialPortfolio = industrialPortfolio;
        console.log("✅ InitializationSystem initialized");
    }

    async initializeECS() {
        console.log("🎮 Initializing ECS...");

        // Add DOM Interface system for UI management
        const domInterface = new DOMInterfaceSystem();
        this.world.addSystem(domInterface, "domInterface");
        domInterface.init();

        // Add Chat Interface system for chat UI management
        const chatInterface = new ChatInterfaceSystem();
        this.world.addSystem(chatInterface, "chatInterface");
        chatInterface.init(this.world, this.industrialPortfolio);

        // Add Session Management system for session list UI
        const sessionManagement = new SessionManagementSystem();
        this.world.addSystem(sessionManagement, "sessionManagement");
        sessionManagement.init(this.world, this.industrialPortfolio);

        // Add Command system for slash command handling
        const commandSystem = new CommandSystem();
        this.world.addSystem(commandSystem, "command");
        commandSystem.init(this.world, this.industrialPortfolio);

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

            // Add connection component to player
            const playerConnection = new Connection();
            player.addComponent(playerConnection);

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

            // Add connection component to origin marker
            const originConnection = new Connection();
            originMarker.addComponent(originConnection);

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

            // Store references for later use
            this.industrialPortfolio.playerEntity = player;
            this.industrialPortfolio.originEntity = originMarker;

            // Set default chat target to origin marker
            this.industrialPortfolio.currentChatTarget = originMarker;

            // Create initial session between player and origin marker
            const sessionSystem = this.world?.getSystem("session");
            if (sessionSystem) {
                const newSession = sessionSystem.createSession(player, originMarker);
                if (newSession) {
                    console.log("✅ Initial session created between player and origin marker");
                } else {
                    console.warn("⚠️ Failed to create initial session");
                }
            }

            console.log("✅ Player and origin entities configured with indicators");
        } else {
            console.warn("⚠️ Could not find player or origin marker entities");
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

    // System update method (required by ECS)
    update(deltaTime) {
        // Initialization System doesn't need regular updates
        // It only runs during bootstrap
    }
}