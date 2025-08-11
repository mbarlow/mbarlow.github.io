import { System } from "../../core/System.js";
import { VoxelIndicatorComponent } from "../../components/VoxelIndicatorComponent.js";
import { CONFIG } from "../../config/index.js";

/**
 * AgentSystem - Handles communication with local Ollama instance
 */
export class AgentSystem extends System {
  constructor() {
    super();
    this.requiredComponents = [];

    // Ollama configuration from CONFIG
    this.ollamaUrl = CONFIG.ai.ollamaUrl;
    this.currentModel = CONFIG.ai.defaultModel;
    this.availableModels = [];

    // Connection state
    this.isConnected = false;
    this.lastHealthCheck = 0;
    this.healthCheckInterval = CONFIG.ai.healthCheckInterval;

    // Chat state
    this.messages = [];
    this.isProcessing = false;

    // Multimodal support
    this.supportsImages = true;
    this.imageQueue = [];

    // World reference (will be set when added to world)
    this.world = null;
  }

  async init() {
    console.log("🤖 Initializing AgentSystem...");

    // Initial health check
    await this.checkHealth();

    // Get available models
    if (this.isConnected) {
      await this.fetchModels();
    }

    // Setup message handler
    this.setupMessageHandler();

    // Update UI with current capabilities
    this.updateImageUploadUI();

    console.log("✅ AgentSystem initialized");
  }

  async checkHealth() {
    try {
      const response = await fetch(`${this.ollamaUrl}/api/tags`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        this.isConnected = true;
        this.updateConnectionStatus(true);
        console.log("✅ Ollama is connected");
        return true;
      }
    } catch (error) {
      console.log("❌ Ollama connection failed:", error.message);
    }

    this.isConnected = false;
    this.updateConnectionStatus(false);
    return false;
  }

  async fetchModels() {
    try {
      const response = await fetch(`${this.ollamaUrl}/api/tags`);
      if (response.ok) {
        const data = await response.json();
        this.availableModels = data.models || [];
        console.log(
          "📋 Available models:",
          this.availableModels.map((m) => m.name),
        );

        // Check if current model exists, otherwise use first available
        const modelExists = this.availableModels.some(
          (m) => m.name === this.currentModel,
        );
        if (!modelExists && this.availableModels.length > 0) {
          this.currentModel = this.availableModels[0].name;
        }

        // Check if current model supports images
        this.checkModelCapabilities();

        // Update UI with model list
        this.updateModelList();
      }
    } catch (error) {
      console.error("❌ Failed to fetch models:", error);
    }
  }

  checkModelCapabilities() {
    // Check if current model supports multimodal input
    const multimodalModels = CONFIG.ai.multimodalModels;
    this.supportsImages = multimodalModels.some((model) =>
      this.currentModel.toLowerCase().includes(model),
    );

    console.log(
      `🖼️ Model ${this.currentModel} supports images: ${this.supportsImages}`,
    );
  }

  setupMessageHandler() {
    // Listen for send button click (already setup in app.js)
    // We'll hook into the sendMessage method
  }

  async generateResponse(content, options = {}) {
    const { model = this.currentModel, images = [], entity = null, context = {} } = options;
    
    if (!this.isConnected) {
      console.warn("Cannot generate response: not connected to Ollama");
      return "I'm currently offline. Please ensure Ollama is running.";
    }

    try {
      const messages = [];
      
      // Add system prompt if entity has one
      if (entity) {
        const systemPrompt = this.buildSystemPrompt(entity, context);
        if (systemPrompt) {
          messages.push({
            role: "system",
            content: systemPrompt
          });
        }
      }
      
      // Add user message
      messages.push({
        role: "user",
        content: content,
        images: images.length > 0 ? images : undefined
      });

      const response = await fetch(`${this.ollamaUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          stream: false
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.message?.content || "No response generated.";
    } catch (error) {
      console.error("Failed to generate response:", error);
      return "Failed to generate response. Please check the console for details.";
    }
  }

  buildSystemPrompt(entity, context = {}) {
    const brain = entity.getComponent('BrainComponent');
    if (!brain || !brain.systemPrompt) return null;

    // Use the SystemPromptBuilder if available
    if (this.promptBuilder) {
      return this.promptBuilder.buildPrompt(entity, context);
    }

    // Fallback to basic system prompt
    return brain.systemPrompt;
  }

  setPromptBuilder(promptBuilder) {
    this.promptBuilder = promptBuilder;
  }

  async generateResponseWithContext(content, entity, context = {}) {
    const brain = entity.getComponent('BrainComponent');
    if (!brain) {
      return this.generateResponse(content);
    }

    // Update indicator to show thinking state
    const indicator = entity.getComponent(VoxelIndicatorComponent);
    if (indicator) {
      indicator.setState('thinking');
    }

    try {
      // Add conversation context if enabled
      if (brain.contextSettings.includeHistory) {
        const sessionSystem = this.world.getSystem('session');
        if (sessionSystem) {
          // Get recent conversation context
          context.recentHistory = this.getRecentConversationContext(entity, brain.contextSettings.historyLimit);
        }
      }

      // Add entity's experiences, relationships, and environmental awareness to context
      if (brain.experiences && brain.experiences.length > 0) {
        context.recentExperiences = brain.experiences.slice(-5).map(exp => 
          `${exp.type}: ${exp.description} (${exp.context ? JSON.stringify(exp.context) : 'no details'})`
        );
      }

      if (brain.relationships && brain.relationships.size > 0) {
        context.relationships = Array.from(brain.relationships.entries()).map(([entityId, rel]) => {
          const entity = this.world.entities.get(entityId);
          const entityName = entity?.tag || `Entity ${entityId}`;
          return `${entityName}: ${rel.interactions} interactions, ${rel.sentiment} sentiment, topics: [${rel.topics_discussed?.slice(-3).join(', ') || 'none'}]`;
        });
      }

      if (brain.environmentalAwareness) {
        context.environmentalAwareness = {
          playerPresent: brain.environmentalAwareness.playerPresent,
          nearbyEntities: brain.environmentalAwareness.nearbyEntities?.length || 0,
          activeConversations: brain.environmentalAwareness.systemLoad || 0
        };
      }

      // Add pending messages to context
      if (brain.pendingMessages && brain.pendingMessages.length > 0) {
        context.pendingMessages = brain.pendingMessages.map(msg => {
          const fromEntity = this.world.entities.get(msg.fromEntityId);
          const fromName = fromEntity?.tag || 'Unknown';
          return `From ${fromName}: "${msg.message}" (${new Date(msg.timestamp).toLocaleTimeString()})`;
        });
      }

      // Add @entity references to context for better understanding
      context.entityReferences = this.extractEntityReferences(content);

      const response = await this.generateResponse(content, {
        model: brain.model !== 'human' ? brain.model : this.currentModel,
        entity: entity,
        context: context,
        images: context.images || []
      });

      // Log the conversation experience for the entity
      if (brain && context.userMessage) {
        brain.logExperience('interaction', `Had conversation with player`, {
          topic: this.extractTopicFromMessage(content),
          player_message: context.userMessage,
          ai_response: response.substring(0, 100) + (response.length > 100 ? '...' : ''),
          timestamp: Date.now()
        });
        
        // Update relationship with player
        const playerEntity = this.world?.getEntitiesByTag('player')[0];
        if (playerEntity) {
          brain.updateRelationship(playerEntity.id, 'conversation', 'positive', this.extractTopicFromMessage(content));
        }
        
        // Check if player is asking to relay a message
        this.checkForMessageRelay(content, entity, brain, playerEntity);
      }

      // Update indicator to show success
      if (indicator) {
        indicator.setState('success');
        // Return to idle after a brief success display
        setTimeout(() => {
          if (indicator.state === 'success') {
            indicator.setState('idle');
          }
        }, CONFIG.ai.timeout.successDisplay);
      }

      return response;

    } catch (error) {
      // Update indicator to show error state
      if (indicator) {
        indicator.setState('error');
        // Return to idle after error display
        setTimeout(() => {
          if (indicator.state === 'error') {
            indicator.setState('idle');
          }
        }, CONFIG.ai.timeout.errorDisplay);
      }
      
      throw error;
    }
  }

  getRecentConversationContext(entity, limit = 5) {
    // This would get recent messages from the current session
    // For now, return empty array
    return [];
  }

  async sendMessage(content, images = []) {
    if (!this.isConnected || this.isProcessing) {
      console.warn("Cannot send message: not connected or already processing");
      return;
    }

    this.isProcessing = true;

    // Add user message to history
    const userMessage = {
      role: "user",
      content: content,
      images: images,
      timestamp: Date.now(),
    };
    this.messages.push(userMessage);
    this.addMessageToUI("user", content, images);

    try {
      // Prepare request body
      const requestBody = {
        model: this.currentModel,
        messages: this.formatMessagesForOllama(),
        stream: true,
      };

      // Add images if supported and provided
      if (this.supportsImages && images.length > 0) {
        requestBody.images = images;
      }

      // Send to Ollama
      const response = await fetch(`${this.ollamaUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.statusText}`);
      }

      // Handle streaming response
      await this.handleStreamingResponse(response);
    } catch (error) {
      console.error("❌ Error sending message:", error);
      this.addMessageToUI(
        "assistant",
        "Error: Failed to communicate with Ollama. Please check if it's running.",
      );
    } finally {
      this.isProcessing = false;
    }
  }

  formatMessagesForOllama() {
    // Format messages for Ollama API
    return this.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      images: msg.images || [],
    }));
  }

  async handleStreamingResponse(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let assistantMessage = "";
    let messageElement = null;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);

            if (data.message && data.message.content) {
              assistantMessage += data.message.content;

              // Create or update message in UI
              if (!messageElement) {
                messageElement = this.addMessageToUI(
                  "assistant",
                  assistantMessage,
                  [],
                  true,
                );
              } else {
                this.updateStreamingMessage(messageElement, assistantMessage);
              }
            }

            if (data.done) {
              // Save complete message to history
              this.messages.push({
                role: "assistant",
                content: assistantMessage,
                timestamp: Date.now(),
              });
            }
          } catch (e) {
            console.warn("Failed to parse streaming chunk:", e);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  addMessageToUI(role, content, images = [], streaming = false) {
    const chatMessages = document.getElementById("chat-messages");
    const welcome = chatMessages.querySelector(".chat-welcome");

    // Check if user was near bottom before adding message
    const wasNearBottom = this.isNearBottom(chatMessages);

    // Remove welcome message if it exists
    if (welcome) {
      welcome.remove();
    }

    // Create message element
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${role}`;
    if (streaming) messageDiv.classList.add("streaming");

    // Add images if any
    if (images.length > 0) {
      const imageContainer = document.createElement("div");
      imageContainer.className = "message-images";
      images.forEach((imgData) => {
        const img = document.createElement("img");
        img.src = `data:image/jpeg;base64,${imgData}`;
        img.className = "message-image";
        imageContainer.appendChild(img);
      });
      messageDiv.appendChild(imageContainer);
    }

    const messageContent = document.createElement("div");
    messageContent.className = "message-content";
    messageContent.textContent = content;

    // Add copy button for assistant messages
    if (role === "assistant") {
      const copyButton = document.createElement("button");
      copyButton.className = "copy-button";
      copyButton.textContent = "Copy";
      copyButton.addEventListener("click", () =>
        this.copyMessage(content, copyButton),
      );
      messageContent.appendChild(copyButton);
    }

    messageDiv.appendChild(messageContent);

    // Add timestamp
    const timestamp = document.createElement("div");
    timestamp.className = "message-timestamp";
    timestamp.textContent = this.formatTimestamp(new Date());
    messageDiv.appendChild(timestamp);

    chatMessages.appendChild(messageDiv);

    // Only auto-scroll if user was near bottom or if it's a new user message
    if (wasNearBottom || role === "user") {
      this.scrollToBottom(chatMessages);
    }

    return messageDiv;
  }

  updateStreamingMessage(messageElement, content) {
    const contentElement = messageElement.querySelector(".message-content");
    if (contentElement) {
      contentElement.textContent = content;

      // Add copy button if it doesn't exist (for streaming messages)
      if (!contentElement.querySelector(".copy-button")) {
        const copyButton = document.createElement("button");
        copyButton.className = "copy-button";
        copyButton.textContent = "Copy";
        copyButton.addEventListener("click", () =>
          this.copyMessage(content, copyButton),
        );
        contentElement.appendChild(copyButton);
      }
    }

    // Check if user is near bottom and scroll accordingly
    const chatMessages = document.getElementById("chat-messages");
    if (this.isNearBottom(chatMessages)) {
      this.scrollToBottom(chatMessages);
    }
  }

  isNearBottom(element, threshold = 100) {
    return (
      element.scrollHeight - element.scrollTop - element.clientHeight <
      threshold
    );
  }

  scrollToBottom(element) {
    element.scrollTop = element.scrollHeight;
  }

  formatTimestamp(date) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  async copyMessage(content, button) {
    try {
      await navigator.clipboard.writeText(content);
      const originalText = button.textContent;
      button.textContent = "Copied!";
      button.classList.add("copied");

      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove("copied");
      }, CONFIG.ai.timeout.copyFeedback);
    } catch (error) {
      console.error("Failed to copy message:", error);
      button.textContent = "Failed";
      setTimeout(() => {
        button.textContent = "Copy";
      }, CONFIG.ai.timeout.copyFeedback);
    }
  }

  updateConnectionStatus(connected) {
    // Update UI to show connection status
    const statusElement = document.getElementById("ollama-status");
    if (statusElement) {
      statusElement.textContent = connected ? "Online" : "Offline";
      statusElement.className = `ollama-status ${connected ? "connected" : "disconnected"}`;
    }
  }

  updateModelList() {
    const modelSelect = document.getElementById("model-select");
    if (!modelSelect) return;

    // Clear existing options
    modelSelect.innerHTML = "";

    // Add models
    this.availableModels.forEach((model) => {
      const option = document.createElement("option");
      option.value = model.name;
      option.textContent = model.name;
      if (model.name === this.currentModel) {
        option.selected = true;
      }
      modelSelect.appendChild(option);
    });
  }

  async switchModel(modelName) {
    if (this.availableModels.some((m) => m.name === modelName)) {
      this.currentModel = modelName;
      this.checkModelCapabilities();
      console.log(`🔄 Switched to model: ${modelName}`);

      // Update image upload UI visibility
      this.updateImageUploadUI();
    }
  }

  updateImageUploadUI() {
    const imageUploadBtn = document.getElementById("image-upload-btn");
    if (imageUploadBtn) {
      if (this.supportsImages) {
        imageUploadBtn.style.display = "flex";
        imageUploadBtn.disabled = false;
      } else {
        imageUploadBtn.style.display = "none";
        imageUploadBtn.disabled = true;
      }
    }
  }

  async processImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        // Convert to base64
        const base64 = e.target.result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  update(deltaTime) {
    // Periodic health check
    const now = Date.now();
    if (now - this.lastHealthCheck > this.healthCheckInterval) {
      this.lastHealthCheck = now;
      this.checkHealth();
    }
  }

  extractEntityReferences(content) {
    const entityRefs = [];
    const atMentions = content.match(/@(\w+)/g);
    
    if (atMentions) {
      atMentions.forEach(mention => {
        const entityName = mention.substring(1).toLowerCase();
        const entities = Array.from(this.world.entities.values());
        const referencedEntity = entities.find(e => 
          (e.tag && e.tag.toLowerCase().includes(entityName)) ||
          (e.id && String(e.id).toLowerCase().includes(entityName))
        );
        
        if (referencedEntity) {
          entityRefs.push({
            mention: mention,
            entity: referencedEntity,
            name: referencedEntity.tag || referencedEntity.id
          });
        }
      });
    }
    
    return entityRefs;
  }

  checkForMessageRelay(content, entity, brain, playerEntity) {
    const lowerContent = content.toLowerCase();
    
    // Look for message relay patterns (including @entity syntax)
    const relayPatterns = [
      /tell\s+@(\w+)\s+(.+)/i,
      /send\s+@(\w+)\s+(.+)/i,
      /give\s+@(\w+)\s+(.+)/i,
      /relay\s+to\s+@(\w+):\s*(.+)/i,
      /pass\s+this\s+to\s+@(\w+):\s*(.+)/i,
      // Legacy patterns without @ symbol
      /tell\s+(\w+)\s+(.+)/i,
      /say\s+to\s+(\w+)\s+(.+)/i,
      /give\s+(\w+)\s+this\s+message:\s*(.+)/i,
      /relay\s+to\s+(\w+):\s*(.+)/i,
      /pass\s+this\s+to\s+(\w+):\s*(.+)/i,
      // New @entity direct messaging patterns  
      /hey\s+@(\w+),\s+send\s+@(\w+)\s+(.+)/i,
      /@(\w+),?\s+send\s+@(\w+)\s+(.+)/i
    ];
    
    for (const pattern of relayPatterns) {
      const match = content.match(pattern);
      if (match) {
        let targetName, message;
        
        // Handle different pattern structures
        if (pattern.source.includes('send\\s+@(\\w+)')) {
          // Pattern: "hey @bot, send @origin my joke" or "@bot, send @origin my joke"
          targetName = match[2]?.toLowerCase(); // Second capture group is the target
          message = match[3]?.trim();           // Third capture group is the message
        } else {
          // Standard patterns: "tell @bot hello" or "give @origin this message"
          targetName = match[1]?.toLowerCase(); // First capture group is the target
          message = match[2]?.trim();           // Second capture group is the message
        }
        
        if (targetName && message) {
          // Find the target entity
          const entities = Array.from(this.world.entities.values());
          const targetEntity = entities.find(e => 
            (e.tag && e.tag.toLowerCase().includes(targetName)) ||
            (e.id && String(e.id).toLowerCase().includes(targetName))
          );
          
          if (targetEntity && targetEntity.id !== entity.id) {
            brain.addPendingMessage(targetEntity.id, message, playerEntity?.id);
            console.log(`📝 ${entity.tag || entity.id} will relay message to ${targetEntity.tag || targetEntity.id}: "${message}"`);
            return true;
          }
        }
      }
    }
    
    return false;
  }

  extractTopicFromMessage(message) {
    // Simple topic extraction - look for key phrases
    const topics = ['consciousness', 'data', 'patterns', 'systems', 'optimization', 'security', 'analysis', 'processing', 'intelligence', 'learning', 'conversation', 'greeting', 'question', 'help'];
    const lowerMessage = message.toLowerCase();
    
    for (const topic of topics) {
      if (lowerMessage.includes(topic)) {
        return topic;
      }
    }
    
    return 'general';
  }

  destroy() {
    // Cleanup
    this.messages = [];
    this.imageQueue = [];
  }
}
