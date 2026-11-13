/**
 * Emissive rim strip around the board perimeter.
 *
 * Adds a thin glowing edge that frames the play area with the biome's
 * accent color. Includes 4 subtle corner point lights for ambient color
 * bleed onto nearby surfaces.
 *
 * Usage:
 *   const rim = createBoardEdgeGlow(THREE, world, {tileSize: 1.3, half: 7});
 *   rim.setTheme(theme);      // call on level change
 *   rim.update(seconds);       // call in animate loop for pulse
 *   rim.dispose();
 */

const BIOME_EDGE_COLOR = {
  orbital:  0x1fa9c5,
  verdant:  0x3ddc84,
  polar:    0x5bc0eb,
  nebula:   0xc06dde,
};

const BIOME_EDGE_INTENSITY = {
  orbital:  1.4,
  verdant:  1.2,
  polar:    1.6,
  nebula:   1.8,
};

export function createBoardEdgeGlow(THREE, parent, {tileSize = 1.3, half = 7} = {}) {
  const boardHalf = half * tileSize + tileSize * 0.5;
  const edgeWidth = 0.06;
  const edgeHeight = 0.12;
  const deckY = -0.24;

  const edgeMaterial = new THREE.MeshStandardMaterial({
    color: 0x1fa9c5,
    emissive: 0x1fa9c5,
    emissiveIntensity: 1.4,
    metalness: 0.3,
    roughness: 0.2,
    transparent: true,
    opacity: 0.9,
    toneMapped: false,
  });

  const group = new THREE.Group();
  group.name = 'board-edge-glow';
  parent.add(group);

  // Four edge strips (N, S, E, W)
  const edges = [];
  const stripLength = boardHalf * 2 + edgeWidth * 2;

  // North edge (negative Z)
  const northGeo = new THREE.BoxGeometry(stripLength, edgeHeight, edgeWidth);
  const north = new THREE.Mesh(northGeo, edgeMaterial);
  north.position.set(0, deckY, -boardHalf - edgeWidth / 2);
  edges.push(north);

  // South edge (positive Z)
  const south = new THREE.Mesh(northGeo, edgeMaterial);
  south.position.set(0, deckY, boardHalf + edgeWidth / 2);
  edges.push(south);

  // East edge (positive X)
  const sideGeo = new THREE.BoxGeometry(edgeWidth, edgeHeight, stripLength);
  const east = new THREE.Mesh(sideGeo, edgeMaterial);
  east.position.set(boardHalf + edgeWidth / 2, deckY, 0);
  edges.push(east);

  // West edge (negative X)
  const west = new THREE.Mesh(sideGeo, edgeMaterial);
  west.position.set(-boardHalf - edgeWidth / 2, deckY, 0);
  edges.push(west);

  for (const e of edges) {
    e.renderOrder = 4;
    group.add(e);
  }

  // Corner accent lights — very subtle color bleed
  const cornerLights = [];
  const cornerPositions = [
    [-boardHalf, deckY + 0.5, -boardHalf],
    [ boardHalf, deckY + 0.5, -boardHalf],
    [-boardHalf, deckY + 0.5,  boardHalf],
    [ boardHalf, deckY + 0.5,  boardHalf],
  ];
  for (const [cx, cy, cz] of cornerPositions) {
    const light = new THREE.PointLight(0x1fa9c5, 3, 6, 2);
    light.position.set(cx, cy, cz);
    group.add(light);
    cornerLights.push(light);
  }

  let pulsePhase = 0;

  function setTheme(theme) {
    const biomeId = theme?.id || 'orbital';
    const color = BIOME_EDGE_COLOR[biomeId] || 0x1fa9c5;
    const intensity = BIOME_EDGE_INTENSITY[biomeId] || 1.4;

    edgeMaterial.color.setHex(color);
    edgeMaterial.emissive.setHex(color);
    edgeMaterial.emissiveIntensity = intensity;

    for (const light of cornerLights) {
      light.color.setHex(color);
    }
  }

  function update(seconds) {
    // Gentle breathing pulse on edge glow
    pulsePhase = seconds;
    const pulse = 1.0 + 0.15 * Math.sin(pulsePhase * 1.5);
    edgeMaterial.emissiveIntensity = (BIOME_EDGE_INTENSITY[currentBiome] || 1.4) * pulse;
    edgeMaterial.opacity = 0.85 + 0.1 * Math.sin(pulsePhase * 1.5 + 0.5);
  }

  let currentBiome = 'orbital';
  const origSetTheme = setTheme;
  function setThemeTracked(theme) {
    currentBiome = theme?.id || 'orbital';
    origSetTheme(theme);
  }

  function dispose() {
    parent.remove(group);
    northGeo.dispose();
    sideGeo.dispose();
    edgeMaterial.dispose();
  }

  return {
    setTheme: setThemeTracked,
    setQuality(mode){for(const light of cornerLights)light.visible=mode==='cinematic'},
    update,
    dispose,
    group,
  };
}
