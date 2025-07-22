// Main Application Controller - Complete Working Version
class IndustrialPortfolio {
  constructor() {
    this.scene = null;
    this.portfolioData = null;
    this.currentTheme = "dark";
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    console.log("🏭 Initializing Industrial Portfolio...");

    // Always load fallback content first so page isn't empty
    this.loadFallbackContent();

    try {
      // Initialize theme system first
      this.initThemeSystem();

      // Initialize THREE.js scene
      await this.initThreeJS();

      // Try to load real GitHub data
      await this.initGitHubData();

      // Setup animations and interactions
      this.setupLEDAnimations();
      this.setupEasterEggs();

      this.initialized = true;
      console.log("✅ Industrial Portfolio initialized successfully");
    } catch (error) {
      console.error("❌ Error initializing portfolio:", error);
      // Fallback content is already loaded, so page still works
    }
  }

  async initThreeJS() {
    console.log("🎮 Initializing THREE.js...");

    // Check if THREE.js is loaded
    if (typeof THREE === "undefined") {
      console.error("THREE.js not loaded! Make sure the CDN link is working.");
      return;
    }

    try {
      // Create THREE.js scene
      this.scene = new IndustrialScene();
      this.scene.init();
      console.log("✅ THREE.js scene initialized");
    } catch (error) {
      console.error("❌ THREE.js initialization failed:", error);
      // Continue without THREE.js - page still works
    }
  }

  async initGitHubData() {
    console.log("📡 Initializing GitHub data...");

    try {
      // Create portfolio data manager
      this.portfolioData = new PortfolioData("mbarlow");

      // Try to load real data
      await this.portfolioData.initialize();

      console.log("✅ GitHub data loaded successfully");
    } catch (error) {
      console.error("❌ GitHub data loading failed:", error);
      console.log("📝 Using fallback content");

      // Update API status to show we're using fallback
      this.updateAPIStatus("offline");
    }
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

    // Update THREE.js scene if it exists
    if (this.scene && this.scene.updateTheme) {
      this.scene.updateTheme(theme);
    }

    // Save to localStorage
    localStorage.setItem("portfolio-theme", theme);

    console.log(`✅ Theme changed to: ${theme}`);
  }

  loadFallbackContent() {
    console.log("📝 Loading fallback content...");

    // Update profile stats - be honest about demo status
    this.updateElement("public-repos", "--");
    this.updateElement("followers", "--");
    this.updateElement("following", "--");
    this.updateElement("user-bio", "v0.1.1");

    // Load demo notice for languages
    const languageHTML = `
            <div class="demo-notice" style="color: var(--text-muted); font-style: italic; text-align: center; padding: 1rem;">
                GitHub API rate limited.<br>
                Add your personal access token to see real data.
            </div>
        `;

    this.updateElement("languages", languageHTML, true);

    // Demo notice for activity
    const activityHTML = `
            <div class="demo-notice" style="color: var(--text-muted); font-style: italic; text-align: center; padding: 1rem;">
                Real activity feed requires<br>
                GitHub API authentication
            </div>
        `;

    this.updateElement("recent-activity", activityHTML, true);

    // Demo notice for repositories
    const reposHTML = `
            <div class="demo-notice" style="color: var(--text-muted); font-style: italic; text-align: center; padding: 1rem;">
                Configure GitHub API access<br>
                to display your repositories
            </div>
        `;

    this.updateElement("featured-repos", reposHTML, true);

    // Update system info
    this.updateElement("last-updated", "Demo mode");
    this.updateElement("profile-views", "--");
    this.updateAPIStatus("demo");

    console.log("✅ Demo content loaded - configure GitHub API for real data");
  }

  updateElement(id, content, isHTML = false) {
    const element = document.getElementById(id);
    if (element) {
      if (isHTML) {
        element.innerHTML = content;
      } else {
        element.textContent = content;
      }
    } else {
      console.warn(`Element with id '${id}' not found`);
    }
  }

  updateAPIStatus(status) {
    const statusMap = {
      loaded: { text: "Demo Mode", color: "var(--text-muted)" },
      demo: { text: "Demo Mode", color: "var(--text-muted)" },
      online: { text: "Online", color: "var(--led-green)" },
      offline: { text: "API Limited", color: "var(--led-red)" },
      error: { text: "Error", color: "var(--led-red)" },
    };

    const statusInfo = statusMap[status] || statusMap.demo;

    const statusElement = document.getElementById("api-status");
    if (statusElement) {
      statusElement.textContent = statusInfo.text;
      statusElement.style.color = statusInfo.color;
    }
  }

  setupLEDAnimations() {
    console.log("💡 Setting up LED animations...");

    // Status LEDs
    const statusLEDs = {
      api: document.getElementById("api-led"),
      activity: document.getElementById("activity-led"),
      connection: document.getElementById("connection-led"),
    };

    // Activate LEDs one by one
    setTimeout(() => {
      if (statusLEDs.api) statusLEDs.api.classList.add("active");
    }, 500);

    setTimeout(() => {
      if (statusLEDs.connection) statusLEDs.connection.classList.add("active");
    }, 1000);

    // Activity LED pulses
    let activityPulse = false;
    setInterval(() => {
      activityPulse = !activityPulse;
      if (statusLEDs.activity) {
        statusLEDs.activity.classList.toggle("active", activityPulse);
      }
    }, 2000);

    // Accent LEDs in cards
    const ledAccents = document.querySelectorAll(".led-accent");
    ledAccents.forEach((led, index) => {
      setTimeout(() => {
        if (!led.classList.contains("pulsing")) {
          led.classList.add("active");
        }
      }, index * 300);
    });

    console.log("✅ LED animations activated");
  }

  setupEasterEggs() {
    console.log("🥚 Setting up easter eggs...");

    // Konami code
    let konami = "";
    const konamiCode =
      "ArrowUpArrowUpArrowDownArrowDownArrowLeftArrowRightArrowLeftArrowRightKeyBKeyA";

    document.addEventListener("keydown", (e) => {
      konami += e.code;
      if (konami.length > konamiCode.length) {
        konami = konami.slice(-konamiCode.length);
      }

      if (konami === konamiCode) {
        this.activateMatrixMode();
        konami = "";
      }
    });

    // Double-click title for debug
    const title = document.querySelector(".title");
    if (title) {
      title.addEventListener("dblclick", () => {
        this.showDebugInfo();
      });
    }

    console.log("✅ Easter eggs ready");
  }

  activateMatrixMode() {
    console.log("🕶️ Matrix mode activated!");

    // Apply matrix theme
    const root = document.documentElement;
    root.style.setProperty("--accent", "#00ff00");
    root.style.setProperty("--text", "#00ff00");
    root.style.setProperty("--bg", "#000000");

    // Show notification
    this.showNotification("Matrix Mode Activated! 🕶️", 3000);

    // Reset after 10 seconds
    setTimeout(() => {
      this.setTheme(this.currentTheme);
      console.log("🔙 Matrix mode deactivated");
    }, 10000);
  }

  showDebugInfo() {
    const debugInfo = {
      theme: this.currentTheme,
      initialized: this.initialized,
      threeJS: this.scene ? "Loaded" : "Not loaded",
      githubData: this.portfolioData ? "Loaded" : "Not loaded",
      timestamp: new Date().toISOString(),
    };

    console.table(debugInfo);
    this.showNotification("Debug info logged to console", 2000);
  }

  showNotification(message, duration = 3000) {
    const notification = document.createElement("div");
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--surface);
            border: 1px solid var(--accent);
            color: var(--text);
            padding: 1rem;
            border-radius: 4px;
            font-family: var(--font-mono);
            font-size: 0.875rem;
            z-index: 10000;
            box-shadow: 0 4px 12px var(--shadow);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

    notification.textContent = message;
    document.body.appendChild(notification);

    // Slide in
    setTimeout(() => {
      notification.style.transform = "translateX(0)";
    }, 10);

    // Slide out and remove
    setTimeout(() => {
      notification.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, duration);
  }

  // Cleanup
  destroy() {
    if (this.scene && this.scene.destroy) {
      this.scene.destroy();
    }
    console.log("🧹 Portfolio cleanup completed");
  }
}

// Simple THREE.js Scene (fallback if main scene fails)
class SimpleThreeScene {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animationId = null;
    this.cubes = [];
  }

  init() {
    try {
      this.setupScene();
      this.setupCamera();
      this.setupRenderer();
      this.setupLighting();
      this.createObjects();
      this.animate();
      console.log("✅ Simple THREE.js scene initialized");
    } catch (error) {
      console.error("❌ Simple THREE.js scene failed:", error);
    }
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x000000, 10, 50);
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.camera.position.z = 15;
  }

  setupRenderer() {
    const canvas = document.getElementById("three-canvas");
    if (!canvas) {
      console.error("THREE.js canvas not found");
      return;
    }

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    this.scene.add(directionalLight);
  }

  createObjects() {
    // Create floating cubes
    for (let i = 0; i < 5; i++) {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshLambertMaterial({
        color: 0x333333,
        transparent: true,
        opacity: 0.6,
      });

      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 10,
      );

      cube.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      );

      this.scene.add(cube);
      this.cubes.push(cube);
    }
  }

  updateTheme(theme) {
    const colors = {
      light: 0xf0f0f0,
      dark: 0x333333,
      grey: 0x666666,
    };

    const color = colors[theme] || colors.dark;

    this.cubes.forEach((cube) => {
      cube.material.color.setHex(color);
    });
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    // Rotate cubes
    this.cubes.forEach((cube) => {
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
    });

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

// Use SimpleThreeScene if IndustrialScene is not available
window.IndustrialScene = window.IndustrialScene || SimpleThreeScene;

// Initialize everything when DOM is ready
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 DOM loaded, starting Industrial Portfolio...");

  // Create and initialize the app
  window.industrialPortfolio = new IndustrialPortfolio();
  await window.industrialPortfolio.init();

  // Mark as ready
  document.body.classList.add("app-ready");
  console.log("🎉 Industrial Portfolio ready!");
});

// Handle page visibility for performance
document.addEventListener("visibilitychange", () => {
  if (window.industrialPortfolio?.scene) {
    if (document.hidden) {
      if (window.industrialPortfolio.scene.animationId) {
        cancelAnimationFrame(window.industrialPortfolio.scene.animationId);
        window.industrialPortfolio.scene.animationId = null;
      }
    } else {
      if (!window.industrialPortfolio.scene.animationId) {
        window.industrialPortfolio.scene.animate();
      }
    }
  }
});

// Handle cleanup
window.addEventListener("beforeunload", () => {
  if (window.industrialPortfolio) {
    window.industrialPortfolio.destroy();
  }
});
