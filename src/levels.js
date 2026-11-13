// Eight independently authored tutorial puzzles for prototype QA.
// These are NOT the copyrighted 200 original Chromatron puzzle arrangements.
// Direction 0=N, 1=NE, 2=E, 3=SE, 4=S, 5=SW, 6=W, 7=NW.
// Colors are bitmasks 1=red, 2=green, 4=blue (prototype palette).
export const PROTOTYPE_LEVELS = [
 {
  title:{pl:'PIERWSZE ŚWIATŁO',en:'FIRST LIGHT'},
  description:{pl:'Jeden laser. Jedno lustro. Ustaw je tak, by wiązka trafiła do rezonatora.',en:'One emitter. One reflector. Position it so the light reaches the resonator.'},
  pieces:[['laser',2,7,2,4],['target',7,3,0,4],['mirror',7,9,0,0]],
  hints:[
   {pl:'Laser świeci w prawo. Rezonator jest wyżej, więc promień musi skręcić w górę.',en:'The emitter shoots right. The target sits higher: the ray needs to turn upward.'},
   {pl:'Postaw lustro na przecięciu poziomej trasy lasera i pionowej linii rezonatora.',en:'Place the mirror where the horizontal laser path crosses the target’s vertical line.'},
   {pl:'Przenieś lustro na pole (7, 7), a następnie obróć je raz w prawo (E).',en:'Move the mirror to cell (7, 7), then rotate it once clockwise (E).'}
  ],hintFocus:{x:7,y:7},startMovablesInTray:true
 },
 {
  title:{pl:'PODWÓJNY ZAKRĘT',en:'THE DOUBLE TURN'},
  description:{pl:'Dwa odbicia pozwolą ominąć barierę i dotrzeć do odbiornika.',en:'Two reflections can route light around the energy barrier.'},
  pieces:[['laser',2,9,2,1],['target',11,4,0,1],['wall',7,9,0,0],['mirror',5,11,0,0],['mirror',9,11,0,0]],
  hints:[
   {pl:'Nie musisz przepychać lasera przez barierę. Spróbuj poprowadzić go górą.',en:'You do not need to pass through the barrier. Try going around its upper side.'},
   {pl:'Pierwsze lustro musi odchylić promień w górę, a drugie z powrotem w prawo.',en:'The first mirror should turn the beam up, and the second should send it right.'},
   {pl:'Ustaw lustra na (5, 9) z obrotem 1 oraz (5, 4) z obrotem 5.',en:'Position mirrors at (5, 9) with rotation 1 and (5, 4) with rotation 5.'}
  ],hintFocus:{x:5,y:9}
 },
 {
  title:{pl:'SPEKTRUM',en:'SPECTRUM'},
  description:{pl:'Filtr zatrzymuje niezgodne kolory. Odsłoń drogę czerwonej wiązce.',en:'A filter blocks non-matching colors. Clear the red beam’s path.'},
  pieces:[['laser',2,7,2,1],['target',12,7,0,1],['filter',7,7,0,2]],
  hints:[
   {pl:'Kolor filtra różni się od koloru lasera.',en:'The filter and the laser are different colors.'},
   {pl:'Filtr można przenieść. Nie każdy element musi zostać na drodze światła.',en:'The filter can be moved. Not every optic needs to remain in the beam path.'},
   {pl:'Przesuń zielony filtr z pola (7, 7) na dowolne wolne pole poza czerwonym promieniem.',en:'Move the green filter off (7, 7) onto any free tile outside the red beam.'}
  ],hintFocus:{x:7,y:7}
 },
 {
  title:{pl:'NIEBIESKI OBJAZD',en:'BLUE DETOUR'},
  description:{pl:'Dwie bariery zasłaniają drogę. Odbij niebieską wiązkę ponad nimi.',en:'Two barriers block the route. Redirect the blue ray around them.'},
  pieces:[['laser',3,10,2,4],['target',11,3,0,4],['wall',8,10,0,0],['wall',9,10,0,0],['mirror',5,12,0,0],['mirror',10,12,0,0]],
  hints:[
   {pl:'Laser może ominąć przeszkody wyżej niż ich położenie na planszy.',en:'There is an unobstructed route above the barriers.'},
   {pl:'Pierwsze lustro powinno odbić wiązkę ku górze; drugie w stronę rezonatora.',en:'The first reflector should turn the ray upward, the next toward the resonator.'},
   {pl:'Ustaw lustra na (5, 10) z obrotem 1 i (5, 3) z obrotem 5.',en:'Place reflectors at (5, 10) with rotation 1 and (5, 3) with rotation 5.'}
  ],hintFocus:{x:5,y:10}
 },
 {
  title:{pl:'DWA SYGNAŁY',en:'TWIN SIGNAL'},
  description:{pl:'Dwa niezależne kolory. Omiń barierę czerwienią, a błękit poprowadź prosto.',en:'Two independent colors. Route red around the barrier while blue travels straight.'},
  pieces:[['laser',2,5,2,1],['laser',2,10,2,4],['target',10,8,0,1],['target',10,10,0,4],['wall',6,5,0,0],['mirror',4,11,0,0],['mirror',8,12,0,0]],
  hints:[
   {pl:'Niebieski odbiornik jest już na prostej trasie lasera. Skup się na czerwonej wiązce.',en:'The blue target already has an unobstructed path. Focus on the red ray.'},
   {pl:'Czerwona wiązka musi zejść niżej przed barierą, potem skręcić w stronę odbiornika.',en:'Turn the red beam downward before the barrier, then right toward its target.'},
   {pl:'Ustaw pierwsze lustro na (4, 5), obrót 7; drugie na (4, 8), obrót 3.',en:'Place the first mirror at (4, 5), rotation 7; the second at (4, 8), rotation 3.'}
  ],hintFocus:{x:4,y:5}
 },
 {
  title:{pl:'PRZESUNIĘCIE WIDMA',en:'SPECTRAL SHIFT'},
  description:{pl:'Czerwony laser, zielony rezonator. Zmień barwę za pomocą modułu Dopplera.',en:'A red emitter and a green receiver. Shift the wavelength using a Doppler module.'},
  pieces:[['laser',2,7,2,1],['target',12,7,0,2],['doppler',7,10,3,0]],
  hints:[
   {pl:'Moduł Dopplera zmienia kolor przepuszczanego światła. W tym układzie potrzebna jest zamiana czerwieni na zieleń.',en:'The Doppler module changes the color of transmitted light. Here red must become green.'},
   {pl:'Wstaw moduł w poziomą wiązkę między laserem a odbiornikiem. Nie wystarczy obrót — element musi leżeć na trasie.',en:'Move the module onto the horizontal beam between emitter and receiver. Rotating it off the path will not work.'},
   {pl:'Umieść moduł Dopplera na (7, 7) i ustaw obrót 0.',en:'Place the Doppler module at (7, 7), rotation 0.'}
  ],hintFocus:{x:7,y:7}
 },
 {
  title:{pl:'TRZY BARWY',en:'THREE WAVELENGTHS'},
  description:{pl:'Biała wiązka kryje trzy kolory. Jeden pryzmat rozdzieli je między trzy rezonatory.',en:'White light contains three colors. One prism can separate them into three receivers.'},
  pieces:[['laser',3,7,2,7],['target',12,7,0,4],['target',10,10,0,2],['target',7,12,0,1],['prism',7,9,3,0]],
  hints:[
   {pl:'Biel to połączenie czerwieni, zieleni i błękitu. Pryzmat wysyła składowe kolory w różnych kierunkach.',en:'White combines red, green, and blue. The prism directs its components along different paths.'},
   {pl:'Szukaj punktu, w którym niebieska trasa biegnie dalej w prawo, zielona ukośnie w dół, a czerwona pionowo w dół.',en:'Look for a cell where blue continues right, green travels diagonally downward, and red heads straight down.'},
   {pl:'Przesuń pryzmat na (7, 7) i obróć do pozycji 0.',en:'Move the prism to (7, 7) and set rotation 0.'}
  ],hintFocus:{x:7,y:7}
 },
 {
  title:{pl:'ROZDWOJONY PROMIEŃ',en:'SPLIT RAY'},
  description:{pl:'Jeden niebieski laser ma zasilić dwa rezonatory. Rozdziel wiązkę bez utraty koloru.',en:'One blue emitter must feed two receivers. Split its beam without changing the wavelength.'},
  pieces:[['laser',2,8,2,4],['target',12,8,0,4],['target',7,3,0,4],['splitter',7,11,3,0]],
  hints:[
   {pl:'Rozdzielacz przekazuje część światła prosto i część odbija na drugi tor.',en:'A splitter allows one part of the beam to continue and redirects another part.'},
   {pl:'Punkt rozdzielenia leży w kolumnie górnego rezonatora i na poziomie lasera. Odbita część musi pójść ku górze.',en:'The branching cell shares the upper receiver’s column and the emitter’s row. The diverted ray must head upward.'},
   {pl:'Ustaw rozdzielacz na (7, 8) z obrotem 1.',en:'Place the splitter at (7, 8), rotation 1.'}
  ],hintFocus:{x:7,y:8}
 }
];

/**
 * Known author-verified demonstration solutions, indexed by the original
 * piece order. These are not the classic Chromatron puzzle arrangements.
 * Each step is checked against the live optics solver before use as a hint.
 */
export const DEMO_SOLUTIONS=Object.freeze([
 [{index:2,x:7,y:7,rot:1}],
 [{index:3,x:5,y:9,rot:1},{index:4,x:5,y:4,rot:5}],
 [{index:2,x:7,y:9,rot:0}],
 [{index:4,x:5,y:10,rot:1},{index:5,x:5,y:3,rot:5}],
 [{index:5,x:4,y:5,rot:7},{index:6,x:4,y:8,rot:3}],
 [{index:2,x:7,y:7,rot:0}],
 [{index:4,x:7,y:7,rot:0}],
 [{index:3,x:7,y:8,rot:1}]
]);
for(let i=0;i<PROTOTYPE_LEVELS.length;i++)PROTOTYPE_LEVELS[i].solution=DEMO_SOLUTIONS[i];

import {CLASSIC_TYPE_NAMES} from './classic-pieces.js';
const types=new Set(CLASSIC_TYPE_NAMES.slice(1));
const validText=value=>typeof value==='string'||(value && typeof value==='object' && ['pl','en'].some(k=>typeof value[k]==='string'));
export function validateLevels(levels){
 if(!Array.isArray(levels)||levels.length===0)throw Error('Expected a non-empty levels array');
 return levels.map((level,index)=>{
  if(!level||!Array.isArray(level.pieces))throw Error('Missing pieces in level '+index);
  const seen=new Set();
  for(const piece of level.pieces){
   if(!Array.isArray(piece)||piece.length!==5)throw Error('Each piece requires five fields');
   const [type,x,y,rot,color]=piece;
   if(!types.has(type))throw Error('Unknown optic: '+type);
   if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=15||y>=15)throw Error('Position outside 15x15 grid');
   if(!Number.isInteger(rot)||rot<0||rot>7)throw Error('Rotation must be 0..7');
   if(!Number.isInteger(color)||color<0||color>7)throw Error('Color must be 0..7');
   const xy=x+','+y;
   if(seen.has(xy))throw Error('Overlapping pieces at '+xy);
   seen.add(xy);
  }
  const title=validText(level.title)?level.title:{en:'EXPERIMENT '+(index+1),pl:'EKSPERYMENT '+(index+1)};
  const description=validText(level.description)?level.description:'';
  const hints=Array.isArray(level.hints)?level.hints.slice(0,3).filter(validText):[];
  // Campaign metadata is optional; it never changes optical behaviour.
  const chapter=validText(level.chapter)?level.chapter:null;
  const difficulty=Number.isInteger(level.difficulty)&&level.difficulty>=1&&level.difficulty<=5?level.difficulty:null;
  const mechanics=Array.isArray(level.mechanics)
  ?level.mechanics.filter(m=>typeof m==='string'&&types.has(m)).slice(0,8):[];
  const f=level.hintFocus;
  const hintFocus=f&&Number.isInteger(f.x)&&Number.isInteger(f.y)&&f.x>=0&&f.x<15&&f.y>=0&&f.y<15?{x:f.x,y:f.y}:null;
  const solution=Array.isArray(level.solution)?level.solution.map(step=>{
   if(!step||!Number.isInteger(step.index)||step.index<0||step.index>=level.pieces.length||
      !Number.isInteger(step.x)||step.x<0||step.x>=15||
      !Number.isInteger(step.y)||step.y<0||step.y>=15||
      !Number.isInteger(step.rot)||step.rot<0||step.rot>7)
    throw new Error('Invalid solution move in level '+index);
   return {index:step.index,x:step.x,y:step.y,rot:step.rot};
  }):null;
  return {title,description,hints,hintFocus,solution,
   ...([1,2,3,4].includes(level.sourceGame)?{sourceGame:level.sourceGame,sourceIndex:level.sourceIndex}:{}),
   startMovablesInTray:Boolean(level.startMovablesInTray),pieces:level.pieces.map(p=>[...p]),
   chapter,difficulty,mechanics};
 });
}
