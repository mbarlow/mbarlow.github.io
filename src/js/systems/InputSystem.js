import { System } from '../core/System.js';

/**
 * InputSystem - Handles keyboard input when chat input is not focused
 */
export class InputSystem extends System {
  constructor() {
    super();
    this.requiredComponents = []; // No specific components required
    this.keyStates = new Map(); // Track key states
    this.chatInput = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for keydown events
    document.addEventListener('keydown', (event) => {
      this.handleKeyDown(event);
    });

    // Listen for keyup events
    document.addEventListener('keyup', (event) => {
      this.handleKeyUp(event);
    });

    // Cache chat input reference
    document.addEventListener('DOMContentLoaded', () => {
      this.chatInput = document.getElementById('chat-input');
    });
  }

  handleKeyDown(event) {
    // Check if chat input has focus - exit early if it does
    if (this.isChatInputFocused()) {
      return; // Let the chat input handle the event
    }

    const keyInfo = this.getKeyInfo(event);
    
    // Update key state
    this.keyStates.set(event.code, {
      pressed: true,
      timestamp: performance.now(),
      event: event
    });

    // Debug output (only when chat input is NOT focused)
    console.group('🎹 InputSystem - Key Down');
    console.log('Key:', keyInfo.key);
    console.log('Code:', keyInfo.code);
    console.log('Modifiers:', keyInfo.modifiers);
    console.log('Target:', event.target.tagName);
    console.log('Active Keys:', Array.from(this.keyStates.keys()).filter(k => this.keyStates.get(k).pressed));
    console.groupEnd();

    // Handle specific key combinations
    this.processKeyInput(keyInfo, event);
  }

  handleKeyUp(event) {
    // Update key state
    if (this.keyStates.has(event.code)) {
      this.keyStates.set(event.code, {
        ...this.keyStates.get(event.code),
        pressed: false,
        releasedAt: performance.now()
      });
    }

    // Debug output for special keys
    if (this.isSpecialKey(event.code)) {
      const keyInfo = this.getKeyInfo(event);
      console.log('🎹 Key Released:', keyInfo.key, keyInfo.code);
    }
  }

  isChatInputFocused() {
    // Always get fresh reference to chat input
    const chatInput = document.getElementById('chat-input');
    return chatInput && document.activeElement === chatInput;
  }

  getKeyInfo(event) {
    return {
      key: event.key,
      code: event.code,
      modifiers: {
        ctrl: event.ctrlKey,
        alt: event.altKey,
        shift: event.shiftKey,
        meta: event.metaKey
      },
      timestamp: performance.now()
    };
  }

  isSpecialKey(code) {
    const specialKeys = [
      'Escape', 'Enter', 'Space', 'Tab',
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'
    ];
    return specialKeys.some(key => code.includes(key));
  }

  processKeyInput(keyInfo, event) {
    const { key, code, modifiers } = keyInfo;

    // Handle escape key
    if (code === 'Escape') {
      console.log('🎹 Escape pressed - closing dropdowns/modals');
      this.closeDropdowns();
      event.preventDefault();
      return;
    }

    // Handle slash for quick command
    if (key === '/' && !modifiers.ctrl && !modifiers.alt) {
      console.log('🎹 Quick command activated');
      this.focusChatInput();
      event.preventDefault();
      return;
    }

    // Handle Ctrl+K for search/command palette
    if (key === 'k' && modifiers.ctrl) {
      console.log('🎹 Command palette shortcut');
      event.preventDefault();
      return;
    }

    // Handle number keys for theme switching
    if (key >= '1' && key <= '3' && !modifiers.ctrl && !modifiers.alt) {
      const themeIndex = parseInt(key) - 1;
      const themes = ['light', 'dark', 'grey'];
      if (themes[themeIndex]) {
        console.log(`🎹 Theme shortcut: ${themes[themeIndex]}`);
        this.switchTheme(themes[themeIndex]);
        event.preventDefault();
      }
      return;
    }

    // Handle space for focus chat
    if (code === 'Space' && !modifiers.ctrl && !modifiers.alt && !modifiers.shift) {
      console.log('🎹 Space pressed - focusing chat input');
      this.focusChatInput();
      event.preventDefault();
      return;
    }

    // Handle arrow keys for navigation
    if (code.startsWith('Arrow')) {
      console.log(`🎹 Arrow key navigation: ${code}`);
      this.handleArrowNavigation(code, modifiers);
      event.preventDefault();
      return;
    }

    // Log other interesting key combinations
    if (modifiers.ctrl || modifiers.alt || modifiers.meta) {
      console.log(`🎹 Modifier combination: ${this.formatModifiers(modifiers)}+${key}`);
    }
  }

  formatModifiers(modifiers) {
    const parts = [];
    if (modifiers.ctrl) parts.push('Ctrl');
    if (modifiers.alt) parts.push('Alt');
    if (modifiers.shift) parts.push('Shift');
    if (modifiers.meta) parts.push('Meta');
    return parts.join('+');
  }

  closeDropdowns() {
    // Close font dropdown if open
    const fontDropdown = document.getElementById('font-dropdown');
    if (fontDropdown && fontDropdown.classList.contains('show')) {
      fontDropdown.classList.remove('show');
    }

    // Close any other dropdowns/modals here
  }

  focusChatInput() {
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
      chatInput.focus();
      console.log('🎹 Chat input focused');
    }
  }

  switchTheme(themeName) {
    // Get the app instance and switch theme
    if (window.industrialPortfolio && window.industrialPortfolio.setTheme) {
      window.industrialPortfolio.setTheme(themeName);
    }
  }

  handleArrowNavigation(code, modifiers) {
    // Handle sidebar navigation with arrow keys
    const navItems = document.querySelectorAll('.nav-item');
    const activeItem = document.querySelector('.nav-item.active');
    
    if (!activeItem || navItems.length === 0) return;

    const currentIndex = Array.from(navItems).indexOf(activeItem);
    let newIndex = currentIndex;

    switch (code) {
      case 'ArrowUp':
        newIndex = Math.max(0, currentIndex - 1);
        break;
      case 'ArrowDown':
        newIndex = Math.min(navItems.length - 1, currentIndex + 1);
        break;
      case 'ArrowLeft':
        // Could toggle sidebar collapse
        if (window.industrialPortfolio && window.industrialPortfolio.collapseSidebar) {
          window.industrialPortfolio.collapseSidebar();
        }
        return;
      case 'ArrowRight':
        // Could expand sidebar
        if (window.industrialPortfolio && window.industrialPortfolio.expandSidebar) {
          window.industrialPortfolio.expandSidebar();
        }
        return;
    }

    if (newIndex !== currentIndex) {
      navItems[newIndex].click();
      console.log(`🎹 Navigation: switched to ${navItems[newIndex].dataset.view}`);
    }
  }

  // Get all currently pressed keys
  getPressedKeys() {
    return Array.from(this.keyStates.entries())
      .filter(([code, state]) => state.pressed)
      .map(([code, state]) => code);
  }

  // Check if a specific key is currently pressed
  isKeyPressed(code) {
    const state = this.keyStates.get(code);
    return state && state.pressed;
  }

  // Update method called by ECS world
  update(deltaTime) {
    // Clean up old key states (released keys older than 1 second)
    const now = performance.now();
    for (const [code, state] of this.keyStates.entries()) {
      if (!state.pressed && state.releasedAt && (now - state.releasedAt) > 1000) {
        this.keyStates.delete(code);
      }
    }
  }

  // Debug method to log current key states
  debugKeyStates() {
    console.group('🎹 InputSystem - Current Key States');
    console.log('Pressed Keys:', this.getPressedKeys());
    console.log('Total Tracked Keys:', this.keyStates.size);
    console.log('Chat Input Focused:', this.isChatInputFocused());
    console.groupEnd();
  }
}