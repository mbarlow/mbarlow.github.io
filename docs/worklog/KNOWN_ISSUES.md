# KNOWN_ISSUES.md

This document tracks common issues and mistakes to avoid when working with this ECS-based portfolio project.

## Entity Creation and Rendering Issues

### Issue: Entities with MeshComponent not appearing in scene

**Problem**: Creating entities with MeshComponent but they don't render or appear in the Three.js scene.

**Root Cause**: The MeshComponent needs actual Three.js primitives (geometry, material, mesh) AND must be explicitly added to the render system's scene.

**Incorrect Pattern** (what doesn't work):
```javascript
// This DOESN'T work - too abstract, missing Three.js primitives
const mesh = new MeshComponent({
  type: 'box',
  width: 1,
  height: 1,
  depth: 1,
  color: 0xff0000,
  receiveShadow: true,
  castShadow: true
});
entity.addComponent(mesh);
// Missing: actual Three.js geometry/material creation
// Missing: adding to scene
```

**Correct Pattern** (what works):
```javascript
// Create actual Three.js primitives
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({
  color: 0xff0000,
  metalness: 0.4,
  roughness: 0.6
});

// Pass them to MeshComponent
const mesh = new MeshComponent({
  geometry: geometry,
  material: material,
  castShadow: true,
  receiveShadow: true
});
entity.addComponent(mesh);

// CRITICAL: Add to render system's scene
const renderSystem = world.getSystem('threeRender');
if (renderSystem) {
  renderSystem.addMeshToScene(mesh.mesh);
}
```

**Key Requirements**:
1. Create actual `THREE.BoxGeometry()`, `THREE.MeshStandardMaterial()`, etc.
2. Pass these to MeshComponent constructor
3. **MUST call `renderSystem.addMeshToScene(mesh.mesh)`** to make it visible
4. Get renderSystem reference: `world.getSystem('threeRender')`

### Working Example

See `createOriginMarker()` in `LevelLoader.js` for the correct pattern:
- Creates Three.js geometry and material
- Creates MeshComponent with these primitives
- Calls `renderSystem.addMeshToScene(mesh.mesh)`
- Entity appears and renders correctly

### Why This Happens

The ECS abstraction separates concerns, but Three.js still needs concrete geometry/material objects. The MeshComponent is a wrapper, but it needs real Three.js objects to work with. The render system also needs to explicitly know about meshes to add them to the scene graph.

## Prevention

When creating entities with visual components:
1. Always create concrete Three.js primitives first
2. Always add to render system's scene
3. Test that entities appear before adding complex behaviors
4. Use the origin marker creation as a reference template

## Related Files

- `src/js/systems/LevelLoader.js` - Entity creation examples
- `src/js/systems/ThreeRenderSystem.js` - Render system with `addMeshToScene()`
- `src/js/components/MeshComponent.js` - Mesh component wrapper