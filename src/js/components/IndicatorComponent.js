import { Component } from '../core/Component.js';
import { IndicatorAnimationManager, IndicatorAnimationPresets } from '../utils/IndicatorAnimations.js';

/**
 * IndicatorComponent - RGB LED-style display for entities
 * Displays emoji art, animations, and state feedback using a 16x16 pixel array
 */
export class IndicatorComponent extends Component {
    constructor(config = {}) {
        super();
        
        // Display configuration
        this.size = config.size || { width: 16, height: 16 };
        this.pixelCount = this.size.width * this.size.height;
        
        // RGB pixel data (3 bytes per pixel: R, G, B)
        this.pixelData = new Uint8Array(this.pixelCount * 3);
        this.backBuffer = new Uint8Array(this.pixelCount * 3); // For smooth transitions
        
        // Display properties
        this.brightness = Math.max(0, Math.min(1, config.brightness || 1.0));
        this.contrast = Math.max(0, Math.min(2, config.contrast || 1.0));
        this.visible = config.visible !== false;
        
        // Positioning (relative to entity)
        this.position = {
            x: config.position?.x || 0,
            y: config.position?.y || 2, // Default: hover above entity
            z: config.position?.z || 0
        };
        this.scale = config.scale || 1.0;
        
        // Animation state
        this.currentAnimation = null;
        this.animationQueue = [];
        this.animationTime = 0;
        this.transitionProgress = 0;
        this.isTransitioning = false;
        
        // Entity state
        this.state = config.state || 'idle';
        this.lastState = 'idle';
        this.stateChangeTime = 0;
        
        // Auto-hide settings
        this.autoHide = config.autoHide !== false; // Default to true
        this.idleDuration = config.idleDuration || 5000; // Hide after 5 seconds idle
        this.fadeOutDuration = config.fadeOutDuration || 1000; // 1 second fade
        this.baseOpacity = 1.0;
        this.targetOpacity = 1.0;
        
        // Performance settings
        this.updateRate = config.updateRate || 60; // FPS for animations
        this.lastUpdate = 0;
        this.needsUpdate = true;
        
        // Animation manager
        this.animationManager = new IndicatorAnimationManager(this);
        
        // Initialize with default pattern
        this.clear();
        if (config.initialPattern) {
            this.setPattern(config.initialPattern);
        }
    }

    /**
     * Clear the display (set all pixels to black)
     */
    clear(r = 0, g = 0, b = 0) {
        for (let i = 0; i < this.pixelCount; i++) {
            const index = i * 3;
            this.pixelData[index] = r;     // Red
            this.pixelData[index + 1] = g; // Green
            this.pixelData[index + 2] = b; // Blue
        }
        this.needsUpdate = true;
    }

    /**
     * Set a pixel color at specific coordinates
     */
    setPixel(x, y, r, g, b) {
        if (x < 0 || x >= this.size.width || y < 0 || y >= this.size.height) {
            return; // Out of bounds
        }
        
        const index = (y * this.size.width + x) * 3;
        this.pixelData[index] = Math.max(0, Math.min(255, r));
        this.pixelData[index + 1] = Math.max(0, Math.min(255, g));
        this.pixelData[index + 2] = Math.max(0, Math.min(255, b));
        this.needsUpdate = true;
    }

    /**
     * Get pixel color at specific coordinates
     */
    getPixel(x, y) {
        if (x < 0 || x >= this.size.width || y < 0 || y >= this.size.height) {
            return { r: 0, g: 0, b: 0 };
        }
        
        const index = (y * this.size.width + x) * 3;
        return {
            r: this.pixelData[index],
            g: this.pixelData[index + 1],
            b: this.pixelData[index + 2]
        };
    }

    /**
     * Fill a rectangular area with color
     */
    fillRect(x, y, width, height, r, g, b) {
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                this.setPixel(x + dx, y + dy, r, g, b);
            }
        }
    }

    /**
     * Draw a circle (useful for simple emoji faces)
     */
    drawCircle(centerX, centerY, radius, r, g, b, filled = false) {
        const radiusSquared = radius * radius;
        
        for (let y = Math.max(0, centerY - radius); y <= Math.min(this.size.height - 1, centerY + radius); y++) {
            for (let x = Math.max(0, centerX - radius); x <= Math.min(this.size.width - 1, centerX + radius); x++) {
                const dx = x - centerX;
                const dy = y - centerY;
                const distanceSquared = dx * dx + dy * dy;
                
                if (filled ? distanceSquared <= radiusSquared : 
                    Math.abs(Math.sqrt(distanceSquared) - radius) < 0.7) {
                    this.setPixel(x, y, r, g, b);
                }
            }
        }
    }

    /**
     * Set the entire display from a pattern array
     */
    setPattern(pattern) {
        if (pattern.length !== this.pixelCount * 3) {
            console.warn('IndicatorComponent: Pattern size mismatch');
            return;
        }
        
        for (let i = 0; i < pattern.length; i++) {
            this.pixelData[i] = pattern[i];
        }
        this.needsUpdate = true;
    }

    /**
     * Create a smooth transition to a new pattern
     */
    transitionTo(targetPattern, duration = 500) {
        if (targetPattern.length !== this.pixelCount * 3) {
            console.warn('IndicatorComponent: Target pattern size mismatch');
            return;
        }
        
        // Copy current state to back buffer
        for (let i = 0; i < this.pixelData.length; i++) {
            this.backBuffer[i] = this.pixelData[i];
        }
        
        // Start transition
        this.targetPattern = new Uint8Array(targetPattern);
        this.transitionDuration = duration;
        this.transitionStartTime = Date.now();
        this.isTransitioning = true;
        this.needsUpdate = true;
    }

    /**
     * Update transition animation
     */
    updateTransition() {
        if (!this.isTransitioning) return;
        
        const elapsed = Date.now() - this.transitionStartTime;
        const progress = Math.min(1, elapsed / this.transitionDuration);
        
        // Smooth easing function (ease-out)
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        
        // Interpolate between back buffer and target
        for (let i = 0; i < this.pixelData.length; i++) {
            const start = this.backBuffer[i];
            const end = this.targetPattern[i];
            this.pixelData[i] = Math.round(start + (end - start) * easedProgress);
        }
        
        this.needsUpdate = true;
        
        if (progress >= 1) {
            this.isTransitioning = false;
            this.targetPattern = null;
        }
    }

    /**
     * Apply brightness and contrast adjustments
     */
    applyEffects() {
        if (this.brightness === 1.0 && this.contrast === 1.0) return;
        
        for (let i = 0; i < this.pixelData.length; i++) {
            let value = this.pixelData[i];
            
            // Apply contrast
            value = ((value / 255) - 0.5) * this.contrast + 0.5;
            
            // Apply brightness
            value *= this.brightness;
            
            // Clamp to valid range
            this.pixelData[i] = Math.max(0, Math.min(255, Math.round(value * 255)));
        }
    }

    /**
     * Change entity state and trigger appropriate visual feedback
     */
    setState(newState) {
        if (this.state === newState) return;
        
        this.lastState = this.state;
        this.state = newState;
        this.stateChangeTime = Date.now();
        
        // Trigger state-specific animation
        this.onStateChange(newState, this.lastState);
    }

    /**
     * Handle state changes with visual feedback
     */
    onStateChange(newState, oldState) {
        switch (newState) {
            case 'idle':
                this.startIdlePattern();
                break;
            case 'thinking':
                this.startThinkingAnimation();
                break;
            case 'responding':
                this.startRespondingAnimation();
                break;
            case 'error':
                this.startErrorAnimation();
                break;
            case 'success':
                this.startSuccessAnimation();
                break;
            case 'notification':
                this.startNotificationAnimation();
                break;
            default:
                console.warn(`IndicatorComponent: Unknown state: ${newState}`);
        }
    }

    /**
     * Idle state pattern - gentle breathing effect
     */
    startIdlePattern() {
        // Simple breathing dots in center
        this.clear();
        const centerX = Math.floor(this.size.width / 2);
        const centerY = Math.floor(this.size.height / 2);
        
        // Draw a small cross pattern
        this.setPixel(centerX, centerY, 50, 50, 100);
        this.setPixel(centerX - 1, centerY, 30, 30, 60);
        this.setPixel(centerX + 1, centerY, 30, 30, 60);
        this.setPixel(centerX, centerY - 1, 30, 30, 60);
        this.setPixel(centerX, centerY + 1, 30, 30, 60);
    }

    /**
     * Thinking state animation - animated dots
     */
    startThinkingAnimation() {
        const animation = IndicatorAnimationPresets.createThinkingDotsAnimation({
            duration: 1200,
            dotColor: [255, 255, 0]
        });
        this.animationManager.playAnimation(animation, true);
    }

    /**
     * Responding state animation - speech bubble or typing indicator
     */
    startRespondingAnimation() {
        const animation = IndicatorAnimationPresets.createSpinningAnimation({
            duration: 800,
            color: [0, 255, 0],
            radius: 4
        });
        this.animationManager.playAnimation(animation, true);
    }

    /**
     * Error state animation - red pulse with X
     */
    startErrorAnimation() {
        const animation = IndicatorAnimationPresets.createPulseAnimation([255, 50, 50], {
            duration: 400,
            pulseFrames: 2,
            offFrames: 2
        });
        this.animationManager.playAnimation(animation, true);
    }

    /**
     * Success state animation - green checkmark
     */
    startSuccessAnimation() {
        const animation = IndicatorAnimationPresets.createPulseAnimation([0, 255, 0], {
            duration: 600,
            pulseFrames: 6,
            offFrames: 2,
            loop: false
        });
        this.animationManager.playAnimation(animation, true);
    }

    /**
     * Notification state animation - pop-up effect
     */
    startNotificationAnimation() {
        const animation = IndicatorAnimationPresets.createNotificationAnimation({
            duration: 800,
            color: [255, 165, 0],
            maxRadius: 6
        });
        this.animationManager.playAnimation(animation, true);
    }

    /**
     * Update the indicator (called by IndicatorRenderSystem)
     */
    update(deltaTime) {
        const now = Date.now();
        
        // Check if we need to update based on frame rate
        if (now - this.lastUpdate < 1000 / this.updateRate) {
            return false; // Skip this frame
        }
        
        this.lastUpdate = now;
        
        // Update any active transitions
        if (this.isTransitioning) {
            this.updateTransition();
        }
        
        // Update animations
        if (this.animationManager.update()) {
            this.needsUpdate = true;
        }
        
        // Handle auto-hide when idle
        if (this.autoHide && this.state === 'idle') {
            const idleTime = now - this.stateChangeTime;
            
            if (idleTime > this.idleDuration) {
                // Start fading out
                this.targetOpacity = 0.0;
            } else {
                // Ensure we're visible when not idle long enough
                this.targetOpacity = 1.0;
            }
        } else {
            // Always visible when not idle
            this.targetOpacity = 1.0;
        }
        
        // Update opacity transition
        if (Math.abs(this.baseOpacity - this.targetOpacity) > 0.01) {
            const fadeSpeed = deltaTime / this.fadeOutDuration;
            if (this.baseOpacity < this.targetOpacity) {
                this.baseOpacity = Math.min(this.targetOpacity, this.baseOpacity + fadeSpeed);
            } else {
                this.baseOpacity = Math.max(this.targetOpacity, this.baseOpacity - fadeSpeed);
            }
            this.needsUpdate = true;
        }
        
        // Apply visual effects
        if (this.needsUpdate) {
            this.applyEffects();
            this.needsUpdate = false;
            return true; // Needs texture update
        }
        
        return false;
    }

    /**
     * Update current animation (placeholder for animation system)
     */
    updateAnimation(deltaTime) {
        // This will be expanded when we add the animation engine
        // For now, just handle basic state-based animations
    }

    /**
     * Get pixel data for rendering (applied with brightness/contrast)
     */
    getRenderData() {
        return this.pixelData;
    }

    /**
     * Set visibility
     */
    setVisible(visible) {
        this.visible = visible;
        this.needsUpdate = true;
    }

    /**
     * Get current opacity for rendering
     */
    getOpacity() {
        return this.visible ? this.baseOpacity : 0.0;
    }
    
    /**
     * Get display info for debugging
     */
    getInfo() {
        return {
            size: this.size,
            state: this.state,
            visible: this.visible,
            brightness: this.brightness,
            opacity: this.baseOpacity,
            isTransitioning: this.isTransitioning,
            animationActive: !!this.currentAnimation
        };
    }
}