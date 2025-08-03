/**
 * VoxelAnimations - Animation system for 3D voxel indicators
 * Handles complex animations with multiple cubes appearing, pulsing, and disappearing
 */

/**
 * Animation manager for handling voxel-based animations
 */
export class VoxelAnimationManager {
    constructor(voxelIndicator) {
        this.voxelIndicator = voxelIndicator;
        this.currentAnimation = null;
        this.animationQueue = [];
        this.isTransitioning = false;
    }
    
    playAnimation(animationName, options = {}) {
        console.log(`🧊 Playing voxel animation: ${animationName}`);
        
        // Clear current state first
        this.voxelIndicator.animateAllDisappear({ sequenceDelay: 15 });
        
        // Start new animation after disappear completes
        setTimeout(() => {
            switch (animationName) {
                case 'thinking':
                    this.playThinkingAnimation(options);
                    break;
                case 'notification':
                    this.playNotificationAnimation(options);
                    break;
                case 'error':
                    this.playErrorAnimation(options);
                    break;
                case 'success':
                    this.playSuccessAnimation(options);
                    break;
                case 'idle':
                default:
                    this.playIdleAnimation(options);
                    break;
            }
        }, 400);
    }
    
    playThinkingAnimation(options = {}) {
        // Sequential thinking dots that pulse
        const dots = [
            { x: 1, y: 4, delay: 0 },
            { x: 3, y: 4, delay: 200 },
            { x: 5, y: 4, delay: 400 }
        ];
        
        dots.forEach(dot => {
            setTimeout(() => {
                this.voxelIndicator.setVoxel(dot.x, dot.y, 0, 255, 255, 0, 1.0);
                const index = this.voxelIndicator.getVoxelIndex(dot.x, dot.y, 0);
                this.voxelIndicator.animateVoxelsAppear([index]);
            }, dot.delay);
        });
    }
    
    playNotificationAnimation(options = {}) {
        // Expanding ring effect
        const center = { x: 4, y: 4 };
        const color = options.color || [255, 165, 0];
        
        // Center dot first
        this.voxelIndicator.setVoxel(center.x, center.y, 0, ...color);
        let index = this.voxelIndicator.getVoxelIndex(center.x, center.y, 0);
        this.voxelIndicator.animateVoxelsAppear([index]);
        
        // Ring 1
        setTimeout(() => {
            const ring1 = [
                { x: center.x-1, y: center.y },
                { x: center.x+1, y: center.y },
                { x: center.x, y: center.y-1 },
                { x: center.x, y: center.y+1 }
            ];
            
            ring1.forEach(pos => {
                if (pos.x >= 0 && pos.x < 8 && pos.y >= 0 && pos.y < 8) {
                    this.voxelIndicator.setVoxel(pos.x, pos.y, 0, ...color);
                }
            });
            
            const indices = ring1.map(pos => 
                this.voxelIndicator.getVoxelIndex(pos.x, pos.y, 0)
            ).filter(idx => idx >= 0);
            
            this.voxelIndicator.animateVoxelsAppear(indices, { sequenceDelay: 50 });
        }, 150);
        
        // Ring 2
        setTimeout(() => {
            const ring2 = [
                { x: center.x-2, y: center.y },
                { x: center.x+2, y: center.y },
                { x: center.x, y: center.y-2 },
                { x: center.x, y: center.y+2 },
                { x: center.x-1, y: center.y-1 },
                { x: center.x+1, y: center.y-1 },
                { x: center.x-1, y: center.y+1 },
                { x: center.x+1, y: center.y+1 }
            ];
            
            ring2.forEach(pos => {
                if (pos.x >= 0 && pos.x < 8 && pos.y >= 0 && pos.y < 8) {
                    this.voxelIndicator.setVoxel(pos.x, pos.y, 0, ...color);
                }
            });
            
            const indices = ring2.map(pos => 
                this.voxelIndicator.getVoxelIndex(pos.x, pos.y, 0)
            ).filter(idx => idx >= 0);
            
            this.voxelIndicator.animateVoxelsAppear(indices, { sequenceDelay: 30 });
        }, 300);
    }
    
    playErrorAnimation(options = {}) {
        // X pattern with dramatic effect
        const color = options.color || [255, 50, 50];
        const lines = [];
        
        // Build X pattern
        for (let i = 1; i < 7; i++) {
            lines.push({ x: i, y: i });
            lines.push({ x: i, y: 7-i });
        }
        
        lines.forEach(pos => {
            this.voxelIndicator.setVoxel(pos.x, pos.y, 0, ...color);
        });
        
        const indices = lines.map(pos => 
            this.voxelIndicator.getVoxelIndex(pos.x, pos.y, 0)
        );
        
        this.voxelIndicator.animateVoxelsAppear(indices, { sequenceDelay: 40 });
    }
    
    playSuccessAnimation(options = {}) {
        // Checkmark with satisfying build-up
        const color = options.color || [0, 255, 0];
        const checkmark = [
            { x: 1, y: 3, delay: 0 },
            { x: 2, y: 2, delay: 100 },
            { x: 3, y: 3, delay: 200 },
            { x: 4, y: 4, delay: 300 },
            { x: 5, y: 5, delay: 400 },
            { x: 6, y: 6, delay: 500 }
        ];
        
        checkmark.forEach(point => {
            setTimeout(() => {
                this.voxelIndicator.setVoxel(point.x, point.y, 0, ...color);
                const index = this.voxelIndicator.getVoxelIndex(point.x, point.y, 0);
                this.voxelIndicator.animateVoxelsAppear([index]);
            }, point.delay);
        });
    }
    
    playIdleAnimation(options = {}) {
        // Simple breathing pattern in center
        const color = options.color || [50, 100, 255];
        const center = { x: 4, y: 4 };
        
        this.voxelIndicator.setVoxel(center.x, center.y, 0, ...color);
        const index = this.voxelIndicator.getVoxelIndex(center.x, center.y, 0);
        this.voxelIndicator.animateVoxelsAppear([index]);
    }
    
    update() {
        // The voxel indicator handles its own animation updates
        return this.voxelIndicator.needsUpdate;
    }
    
    hasActiveAnimation() {
        return this.voxelIndicator.voxels.some(v => v.isAnimating);
    }
}

/**
 * Animation presets for common voxel patterns
 */
export class VoxelAnimationPresets {
    static createSpinningCube(options = {}) {
        // Create a more complex 3D spinning animation
        const frames = [];
        const frameCount = options.frameCount || 16;
        const color = options.color || [0, 255, 255];
        
        // This would create frames for a spinning cube animation
        // Implementation would depend on specific 3D rotation effects needed
        
        return {
            frames,
            duration: options.duration || 1000,
            loop: true
        };
    }
    
    static createPulseWave(options = {}) {
        // Create a wave effect across the voxel grid
        const color = options.color || [255, 100, 0];
        const amplitude = options.amplitude || 1.0;
        
        // Implementation for wave propagation across voxels
        return {
            type: 'wave',
            color,
            amplitude,
            duration: options.duration || 1500
        };
    }
    
    static createMatrixRain(options = {}) {
        // Digital rain effect like Matrix
        const color = options.color || [0, 255, 0];
        
        return {
            type: 'matrix',
            color,
            duration: options.duration || 3000,
            intensity: options.intensity || 0.7
        };
    }
}