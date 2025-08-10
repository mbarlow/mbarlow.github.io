import { System } from "../../core/System.js";
import { VoxelIndicatorComponent } from "../../components/VoxelIndicatorComponent.js";

/**
 * AgentSystem - Handles communication with local Ollama instance
 */
export class AgentSystem extends System {
  constructor() {
    super();
    this.requiredComponents = [];

    // Ollama configuration
    this.ollamaUrl = "http://localhost:11434";
    this.currentModel = "gemma3";
    this.availableModels = [];

    // Connection state
    this.isConnected = false;
    this.lastHealthCheck = 0;
    this.healthCheckInterval = 5000; // Check every 5 seconds

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
    const multimodalModels = ["gemma3", "llava", "bakllava"];
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
          // This would be implemented to include recent messages
          context.recentHistory = this.getRecentConversationContext(entity, brain.contextSettings.historyLimit);
        }
      }

      const response = await this.generateResponse(content, {
        model: brain.model !== 'human' ? brain.model : this.currentModel,
        entity: entity,
        context: context,
        images: context.images || []
      });

      // Update indicator to show success
      if (indicator) {
        indicator.setState('success');
        // Return to idle after a brief success display
        setTimeout(() => {
          if (indicator.state === 'success') {
            indicator.setState('idle');
          }
        }, 1500);
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
        }, 2000);
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
      }, 2000);
    } catch (error) {
      console.error("Failed to copy message:", error);
      button.textContent = "Failed";
      setTimeout(() => {
        button.textContent = "Copy";
      }, 2000);
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

  destroy() {
    // Cleanup
    this.messages = [];
    this.imageQueue = [];
  }
}
