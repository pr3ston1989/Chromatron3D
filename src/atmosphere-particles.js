/**
 * Per-biome atmospheric particles that fill the space between
 * the camera and the board.
 *
 * Floating dust motes (orbital), pollen/spores (verdant), snowflakes (polar),
 * crystal sparkles (nebula). Very low opacity, slow drift, depth-faded.
 * Adds atmospheric density — the difference between "3D objects in a void"
 * and "a place."
 *
 * Single GPU draw call via Points with a custom shader.
 */

const BIOME_CONFIGS = {
  orbital: {
    color: [0.55, 0.70, 0.85],
    count: 180,
    speed: 0.15,
    size: 2.5,
    opacity: 0.10,
    drift: {x: 0.3, y: -0.08, z: 0.1},
    turbulence: 0.4,
  },
  verdant: {
    color: [0.6, 0.95, 0.5],
    count: 200,
    speed: 0.12,
    size: 3.0,
    opacity: 0.12,
    drift: {x: 0.15, y: 0.12, z: 0.08},
    turbulence: 0.6,
  },
  polar: {
    color: [0.85, 0.92, 1.0],
    count: 250,
    speed: 0.08,
    size: 3.5,
    opacity: 0.14,
    drift: {x: 0.2, y: -0.25, z: 0.15},
    turbulence: 0.3,
  },
  nebula: {
    color: [0.9, 0.5, 0.85],
    count: 160,
    speed: 0.10,
    size: 2.2,
    opacity: 0.09,
    drift: {x: 0.1, y: 0.05, z: 0.15},
    turbulence: 0.7,
  },
};

const MAX_PARTICLES = 250;

export function createAtmosphereParticles(THREE, scene) {
  // Pre-allocate arrays for maximum particle count
  const positions = new Float32Array(MAX_PARTICLES * 3);
  const seeds = new Float32Array(MAX_PARTICLES * 3); // random per-particle seed
  const sizes = new Float32Array(MAX_PARTICLES);

  // Initialize random seed values
  for (let i = 0; i < MAX_PARTICLES; i++) {
    seeds[i * 3]     = Math.random() * 100;
    seeds[i * 3 + 1] = Math.random() * 100;
    seeds[i * 3 + 2] = Math.random() * 100;
    // Spread particles in a large volume around origin
    positions[i * 3]     = (Math.random() - 0.5) * 60;
    positions[i * 3 + 1] = Math.random() * 25 - 2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    sizes[i] = 0.5 + Math.random() * 1.5;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 3));
  geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime:       {value: 0},
      uColor:      {value: new THREE.Vector3(0.55, 0.70, 0.85)},
      uDrift:      {value: new THREE.Vector3(0.3, -0.08, 0.1)},
      uSpeed:      {value: 0.15},
      uBaseSize:   {value: 2.5},
      uOpacity:    {value: 0.10},
      uTurbulence: {value: 0.4},
      uActiveCount:{value: 180},
    },
    vertexShader: `
      attribute vec3 aSeed;
      attribute float aSize;
      uniform float uTime;
      uniform vec3 uDrift;
      uniform float uSpeed;
      uniform float uBaseSize;
      uniform float uTurbulence;
      uniform float uActiveCount;
      varying float vAlpha;
      varying float vIdx;

      void main() {
        // Hide particles beyond activeCount
        float idx = float(gl_VertexID);
        if (idx >= uActiveCount) {
          gl_Position = vec4(0.0, 0.0, -2.0, 1.0);
          gl_PointSize = 0.0;
          vAlpha = 0.0;
          return;
        }

        float t = uTime * uSpeed;

        // Looping drift with per-particle offset
        vec3 pos = position;
        pos += uDrift * (t + aSeed.x * 10.0);

        // Turbulence — gentle swirl
        pos.x += sin(t * 0.7 + aSeed.x * 6.28) * uTurbulence;
        pos.y += cos(t * 0.5 + aSeed.y * 6.28) * uTurbulence * 0.6;
        pos.z += sin(t * 0.6 + aSeed.z * 6.28) * uTurbulence * 0.8;

        // Wrap particles back into the visible volume
        float boxSize = 60.0;
        float boxHalf = boxSize * 0.5;
        pos.x = mod(pos.x + boxHalf, boxSize) - boxHalf;
        pos.z = mod(pos.z + boxHalf, boxSize) - boxHalf;
        pos.y = mod(pos.y + 2.0, 27.0) - 2.0;

        vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPos;

        // Size attenuation
        float dist = -mvPos.z;
        gl_PointSize = clamp(uBaseSize * aSize * 45.0 / max(dist, 1.0), 0.5, 8.0);

        // Fade with distance and add twinkle
        float distFade = (1.0 - smoothstep(10.0, 50.0, dist)) * smoothstep(0.5, 3.0, dist);
        float twinkle = 0.7 + 0.3 * sin(t * 3.0 + aSeed.x * 20.0);
        vAlpha = distFade * twinkle;
        vIdx = idx;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vAlpha;

      void main() {
        float d = length(gl_PointCoord - vec2(0.5)) * 2.0;
        float core = exp(-d * d * 8.0);
        float haze = exp(-d * d * 2.5);
        float alpha = vAlpha * uOpacity * (core * 0.7 + haze * 0.3);
        if (alpha < 0.003) discard;
        vec3 color = uColor * (core * 1.5 + haze * 0.5);
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = 1;
  points.name = 'atmosphere-particles';
  scene.add(points);

  let currentBiome = 'orbital';

  function setBiome(biomeId) {
    const id = biomeId || 'orbital';
    currentBiome = id;
    const cfg = BIOME_CONFIGS[id] || BIOME_CONFIGS.orbital;
    material.uniforms.uColor.value.set(...cfg.color);
    material.uniforms.uDrift.value.set(cfg.drift.x, cfg.drift.y, cfg.drift.z);
    material.uniforms.uSpeed.value = cfg.speed;
    material.uniforms.uBaseSize.value = cfg.size;
    material.uniforms.uOpacity.value = cfg.opacity;
    material.uniforms.uTurbulence.value = cfg.turbulence;
    material.uniforms.uActiveCount.value = cfg.count;
  }

  function update(seconds) {
    material.uniforms.uTime.value = seconds;
  }

  function setQuality(quality) {
    const cfg = BIOME_CONFIGS[currentBiome] || BIOME_CONFIGS.orbital;
    const scale = quality === 'performance' ? 0.4 : quality === 'cinematic' ? 1.0 : 0.7;
    material.uniforms.uActiveCount.value = Math.floor(cfg.count * scale);
  }

  function dispose() {
    scene.remove(points);
    geometry.dispose();
    material.dispose();
  }

  return {setBiome, update, setQuality, dispose};
}
