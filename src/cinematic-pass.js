/**
 * Cinematic post-processing shader pass.
 *
 * Single-pass color grading that transforms the raw render into something
 * that feels like a graded film frame. Per-biome tint, vignette, saturation
 * boost and subtle film grain in one draw call.
 *
 * Usage:
 *   const cine = createCinematicPass(THREE, ShaderPass);
 *   composer.addPass(cine.pass);        // insert after bloom, before AA
 *   cine.setBiome('orbital');           // call on level change
 *   cine.update(seconds);              // call in animate loop
 */

const BIOME_TINTS = {
  orbital:  {r: 0.92, g: 0.95, b: 1.08},   // cool steel-blue
  verdant:  {r: 0.90, g: 1.06, b: 0.92},   // warm green
  polar:    {r: 0.88, g: 0.96, b: 1.12},   // ice-blue
  nebula:   {r: 1.06, g: 0.88, b: 1.04},   // magenta-violet
};

const BIOME_VIGNETTE = {
  orbital:  0.38,
  verdant:  0.32,
  polar:    0.42,
  nebula:   0.45,
};

const BIOME_SATURATION = {
  orbital:  1.08,
  verdant:  1.12,
  polar:    1.06,
  nebula:   1.15,
};

export function createCinematicPass(THREE, ShaderPass) {
  const shader = {
    uniforms: {
      tDiffuse:     {value: null},
      uTime:        {value: 0},
      uTint:        {value: new THREE.Vector3(0.92, 0.95, 1.08)},
      uVignette:    {value: 0.38},
      uSaturation:  {value: 1.08},
      uGrainAmount: {value: 0.035},
      uExposure:    {value: 1.0},
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float uTime;
      uniform vec3 uTint;
      uniform float uVignette;
      uniform float uSaturation;
      uniform float uGrainAmount;
      uniform float uExposure;
      varying vec2 vUv;

      // Compact grain function — animated noise per pixel
      float grain(vec2 uv, float t) {
        return fract(sin(dot(uv + t * 0.1, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
      }

      void main() {
        vec4 texel = texture2D(tDiffuse, vUv);
        vec3 color = texel.rgb;

        // ── Exposure ──
        color *= uExposure;

        // ── Color tint (multiplicative, subtle per-biome grade) ──
        color *= uTint;

        // ── Saturation boost ──
        float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
        color = mix(vec3(luminance), color, uSaturation);

        // ── Vignette (smooth radial darken) ──
        vec2 center = vUv - 0.5;
        float dist = length(center);
        // Soft falloff: start at ~40% of frame, full dark at corners
        float vig = 1.0 - smoothstep(0.3, 0.85, dist) * uVignette;
        color *= vig;

        // ── Film grain (subtle, animated) ──
        float noise = grain(vUv * 512.0, uTime);
        color += noise * uGrainAmount * (1.0 - dist * 0.5);

        // ── Subtle lift in shadows (cinematic look) ──
        color = max(color, vec3(0.008));

        gl_FragColor = vec4(color, texel.a);
      }
    `
  };

  const pass = new ShaderPass(shader);
  pass.renderToScreen = false;

  let currentBiome = 'orbital';

  function setBiome(biomeId) {
    const id = biomeId || 'orbital';
    currentBiome = id;
    const tint = BIOME_TINTS[id] || BIOME_TINTS.orbital;
    pass.uniforms.uTint.value.set(tint.r, tint.g, tint.b);
    pass.uniforms.uVignette.value = BIOME_VIGNETTE[id] || 0.38;
    pass.uniforms.uSaturation.value = BIOME_SATURATION[id] || 1.08;
  }

  function update(seconds) {
    pass.uniforms.uTime.value = seconds;
  }

  function setQuality(quality) {
    // Disable grain on performance mode to save shader instructions
    pass.uniforms.uGrainAmount.value = quality === 'performance' ? 0 : 0.035;
  }

  return {pass, setBiome, update, setQuality, getBiome: () => currentBiome};
}
