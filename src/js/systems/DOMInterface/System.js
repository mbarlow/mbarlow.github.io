import { System } from '../../core/System.js';

/**
 * DOMInterfaceSystem - Handles DOM interactions and UI state management
 * This system bridges the ECS world with browser DOM operations
 */
export class DOMInterfaceSystem extends System {
    constructor() {
        super();
        this.requiredComponents = [];
        
        // UI state
        this.currentTheme = "dark";
        this.currentFont = "Inter";
        this.currentView = "chat";
        this.sidebarCollapsed = false;
    }

    init() {
        console.log("🖥️ Initializing DOMInterface System...");
        this.initThemeSystem();
        this.initFontSystem();
        this.initNavigationSystem();
        this.initSidebarSystem();
        console.log("✅ DOMInterface System initialized");
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
        fontDropdown?.classList.add("show");
    }

    hideFontDropdown() {
        const fontDropdown = document.getElementById("font-dropdown");
        fontDropdown?.classList.remove("show");
    }

    initNavigationSystem() {
        console.log("🧭 Initializing navigation system...");

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

        console.log("✅ Navigation system initialized");
    }

    initSidebarSystem() {
        console.log("📱 Initializing sidebar system...");

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

        console.log("✅ Sidebar system initialized");
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

    // System update method (required by ECS)
    update(deltaTime) {
        // DOM Interface doesn't need regular updates
        // It responds to events instead
    }
}