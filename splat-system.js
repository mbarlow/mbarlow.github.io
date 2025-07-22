// Gaussian Splat System - Volumetric point cloud visualization
class SplatSystem {
    constructor(scene) {
        this.scene = scene;
        this.splatPoints.geometry.attributes.size.needsUpdate = true;
    }

    destroy() {
        if (this.splatPoints) {
            this.scene.remove(this.splatPoints);
            this.splatPoints.geometry.dispose();
            this.splatPoints.material.dispose();
            this.splatPoints = null;
        }
        this.clusters = [];
        this.originalSizes = null;
    }
}

// Make globally available
window.SplatSystem = SplatSystem; = null;
        this.clusters = [];
    }

    init() {
        console.log('💫 Initializing Splat System...');
        this.createGaussianSplatField();
    }

    createGaussianSplatField() {
        const splatCount = 600;
        const positions = new Float32Array(splatCount * 3);
        const colors = new Float32Array(splatCount * 3);
        const sizes = new Float32Array(splatCount);
        const alphas = new Float32Array(splatCount);

        // Define cluster centers
        this.clusters = [
            { center: { x: 0, y: 0, z: 0 }, color: { r: 0.2, g: 0.4, b: 0.8 } },
            { center: { x: 15, y: 8, z: -10 }, color: { r: 0.8, g: 0.3, b: 0.2 } },
            { center: { x: -12, y: -5, z: 8 }, color: { r: 0.3, g: 0.8, b: 0.4 } },
            { center: { x: 8, y: 12, z: 15 }, color: { r: 0.8, g: 0.8, b: 0.2 } },
            { center: { x: -8, y: -8, z: -12 }, color: { r: 0.6, g: 0.2, b: 0.8 } }
        ];

        for (let i = 0; i < splatCount; i++) {
            // Distribute in organic clusters
            const cluster = this.clusters[Math.floor(Math.random() * this.clusters.length)];

            // Gaussian distribution around cluster center
            const spread = 6;
            positions[i * 3] = cluster.center.x + this.gaussianRandom() * spread;
            positions[i * 3 + 1] = cluster.center.y + this.gaussianRandom() * spread;
            positions[i * 3 + 2] = cluster.center.z + this.gaussianRandom() * spread;

            // Color based on cluster with some variation
            colors[i * 3] = cluster.color.r + (Math.random() - 0.5) * 0.2;
            colors[i * 3 + 1] = cluster.color.g + (Math.random() - 0.5) * 0.2;
            colors[i * 3 + 2] = cluster.color.b + (Math.random() - 0.5) * 0.2;

            sizes[i] = Math.random() * 4 + 2;
            alphas[i] = Math.random() * 0.8 + 0.3;
        }

        const splatGeometry = new THREE.BufferGeometry();
        splatGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        splatGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        splatGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        splatGeometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

        const splatMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pixelRatio: { value: window.devicePixelRatio }
            },
            vertexShader: `
                attribute float size;
                attribute float alpha;
                varying vec3 vColor;
                varying float vAlpha;
                uniform float time;

                void main() {
                    vColor = color;
                    vAlpha = alpha;

                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

                    // Organic pulsing
                    float pulse = sin(time * 2.0 + position.x * 0.1 + position.y * 0.1) * 0.3 + 1.0;

                    gl_PointSize = size * pulse * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vAlpha;

                void main() {
                    float r = length(gl_PointCoord - vec2(0.5));
                    if (r > 0.5) discard;

                    // Gaussian falloff for authentic splat appearance
                    float alpha = exp(-r * r * 8.0) * vAlpha * 0.8;

                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            transparent: true,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.splatPoints = new THREE.Points(splatGeometry, splatMaterial);
        this.scene.add(this.splatPoints);

        console.log(`✅ Created ${splatCount} gaussian splats in ${this.clusters.length} clusters`);
    }

    gaussianRandom() {
        // Box-Muller transform for gaussian distribution
        let u = 0, v = 0;
        while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
        while(v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }

    updateTheme(theme) {
        if (!this.splatPoints) return;

        // Adjust overall intensity based on theme
        const intensities = {
            light: 0.6,
            dark: 1.0,
            grey: 0.8
        };

        const intensity = intensities[theme] || intensities.dark;
        const colors = this.splatPoints.geometry.attributes.color.array;

        for (let i = 0; i < colors.length; i += 3) {
            colors[i] *= intensity;
            colors[i + 1] *= intensity;
            colors[i + 2] *= intensity;
        }

        this.splatPoints.geometry.attributes.color.needsUpdate = true;
    }

    update(time, dataMetrics) {
        if (!this.splatPoints) return;

        // Update shader uniforms
        this.splatPoints.material.uniforms.time.value = time;

        // Slow rotation based on activity
        this.splatPoints.rotation.y += 0.002 * dataMetrics.activity;
        this.splatPoints.rotation.x += 0.001 * dataMetrics.connections;

        // Dynamic size scaling based on complexity
        const sizes = this.splatPoints.geometry.attributes.size.array;
        const originalSizes = this.originalSizes || sizes.slice();

        if (!this.originalSizes) {
            this.originalSizes = sizes.slice();
        }

        for (let i = 0; i < sizes.length; i++) {
            const dynamicScale = 1 + Math.sin(time * 0.5 + i * 0.1) * 0.3 * dataMetrics.complexity;
            sizes[i] = originalSizes[i] * dynamicScale;
        }

        this.splatPoints
