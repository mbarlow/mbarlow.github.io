/**
 * IndicatorAnimations - Animation presets and utilities for RGB indicators
 * Provides frame-based animations, easing functions, and common patterns
 */

/**
 * Animation class - represents a sequence of frames with timing
 */
export class IndicatorAnimation {
    constructor(frames, options = {}) {
        this.frames = frames; // Array of pixel data arrays or frame objects
        this.duration = options.duration || 1000; // Total animation duration in ms
        this.loop = options.loop !== false; // Default to looping
        this.pingPong = options.pingPong || false; // Reverse on completion
        this.easing = options.easing || 'linear';
        this.onComplete = options.onComplete || null;
        this.onFrame = options.onFrame || null;
        
        // Animation state
        this.currentFrame = 0;
        this.direction = 1; // 1 for forward, -1 for reverse
        this.startTime = 0;
        this.isPlaying = false;
        this.hasStarted = false;
        
        // Calculate frame duration
        this.frameDuration = this.duration / Math.max(1, this.frames.length);
    }
    
    start() {
        this.startTime = Date.now();
        this.isPlaying = true;
        this.hasStarted = true;
        this.currentFrame = 0;
        this.direction = 1;
    }
    
    stop() {
        this.isPlaying = false;
    }
    
    reset() {
        this.currentFrame = 0;
        this.direction = 1;
        this.startTime = 0;
        this.isPlaying = false;
        this.hasStarted = false;
    }
    
    update(currentTime = Date.now()) {
        if (!this.isPlaying || this.frames.length === 0) return false;
        
        const elapsed = currentTime - this.startTime;
        const progress = Math.min(1, elapsed / this.duration);
        
        // Calculate current frame index with easing
        const easedProgress = this.applyEasing(progress);
        const frameIndex = Math.floor(easedProgress * this.frames.length);
        
        // Check if frame changed
        const newFrame = Math.min(frameIndex, this.frames.length - 1);
        const frameChanged = newFrame !== this.currentFrame;
        
        this.currentFrame = newFrame;
        
        // Call frame callback
        if (frameChanged && this.onFrame) {
            this.onFrame(this.currentFrame, this.getCurrentFrameData());
        }
        
        // Check for completion
        if (progress >= 1) {
            if (this.pingPong) {
                this.direction *= -1;
                this.startTime = currentTime;
                
                if (this.direction === 1) {
                    // Completed a full ping-pong cycle
                    if (this.onComplete) this.onComplete();
                    if (!this.loop) {
                        this.stop();
                        return false;
                    }
                }
            } else {
                if (this.onComplete) this.onComplete();
                
                if (this.loop) {
                    this.startTime = currentTime;
                    this.currentFrame = 0;
                } else {
                    this.stop();
                    return false;
                }
            }
        }
        
        return frameChanged;
    }
    
    getCurrentFrameData() {
        if (this.frames.length === 0) return null;
        
        const frame = this.frames[this.currentFrame];
        
        // Handle different frame formats
        if (frame instanceof Uint8Array) {
            return frame;
        } else if (frame && frame.data) {
            return frame.data;
        } else if (typeof frame === 'function') {
            return frame(this.currentFrame, this.frames.length);
        }
        
        return frame;
    }
    
    applyEasing(progress) {
        switch (this.easing) {
            case 'linear':
                return progress;
            case 'easeIn':
                return progress * progress;
            case 'easeOut':
                return 1 - Math.pow(1 - progress, 2);
            case 'easeInOut':
                return progress < 0.5 
                    ? 2 * progress * progress 
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            case 'bounce':
                return this.bounceEasing(progress);
            case 'elastic':
                return this.elasticEasing(progress);
            default:
                return progress;
        }
    }
    
    bounceEasing(x) {
        const n1 = 7.5625;
        const d1 = 2.75;
        
        if (x < 1 / d1) {
            return n1 * x * x;
        } else if (x < 2 / d1) {
            return n1 * (x -= 1.5 / d1) * x + 0.75;
        } else if (x < 2.5 / d1) {
            return n1 * (x -= 2.25 / d1) * x + 0.9375;
        } else {
            return n1 * (x -= 2.625 / d1) * x + 0.984375;
        }
    }
    
    elasticEasing(x) {
        const c4 = (2 * Math.PI) / 3;
        return x === 0 ? 0 : x === 1 ? 1 : 
            Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
    }
}

/**
 * Animation presets for common indicator states and effects
 */
export class IndicatorAnimationPresets {
    static size = { width: 16, height: 16 };
    
    /**
     * Create breathing/pulsing animation
     */
    static createBreathingAnimation(baseColor = [50, 50, 100], options = {}) {
        const frames = [];
        const frameCount = options.frameCount || 16;
        const minIntensity = options.minIntensity || 0.3;
        const maxIntensity = options.maxIntensity || 1.0;
        
        for (let i = 0; i < frameCount; i++) {
            const phase = (i / frameCount) * Math.PI * 2;
            const intensity = minIntensity + (maxIntensity - minIntensity) * 
                (Math.sin(phase) * 0.5 + 0.5);
            
            const frame = this.createSolidFrame([
                Math.round(baseColor[0] * intensity),
                Math.round(baseColor[1] * intensity),
                Math.round(baseColor[2] * intensity)
            ]);
            
            frames.push(frame);
        }
        
        return new IndicatorAnimation(frames, {
            duration: options.duration || 2000,
            loop: true,
            easing: 'easeInOut'
        });
    }
    
    /**
     * Create thinking dots animation
     */
    static createThinkingDotsAnimation(options = {}) {
        const frames = [];
        const frameCount = options.frameCount || 8;
        const dotColor = options.dotColor || [255, 255, 0];
        const bgColor = options.backgroundColor || [0, 0, 0];
        
        for (let frame = 0; frame < frameCount; frame++) {
            const frameData = this.createSolidFrame(bgColor);
            const y = Math.floor(this.size.height / 2);
            
            // Three dots that light up in sequence
            const dots = [6, 8, 10];
            dots.forEach((x, index) => {
                const isActive = (frame + index) % frameCount < 2;
                const color = isActive ? dotColor : [
                    Math.round(dotColor[0] * 0.2),
                    Math.round(dotColor[1] * 0.2),
                    Math.round(dotColor[2] * 0.2)
                ];
                
                this.setPixelInFrame(frameData, x, y, color);
            });
            
            frames.push(frameData);
        }
        
        return new IndicatorAnimation(frames, {
            duration: options.duration || 1200,
            loop: true
        });
    }
    
    /**
     * Create spinning animation
     */
    static createSpinningAnimation(options = {}) {
        const frames = [];
        const frameCount = options.frameCount || 12;
        const color = options.color || [0, 255, 255];
        const bgColor = options.backgroundColor || [0, 0, 0];
        const radius = options.radius || 5;
        
        for (let frame = 0; frame < frameCount; frame++) {
            const frameData = this.createSolidFrame(bgColor);
            const angle = (frame / frameCount) * Math.PI * 2;
            
            // Draw spinning dots around center
            const centerX = this.size.width / 2;
            const centerY = this.size.height / 2;
            
            for (let i = 0; i < 4; i++) {
                const dotAngle = angle + (i * Math.PI / 2);
                const x = Math.round(centerX + Math.cos(dotAngle) * radius);
                const y = Math.round(centerY + Math.sin(dotAngle) * radius);
                
                if (x >= 0 && x < this.size.width && y >= 0 && y < this.size.height) {
                    this.setPixelInFrame(frameData, x, y, color);
                }
            }
            
            frames.push(frameData);
        }
        
        return new IndicatorAnimation(frames, {
            duration: options.duration || 1000,
            loop: true
        });
    }
    
    /**
     * Create pulse animation (rapid flash)
     */
    static createPulseAnimation(color = [255, 0, 0], options = {}) {
        const frames = [];
        const pulseFrames = options.pulseFrames || 4;
        const offFrames = options.offFrames || 4;
        const bgColor = options.backgroundColor || [0, 0, 0];
        
        // On frames
        for (let i = 0; i < pulseFrames; i++) {
            frames.push(this.createSolidFrame(color));
        }
        
        // Off frames
        for (let i = 0; i < offFrames; i++) {
            frames.push(this.createSolidFrame(bgColor));
        }
        
        return new IndicatorAnimation(frames, {
            duration: options.duration || 500,
            loop: options.loop !== false
        });
    }
    
    /**
     * Create wave animation
     */
    static createWaveAnimation(options = {}) {
        const frames = [];
        const frameCount = options.frameCount || 16;
        const color = options.color || [0, 255, 100];
        const bgColor = options.backgroundColor || [0, 0, 0];
        
        for (let frame = 0; frame < frameCount; frame++) {
            const frameData = this.createSolidFrame(bgColor);
            const time = (frame / frameCount) * Math.PI * 2;
            
            for (let x = 0; x < this.size.width; x++) {
                const waveHeight = Math.sin(x * 0.5 + time) * 0.5 + 0.5;
                const y = Math.round((this.size.height - 1) * waveHeight);
                
                this.setPixelInFrame(frameData, x, y, color);
            }
            
            frames.push(frameData);
        }
        
        return new IndicatorAnimation(frames, {
            duration: options.duration || 1500,
            loop: true
        });
    }
    
    /**
     * Create notification pop animation
     */
    static createNotificationAnimation(options = {}) {
        const frames = [];
        const maxRadius = options.maxRadius || 6;
        const color = options.color || [255, 165, 0];
        const bgColor = options.backgroundColor || [0, 0, 0];
        
        // Expanding circle
        for (let radius = 0; radius <= maxRadius; radius++) {
            const frameData = this.createSolidFrame(bgColor);
            this.drawCircleInFrame(frameData, 8, 8, radius, color, false);
            frames.push(frameData);
        }
        
        // Shrinking circle
        for (let radius = maxRadius - 1; radius >= 0; radius--) {
            const frameData = this.createSolidFrame(bgColor);
            this.drawCircleInFrame(frameData, 8, 8, radius, color, false);
            frames.push(frameData);
        }
        
        return new IndicatorAnimation(frames, {
            duration: options.duration || 800,
            loop: false,
            easing: 'easeOut'
        });
    }
    
    // Utility methods
    
    static createSolidFrame(color) {
        const frame = new Uint8Array(this.size.width * this.size.height * 3);
        for (let i = 0; i < frame.length; i += 3) {
            frame[i] = color[0];     // R
            frame[i + 1] = color[1]; // G
            frame[i + 2] = color[2]; // B
        }
        return frame;
    }
    
    static setPixelInFrame(frameData, x, y, color) {
        if (x < 0 || x >= this.size.width || y < 0 || y >= this.size.height) return;
        
        const index = (y * this.size.width + x) * 3;
        frameData[index] = color[0];     // R
        frameData[index + 1] = color[1]; // G
        frameData[index + 2] = color[2]; // B
    }
    
    static drawCircleInFrame(frameData, centerX, centerY, radius, color, filled = false) {
        const radiusSquared = radius * radius;
        
        for (let y = Math.max(0, centerY - radius); y <= Math.min(this.size.height - 1, centerY + radius); y++) {
            for (let x = Math.max(0, centerX - radius); x <= Math.min(this.size.width - 1, centerX + radius); x++) {
                const dx = x - centerX;
                const dy = y - centerY;
                const distanceSquared = dx * dx + dy * dy;
                
                if (filled ? distanceSquared <= radiusSquared : 
                    Math.abs(Math.sqrt(distanceSquared) - radius) < 0.7) {
                    this.setPixelInFrame(frameData, x, y, color);
                }
            }
        }
    }
}

/**
 * Animation manager for handling multiple animations and transitions
 */
export class IndicatorAnimationManager {
    constructor(indicator) {
        this.indicator = indicator;
        this.currentAnimation = null;
        this.animationQueue = [];
        this.isTransitioning = false;
        this.transitionDuration = 300;
    }
    
    playAnimation(animation, immediate = false) {
        if (immediate) {
            this.stopCurrentAnimation();
            this.startAnimation(animation);
        } else {
            this.animationQueue.push(animation);
            this.processQueue();
        }
    }
    
    stopCurrentAnimation() {
        if (this.currentAnimation) {
            this.currentAnimation.stop();
            this.currentAnimation = null;
        }
    }
    
    startAnimation(animation) {
        this.currentAnimation = animation;
        
        // Set up frame callback to update indicator BEFORE starting
        animation.onFrame = (frameIndex, frameData) => {
            if (frameData) {
                this.indicator.setPattern(frameData);
            }
        };
        
        // Set up completion callback
        const originalOnComplete = animation.onComplete;
        animation.onComplete = () => {
            if (originalOnComplete) originalOnComplete();
            this.processQueue();
        };
        
        // Start the animation after callbacks are set
        animation.start();
    }
    
    processQueue() {
        if (this.currentAnimation && this.currentAnimation.isPlaying) return;
        
        if (this.animationQueue.length > 0) {
            const nextAnimation = this.animationQueue.shift();
            this.startAnimation(nextAnimation);
        }
    }
    
    update() {
        if (this.currentAnimation) {
            return this.currentAnimation.update();
        }
        return false;
    }
    
    clearQueue() {
        this.animationQueue = [];
    }
    
    hasActiveAnimation() {
        return this.currentAnimation && this.currentAnimation.isPlaying;
    }
}