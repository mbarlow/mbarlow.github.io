import { System } from '../../core/System.js';

/**
 * ChatInterfaceSystem - Handles chat UI interactions and message display
 * This system manages the chat interface, message rendering, and user input
 */
export class ChatInterfaceSystem extends System {
    constructor() {
        super();
        this.requiredComponents = [];
        
        // System references - will be set by app.js
        this.world = null;
        this.industrialPortfolio = null;
    }

    init(world, industrialPortfolio) {
        console.log("💬 Initializing ChatInterface System...");
        this.world = world;
        this.industrialPortfolio = industrialPortfolio;
        
        this.initChatInterface();
        console.log("✅ ChatInterface System initialized");
    }

    initChatInterface() {
        console.log("💬 Initializing chat interface...");

        const chatInput = document.getElementById("chat-input");
        const chatSend = document.getElementById("chat-send");
        const modelSelect = document.getElementById("model-select");
        const imageUploadBtn = document.getElementById("image-upload-btn");
        const imageUpload = document.getElementById("image-upload");

        if (chatInput && chatSend) {
            // Auto-resize textarea
            chatInput.addEventListener("input", () => {
                this.autoResizeTextarea(chatInput);
                this.updateSendButton(chatInput, chatSend);
            });

            // Handle Enter key
            chatInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            // Send button click
            chatSend.addEventListener("click", () => {
                this.sendMessage();
            });

            // Initial button state
            this.updateSendButton(chatInput, chatSend);
        }

        // Model select handler
        if (modelSelect) {
            modelSelect.addEventListener("change", (e) => {
                const agentSystem = this.world?.getSystem("agent");
                if (agentSystem) {
                    agentSystem.switchModel(e.target.value);
                }
            });
        }

        // Image upload handlers
        if (imageUploadBtn && imageUpload) {
            imageUploadBtn.addEventListener("click", () => {
                imageUpload.click();
            });

            imageUpload.addEventListener("change", (e) => {
                if (e.target.files.length > 0) {
                    this.handleImageUpload(Array.from(e.target.files));
                }
            });
        }

        // Clipboard paste support
        if (chatInput) {
            chatInput.addEventListener("paste", async (e) => {
                await this.handlePaste(e);
            });
        }

        console.log("✅ Chat interface initialized");
    }

    addMessage(type, content) {
        const chatMessages = document.getElementById("chat-messages");
        const welcome = chatMessages.querySelector(".chat-welcome");

        // Remove welcome message if it exists
        if (welcome) {
            welcome.remove();
        }

        // Create message element
        const messageDiv = document.createElement("div");
        messageDiv.className = `message ${type}`;

        const messageContent = document.createElement("div");
        messageContent.className = "message-content";
        messageContent.textContent = content;

        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    autoResizeTextarea(textarea) {
        textarea.style.height = "auto";
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
    }

    updateSendButton(input, button) {
        const hasText = input.value.trim().length > 0;
        button.disabled = !hasText;
    }

    async sendMessage() {
        const chatInput = document.getElementById("chat-input");
        const message = chatInput.value.trim();

        if (!message) return;

        console.log("📤 Sending message:", message);

        // Handle commands (delegate back to IndustrialPortfolio)
        if (message.startsWith("/")) {
            if (this.industrialPortfolio) {
                return this.industrialPortfolio.handleSlashCommand(message);
            }
        }

        // Ensure session is active with current chat target (delegate to IndustrialPortfolio)
        let session;
        if (this.industrialPortfolio) {
            session = this.industrialPortfolio.activatePlayerTargetSession();
            if (!session) {
                this.addMessage("assistant", "Failed to establish connection with target entity.");
                return;
            }
        }

        // Get images if any
        const imagePreview = document.getElementById("image-preview");
        const images = [];
        if (imagePreview) {
            const imageItems = imagePreview.querySelectorAll(".image-preview-item");
            for (const item of imageItems) {
                const base64 = item.dataset.base64;
                if (base64) images.push(base64);
            }
        }

        // Clear input and images
        chatInput.value = "";
        this.autoResizeTextarea(chatInput);
        this.updateSendButton(chatInput, document.getElementById("chat-send"));
        this.clearImagePreview();

        // Send message through session system
        const sessionSystem = this.world?.getSystem("session");
        const agentSystem = this.world?.getSystem("agent");

        if (sessionSystem && this.industrialPortfolio?.playerEntity && this.industrialPortfolio?.currentChatTarget) {
            // Add user message to session with images
            sessionSystem.sendMessage(
                session.id,
                this.industrialPortfolio.playerEntity.id,
                message,
                "user",
                { images: images }
            );

            // Display user message
            this.addMessage("user", message);

            // Get AI response if agent system is ready
            if (agentSystem && agentSystem.isConnected) {
                try {
                    // Get response from AI using entity context
                    const response = await agentSystem.generateResponseWithContext(
                        message,
                        this.industrialPortfolio.currentChatTarget,
                        { images: images, userMessage: message }
                    );

                    // Add AI response to session
                    sessionSystem.sendMessage(
                        session.id,
                        this.industrialPortfolio.currentChatTarget.id,
                        response,
                        "llm"
                    );

                    // Display AI response
                    this.addMessage("assistant", response);
                    
                    // Refresh sessions list to show updated activity
                    if (this.industrialPortfolio.loadSessionsList) {
                        this.industrialPortfolio.loadSessionsList();
                    }
                } catch (error) {
                    console.error("Error getting AI response:", error);
                    // Fallback response
                    const fallbackResponse = "Agent system not initialized. Please check if Ollama is running.";
                    sessionSystem.sendMessage(
                        session.id,
                        this.industrialPortfolio.currentChatTarget.id,
                        fallbackResponse,
                        "system"
                    );
                    this.addMessage("assistant", fallbackResponse);
                }
            } else {
                // Fallback response when agent not connected
                const fallbackResponse = "Agent system not initialized. Please check if Ollama is running.";
                sessionSystem.sendMessage(
                    session.id,
                    this.industrialPortfolio.currentChatTarget.id,
                    fallbackResponse,
                    "system"
                );
                this.addMessage("assistant", fallbackResponse);
            }
        } else {
            // Fallback if session system not ready
            this.addMessage("user", message);
            this.addMessage("assistant", "Session system not initialized.");
        }
    }

    async handleImageUpload(files) {
        const imagePreview = document.getElementById("image-preview");
        const agentSystem = this.world?.getSystem("agent");

        if (!agentSystem) {
            alert("AgentSystem not ready. Please wait for Ollama to connect.");
            return;
        }

        if (!agentSystem.supportsImages) {
            alert(
                `Current model "${agentSystem.currentModel}" doesn't support images. Please select a multimodal model like gemma2 or gemma3.`
            );
            return;
        }

        // Show image upload container if hidden
        const imageContainer = document.getElementById("image-upload-container");
        if (imageContainer && files.length > 0) {
            imageContainer.style.display = "block";
        }

        // Process each file
        for (const file of files) {
            if (file.type.startsWith("image/")) {
                try {
                    const base64 = await this.fileToBase64(file);
                    this.addImageToPreview(file.name, base64);
                    console.log(`Image ${file.name} added to preview`);
                } catch (error) {
                    console.error(`Failed to process image ${file.name}:`, error);
                    alert(`Failed to process image: ${file.name}`);
                }
            }
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]); // Remove data:image/...;base64, prefix
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    addImageToPreview(filename, base64Data) {
        const imagePreview = document.getElementById("image-preview");
        
        const imageItem = document.createElement("div");
        imageItem.className = "image-preview-item";
        imageItem.dataset.base64 = base64Data;

        const img = document.createElement("img");
        img.src = `data:image/jpeg;base64,${base64Data}`;
        img.alt = filename;

        const removeBtn = document.createElement("button");
        removeBtn.className = "image-remove-btn";
        removeBtn.innerHTML = "×";
        removeBtn.title = "Remove image";
        removeBtn.addEventListener("click", () => {
            imageItem.remove();
            this.checkHideImageContainer();
        });

        const filename_div = document.createElement("div");
        filename_div.className = "image-filename";
        filename_div.textContent = filename;

        imageItem.appendChild(img);
        imageItem.appendChild(removeBtn);
        imageItem.appendChild(filename_div);
        imagePreview.appendChild(imageItem);
    }

    clearImagePreview() {
        const imagePreview = document.getElementById("image-preview");
        if (imagePreview) {
            imagePreview.innerHTML = "";
        }
        this.checkHideImageContainer();
    }

    checkHideImageContainer() {
        const imageContainer = document.getElementById("image-upload-container");
        const imagePreview = document.getElementById("image-preview");
        
        if (imageContainer && imagePreview && imagePreview.children.length === 0) {
            imageContainer.style.display = "none";
        }
    }

    async handlePaste(event) {
        const clipboardData = event.clipboardData || window.clipboardData;
        if (!clipboardData) {
            console.log("📋 No clipboard data available");
            return;
        }

        const items = clipboardData.items;
        const imageFiles = [];

        console.log("📋 Clipboard items:", items.length);
        for (let i = 0; i < items.length; i++) {
            console.log(`📋 Item ${i}: type=${items[i].type}, kind=${items[i].kind}`);
        }

        // Look for images in clipboard
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.startsWith("image/")) {
                event.preventDefault(); // Prevent default paste behavior for images
                const file = item.getAsFile();
                if (file) {
                    imageFiles.push(file);
                    console.log("📋 Found image file:", file.name, file.type, file.size);
                }
            }
        }

        // Process images if found
        if (imageFiles.length > 0) {
            console.log("📋 Pasted", imageFiles.length, "image(s)");
            await this.handleImageUpload(imageFiles);
        } else {
            console.log("📋 No images found in clipboard");
        }
    }

    // System update method (required by ECS)
    update(deltaTime) {
        // Chat Interface doesn't need regular updates
        // It responds to events instead
    }
}