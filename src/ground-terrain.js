/**
 * Biome-specific ground terrain extending around and beneath the floating
 * board platform. Four cached biome terrains, only one visible at a time.
 *
 * All geometry stays outside the 15×15 optical workspace (min 10.5 from center).
 * Uses InstancedMesh for efficient rendering — one draw call per element type.
 * No external textures or runtime network requests.
 */

const BOARD_CLEARANCE = 10.5;

function hashText(value) {
 let h = 2166136261;
 for (const c of String(value)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
 return h >>> 0;
}
function rngFrom(seed) {
 let state = (seed >>> 0) || 0x6d2b79f5;
 return () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 4294967296; };
}

function isSafe(x, z) {
 return Math.max(Math.abs(x), Math.abs(z)) >= BOARD_CLEARANCE;
}

/**
 * @param {object} THREE — Three.js namespace
 * @param {THREE.Group} world — parent group attached to the scene
 * @returns {{setTheme, setQuality, update, dispose}}
 */
export function createGroundTerrain(THREE, world) {
 const biomes = new Map();
 let active = null;
 let quality = 'balanced';

 // ── helpers ──────────────────────────────────────────────────────────
 function placeSafe(random, minR, maxR) {
  for (let attempt = 0; attempt < 20; attempt++) {
   const angle = random() * Math.PI * 2;
   const dist = minR + random() * (maxR - minR);
   const x = Math.cos(angle) * dist;
   const z = Math.sin(angle) * dist;
   if (isSafe(x, z)) return { x, z };
  }
  const angle = random() * Math.PI * 2;
  const dist = maxR * 0.9;
  return { x: Math.cos(angle) * dist, z: Math.sin(angle) * dist };
 }

 function makeInstanced(geometry, material, count) {
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.frustumCulled = false;
  mesh.userData.scenicOnly = true;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
 }

 function applyInstance(mesh, index, dummy, baseColor, altColor, random) {
  dummy.updateMatrix();
  mesh.setMatrixAt(index, dummy.matrix);
  if (mesh.instanceColor || baseColor) {
   const c = baseColor.clone().lerp(altColor, random() * 0.6);
   mesh.setColorAt(index, c);
  }
 }

 // ── ground ring (shared shape, biome-tinted) ────────────────────────
 function makeGroundRing(THREE, color, opacity) {
  const geo = new THREE.RingGeometry(12.5, 28, 96, 3);
  // Radial alpha falloff: strongest near platform, fading outward
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 4);
  for (let i = 0; i < pos.count; i++) {
   const px = pos.getX(i), pz = pos.getY(i); // RingGeometry is in XY plane
   const r = Math.hypot(px, pz);
   const t = Math.max(0, Math.min(1, (r - 12.5) / 15.5));
   const alpha = opacity * (1 - t * t);
   const col = new THREE.Color(color);
   colors[i * 4] = col.r;
   colors[i * 4 + 1] = col.g;
   colors[i * 4 + 2] = col.b;
   colors[i * 4 + 3] = alpha;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 4));
  const mat = new THREE.MeshStandardMaterial({
   vertexColors: true, transparent: true, opacity: 1,
   depthWrite: false, side: THREE.DoubleSide,
   metalness: 0.15, roughness: 0.7
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -2.0;
  mesh.name = 'ground-terrain-ring';
  mesh.userData.scenicOnly = true;
  return { mesh, material: mat, geometry: geo };
 }

 // ── ORBITAL terrain (industrial plates, grating, conduits) ──────────
 function buildOrbital(THREE, group, random) {
  const dummy = new THREE.Object3D();
  const baseCol = new THREE.Color(0x2a3d4d);
  const altCol = new THREE.Color(0x4a5a67);
  const accentCol = new THREE.Color(0xd9a050);
  const layers = {};

  // Large plates — flat boxes at various heights
  const plateGeo = new THREE.BoxGeometry(3.8, 0.18, 2.4);
  const plateMat = new THREE.MeshStandardMaterial({
   color: 0x344957, metalness: 0.82, roughness: 0.38, flatShading: true
  });
  const plates = makeInstanced(plateGeo, plateMat, 12);
  plates.name = 'orbital-ground-plates';
  for (let i = 0; i < 12; i++) {
   const angle = (i / 12) * Math.PI * 2 + random() * 0.3;
   const dist = 13 + random() * 8;
   dummy.position.set(Math.cos(angle) * dist, -1.85 - random() * 0.5, Math.sin(angle) * dist);
   dummy.rotation.set(0, angle + random() * 0.4, (random() - 0.5) * 0.06);
   dummy.scale.set(0.7 + random() * 0.6, 1, 0.7 + random() * 0.5);
   applyInstance(plates, i, dummy, baseCol, altCol, random);
  }
  plates.instanceMatrix.needsUpdate = true;
  if (plates.instanceColor) plates.instanceColor.needsUpdate = true;
  group.add(plates);
  layers.large = plates;

  // Medium grating sections
  const grateGeo = new THREE.BoxGeometry(1.8, 0.08, 1.2);
  const grateMat = new THREE.MeshStandardMaterial({
   color: 0x526e7a, metalness: 0.75, roughness: 0.45, flatShading: true
  });
  const grates = makeInstanced(grateGeo, grateMat, 22);
  grates.name = 'orbital-ground-grating';
  for (let i = 0; i < 22; i++) {
   const { x, z } = placeSafe(random, 11.5, 24);
   dummy.position.set(x, -1.78 - random() * 0.35, z);
   dummy.rotation.set(0, random() * Math.PI, 0);
   dummy.scale.set(0.6 + random() * 0.8, 1, 0.5 + random() * 0.7);
   applyInstance(grates, i, dummy, baseCol, new THREE.Color(0x607882), random);
  }
  grates.instanceMatrix.needsUpdate = true;
  if (grates.instanceColor) grates.instanceColor.needsUpdate = true;
  group.add(grates);
  layers.medium = grates;

  // Small rivets / bolts
  const rivetGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.06, 6);
  const rivetMat = new THREE.MeshStandardMaterial({
   color: 0x6a7d88, metalness: 0.9, roughness: 0.3
  });
  const rivets = makeInstanced(rivetGeo, rivetMat, 45);
  rivets.name = 'orbital-ground-rivets';
  for (let i = 0; i < 45; i++) {
   const { x, z } = placeSafe(random, 11.5, 22);
   dummy.position.set(x, -1.72 - random() * 0.2, z);
   dummy.rotation.set(0, 0, 0);
   dummy.scale.set(0.7 + random() * 0.8, 1, 0.7 + random() * 0.8);
   dummy.updateMatrix();
   rivets.setMatrixAt(i, dummy.matrix);
  }
  rivets.instanceMatrix.needsUpdate = true;
  group.add(rivets);
  layers.small = rivets;

  // Warning stripes (accent)
  const stripeGeo = new THREE.BoxGeometry(2.5, 0.025, 0.12);
  const stripeMat = new THREE.MeshStandardMaterial({
   color: 0xe7a650, emissive: 0x5a3810, emissiveIntensity: 0.35,
   metalness: 0.4, roughness: 0.5
  });
  const stripes = makeInstanced(stripeGeo, stripeMat, 8);
  stripes.name = 'orbital-ground-stripes';
  for (let i = 0; i < 8; i++) {
   const angle = (i / 8) * Math.PI * 2;
   const dist = 12.5 + random() * 4;
   dummy.position.set(Math.cos(angle) * dist, -1.74, Math.sin(angle) * dist);
   dummy.rotation.set(0, angle + Math.PI / 2, 0);
   dummy.scale.set(0.8 + random() * 0.5, 1, 1);
   dummy.updateMatrix();
   stripes.setMatrixAt(i, dummy.matrix);
  }
  stripes.instanceMatrix.needsUpdate = true;
  group.add(stripes);

  const ring = makeGroundRing(THREE, 0x1a2e3d, 0.18);
  group.add(ring.mesh);

  return { layers, ring, stripes, materials: [plateMat, grateMat, rivetMat, stripeMat, ring.material] };
 }

 // ── VERDANT terrain (moss, boulders, organic growth) ────────────────
 function buildVerdant(THREE, group, random) {
  const dummy = new THREE.Object3D();
  const mossBase = new THREE.Color(0x3a6b42);
  const mossAlt = new THREE.Color(0x5d9957);
  const earthBase = new THREE.Color(0x4a5540);
  const earthAlt = new THREE.Color(0x6b7a55);
  const layers = {};

  // Large boulders with mossy appearance
  const boulderGeo = new THREE.IcosahedronGeometry(1.0, 1);
  // Deform vertices for organic look
  const bPos = boulderGeo.attributes.position;
  const seed = random() * 1000;
  for (let i = 0; i < bPos.count; i++) {
   const x = bPos.getX(i), y = bPos.getY(i), z = bPos.getZ(i);
   const noise = 0.85 + 0.3 * Math.sin(x * 3.7 + seed) * Math.cos(z * 4.1 + seed);
   bPos.setXYZ(i, x * noise, y * noise * 0.7, z * noise);
  }
  boulderGeo.computeVertexNormals();
  const boulderMat = new THREE.MeshStandardMaterial({
   color: 0x4a6348, metalness: 0.02, roughness: 0.95, flatShading: true
  });
  const boulders = makeInstanced(boulderGeo, boulderMat, 10);
  boulders.name = 'verdant-ground-boulders';
  for (let i = 0; i < 10; i++) {
   const angle = (i / 10) * Math.PI * 2 + (random() - 0.5) * 0.5;
   const dist = 11.5 + random() * 8;
   dummy.position.set(Math.cos(angle) * dist, -1.5 + random() * 0.4, Math.sin(angle) * dist);
   dummy.rotation.set(random() * 0.3, random() * Math.PI * 2, random() * 0.25);
   const s = 0.6 + random() * 1.2;
   dummy.scale.set(s, s * (0.4 + random() * 0.5), s * (0.8 + random() * 0.4));
   applyInstance(boulders, i, dummy, earthBase, earthAlt, random);
  }
  boulders.instanceMatrix.needsUpdate = true;
  if (boulders.instanceColor) boulders.instanceColor.needsUpdate = true;
  group.add(boulders);
  layers.large = boulders;

  // Medium moss patches (flat discs)
  const mossGeo = new THREE.CircleGeometry(0.65, 9);
  const mossMat = new THREE.MeshStandardMaterial({
   color: 0x4d8b56, metalness: 0.0, roughness: 0.98,
   side: THREE.DoubleSide, flatShading: false
  });
  const mosses = makeInstanced(mossGeo, mossMat, 25);
  mosses.name = 'verdant-ground-moss';
  for (let i = 0; i < 25; i++) {
   const { x, z } = placeSafe(random, 10.8, 22);
   dummy.position.set(x, -1.55 - random() * 0.3, z);
   dummy.rotation.set(-Math.PI / 2 + (random() - 0.5) * 0.15, 0, random() * Math.PI * 2);
   dummy.scale.set(0.5 + random() * 1.5, 0.5 + random() * 1.5, 1);
   applyInstance(mosses, i, dummy, mossBase, mossAlt, random);
  }
  mosses.instanceMatrix.needsUpdate = true;
  if (mosses.instanceColor) mosses.instanceColor.needsUpdate = true;
  group.add(mosses);
  layers.medium = mosses;

  // Small vegetation tufts
  const tuftGeo = new THREE.ConeGeometry(0.15, 0.35, 5);
  const tuftMat = new THREE.MeshStandardMaterial({
   color: 0x5aaa65, metalness: 0.0, roughness: 0.95,
   side: THREE.DoubleSide, flatShading: true
  });
  const tufts = makeInstanced(tuftGeo, tuftMat, 50);
  tufts.name = 'verdant-ground-tufts';
  for (let i = 0; i < 50; i++) {
   const { x, z } = placeSafe(random, 10.8, 20);
   dummy.position.set(x, -1.42 - random() * 0.2, z);
   dummy.rotation.set((random() - 0.5) * 0.5, random() * Math.PI * 2, (random() - 0.5) * 0.4);
   dummy.scale.set(0.5 + random() * 1.0, 0.6 + random() * 1.4, 0.5 + random() * 1.0);
   applyInstance(tufts, i, dummy, new THREE.Color(0x4da85a), new THREE.Color(0x7bc87a), random);
  }
  tufts.instanceMatrix.needsUpdate = true;
  if (tufts.instanceColor) tufts.instanceColor.needsUpdate = true;
  group.add(tufts);
  layers.small = tufts;

  // Fallen leaf litter
  const leafGeo = new THREE.CircleGeometry(0.08, 5);
  const leafMat = new THREE.MeshStandardMaterial({
   color: 0x8a7a3a, metalness: 0.0, roughness: 0.99,
   side: THREE.DoubleSide, transparent: true, opacity: 0.85
  });
  const leaves = makeInstanced(leafGeo, leafMat, 35);
  leaves.name = 'verdant-ground-leaves';
  for (let i = 0; i < 35; i++) {
   const { x, z } = placeSafe(random, 10.8, 18);
   dummy.position.set(x, -1.50 - random() * 0.15, z);
   dummy.rotation.set(-Math.PI / 2 + random() * 0.3, random() * Math.PI * 2, random() * 0.2);
   dummy.scale.set(0.6 + random() * 1.2, 0.6 + random() * 1.2, 1);
   dummy.updateMatrix();
   leaves.setMatrixAt(i, dummy.matrix);
   leaves.setColorAt(i, new THREE.Color(0x7a6a2a).lerp(new THREE.Color(0xaa9948), random()));
  }
  leaves.instanceMatrix.needsUpdate = true;
  leaves.instanceColor.needsUpdate = true;
  group.add(leaves);

  const ring = makeGroundRing(THREE, 0x1e3622, 0.14);
  group.add(ring.mesh);

  return { layers, ring, leaves, materials: [boulderMat, mossMat, tuftMat, leafMat, ring.material] };
 }

 // ── POLAR terrain (ice spires, frozen pools, frost rocks) ───────────
 function buildPolar(THREE, group, random) {
  const dummy = new THREE.Object3D();
  const iceBase = new THREE.Color(0x7fc8e2);
  const iceAlt = new THREE.Color(0xbce8f5);
  const frostBase = new THREE.Color(0xc0d8e6);
  const frostAlt = new THREE.Color(0xe4f2f8);
  const layers = {};

  // Large ice spires
  const spireGeo = new THREE.ConeGeometry(0.45, 2.8, 6);
  const spireMat = new THREE.MeshStandardMaterial({
   color: 0x8ad4ee, metalness: 0.05, roughness: 0.15,
   transparent: true, opacity: 0.88, flatShading: true
  });
  const spires = makeInstanced(spireGeo, spireMat, 10);
  spires.name = 'polar-ground-spires';
  for (let i = 0; i < 10; i++) {
   const angle = (i / 10) * Math.PI * 2 + (random() - 0.5) * 0.4;
   const dist = 11.5 + random() * 7;
   dummy.position.set(
    Math.cos(angle) * dist,
    -1.4 + random() * 0.3,
    Math.sin(angle) * dist
   );
   dummy.rotation.set((random() - 0.5) * 0.25, random() * Math.PI, (random() - 0.5) * 0.2);
   const h = 0.5 + random() * 1.2;
   dummy.scale.set(0.4 + random() * 0.6, h, 0.4 + random() * 0.6);
   applyInstance(spires, i, dummy, iceBase, iceAlt, random);
  }
  spires.instanceMatrix.needsUpdate = true;
  if (spires.instanceColor) spires.instanceColor.needsUpdate = true;
  group.add(spires);
  layers.large = spires;

  // Frozen pools (flat circles)
  const poolGeo = new THREE.CircleGeometry(1.1, 12);
  const poolMat = new THREE.MeshStandardMaterial({
   color: 0x9dd5e8, metalness: 0.12, roughness: 0.08,
   transparent: true, opacity: 0.72, side: THREE.DoubleSide
  });
  const pools = makeInstanced(poolGeo, poolMat, 18);
  pools.name = 'polar-ground-pools';
  for (let i = 0; i < 18; i++) {
   const { x, z } = placeSafe(random, 11.5, 24);
   dummy.position.set(x, -1.82 - random() * 0.3, z);
   dummy.rotation.set(-Math.PI / 2, 0, random() * Math.PI * 2);
   dummy.scale.set(0.4 + random() * 1.0, 0.4 + random() * 1.0, 1);
   applyInstance(pools, i, dummy, new THREE.Color(0x8bbdd4), new THREE.Color(0xc8eaf5), random);
  }
  pools.instanceMatrix.needsUpdate = true;
  if (pools.instanceColor) pools.instanceColor.needsUpdate = true;
  group.add(pools);
  layers.medium = pools;

  // Small ice shards + frost rocks
  const shardGeo = new THREE.OctahedronGeometry(0.22, 0);
  const shardMat = new THREE.MeshStandardMaterial({
   color: 0xb8e5f2, metalness: 0.06, roughness: 0.12,
   transparent: true, opacity: 0.82, flatShading: true
  });
  const shards = makeInstanced(shardGeo, shardMat, 45);
  shards.name = 'polar-ground-shards';
  for (let i = 0; i < 45; i++) {
   const { x, z } = placeSafe(random, 10.8, 22);
   dummy.position.set(x, -1.55 - random() * 0.25, z);
   dummy.rotation.set(random() * Math.PI, random() * Math.PI, random() * Math.PI);
   const s = 0.4 + random() * 1.3;
   dummy.scale.set(s * 0.7, s * (0.5 + random()), s * 0.6);
   applyInstance(shards, i, dummy, frostBase, frostAlt, random);
  }
  shards.instanceMatrix.needsUpdate = true;
  if (shards.instanceColor) shards.instanceColor.needsUpdate = true;
  group.add(shards);
  layers.small = shards;

  const ring = makeGroundRing(THREE, 0x1a3048, 0.16);
  group.add(ring.mesh);

  return { layers, ring, shimmerMat: spireMat, poolMat, materials: [spireMat, poolMat, shardMat, ring.material] };
 }

 // ── NEBULA terrain (crystals, basalt columns, glowing veins) ────────
 function buildNebula(THREE, group, random) {
  const dummy = new THREE.Object3D();
  const crystalBase = new THREE.Color(0x8850a8);
  const crystalAlt = new THREE.Color(0xc875b8);
  const basaltBase = new THREE.Color(0x2a2238);
  const basaltAlt = new THREE.Color(0x3d3050);
  const layers = {};

  // Large crystal formations
  const crystalGeo = new THREE.OctahedronGeometry(0.8, 0);
  const crystalMat = new THREE.MeshStandardMaterial({
   color: 0x9863b8, metalness: 0.19, roughness: 0.23,
   emissive: 0x6a2888, emissiveIntensity: 0.25, flatShading: true
  });
  const crystals = makeInstanced(crystalGeo, crystalMat, 12);
  crystals.name = 'nebula-ground-crystals';
  for (let i = 0; i < 12; i++) {
   const angle = (i / 12) * Math.PI * 2 + (random() - 0.5) * 0.35;
   const dist = 11.5 + random() * 8;
   dummy.position.set(
    Math.cos(angle) * dist,
    -1.3 + random() * 0.5,
    Math.sin(angle) * dist
   );
   dummy.rotation.set(
    (random() - 0.5) * 0.6,
    random() * Math.PI * 2,
    (random() - 0.5) * 0.4
   );
   const s = 0.6 + random() * 1.4;
   dummy.scale.set(s * 0.5, s * (1.0 + random() * 0.8), s * 0.5);
   applyInstance(crystals, i, dummy, crystalBase, crystalAlt, random);
  }
  crystals.instanceMatrix.needsUpdate = true;
  if (crystals.instanceColor) crystals.instanceColor.needsUpdate = true;
  group.add(crystals);
  layers.large = crystals;

  // Basalt hexagonal columns
  const colGeo = new THREE.CylinderGeometry(0.28, 0.3, 1.2, 6);
  const colMat = new THREE.MeshStandardMaterial({
   color: 0x2e2540, metalness: 0.55, roughness: 0.65, flatShading: true
  });
  const columns = makeInstanced(colGeo, colMat, 20);
  columns.name = 'nebula-ground-basalt';
  for (let i = 0; i < 20; i++) {
   const { x, z } = placeSafe(random, 11.0, 22);
   dummy.position.set(x, -2.0 + random() * 0.6, z);
   dummy.rotation.set(0, random() * Math.PI / 3, 0);
   const h = 0.4 + random() * 1.0;
   dummy.scale.set(0.6 + random() * 0.6, h, 0.6 + random() * 0.6);
   applyInstance(columns, i, dummy, basaltBase, basaltAlt, random);
  }
  columns.instanceMatrix.needsUpdate = true;
  if (columns.instanceColor) columns.instanceColor.needsUpdate = true;
  group.add(columns);
  layers.medium = columns;

  // Small crystal fragments
  const fragGeo = new THREE.OctahedronGeometry(0.18, 0);
  const fragMat = new THREE.MeshStandardMaterial({
   color: 0xc47dab, metalness: 0.14, roughness: 0.28,
   emissive: 0x7a2868, emissiveIntensity: 0.2, flatShading: true
  });
  const frags = makeInstanced(fragGeo, fragMat, 40);
  frags.name = 'nebula-ground-fragments';
  for (let i = 0; i < 40; i++) {
   const { x, z } = placeSafe(random, 10.8, 20);
   dummy.position.set(x, -1.5 - random() * 0.3, z);
   dummy.rotation.set(random() * Math.PI, random() * Math.PI, random() * Math.PI);
   const s = 0.4 + random() * 1.0;
   dummy.scale.set(s, s * (0.5 + random() * 1.0), s * 0.7);
   applyInstance(frags, i, dummy, new THREE.Color(0xa660a0), new THREE.Color(0xd890c0), random);
  }
  frags.instanceMatrix.needsUpdate = true;
  if (frags.instanceColor) frags.instanceColor.needsUpdate = true;
  group.add(frags);
  layers.small = frags;

  // Glowing vein lines on the ground
  const veinGeo = new THREE.BoxGeometry(3.0, 0.02, 0.06);
  const veinMat = new THREE.MeshBasicMaterial({
   color: 0xdf83b6, transparent: true, opacity: 0.4,
   depthWrite: false, blending: THREE.AdditiveBlending
  });
  const veins = makeInstanced(veinGeo, veinMat, 14);
  veins.name = 'nebula-ground-veins';
  for (let i = 0; i < 14; i++) {
   const { x, z } = placeSafe(random, 11.5, 22);
   dummy.position.set(x, -1.74, z);
   dummy.rotation.set(0, random() * Math.PI, 0);
   dummy.scale.set(0.5 + random() * 1.2, 1, 1);
   dummy.updateMatrix();
   veins.setMatrixAt(i, dummy.matrix);
  }
  veins.instanceMatrix.needsUpdate = true;
  group.add(veins);

  const ring = makeGroundRing(THREE, 0x1e1028, 0.15);
  group.add(ring.mesh);

  return {
   layers, ring, veins, veinMat,
   crystalMat, fragMat,
   materials: [crystalMat, colMat, fragMat, veinMat, ring.material]
  };
 }

 // ── build all four biomes (cached, only one visible) ────────────────
 const BIOME_BUILDERS = { orbital: buildOrbital, verdant: buildVerdant, polar: buildPolar, nebula: buildNebula };
 const DECOR_MAP = { scrap: 'orbital', moss: 'verdant', ice: 'polar', crystal: 'nebula' };

 for (const [id, builder] of Object.entries(BIOME_BUILDERS)) {
  const group = new THREE.Group();
  group.name = 'ground-terrain-' + id;
  group.visible = false;
  world.add(group);
  const random = rngFrom(hashText('ground-terrain:' + id));
  const data = builder(THREE, group, random);
  biomes.set(id, { group, ...data });
 }

 // ── quality scaling ─────────────────────────────────────────────────
 function applyQuality() {
  for (const [, data] of biomes) {
   const { layers } = data;
   if (layers.large) layers.large.visible = true;
   if (layers.medium) layers.medium.visible = quality !== 'performance';
   if (layers.small) layers.small.visible = quality === 'cinematic';
  }
 }

 function setTheme(theme) {
  if (!theme) return;
  const id = DECOR_MAP[theme.decor] || theme.id;
  for (const [biomeId, data] of biomes) {
   data.group.visible = biomeId === id;
  }
  active = biomes.get(id) || null;
  applyQuality();
 }

 function setQuality(profile) {
  quality = (['performance', 'balanced', 'cinematic'].includes(profile)) ? profile : 'balanced';
  applyQuality();
 }

 function update(seconds, reducedMotion) {
  if (!active || reducedMotion) return;
  // Nebula: pulsing crystal glow and vein opacity
  const nebData = biomes.get('nebula');
  if (nebData && nebData.group.visible) {
   const pulse = 0.5 + 0.5 * Math.sin(seconds * 0.6);
   if (nebData.crystalMat) nebData.crystalMat.emissiveIntensity = 0.15 + pulse * 0.2;
   if (nebData.fragMat) nebData.fragMat.emissiveIntensity = 0.12 + pulse * 0.18;
   if (nebData.veinMat) nebData.veinMat.opacity = 0.25 + pulse * 0.3;
  }
  // Polar: gentle shimmer on ice spires
  const polData = biomes.get('polar');
  if (polData && polData.group.visible) {
   const shimmer = 0.5 + 0.5 * Math.sin(seconds * 0.45);
   if (polData.shimmerMat) polData.shimmerMat.opacity = 0.82 + shimmer * 0.1;
   if (polData.poolMat) polData.poolMat.opacity = 0.65 + shimmer * 0.12;
  }
 }

 function dispose() {
  const geometries = new Set();
  const materials = new Set();
  for (const [, data] of biomes) {
   data.group.traverse(obj => {
    if (obj.isMesh || obj.isInstancedMesh) {
     if (obj.geometry) geometries.add(obj.geometry);
     const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
     for (const m of mats) if (m) materials.add(m);
    }
   });
   world.remove(data.group);
  }
  for (const g of geometries) g.dispose();
  for (const m of materials) m.dispose();
  biomes.clear();
  active = null;
 }

 applyQuality();
 return { setTheme, setQuality, update, dispose };
}
