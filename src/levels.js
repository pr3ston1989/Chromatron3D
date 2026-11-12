// Original demonstration layouts for the vertical slice.
// Never pass these off as the 200 original Chromatron puzzles.
// Directions: N=0, NE=1, E=2, SE=3, S=4, SW=5, W=6, NW=7.
// Colors: additive RGB bitmask R=1, G=2, B=4.
export const PROTOTYPE_LEVELS = [
 {title:'FIRST LIGHT',description:'A single ray. One reflector. Find the path between the emitter and resonator.',pieces:[
  ['laser',2,7,2,4],['target',7,3,0,4],['mirror',7,9,0,0]]},
 {title:'THE TURN',description:'Two reflecting surfaces can carry light around an obstacle. Click to rotate a selected optic.',pieces:[
  ['laser',2,9,2,1],['target',11,4,0,1],['wall',7,9,0,0],['mirror',5,11,0,0],['mirror',9,11,0,0]]},
 {title:'SPECTRUM',description:'A filter only passes the wavelengths matching its color. Use the red beam to reach its resonator.',pieces:[
  ['laser',2,7,2,1],['target',12,7,0,1],['filter',7,7,2,1],['mirror',4,10,0,0]]},
 {title:'BLUE SHIFT',description:'Route the blue signal around the energy barrier.',pieces:[
  ['laser',3,10,2,4],['target',11,3,0,4],['wall',8,10,0,0],['wall',9,10,0,0],['mirror',5,12,0,0],['mirror',10,12,0,0]]},
 {title:'TWIN SIGNAL',description:'Two sources must independently energize their matching resonators.',pieces:[
  ['laser',2,5,2,1],['laser',2,10,2,4],['target',11,5,0,1],['target',11,10,0,4],['mirror',7,7,0,0],['mirror',7,8,0,0]]}
];
// Import file schema: { title, description, pieces: [['laser'|'target'|'mirror'|..., x, y, rotation, color], ...] }
// The original games contain 4 x 50 levels. Their layouts are NOT included.
export function validateLevels(levels) {
 if (!Array.isArray(levels) || !levels.length) throw Error('Expected a non-empty levels array');
 return levels.map((level, index) => {
  if (!Array.isArray(level.pieces)) throw Error('Missing pieces in level '+index);
  const seen = new Set();
  for(const piece of level.pieces){
   const [type,x,y,rot,color]=piece;
   if(!['laser','target','mirror','wall','filter','splitter','prism','bender','doppler','conduit','teleporter'].includes(type)) throw Error('Unknown piece: '+type);
   if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=15||y>=15)throw Error('Position outside grid');
   if(!Number.isInteger(rot)||rot<0||rot>7)throw Error('Rotation must be 0..7');
   if(!Number.isInteger(color)||color<0||color>7)throw Error('Color must be 0..7');
   const key=x+','+y;
   if(seen.has(key)) throw Error('Overlapping pieces at '+key);
   seen.add(key);
  }
  return {title:String(level.title||'EXPERIMENT '+(index+1)),description:String(level.description||''),pieces:level.pieces.map(p=>[...p])};
 });
}
