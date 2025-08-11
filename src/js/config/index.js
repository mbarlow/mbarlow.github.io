/**
 * Central configuration for the entire application
 * All hardcoded values should be defined here for easy management
 */

export const CONFIG = {
  // Development environment settings
  environment: {
    isDevelopment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    isProduction: window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
  },

  // Server and API settings
  server: {
    port: 3000,
    liveReloadPort: 36253
  },

  // AI/Ollama configuration
  ai: {
    ollamaUrl: 'http://localhost:11434',
    defaultModel: 'gemma3',
    multimodalModels: ['gemma3', 'llava', 'bakllava'],
    healthCheckInterval: 5000,
    contextWindow: 10,
    historyLimit: 5,
    defaultCommands: ['search', 'history', 'who', 'context'],
    timeout: {
      successDisplay: 1500,
      errorDisplay: 2000,
      copyFeedback: 2000
    }
  },

  // Three.js rendering configuration
  rendering: {
    camera: {
      default: {
        fov: 75,
        near: 0.1,
        far: 1000
      },
      orbit: {
        fov: 50,
        near: 0.1,
        far: 1000
      }
    },
    
    grid: {
      size: 20,
      divisions: 20,
      worldGrid: {
        width: 8,
        height: 8,
        spacing: 3
      }
    },

    fog: {
      near: 10,
      far: 50
    },

    lighting: {
      ambient: {
        intensity: 0.6,
        color: 0xffffff
      },
      directional: {
        intensity: 0.8,
        position: { x: 5, y: 10, z: 5 },
        shadow: {
          mapSize: 2048,
          camera: {
            near: 0.5,
            far: 50,
            left: -20,
            right: 20,
            top: 20,
            bottom: -20
          }
        }
      }
    },

    // Theme configurations
    themes: {
      light: {
        background: 0xf5f5f5,
        grid: 0xcccccc,
        ambient: 0xffffff,
        text: '#2b2b2b',
        panel: '#ffffff'
      },
      dark: {
        background: 0x1a1a1a,
        grid: 0x444444,
        ambient: 0x404040,
        text: '#e0e0e0',
        panel: '#2b2b2b'
      },
      grey: {
        background: 0x2d2d2d,
        grid: 0x555555,
        ambient: 0x606060,
        text: '#d0d0d0',
        panel: '#3a3a3a'
      },
      abyss: {
        background: 0x0a0a0a,
        grid: 0x1a1a1a,
        ambient: 0x202020,
        text: '#c0c0c0',
        panel: '#151515'
      },
      hacker: {
        background: 0x0d1117,
        grid: 0x30363d,
        ambient: 0x0d1117,
        text: '#00ff41',
        panel: '#161b22'
      }
    }
  },

  // Connection system configuration
  connections: {
    materials: {
      inactive: {
        color: 0x444444,
        opacity: 0.2,
        emissive: 0x111111
      },
      active: {
        color: 0x00ff88,
        opacity: 0.9,
        emissive: 0x004422,
        emissivePulse: 0x006633
      },
      pending: {
        color: 0xffaa00,
        opacity: 0.7,
        emissive: 0x442200
      },
      connecting: {
        color: 0x4488ff,
        opacity: 0.6,
        emissive: 0x002244
      },
      error: {
        color: 0xff4444,
        opacity: 0.5,
        emissive: 0x441111
      }
    },
    
    curve: {
      baseStrength: 0.3,
      strengthVariation: 0.3,
      baseHeight: 0.15,
      heightVariation: 0.2,
      tubeRadius: 0.015,
      controlPoint1Range: 0.1,
      controlPoint2Range: 0.1,
      asymmetryFactor: 0.4
    },

    animation: {
      pulseSpeed: 2.0,
      baseOpacity: 0.9,
      pulseAmount: 0.3,
      waveSpeedMin: 0.5,
      waveSpeedMax: 1.5,
      waveAmplitudeMin: 0.05,
      waveAmplitudeMax: 0.15
    },

    particles: {
      count: 8,
      radius: 0.005,
      baseSpeed: 0.5,
      speedVariation: 0.3,
      opacity: 0.8,
      fadeZone: 0.1
    },

    lod: {
      distances: {
        close: 10,
        medium: 30,
        far: 60
      },
      segments: {
        close: { min: 24, multiplier: 3 },
        medium: { min: 16, multiplier: 2 },
        far: { min: 8, multiplier: 1 },
        max: 60
      },
      radialSegments: {
        close: 12,
        medium: 8,
        far: 6
      }
    }
  },

  // Movement and physics configuration
  physics: {
    movement: {
      walkSpeed: 5.0,
      runSpeed: 8.0,
      crouchSpeed: 2.0,
      jumpForce: 10.0,
      friction: 10.0,
      gravity: 20.0,
      mouseSensitivity: 0.002
    },
    
    character: {
      height: 1.8,
      crouchHeight: 1.2,
      radius: 0.5
    },

    thirdPerson: {
      distance: 8,
      height: 6,
      smoothing: 0.1
    }
  },

  // Voxel indicator configuration
  voxel: {
    indicator: {
      cubeSize: 0.12,
      maxRenderDistance: 30,
      lod: {
        high: 8,
        medium: 15,
        low: 30
      },
      material: {
        color: 0xffffff,
        emissive: 0x111111,
        opacity: 0.8
      }
    },

    animations: {
      clear: {
        delay: 15,
        timeout: 400
      },
      thinking: {
        delays: [0, 200, 400],
        ringExpansion: [150, 300]
      },
      success: {
        delays: [100, 200, 300, 400, 500]
      },
      bounce: {
        n1: 7.5625,
        d1: 2.75
      },
      transition: {
        smoothTime: 50,
        maxOpacity: 0.8
      }
    }
  },

  // UI and interaction configuration
  ui: {
    chat: {
      maxMessages: 100,
      typingIndicatorDelay: 300,
      scrollBehavior: 'smooth'
    },
    
    tooltips: {
      delay: 500,
      duration: 3000
    },

    notifications: {
      duration: 3000,
      position: 'top-right'
    }
  },

  // Performance settings
  performance: {
    updateThreshold: 0.01, // Minimum movement for updates
    maxParticles: 100,
    maxConnections: 50,
    shadowQuality: 'high', // 'low', 'medium', 'high'
    antialias: true
  },

  // Debug settings
  debug: {
    enabled: false,
    showStats: false,
    showGrid: true,
    logLevel: 'info', // 'error', 'warn', 'info', 'debug'
    wireframe: false
  }
};

// Helper function to get nested config values safely
export function getConfig(path, defaultValue = undefined) {
  return path.split('.').reduce((obj, key) => 
    obj && obj[key] !== undefined ? obj[key] : defaultValue, CONFIG);
}

// Helper function to update config values (useful for runtime adjustments)
export function updateConfig(path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((obj, key) => {
    if (!obj[key]) obj[key] = {};
    return obj[key];
  }, CONFIG);
  target[lastKey] = value;
}

// Export default for convenience
export default CONFIG;