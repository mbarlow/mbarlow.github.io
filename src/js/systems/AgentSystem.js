import { System } from '../core/System.js';

/**
 * AgentSystem - Handles communication with local Ollama instance
 */
export class AgentSystem extends System {
  constructor() {
    super();
    this.requiredComponents = [];
    
    // Ollama configuration
    this.ollamaUrl = 'http://localhost:11434';
    this.currentModel = 'gemma2';
    this.availableModels = [];
    
    // Connection state
    this.isConnected = false;
    this.lastHealthCheck = 0;
    this.healthCheckInterval = 5000; // Check every 5 seconds
    
    // Chat state
    this.messages = [];
    this.isProcessing = false;
    
    // Multimodal support
    this.supportsImages = false;
    this.imageQueue = [];
  }
  
  async init() {
    console.log('🤖 Initializing AgentSystem...');
    
    // Initial health check
    await this.checkHealth();
    
    // Get available models
    if (this.isConnected) {
      await this.fetchModels();
    }
    
    // Setup message handler
    this.setupMessageHandler();
    
    console.log('✅ AgentSystem initialized');
  }
  
  async checkHealth() {
    try {
      const response = await fetch(`${this.ollamaUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        this.isConnected = true;
        this.updateConnectionStatus(true);
        console.log('✅ Ollama is connected');
        return true;
      }
    } catch (error) {
      console.log('❌ Ollama connection failed:', error.message);
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
        console.log('📋 Available models:', this.availableModels.map(m => m.name));
        
        // Check if current model exists, otherwise use first available
        const modelExists = this.availableModels.some(m => m.name === this.currentModel);
        if (!modelExists && this.availableModels.length > 0) {
          this.currentModel = this.availableModels[0].name;
        }
        
        // Check if current model supports images
        this.checkModelCapabilities();
        
        // Update UI with model list
        this.updateModelList();
      }
    } catch (error) {
      console.error('❌ Failed to fetch models:', error);
    }
  }
  
  checkModelCapabilities() {
    // Check if current model supports multimodal input
    const multimodalModels = ['gemma2', 'llava', 'bakllava'];
    this.supportsImages = multimodalModels.some(model => 
      this.currentModel.toLowerCase().includes(model)
    );
    
    console.log(`🖼️ Model ${this.currentModel} supports images: ${this.supportsImages}`);
  }
  
  setupMessageHandler() {
    // Listen for send button click (already setup in app.js)
    // We'll hook into the sendMessage method
  }
  
  async sendMessage(content, images = []) {
    if (!this.isConnected || this.isProcessing) {
      console.warn('Cannot send message: not connected or already processing');
      return;
    }
    
    this.isProcessing = true;
    
    // Add user message to history
    const userMessage = {
      role: 'user',
      content: content,
      images: images,
      timestamp: Date.now()
    };
    this.messages.push(userMessage);
    this.addMessageToUI('user', content, images);
    
    try {
      // Prepare request body
      const requestBody = {
        model: this.currentModel,
        messages: this.formatMessagesForOllama(),
        stream: true
      };
      
      // Add images if supported and provided
      if (this.supportsImages && images.length > 0) {
        requestBody.images = images;
      }
      
      // Send to Ollama
      const response = await fetch(`${this.ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.statusText}`);
      }
      
      // Handle streaming response
      await this.handleStreamingResponse(response);
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      this.addMessageToUI('assistant', 'Error: Failed to communicate with Ollama. Please check if it\'s running.');
    } finally {
      this.isProcessing = false;
    }
  }
  
  formatMessagesForOllama() {
    // Format messages for Ollama API
    return this.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      images: msg.images || []
    }));
  }
  
  async handleStreamingResponse(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let assistantMessage = '';
    let messageElement = null;
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            
            if (data.message && data.message.content) {
              assistantMessage += data.message.content;
              
              // Create or update message in UI
              if (!messageElement) {
                messageElement = this.addMessageToUI('assistant', assistantMessage, [], true);
              } else {
                this.updateStreamingMessage(messageElement, assistantMessage);
              }
            }
            
            if (data.done) {
              // Save complete message to history
              this.messages.push({
                role: 'assistant',
                content: assistantMessage,
                timestamp: Date.now()
              });
            }
          } catch (e) {
            console.warn('Failed to parse streaming chunk:', e);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
  
  addMessageToUI(role, content, images = [], streaming = false) {
    const chatMessages = document.getElementById('chat-messages');
    const welcome = chatMessages.querySelector('.chat-welcome');
    
    // Remove welcome message if it exists
    if (welcome) {
      welcome.remove();
    }
    
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    if (streaming) messageDiv.classList.add('streaming');
    
    // Add images if any
    if (images.length > 0) {
      const imageContainer = document.createElement('div');
      imageContainer.className = 'message-images';
      images.forEach(imgData => {
        const img = document.createElement('img');
        img.src = `data:image/jpeg;base64,${imgData}`;
        img.className = 'message-image';
        imageContainer.appendChild(img);
      });
      messageDiv.appendChild(imageContainer);
    }
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = content;
    
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageDiv;
  }
  
  updateStreamingMessage(messageElement, content) {
    const contentElement = messageElement.querySelector('.message-content');
    if (contentElement) {
      contentElement.textContent = content;
    }
    
    // Scroll to bottom
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  updateConnectionStatus(connected) {
    // Update UI to show connection status
    const statusElement = document.getElementById('ollama-status');
    if (statusElement) {
      statusElement.textContent = connected ? 'Online' : 'Offline';
      statusElement.className = `ollama-status ${connected ? 'connected' : 'disconnected'}`;
    }
  }
  
  updateModelList() {
    const modelSelect = document.getElementById('model-select');
    if (!modelSelect) return;
    
    // Clear existing options
    modelSelect.innerHTML = '';
    
    // Add models
    this.availableModels.forEach(model => {
      const option = document.createElement('option');
      option.value = model.name;
      option.textContent = model.name;
      if (model.name === this.currentModel) {
        option.selected = true;
      }
      modelSelect.appendChild(option);
    });
  }
  
  async switchModel(modelName) {
    if (this.availableModels.some(m => m.name === modelName)) {
      this.currentModel = modelName;
      this.checkModelCapabilities();
      console.log(`🔄 Switched to model: ${modelName}`);
      
      // Update image upload UI visibility
      this.updateImageUploadUI();
    }
  }
  
  updateImageUploadUI() {
    const imageUpload = document.getElementById('image-upload-container');
    if (imageUpload) {
      imageUpload.style.display = this.supportsImages ? 'block' : 'none';
    }
  }
  
  async processImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        // Convert to base64
        const base64 = e.target.result.split(',')[1];
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