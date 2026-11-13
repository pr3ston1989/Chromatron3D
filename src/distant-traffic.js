/**
 * Small ambient craft / drifting particles far outside the 15x15 puzzle grid.
 * Each biome owns a fixed set of objects; level changes reuse their meshes.
 * No scenic object is included in raycast targets or optical physics.
 */
export function createDistantTraffic(THREE, sky, theme, random, geometry) {
 const root = new THREE.Group();
 root.name = 'environment-distant-traffic';
 sky.add(root);

 const hull = new THREE.MeshStandardMaterial({
  color: theme.accent, emissive: theme.edge, emissiveIntensity: .24,
  metalness: theme.decor === 'moss' ? .08 : .63, roughness: .38,
  flatShading: true
 });
 const glow = new THREE.MeshBasicMaterial({
  color: theme.edge, transparent: true, opacity: .28, depthWrite: false,
  fog: false, blending: THREE.AdditiveBlending
 });
 const tracks = [];
 for(let i = 0; i < 4; i++){
  const craft = new THREE.Group();
  craft.name = 'distant-drifter-' + i;
  const body = new THREE.Mesh(geometry.body, hull);
  body.scale.set(
   theme.decor === 'moss' ? .56 : .94,
   theme.decor === 'ice' ? 1.65 : .6,
   theme.decor === 'crystal' ? 1.3 : .86
  );
  craft.add(body);
  const wake = new THREE.Mesh(geometry.wake, glow);
  wake.rotation.x = Math.PI / 2;
  wake.position.z = 1.45;
  wake.scale.setScalar(theme.decor === 'moss' ? .5 : 1);
  craft.add(wake);
  if(theme.decor === 'scrap'){
   const wings = new THREE.Mesh(geometry.wings, hull);
   wings.position.z = -.06;
   craft.add(wings);
  }
  root.add(craft);
  tracks.push({craft, radius: 0, height: 0, phase: 0, speed: 0});
 }
 function update(seconds, reducedMotion = false){
  if(reducedMotion) return;
  for(const [i, track] of tracks.entries()){
   if(!track.craft.visible) continue;
   const angle = track.phase + track.speed * seconds;
   // The path is a wide orbit: no flight through the puzzle / sight lines.
   const radius = track.radius + Math.sin(seconds * .028 + i) * .8;
   track.craft.position.set(
    Math.cos(angle) * radius,
    track.height + Math.sin(seconds * .16 + track.phase) * 1.1,
    Math.sin(angle) * radius
   );
   track.craft.rotation.set(0, -angle - Math.PI / 2,
    Math.sin(seconds * .18 + i) * .06);
  }
 }
 function setLayout(layoutRandom){
  for(const [i, track] of tracks.entries()){
   track.radius = 46 + layoutRandom() * 37;
   track.height = 12 + layoutRandom() * 25;
   track.phase = layoutRandom() * Math.PI * 2;
   const direction = i % 2 ? -1 : 1;
   track.speed = direction * (.007 + layoutRandom() * .012);
  }
  // An immediately valid static composition, even with reduced motion.
  update(0);
 }
 function setQuality(profile = 'balanced'){
  const limit = profile === 'performance' ? 1 :
   profile === 'cinematic' ? 4 : 2;
  for(const [i, track] of tracks.entries()) track.craft.visible = i < limit;
  update(0);
 }
 function getVisibleCount(){
  return tracks.filter(track => track.craft.visible).length;
 }
 setLayout(random);
 setQuality('balanced');
 return {root, setLayout, setQuality, update, getVisibleCount};
}
