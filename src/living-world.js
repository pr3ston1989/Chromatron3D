/**
 * Biome-specific ambient particle systems and animated vegetation.
 *
 * Each biome has a distinct visual personality expressed through floating
 * particles (sparks, spores, snow, energy motes) and animated rim features
 * (swaying ferns, growing ice, pulsing crystals, blinking lights).
 *
 * All elements stay outside the 15×15 optical workspace. Particles orbit
 * the platform in a cylindrical shell (radius 12–35, height −3 to +15).
 * Vegetation is instanced on the platform rim (10.2–12 from center).
 *
 * No external textures or dependencies. THREE is passed as a parameter.
 */

const PARTICLE_COUNTS = Object.freeze({ performance: 80, balanced: 200, cinematic: 400 });
const VEG_COUNTS = Object.freeze({ performance: 8, balanced: 18, cinematic: 30 });
const BOARD_CLEARANCE = 10.5;
const PARTICLE_INNER = 12;
const PARTICLE_OUTER = 35;
const PARTICLE_FLOOR = -3;
const PARTICLE_CEILING = 15;
const VEG_INNER = 10.2;
const VEG_OUTER = 12.0;

function hashSeed(value) {
 let h = 2166136261;
 for (const c of String(value)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
 return h >>> 0;
}
function rngFrom(seed) {
 let s = (seed >>> 0) || 0x6d2b79f5;
 return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
}

/* ── Procedural glow sprite texture ─────────────────────────────────── */

function makeGlowTexture(THREE, size = 32) {
 const data = new Uint8Array(size * size * 4);
 const center = size / 2;
 for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
   const dx = (x + 0.5 - center) / center;
   const dy = (y + 0.5 - center) / center;
   const dist = Math.hypot(dx, dy);
   const alpha = Math.max(0, 1 - dist);
   const soft = alpha * alpha * (3 - 2 * alpha); // smoothstep
   const p = (y * size + x) * 4;
   data[p] = 255; data[p + 1] = 255; data[p + 2] = 255;
   data[p + 3] = Math.round(soft * 255);
  }
 }
 const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
 tex.minFilter = THREE.LinearFilter;
 tex.magFilter = THREE.LinearFilter;
 tex.generateMipmaps = false;
 tex.needsUpdate = true;
 return tex;
}

/* ── Biome particle definitions ─────────────────────────────────────── */

const BIOME_PARTICLES = Object.freeze({
 orbital: Object.freeze({
  colors: [0xff9944, 0x44ccee, 0xffcc66, 0x66ddff, 0xff7733],
  sizeRange: [0.08, 0.28],
  speedRange: [0.15, 0.55],
  drift: [0, 1, 0],      // upward embers
  turbulence: 0.3,
  opacity: 0.72,
  blending: 'additive'
 }),
 verdant: Object.freeze({
  colors: [0x88dd66, 0xccee55, 0xaaff88, 0x66cc44, 0xeeff99],
  sizeRange: [0.06, 0.22],
  speedRange: [0.08, 0.30],
  drift: [0, 0.6, 0],    // gentle rise
  turbulence: 0.15,
  opacity: 0.58,
  blending: 'additive'
 }),
 polar: Object.freeze({
  colors: [0xcceeFF, 0xffffff, 0xaaddff, 0xddeeff, 0x99ccee],
  sizeRange: [0.05, 0.18],
  speedRange: [0.10, 0.35],
  drift: [0.2, -0.4, 0.1], // sideways snowfall
  turbulence: 0.20,
  opacity: 0.62,
  blending: 'normal'
 }),
 nebula: Object.freeze({
  colors: [0xdd66bb, 0xaa55cc, 0xff88dd, 0xcc44aa, 0xffaaee],
  sizeRange: [0.07, 0.25],
  speedRange: [0.06, 0.25],
  drift: [0, 0.15, 0],   // slow swirl
  turbulence: 0.40,
  opacity: 0.65,
  blending: 'additive'
 })
});

/* ── Particle system per biome ──────────────────────────────────────── */

function createParticleSystem(THREE, parent, biomeId, glowTexture) {
 const maxCount = PARTICLE_COUNTS.cinematic;
 const config = BIOME_PARTICLES[biomeId];

 const positions = new Float32Array(maxCount * 3);
 const colors = new Float32Array(maxCount * 3);
 const sizes = new Float32Array(maxCount);

 // Per-particle state (not uploaded to GPU, CPU-side bookkeeping)
 const ages = new Float32Array(maxCount);
 const lifetimes = new Float32Array(maxCount);
 const velocities = new Float32Array(maxCount * 3);
 const phases = new Float32Array(maxCount); // turbulence phase

 const geometry = new THREE.BufferGeometry();
 geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
 geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
 geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
 geometry.setDrawRange(0, PARTICLE_COUNTS.balanced);

 const isAdditive = config.blending === 'additive';
 const material = new THREE.PointsMaterial({
  size: 0.2,
  map: glowTexture,
  vertexColors: true,
  transparent: true,
  opacity: config.opacity,
  depthWrite: false,
  sizeAttenuation: true,
  blending: isAdditive ? THREE.AdditiveBlending : THREE.NormalBlending,
  fog: false
 });

 const points = new THREE.Points(geometry, material);
 points.name = 'living-particles-' + biomeId;
 points.frustumCulled = false;
 points.visible = false;
 parent.add(points);

 let rng = rngFrom(hashSeed(biomeId + ':particles'));

 function spawnParticle(i) {
  // Position: random in cylindrical shell
  const angle = rng() * Math.PI * 2;
  const radius = PARTICLE_INNER + rng() * (PARTICLE_OUTER - PARTICLE_INNER);
  const height = PARTICLE_FLOOR + rng() * (PARTICLE_CEILING - PARTICLE_FLOOR);

  positions[i * 3] = Math.cos(angle) * radius;
  positions[i * 3 + 1] = height;
  positions[i * 3 + 2] = Math.sin(angle) * radius;

  // Color
  const colorHex = config.colors[Math.floor(rng() * config.colors.length)];
  const brightness = 0.7 + rng() * 0.3;
  colors[i * 3] = ((colorHex >> 16) & 255) / 255 * brightness;
  colors[i * 3 + 1] = ((colorHex >> 8) & 255) / 255 * brightness;
  colors[i * 3 + 2] = (colorHex & 255) / 255 * brightness;

  // Size
  sizes[i] = config.sizeRange[0] + rng() * (config.sizeRange[1] - config.sizeRange[0]);

  // Velocity
  const speed = config.speedRange[0] + rng() * (config.speedRange[1] - config.speedRange[0]);
  const vAngle = rng() * Math.PI * 2;
  velocities[i * 3] = config.drift[0] + Math.cos(vAngle) * speed * 0.3;
  velocities[i * 3 + 1] = config.drift[1] + (rng() - 0.3) * speed;
  velocities[i * 3 + 2] = config.drift[2] + Math.sin(vAngle) * speed * 0.3;

  // Lifetime
  lifetimes[i] = 6 + rng() * 14;
  ages[i] = rng() * lifetimes[i]; // stagger initial ages
  phases[i] = rng() * Math.PI * 2;
 }

 function initAll(seed) {
  rng = rngFrom(hashSeed(biomeId + ':' + seed + ':particles'));
  for (let i = 0; i < maxCount; i++) spawnParticle(i);
  geometry.attributes.position.needsUpdate = true;
  geometry.attributes.color.needsUpdate = true;
  geometry.attributes.size.needsUpdate = true;
 }

 function respawn(i) {
  // Respawn at rim, staggered entry
  const angle = rng() * Math.PI * 2;
  const radius = PARTICLE_INNER + rng() * (PARTICLE_OUTER - PARTICLE_INNER);
  const height = biomeId === 'polar'
   ? PARTICLE_CEILING - rng() * 3 // snow starts high
   : PARTICLE_FLOOR + rng() * 4;  // others start low

  positions[i * 3] = Math.cos(angle) * radius;
  positions[i * 3 + 1] = height;
  positions[i * 3 + 2] = Math.sin(angle) * radius;

  const speed = config.speedRange[0] + rng() * (config.speedRange[1] - config.speedRange[0]);
  const vAngle = rng() * Math.PI * 2;
  velocities[i * 3] = config.drift[0] + Math.cos(vAngle) * speed * 0.3;
  velocities[i * 3 + 1] = config.drift[1] + (rng() - 0.3) * speed;
  velocities[i * 3 + 2] = config.drift[2] + Math.sin(vAngle) * speed * 0.3;

  lifetimes[i] = 6 + rng() * 14;
  ages[i] = 0;
  phases[i] = rng() * Math.PI * 2;
 }

 function update(dt, seconds) {
  const count = geometry.drawRange.count;
  for (let i = 0; i < count; i++) {
   ages[i] += dt;
   if (ages[i] >= lifetimes[i]) {
    respawn(i);
    continue;
   }

   // Fade: ramp in over 1s, ramp out over last 2s
   const fadeIn = Math.min(1, ages[i]);
   const fadeOut = Math.min(1, (lifetimes[i] - ages[i]) / 2);
   const fade = fadeIn * fadeOut;

   // Turbulence: gentle sinusoidal wobble
   const turb = config.turbulence;
   const p = phases[i];
   const wobbleX = Math.sin(seconds * 0.7 + p) * turb;
   const wobbleY = Math.cos(seconds * 0.5 + p * 1.3) * turb * 0.5;
   const wobbleZ = Math.sin(seconds * 0.6 + p * 0.7) * turb;

   positions[i * 3] += (velocities[i * 3] + wobbleX) * dt;
   positions[i * 3 + 1] += (velocities[i * 3 + 1] + wobbleY) * dt;
   positions[i * 3 + 2] += (velocities[i * 3 + 2] + wobbleZ) * dt;

   // Keep particles in bounds
   const px = positions[i * 3], pz = positions[i * 3 + 2];
   const distXZ = Math.hypot(px, pz);
   if (distXZ > PARTICLE_OUTER || distXZ < PARTICLE_INNER * 0.9 ||
       positions[i * 3 + 1] > PARTICLE_CEILING ||
       positions[i * 3 + 1] < PARTICLE_FLOOR) {
    respawn(i);
    continue;
   }

   // Enforce board clearance at board height
   const py = positions[i * 3 + 1];
   if (py > -2.5 && py < 2.5 && distXZ < BOARD_CLEARANCE) {
    // Push outward
    const scale = BOARD_CLEARANCE / distXZ;
    positions[i * 3] *= scale;
    positions[i * 3 + 2] *= scale;
   }

   // Animated size with fade
   sizes[i] = (config.sizeRange[0] + (config.sizeRange[1] - config.sizeRange[0]) *
    (0.5 + 0.5 * Math.sin(seconds * 1.2 + p))) * fade;
  }
  geometry.attributes.position.needsUpdate = true;
  geometry.attributes.size.needsUpdate = true;
 }

 initAll(0);

 return {
  points,
  initAll,
  update,
  setDrawRange(count) { geometry.setDrawRange(0, Math.min(maxCount, count)); },
  dispose() {
   parent.remove(points);
   geometry.dispose();
   material.dispose();
  }
 };
}

/* ── Animated rim vegetation per biome ──────────────────────────────── */

function createRimVegetation(THREE, parent, biomeId) {
 const maxCount = VEG_COUNTS.cinematic;
 const rng = rngFrom(hashSeed(biomeId + ':vegetation'));
 const dummy = new THREE.Object3D();

 // Biome-specific geometry and materials
 let geometry, material, animStyle;

 if (biomeId === 'verdant') {
  // Swaying fern fronds
  geometry = new THREE.ConeGeometry(0.18, 0.85, 5);
  material = new THREE.MeshStandardMaterial({
   color: 0x4da65a, roughness: 0.92, metalness: 0.0,
   side: THREE.DoubleSide, flatShading: true
  });
  animStyle = 'sway';
 } else if (biomeId === 'polar') {
  // Ice crystal spikes
  geometry = new THREE.ConeGeometry(0.10, 0.65, 4);
  material = new THREE.MeshStandardMaterial({
   color: 0x8ecce6, roughness: 0.18, metalness: 0.08,
   transparent: true, opacity: 0.85, flatShading: true
  });
  animStyle = 'grow';
 } else if (biomeId === 'nebula') {
  // Pulsing crystal shards
  geometry = new THREE.OctahedronGeometry(0.16, 0);
  material = new THREE.MeshStandardMaterial({
   color: 0xbb66aa, roughness: 0.25, metalness: 0.15,
   emissive: 0x662255, emissiveIntensity: 0.4, flatShading: true
  });
  animStyle = 'pulse';
 } else {
  // orbital: status lights / small antenna dishes
  geometry = new THREE.SphereGeometry(0.09, 6, 4);
  material = new THREE.MeshStandardMaterial({
   color: 0x55ccee, roughness: 0.28, metalness: 0.4,
   emissive: 0x227799, emissiveIntensity: 0.5
  });
  animStyle = 'blink';
 }

 const mesh = new THREE.InstancedMesh(geometry, material, maxCount);
 mesh.name = 'living-vegetation-' + biomeId;
 mesh.frustumCulled = false;
 mesh.visible = false;
 parent.add(mesh);

 // Assign per-instance color variation
 const baseColor = new THREE.Color(material.color.getHex());
 const brightColor = new THREE.Color(material.color.getHex()).multiplyScalar(1.3);

 // Store base transforms for animation
 const basePositions = [];
 const baseScales = [];
 const animPhases = [];

 for (let i = 0; i < maxCount; i++) {
  const angle = rng() * Math.PI * 2;
  const radius = VEG_INNER + rng() * (VEG_OUTER - VEG_INNER);
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  const y = biomeId === 'verdant' ? -0.12 + rng() * 0.08 :
            biomeId === 'polar' ? -0.15 + rng() * 0.06 :
            biomeId === 'nebula' ? -0.10 + rng() * 0.10 :
            -0.08 + rng() * 0.05;

  const scale = 0.6 + rng() * 1.1;
  basePositions.push(x, y, z);
  baseScales.push(scale);
  animPhases.push(rng() * Math.PI * 2);

  dummy.position.set(x, y, z);
  dummy.rotation.set(
   (rng() - 0.5) * (biomeId === 'verdant' ? 0.6 : 0.3),
   rng() * Math.PI * 2,
   (rng() - 0.5) * (biomeId === 'verdant' ? 0.5 : 0.2)
  );
  dummy.scale.setScalar(scale);
  dummy.updateMatrix();
  mesh.setMatrixAt(i, dummy.matrix);

  const col = baseColor.clone().lerp(brightColor, rng());
  mesh.setColorAt(i, col);
 }
 mesh.instanceMatrix.needsUpdate = true;
 if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

 let visibleCount = VEG_COUNTS.balanced;

 function update(seconds) {
  const count = Math.min(visibleCount, maxCount);
  for (let i = 0; i < count; i++) {
   const px = basePositions[i * 3];
   const py = basePositions[i * 3 + 1];
   const pz = basePositions[i * 3 + 2];
   const sc = baseScales[i];
   const phase = animPhases[i];

   if (animStyle === 'sway') {
    // Gentle swaying like wind through ferns
    const swayX = Math.sin(seconds * 0.8 + phase) * 0.12;
    const swayZ = Math.cos(seconds * 0.6 + phase * 1.3) * 0.09;
    dummy.position.set(px + swayX * sc * 0.3, py, pz + swayZ * sc * 0.3);
    dummy.rotation.set(
     swayX * 0.6 + Math.sin(phase) * 0.2,
     phase,
     swayZ * 0.5
    );
    dummy.scale.setScalar(sc);
   } else if (animStyle === 'grow') {
    // Slowly growing/receding ice crystals
    const growFactor = 0.7 + 0.3 * Math.sin(seconds * 0.15 + phase);
    dummy.position.set(px, py, pz);
    dummy.rotation.set(Math.sin(phase) * 0.15, phase, Math.cos(phase) * 0.12);
    dummy.scale.set(sc * 0.8, sc * growFactor * 1.2, sc * 0.8);
   } else if (animStyle === 'pulse') {
    // Pulsing energy crystals
    const pulse = 0.85 + 0.15 * Math.sin(seconds * 1.5 + phase);
    dummy.position.set(px, py + Math.sin(seconds * 0.4 + phase) * 0.04, pz);
    dummy.rotation.set(
     seconds * 0.07 + phase,
     seconds * 0.12 + phase * 0.7,
     0
    );
    dummy.scale.setScalar(sc * pulse);
   } else {
    // Blink: orbital status lights
    const blink = Math.sin(seconds * 2.2 + phase) > 0.3 ? 1.0 : 0.4;
    dummy.position.set(px, py, pz);
    dummy.rotation.set(0, seconds * 0.3 + phase, 0);
    dummy.scale.setScalar(sc * blink);
   }

   dummy.updateMatrix();
   mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;

  // Animated emissive for pulsing biomes
  if (animStyle === 'pulse') {
   material.emissiveIntensity = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(seconds * 1.1));
  } else if (animStyle === 'blink') {
   material.emissiveIntensity = 0.3 + 0.4 * (0.5 + 0.5 * Math.sin(seconds * 2.5));
  }
 }

 return {
  mesh,
  update,
  setVisible(count) { visibleCount = count; mesh.count = Math.min(count, maxCount); },
  dispose() {
   parent.remove(mesh);
   geometry.dispose();
   material.dispose();
  }
 };
}

/* ── Firefly / beacon accent lights ─────────────────────────────────── */

function createAccentLights(THREE, parent, biomeId) {
 const count = 12;
 const rng = rngFrom(hashSeed(biomeId + ':accents'));

 const config = {
  orbital: { color: 0x55ccee, emissive: 0x22aacc, intensity: 0.6, speed: 2.0, radius: [13, 20] },
  verdant: { color: 0xaaff77, emissive: 0x55cc33, intensity: 0.5, speed: 0.6, radius: [12, 18] },
  polar:   { color: 0x88ddff, emissive: 0x4499bb, intensity: 0.3, speed: 0.8, radius: [14, 22] },
  nebula:  { color: 0xff88cc, emissive: 0xaa4488, intensity: 0.7, speed: 1.2, radius: [13, 19] }
 }[biomeId];

 const geometry = new THREE.SphereGeometry(0.06, 4, 3);
 const material = new THREE.MeshBasicMaterial({
  color: config.color,
  transparent: true,
  opacity: 0.8,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  fog: false
 });

 const mesh = new THREE.InstancedMesh(geometry, material, count);
 mesh.name = 'living-accent-lights-' + biomeId;
 mesh.frustumCulled = false;
 mesh.visible = false;
 parent.add(mesh);

 const dummy = new THREE.Object3D();
 const lightData = [];

 for (let i = 0; i < count; i++) {
  const angle = rng() * Math.PI * 2;
  const radius = config.radius[0] + rng() * (config.radius[1] - config.radius[0]);
  const height = -1 + rng() * 6;
  const phase = rng() * Math.PI * 2;
  const orbitSpeed = (0.02 + rng() * 0.04) * (rng() > 0.5 ? 1 : -1);
  const bobSpeed = 0.3 + rng() * 0.5;
  const bobAmp = 0.3 + rng() * 0.8;
  const baseSize = 0.5 + rng() * 1.5;

  lightData.push({ angle, radius, height, phase, orbitSpeed, bobSpeed, bobAmp, baseSize });

  const col = new THREE.Color(config.color).multiplyScalar(0.7 + rng() * 0.6);
  mesh.setColorAt(i, col);
 }
 if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

 function update(seconds) {
  for (let i = 0; i < count; i++) {
   const d = lightData[i];
   const a = d.angle + seconds * d.orbitSpeed;
   const x = Math.cos(a) * d.radius;
   const z = Math.sin(a) * d.radius;
   const y = d.height + Math.sin(seconds * d.bobSpeed + d.phase) * d.bobAmp;

   // Flickering intensity
   const flicker = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(seconds * config.speed + d.phase));
   const pulse = biomeId === 'verdant'
    ? (Math.sin(seconds * 0.8 + d.phase * 3) > 0.6 ? 1.8 : 0.3) // firefly blink
    : flicker;

   dummy.position.set(x, y, z);
   dummy.scale.setScalar(d.baseSize * pulse);
   dummy.updateMatrix();
   mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
 }

 return {
  mesh,
  update,
  dispose() {
   parent.remove(mesh);
   geometry.dispose();
   material.dispose();
  }
 };
}

/* ── Orbital-specific animated antenna dishes ───────────────────────── */

function createOrbitalAntennas(THREE, parent) {
 const count = 6;
 const rng = rngFrom(hashSeed('orbital:antennas'));

 const group = new THREE.Group();
 group.name = 'living-orbital-antennas';
 group.visible = false;
 parent.add(group);

 const dishMat = new THREE.MeshStandardMaterial({
  color: 0x445566, metalness: 0.7, roughness: 0.35, side: THREE.DoubleSide
 });
 const mastMat = new THREE.MeshStandardMaterial({
  color: 0x556677, metalness: 0.6, roughness: 0.4
 });
 const tipMat = new THREE.MeshStandardMaterial({
  color: 0x55ccee, emissive: 0x227799, emissiveIntensity: 0.5,
  metalness: 0.3, roughness: 0.3
 });

 const dishes = [];
 for (let i = 0; i < count; i++) {
  const angle = rng() * Math.PI * 2;
  const radius = 10.8 + rng() * 1.5;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  const rotSpeed = (0.15 + rng() * 0.25) * (rng() > 0.5 ? 1 : -1);
  const phase = rng() * Math.PI * 2;
  const height = 0.4 + rng() * 0.6;

  const antenna = new THREE.Group();
  antenna.position.set(x, -0.3, z);
  antenna.userData.scenicOnly = true;

  // Mast
  const mast = new THREE.Mesh(
   new THREE.CylinderGeometry(0.03, 0.04, height, 5),
   mastMat
  );
  mast.position.y = height / 2;
  antenna.add(mast);

  // Dish
  const dish = new THREE.Mesh(
   new THREE.CircleGeometry(0.15 + rng() * 0.10, 8),
   dishMat
  );
  dish.position.y = height;
  dish.rotation.x = -0.4;
  antenna.add(dish);

  // Tip light
  const tip = new THREE.Mesh(
   new THREE.SphereGeometry(0.035, 4, 3),
   tipMat
  );
  tip.position.y = height + 0.05;
  antenna.add(tip);

  group.add(antenna);
  dishes.push({ antenna, rotSpeed, phase });
 }

 function update(seconds) {
  for (const d of dishes) {
   d.antenna.rotation.y = seconds * d.rotSpeed + d.phase;
  }
  tipMat.emissiveIntensity = 0.3 + 0.4 * (0.5 + 0.5 * Math.sin(seconds * 2.0));
 }

 return {
  group,
  update,
  dispose() {
   parent.remove(group);
   dishMat.dispose();
   mastMat.dispose();
   tipMat.dispose();
   for (const d of dishes) {
    d.antenna.traverse(node => {
     if (node.isMesh) node.geometry.dispose();
    });
   }
  }
 };
}

/* ── Main living world controller ───────────────────────────────────── */

export function createLivingWorld(THREE, scene, world, options = {}) {
 const glowTexture = makeGlowTexture(THREE);

 // Create all biome particle systems
 const particleSystems = {};
 const vegetationSets = {};
 const accentLights = {};

 for (const biomeId of ['orbital', 'verdant', 'polar', 'nebula']) {
  particleSystems[biomeId] = createParticleSystem(THREE, scene, biomeId, glowTexture);
  vegetationSets[biomeId] = createRimVegetation(THREE, world, biomeId);
  accentLights[biomeId] = createAccentLights(THREE, scene, biomeId);
 }

 // Orbital-specific antennas
 const antennas = createOrbitalAntennas(THREE, world);

 let activeBiome = null;
 let quality = 'balanced';
 let lastTime = 0;
 let disposed = false;

 function setQuality(profile) {
  quality = PARTICLE_COUNTS[profile] ? profile : 'balanced';
  for (const biomeId of Object.keys(particleSystems)) {
   particleSystems[biomeId].setDrawRange(PARTICLE_COUNTS[quality]);
   vegetationSets[biomeId].setVisible(VEG_COUNTS[quality]);
  }
 }

 function setLevel(biomeId, packId, index, seed = 0) {
  if (!particleSystems[biomeId]) return;

  // Hide previous
  if (activeBiome && activeBiome !== biomeId) {
   particleSystems[activeBiome].points.visible = false;
   vegetationSets[activeBiome].mesh.visible = false;
   accentLights[activeBiome].mesh.visible = false;
  }
  antennas.group.visible = biomeId === 'orbital';

  activeBiome = biomeId;

  // Reinitialize particles with level seed
  const combinedSeed = hashSeed(packId + ':' + index + ':' + seed);
  particleSystems[biomeId].initAll(combinedSeed);

  // Show active
  particleSystems[biomeId].points.visible = true;
  vegetationSets[biomeId].mesh.visible = true;
  accentLights[biomeId].mesh.visible = true;

  // Apply quality
  particleSystems[biomeId].setDrawRange(PARTICLE_COUNTS[quality]);
  vegetationSets[biomeId].setVisible(VEG_COUNTS[quality]);
 }

 function update(seconds, reducedMotion = false) {
  if (!activeBiome || disposed) return;

  const dt = Math.min(seconds - lastTime, 0.1); // cap delta
  lastTime = seconds;

  if (dt <= 0) {
   lastTime = seconds;
   return;
  }

  if (!reducedMotion) {
   particleSystems[activeBiome].update(dt, seconds);
   vegetationSets[activeBiome].update(seconds);
   accentLights[activeBiome].update(seconds);
   if (activeBiome === 'orbital') antennas.update(seconds);
  }
 }

 function getStats() {
  if (!activeBiome) return { biome: null, particles: 0, vegetation: 0, accents: 0 };
  return {
   biome: activeBiome,
   particles: PARTICLE_COUNTS[quality],
   vegetation: VEG_COUNTS[quality],
   accents: 12,
   antennas: activeBiome === 'orbital' ? 6 : 0
  };
 }

 function dispose() {
  if (disposed) return;
  disposed = true;
  for (const biomeId of Object.keys(particleSystems)) {
   particleSystems[biomeId].dispose();
   vegetationSets[biomeId].dispose();
   accentLights[biomeId].dispose();
  }
  antennas.dispose();
  glowTexture.dispose();
 }

 setQuality('balanced');

 return { setLevel, setQuality, update, getStats, dispose };
}
