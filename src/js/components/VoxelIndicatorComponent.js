import { Component } from '../core/Component.js';
import { VoxelAnimationManager, VoxelAnimationPresets } from '../utils/VoxelAnimations.js';

/**
 * VoxelIndicatorComponent - 3D voxel-based indicator system
 * Uses animated cubes that appear, pulse like LEDs, and disappear
 * Much more visually impressive than flat 2D indicators
 */
export class VoxelIndicatorComponent extends Component {
    constructor(config = {}) {
        super();
        
        // 3D grid configuration (reduced from 16x16 to 8x8 as requested)
        this.gridSize = config.gridSize || { width: 8, height: 8, depth: 1 };
        this.voxelCount = this.gridSize.width * this.gridSize.height * this.gridSize.depth;
        
        // Physical properties
        this.cubeSize = config.cubeSize || 0.12; // Larger cubes for visibility
        this.spacing = config.spacing || 0.15; // More space between cubes
        this.totalWidth = (this.gridSize.width - 1) * this.spacing;
        this.totalHeight = (this.gridSize.height - 1) * this.spacing;
        
        // Positioning (relative to entity)
        this.position = {
            x: config.position?.x || 0,
            y: config.position?.y || 1.2, // Closer to entity due to smaller size
            z: config.position?.z || 0
        };
        this.scale = config.scale || 1.0;
        
        // Voxel data - each voxel has color, visibility, and animation state
        this.voxels = new Array(this.voxelCount);
        for (let i = 0; i < this.voxelCount; i++) {
            this.voxels[i] = {
                color: [0, 0, 0], // RGB
                brightness: 0.0,  // 0-1 for LED pulsing
                visible: false,   // Whether this voxel should exist
                targetVisible: false, // Target visibility for animations
                
                // Animation properties
                animationPhase: 0,     // For pulsing effects
                appearProgress: 0,     // 0-1 for appear animation
                disappearProgress: 0,  // 0-1 for disappear animation
                
                // Timing
                appearDelay: 0,        // Delay before appearing (for sequenced effects)
                isAnimating: false,
                animationType: 'none'  // 'appear', 'disappear', 'pulse', 'idle'
            };
        }
        
        // Display properties
        this.brightness = Math.max(0, Math.min(1, config.brightness || 1.0));
        this.visible = config.visible !== false;
        
        // Entity state
        this.state = config.state || 'idle';
        this.lastState = 'idle';
        this.stateChangeTime = 0;
        
        // Animation management
        this.animationManager = new VoxelAnimationManager(this);
        this.needsUpdate = true;
        
        // Performance settings
        this.updateRate = config.updateRate || 60; // FPS for animations
        this.lastUpdate = 0;
        
        // Initialize with clear state
        this.clear();
        
        console.log(`🧊 VoxelIndicator created: ${this.gridSize.width}x${this.gridSize.height} grid`);
    }
    
    /**
     * Clear all voxels
     */
    clear() {
        for (let i = 0; i < this.voxelCount; i++) {
            this.voxels[i].color = [0, 0, 0];
            this.voxels[i].brightness = 0;
            this.voxels[i].visible = false;
            this.voxels[i].targetVisible = false;
            this.voxels[i].isAnimating = false;
            this.voxels[i].animationType = 'none';
        }
        this.needsUpdate = true;
    }
    
    /**
     * Set a voxel at 3D coordinates
     */
    setVoxel(x, y, z, r, g, b, brightness = 1.0) {
        if (x < 0 || x >= this.gridSize.width || 
            y < 0 || y >= this.gridSize.height || 
            z < 0 || z >= this.gridSize.depth) {
            return; // Out of bounds
        }
        
        const index = this.getVoxelIndex(x, y, z);
        const voxel = this.voxels[index];
        
        voxel.color = [
            Math.max(0, Math.min(255, r)),
            Math.max(0, Math.min(255, g)),
            Math.max(0, Math.min(255, b))
        ];
        voxel.brightness = Math.max(0, Math.min(1, brightness));
        voxel.targetVisible = true;
        
        this.needsUpdate = true;
    }
    
    /**
     * Get voxel at 3D coordinates
     */
    getVoxel(x, y, z) {
        if (x < 0 || x >= this.gridSize.width || 
            y < 0 || y >= this.gridSize.height || 
            z < 0 || z >= this.gridSize.depth) {
            return null;
        }
        
        const index = this.getVoxelIndex(x, y, z);
        return this.voxels[index];
    }
    
    /**
     * Convert 3D coordinates to array index
     */
    getVoxelIndex(x, y, z) {
        return z * (this.gridSize.width * this.gridSize.height) + 
               y * this.gridSize.width + x;
    }
    
    /**
     * Convert array index to 3D coordinates
     */
    getVoxelCoords(index) {
        const z = Math.floor(index / (this.gridSize.width * this.gridSize.height));
        const remainder = index % (this.gridSize.width * this.gridSize.height);
        const y = Math.floor(remainder / this.gridSize.width);
        const x = remainder % this.gridSize.width;
        return { x, y, z };
    }
    
    /**
     * Get world position for a voxel
     */
    getVoxelWorldPosition(x, y, z) {
        return {
            x: (x - (this.gridSize.width - 1) / 2) * this.spacing,
            y: (y - (this.gridSize.height - 1) / 2) * this.spacing,
            z: (z - (this.gridSize.depth - 1) / 2) * this.spacing
        };
    }
    
    /**
     * Start appear animation for specific voxels
     */
    animateVoxelsAppear(voxelIndices, options = {}) {
        const baseDelay = options.baseDelay || 0;
        const sequenceDelay = options.sequenceDelay || 50; // ms between each voxel
        const animationType = options.animationType || 'bounce'; // bounce, fade, spiral
        
        console.log('🧊 Starting appear animation for', voxelIndices.length, 'voxels');
        
        voxelIndices.forEach((index, i) => {
            if (index >= 0 && index < this.voxelCount) {
                const voxel = this.voxels[index];
                voxel.appearDelay = baseDelay + (i * sequenceDelay);
                voxel.isAnimating = true;
                voxel.animationType = 'appear';
                voxel.appearProgress = 0;
                
                console.log('🧊 Set voxel', index, 'to animate with delay', voxel.appearDelay);
            }
        });
        
        this.needsUpdate = true;
    }
    
    /**
     * Animate voxels in a wave pattern
     */
    animateVoxelsAppearWave(voxelIndices) {
        console.log('🧊 Starting wave animation for', voxelIndices.length, 'voxels');
        
        voxelIndices.forEach((index, i) => {
            if (index >= 0 && index < this.voxelCount) {
                const coords = this.getVoxelCoords(index);
                // Calculate wave delay based on distance from bottom-left corner
                const waveDelay = (coords.x + coords.y) * 50; // 50ms per diagonal step
                
                const voxel = this.voxels[index];
                voxel.appearDelay = waveDelay;
                voxel.isAnimating = true;
                voxel.animationType = 'appear';
                voxel.appearProgress = 0;
                
                console.log('🧊 Wave voxel', index, `(${coords.x},${coords.y})`, 'delay:', waveDelay);
            }
        });
        
        this.needsUpdate = true;
    }
    
    /**
     * Start disappear animation for all visible voxels
     */
    animateAllDisappear(options = {}) {
        const baseDelay = options.baseDelay || 0;
        const sequenceDelay = options.sequenceDelay || 30;
        
        let visibleIndex = 0;
        for (let i = 0; i < this.voxelCount; i++) {
            const voxel = this.voxels[i];
            if (voxel.visible || voxel.targetVisible) {
                voxel.appearDelay = baseDelay + (visibleIndex * sequenceDelay);
                voxel.isAnimating = true;
                voxel.animationType = 'disappear';
                voxel.disappearProgress = 0;
                voxel.targetVisible = false;
                visibleIndex++;
            }
        }
        
        this.needsUpdate = true;
    }
    
    /**
     * Create a simple pattern (like a smiley face)
     */
    createPattern(patternName) {
        console.log('🧊 Creating pattern:', patternName);
        this.clear();
        
        switch (patternName) {
            case 'smiley':
                this.createSmileyPattern();
                break;
            case 'thinking':
                this.createThinkingPattern();
                break;
            case 'notification':
                this.createNotificationPattern();
                break;
            case 'error':
                this.createErrorPattern();
                break;
            case 'success':
                this.createSuccessPattern();
                break;
            default:
                this.createIdlePattern();
        }
        
        console.log('🧊 Pattern created, active voxels:', this.voxels.filter(v => v.targetVisible).length);
    }
    
    createSmileyPattern() {
        console.log('🧊 Creating smiley pattern');
        // Face outline (simplified for 8x8)
        const faceColor = [100, 150, 255];
        
        // Eyes
        this.setVoxel(2, 5, 0, ...faceColor);
        this.setVoxel(5, 5, 0, ...faceColor);
        
        // Smile
        this.setVoxel(2, 2, 0, ...faceColor);
        this.setVoxel(3, 1, 0, ...faceColor);
        this.setVoxel(4, 1, 0, ...faceColor);
        this.setVoxel(5, 2, 0, ...faceColor);
        
        // Get indices of set voxels for animation
        const voxelIndices = [];
        for (let i = 0; i < this.voxelCount; i++) {
            if (this.voxels[i].targetVisible) {
                voxelIndices.push(i);
            }
        }
        
        console.log('🧊 Animating voxels:', voxelIndices.length, 'voxels');
        this.animateVoxelsAppear(voxelIndices, { sequenceDelay: 100 });
    }
    
    createThinkingPattern() {
        // Three dots
        const dotColor = [255, 255, 0];
        this.setVoxel(2, 3, 0, ...dotColor);
        this.setVoxel(4, 3, 0, ...dotColor);
        this.setVoxel(6, 3, 0, ...dotColor);
        
        const voxelIndices = [
            this.getVoxelIndex(2, 3, 0),
            this.getVoxelIndex(4, 3, 0),
            this.getVoxelIndex(6, 3, 0)
        ];
        
        this.animateVoxelsAppear(voxelIndices, { sequenceDelay: 200 });
    }
    
    createNotificationPattern() {
        // Expanding circle
        const notifColor = [255, 165, 0];
        const centerX = 4, centerY = 4;
        
        // Inner dot
        this.setVoxel(centerX, centerY, 0, ...notifColor);
        
        // Ring around
        const ring = [
            [centerX-1, centerY], [centerX+1, centerY],
            [centerX, centerY-1], [centerX, centerY+1]
        ];
        
        ring.forEach(([x, y]) => {
            if (x >= 0 && x < this.gridSize.width && y >= 0 && y < this.gridSize.height) {
                this.setVoxel(x, y, 0, ...notifColor);
            }
        });
        
        const voxelIndices = [];
        for (let i = 0; i < this.voxelCount; i++) {
            if (this.voxels[i].targetVisible) {
                voxelIndices.push(i);
            }
        }
        
        this.animateVoxelsAppear(voxelIndices, { sequenceDelay: 80 });
    }
    
    createErrorPattern() {
        // X pattern
        const errorColor = [255, 50, 50];
        
        // Diagonal lines
        for (let i = 1; i < 7; i++) {
            this.setVoxel(i, i, 0, ...errorColor);
            this.setVoxel(i, 7-i, 0, ...errorColor);
        }
        
        const voxelIndices = [];
        for (let i = 0; i < this.voxelCount; i++) {
            if (this.voxels[i].targetVisible) {
                voxelIndices.push(i);
            }
        }
        
        this.animateVoxelsAppear(voxelIndices, { sequenceDelay: 60 });
    }
    
    createSuccessPattern() {
        // Checkmark
        const successColor = [0, 255, 0];
        
        // Checkmark shape
        this.setVoxel(2, 3, 0, ...successColor);
        this.setVoxel(3, 2, 0, ...successColor);
        this.setVoxel(4, 3, 0, ...successColor);
        this.setVoxel(5, 4, 0, ...successColor);
        this.setVoxel(6, 5, 0, ...successColor);
        
        const voxelIndices = [];
        for (let i = 0; i < this.voxelCount; i++) {
            if (this.voxels[i].targetVisible) {
                voxelIndices.push(i);
            }
        }
        
        this.animateVoxelsAppear(voxelIndices, { sequenceDelay: 100 });
    }
    
    createIdlePattern() {
        console.log('🧊 Creating full grid pattern');
        // Fill entire 8x8 grid
        const baseColor = [0, 100, 255];
        const voxelIndices = [];
        
        for (let y = 0; y < this.gridSize.height; y++) {
            for (let x = 0; x < this.gridSize.width; x++) {
                // Vary color slightly for visual interest
                const variation = (x + y) * 10;
                this.setVoxel(x, y, 0, 
                    Math.max(0, baseColor[0] - variation),
                    Math.max(0, baseColor[1] - variation),
                    Math.min(255, baseColor[2] + variation)
                );
                voxelIndices.push(this.getVoxelIndex(x, y, 0));
            }
        }
        
        console.log('🧊 Full grid pattern: all voxels set');
        // Wave animation from bottom-left to top-right
        this.animateVoxelsAppearWave(voxelIndices);
    }
    
    /**
     * Change entity state and trigger appropriate visual feedback
     */
    setState(newState) {
        if (this.state === newState) return;
        
        // Clear previous state first
        this.animateAllDisappear({ sequenceDelay: 20 });
        
        // Set new state after a delay
        setTimeout(() => {
            this.lastState = this.state;
            this.state = newState;
            this.stateChangeTime = Date.now();
            this.onStateChange(newState, this.lastState);
        }, 500); // Wait for disappear animation
    }
    
    /**
     * Handle state changes with visual feedback
     */
    onStateChange(newState, oldState) {
        switch (newState) {
            case 'idle':
                this.createPattern('smiley');
                break;
            case 'thinking':
                this.createPattern('thinking');
                break;
            case 'responding':
                this.createPattern('success');
                break;
            case 'error':
                this.createPattern('error');
                break;
            case 'success':
                this.createPattern('success');
                break;
            case 'notification':
                this.createPattern('notification');
                break;
            default:
                this.createPattern('idle');
        }
    }
    
    /**
     * Update animations and voxel states
     */
    update(deltaTime) {
        const now = Date.now();
        
        // Check if we need to update based on frame rate
        if (now - this.lastUpdate < 1000 / this.updateRate) {
            return false; // Skip this frame
        }
        
        this.lastUpdate = now;
        let hasChanges = false;
        
        // Update each voxel's animation
        for (let i = 0; i < this.voxelCount; i++) {
            const voxel = this.voxels[i];
            
            if (voxel.isAnimating) {
                hasChanges = true;
                
                if (Math.random() < 0.01) { // Debug occasionally
                    console.log('🧊 Animating voxel', i, 'type:', voxel.animationType, 'progress:', voxel.appearProgress, 'deltaTime:', deltaTime);
                }
                
                switch (voxel.animationType) {
                    case 'appear':
                        if (now >= this.stateChangeTime + voxel.appearDelay) {
                            // Calculate progress based on elapsed time since animation started
                            const animationStartTime = this.stateChangeTime + voxel.appearDelay;
                            const elapsed = now - animationStartTime;
                            voxel.appearProgress = Math.min(1, elapsed / 300); // 300ms total duration
                            
                            if (voxel.appearProgress >= 1) {
                                voxel.visible = true;
                                voxel.isAnimating = false;
                                voxel.animationType = 'pulse';
                                console.log('🧊 Voxel became visible!', i);
                            }
                        }
                        break;
                        
                    case 'disappear':
                        if (now >= this.stateChangeTime + voxel.appearDelay) {
                            // Calculate progress based on elapsed time since animation started
                            const animationStartTime = this.stateChangeTime + voxel.appearDelay;
                            const elapsed = now - animationStartTime;
                            voxel.disappearProgress = Math.min(1, elapsed / 200); // 200ms total duration
                            
                            if (voxel.disappearProgress >= 1) {
                                voxel.visible = false;
                                voxel.isAnimating = false;
                                voxel.animationType = 'none';
                            }
                        }
                        break;
                        
                    case 'pulse':
                        // LED-style pulsing
                        voxel.animationPhase += deltaTime / 1000; // 1 second cycle
                        if (voxel.animationPhase > Math.PI * 2) {
                            voxel.animationPhase -= Math.PI * 2;
                        }
                        hasChanges = true;
                        break;
                }
            }
        }
        
        if (hasChanges) {
            this.needsUpdate = true;
        }
        
        return hasChanges;
    }
    
    /**
     * Get voxel data for rendering
     */
    getRenderData() {
        return this.voxels;
    }
    
    /**
     * Get display info for debugging
     */
    getInfo() {
        const activeVoxels = this.voxels.filter(v => v.visible).length;
        const animatingVoxels = this.voxels.filter(v => v.isAnimating).length;
        
        return {
            gridSize: this.gridSize,
            state: this.state,
            visible: this.visible,
            brightness: this.brightness,
            activeVoxels,
            animatingVoxels,
            needsUpdate: this.needsUpdate
        };
    }
    
    /**
     * Set visibility
     */
    setVisible(visible) {
        this.visible = visible;
        this.needsUpdate = true;
    }
}