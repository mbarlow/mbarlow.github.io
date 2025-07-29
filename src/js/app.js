import { World } from './core/index.js';
import { RenderSystem, InputSystem } from './systems/index.js';

// Main Application Controller
class IndustrialPortfolio {
  constructor() {
    this.currentTheme = "dark";
    this.currentView = "chat";
    this.sidebarCollapsed = false;
    this.currentFont = "Inter";
    this.initialized = false;
    this.world = new World();
  }

  async init() {
    if (this.initialized) return;

    console.log("🏭 Initializing Industrial Portfolio...");

    try {
      // Initialize theme system
      this.initThemeSystem();

      // Initialize font system
      this.initFontSystem();

      // Initialize navigation
      this.initNavigation();

      // Initialize sidebar
      this.initSidebar();

      // Initialize chat interface
      this.initChatInterface();

      // Initialize ECS
      this.initECS();

      this.initialized = true;
      console.log("✅ Industrial Portfolio initialized successfully");
    } catch (error) {
      console.error("❌ Error initializing portfolio:", error);
    }
  }

  initECS() {
    console.log("🎮 Initializing ECS...");

    // Add core systems
    this.world.addSystem(new RenderSystem(), 'render');
    this.world.addSystem(new InputSystem(), 'input');

    // Start the ECS world
    this.world.start();

    console.log("✅ ECS initialized");
  }

  initThemeSystem() {
    console.log("🎨 Initializing theme system...");

    // Set initial theme
    const savedTheme = localStorage.getItem("portfolio-theme") || "dark";
    this.setTheme(savedTheme);

    // Setup theme button listeners
    const themeButtons = document.querySelectorAll(".theme-btn");
    console.log(`Found ${themeButtons.length} theme buttons`);

    themeButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const theme = btn.dataset.theme;
        console.log(`🎨 Switching to ${theme} theme`);
        this.setTheme(theme);
      });
    });

    console.log(`✅ Theme system initialized (current: ${this.currentTheme})`);
  }

  initFontSystem() {
    console.log("🔤 Initializing font system...");

    // Set initial font
    const savedFont = localStorage.getItem("portfolio-font") || "Inter";
    this.setFont(savedFont);

    // Setup font dropdown
    const fontToggle = document.getElementById("font-toggle");
    const fontDropdown = document.getElementById("font-dropdown");
    const fontClose = document.getElementById("font-dropdown-close");
    const fontOptions = document.querySelectorAll(".font-option");

    if (fontToggle && fontDropdown) {
      fontToggle.addEventListener("click", () => {
        this.showFontDropdown();
      });

      fontClose.addEventListener("click", () => {
        this.hideFontDropdown();
      });

      // Close on backdrop click
      fontDropdown.addEventListener("click", (e) => {
        if (e.target === fontDropdown) {
          this.hideFontDropdown();
        }
      });

      // Font option listeners
      fontOptions.forEach((option) => {
        option.addEventListener("click", (e) => {
          e.preventDefault();
          const fontName = option.dataset.font;
          if (fontName) {
            this.setFont(fontName);
            this.hideFontDropdown();
          }
        });
      });
    }

    console.log(`✅ Font system initialized (current: ${this.currentFont})`);
  }

  initNavigation() {
    console.log("🧭 Initializing navigation...");

    const navItems = document.querySelectorAll(".nav-item");
    
    navItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const viewName = item.dataset.view;
        if (viewName) {
          this.switchView(viewName);
        }
      });
    });

    console.log("✅ Navigation initialized");
  }

  initSidebar() {
    console.log("📱 Initializing sidebar...");

    const sidebarToggle = document.getElementById("sidebar-toggle");
    const sidebar = document.getElementById("sidebar");

    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener("click", () => {
        this.toggleSidebar();
      });
    }

    // Load saved sidebar state
    const savedCollapsed = localStorage.getItem("sidebar-collapsed") === "true";
    if (savedCollapsed) {
      this.collapseSidebar();
    }

    console.log("✅ Sidebar initialized");
  }

  initChatInterface() {
    console.log("💬 Initializing chat interface...");

    const chatInput = document.getElementById("chat-input");
    const chatSend = document.getElementById("chat-send");

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

      // Handle send button
      chatSend.addEventListener("click", () => {
        this.sendMessage();
      });

      // Initial state
      this.updateSendButton(chatInput, chatSend);
    }

    console.log("✅ Chat interface initialized");
  }

  setTheme(theme) {
    console.log(`🎨 Setting theme to: ${theme}`);

    // Update current theme
    this.currentTheme = theme;

    // Update body data attribute
    document.body.setAttribute("data-theme", theme);

    // Update active theme button
    document.querySelectorAll(".theme-btn").forEach((btn) => {
      btn.classList.remove("active");
      if (btn.dataset.theme === theme) {
        btn.classList.add("active");
      }
    });

    // Save to localStorage
    localStorage.setItem("portfolio-theme", theme);

    console.log(`✅ Theme changed to: ${theme}`);
  }

  setFont(fontName) {
    console.log(`🔤 Setting font to: ${fontName}`);

    // Update current font
    this.currentFont = fontName;

    // Update body data attribute
    document.body.setAttribute("data-font", fontName);

    // Update active font option
    document.querySelectorAll(".font-option").forEach((option) => {
      option.classList.remove("active");
      if (option.dataset.font === fontName) {
        option.classList.add("active");
      }
    });

    // Save to localStorage
    localStorage.setItem("portfolio-font", fontName);

    console.log(`✅ Font changed to: ${fontName}`);
  }

  showFontDropdown() {
    const fontDropdown = document.getElementById("font-dropdown");
    if (fontDropdown) {
      fontDropdown.classList.add("show");
    }
  }

  hideFontDropdown() {
    const fontDropdown = document.getElementById("font-dropdown");
    if (fontDropdown) {
      fontDropdown.classList.remove("show");
    }
  }

  switchView(viewName) {
    console.log(`🔄 Switching to ${viewName} view`);

    // Update nav items
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.remove("active");
      if (item.dataset.view === viewName) {
        item.classList.add("active");
      }
    });

    // Update views
    document.querySelectorAll(".view").forEach((view) => {
      view.classList.remove("active");
    });

    const targetView = document.getElementById(`${viewName}-view`);
    if (targetView) {
      targetView.classList.add("active");
      this.currentView = viewName;
    }

    console.log(`✅ Switched to ${viewName} view`);
  }

  toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    
    if (this.sidebarCollapsed) {
      this.expandSidebar();
    } else {
      this.collapseSidebar();
    }
  }

  collapseSidebar() {
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.add("collapsed");
    this.sidebarCollapsed = true;
    localStorage.setItem("sidebar-collapsed", "true");
    console.log("🔼 Sidebar collapsed");
  }

  expandSidebar() {
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.remove("collapsed");
    this.sidebarCollapsed = false;
    localStorage.setItem("sidebar-collapsed", "false");
    console.log("🔽 Sidebar expanded");
  }

  autoResizeTextarea(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
  }

  updateSendButton(input, button) {
    const hasText = input.value.trim().length > 0;
    button.disabled = !hasText;
  }

  sendMessage() {
    const chatInput = document.getElementById("chat-input");
    const message = chatInput.value.trim();
    
    if (!message) return;

    console.log("📤 Sending message:", message);
    
    // Add message to chat
    this.addMessage("user", message);
    
    // Clear input
    chatInput.value = "";
    this.autoResizeTextarea(chatInput);
    this.updateSendButton(chatInput, document.getElementById("chat-send"));
    
    // Simulate response (replace with actual chat logic)
    setTimeout(() => {
      this.addMessage("assistant", "Thanks for your message! This is a demo response.");
    }, 1000);
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

  // Debug method to access input system
  getInputSystem() {
    return this.world.getSystem('input');
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
  console.log("  - Type 'window.industrialPortfolio.getInputSystem().debugKeyStates()' to see key states");
});

// Handle cleanup
window.addEventListener("beforeunload", () => {
  if (window.industrialPortfolio) {
    window.industrialPortfolio.destroy();
  }
});