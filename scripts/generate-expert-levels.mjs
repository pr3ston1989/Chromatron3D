#!/usr/bin/env node
/**
 * Generates the 50-puzzle EXPERT campaign.
 *
 * Every puzzle is built from a concrete beam route (so a solution provably
 * exists), then hardened: the generator searches for winning layouts that omit
 * one optic and blocks each one with a wall that is never on the authored
 * route. The emitted file therefore carries a machine-verified solution and a
 * documented no-shortcut guarantee within the stated search budget.
 *
 * Run: node scripts/generate-expert-levels.mjs [--limit=N] [--out=path]
 */
import {writeFileSync} from 'node:fs';
import {rng,checkShortcuts,findSolution,validateCandidate,protectedPath} from './design/core.mjs';
import {
 assembleTurnLevel,assembleTwinLevel,assembleSplitterLevel,assemblePrismLevel,
 assembleTanglerLevel,assembleTeleporterLevel,assembleAdditiveLevel,
 addRandomWalls,addConduits,movableIndexes,solveResult
} from './design/families.mjs';
import {trace,DX,DY} from '../src/optics.js';

const CH={pl:'ROZDZIAŁ',en:'CHAPTER'};
const chapters=[
 {id:1,pl:'REFLEKSY',en:'REFLECTIONS'},
 {id:2,pl:'ZGIĘCIA',en:'BENDS'},
 {id:3,pl:'ROZDZIELENIA',en:'SPLITS'},
 {id:4,pl:'WIDMO',en:'SPECTRUM'},
 {id:5,pl:'SPLĄTANIE',en:'ENTANGLEMENT'}
];
const chapterMeta=id=>{
 const c=chapters.find(x=>x.id===id);
 return {pl:`${CH.pl} 0${id} // ${c.pl}`,en:`${CH.en} 0${id} // ${c.en}`};
};

const roster=[
 // Chapter 1 — reflections
 {ch:1,n:1,pl:'PIERWSZY ODDECH',en:'FIRST BREATH',dp:'Trzy zakręty w ciemnej komorze. Poprowadź wiązkę do rezonatora.',de:'Three turns in a dark chamber. Guide the beam into the resonator.',build:'turn',o:{turns:3,turnKinds:['mirror'],color:4,walls:12}},
 {ch:1,n:2,pl:'KĄT PROSTY',en:'RIGHT ANGLE',dp:'Dwie bariery zwężają pole. Znajdź trzy punkty odbicia.',de:'Two barriers narrow the field. Find three reflection points.',build:'turn',o:{turns:3,turnKinds:['mirror'],color:1,walls:16,baffle:false}},
 {ch:1,n:3,pl:'CICHY OBWÓD',en:'QUIET CIRCUIT',dp:'Cichy obwód wymaga trzech luster i cierpliwości.',de:'A quiet circuit needs three mirrors and patience.',build:'turn',o:{turns:3,turnKinds:['mirror'],color:2,walls:18}},
 {ch:1,n:4,pl:'ZIMNA SOCZEWKA',en:'COLD LENS',dp:'Zimna soczewka czeka na błękit. Nie spiesz się z ostatnim zakrętem.',de:'The cold lens waits for blue. Do not rush the final turn.',build:'turn',o:{turns:3,turnKinds:['mirror'],color:4,walls:14,baffle:false}},
 {ch:1,n:5,pl:'TRZY ZWARCIA',en:'THREE SHUNTS',dp:'Trzy zwierciadła, trzy zwarcia toru. Rezonator jest na krawędzi.',de:'Three reflectors, three shunts. The receiver sits on the rim.',build:'turn',o:{turns:3,turnKinds:['mirror'],color:1,walls:20,conduits:1}},
 {ch:1,n:6,pl:'BOCZNY KORYTARZ',en:'SIDE CORRIDOR',dp:'Wąski boczny korytarz prowadzi do celu. Uważaj na ślepe zaułki.',de:'A narrow side corridor leads to the goal. Beware of dead ends.',build:'turn',o:{turns:3,turnKinds:['mirror'],color:2,walls:22}},
 {ch:1,n:7,pl:'OSTATNI ZAKRĘT',en:'FINAL TURN',dp:'Ostatni zakręt decyduje o wszystkim. Odbij promień dokładnie w rezonator.',de:'The final turn decides everything. Reflect the ray exactly into the receiver.',build:'turn',o:{turns:3,turnKinds:['mirror'],color:4,walls:12,baffle:false}},
 {ch:1,n:8,pl:'WĄSKIE GARDŁO',en:'BOTTLENECK',dp:'Bariery tworzą gardło. Wiązka musi przejść przez nie bez drgnienia.',de:'Barriers form a bottleneck. The beam must pass through without wavering.',build:'turn',o:{turns:3,turnKinds:['mirror'],color:1,walls:24,conduits:2}},
 {ch:1,n:9,pl:'RÓWNOLEGŁE DROGI',en:'PARALLEL PATHS',dp:'Cztery zwierciadła i dłuższa trasa. Zaplanuj całość od końca.',de:'Four reflectors and a longer route. Plan backwards from the goal.',build:'turn',o:{turns:4,turnKinds:['mirror'],color:2,walls:16}},
 {ch:1,n:10,pl:'DOMKNIĘCIE',en:'CLOSURE',dp:'Domknij obwód, zanim światło ucieknie w mrok.',de:'Close the circuit before the light escapes into the dark.',build:'turn',o:{turns:4,turnKinds:['mirror'],color:4,walls:20,baffle:false}},
 // Chapter 2 — benders and twin circuits
 {ch:2,n:11,pl:'CZTERDZIEŚCI PIĘĆ',en:'FORTY-FIVE',dp:'Zakrzywiacze zginają światło o 45 stopni. Trasa biegnie po skosie.',de:'Benders turn light by 45 degrees. The route runs diagonally.',build:'turn',o:{turns:3,turnKinds:['bender'],color:1,walls:14}},
 {ch:2,n:12,pl:'UKOŚNY CIĄG',en:'DIAGONAL RUN',dp:'Cztery ukośne odcinki i jeden rezonator.',de:'Four diagonal segments and a single receiver.',build:'turn',o:{turns:4,turnKinds:['bender'],color:4,walls:16}},
 {ch:2,n:13,pl:'ZŁAMANA LINIA',en:'BROKEN LINE',dp:'Lustra i zakrzywiacze w jednym obwodzie. Każdy element ma swoje miejsce.',de:'Mirrors and benders share one circuit. Every piece has its place.',build:'turn',o:{turns:3,turnKinds:['mirror','bender'],color:2,walls:16}},
 {ch:2,n:14,pl:'DWA ŹRÓDŁA',en:'TWIN SOURCES',dp:'Dwa lasery, dwa cele. Dwa niezależne obwody na jednej planszy.',de:'Two emitters, two receivers. Two independent circuits on one board.',build:'twin',o:{turns:[2,2],colors:[1,4],walls:14}},
 {ch:2,n:15,pl:'ROMB',en:'RHOMBUS',dp:'Romb światła: cztery boki, jeden cel.',de:'A rhombus of light: four sides, one goal.',build:'turn',o:{turns:3,turnKinds:['bender'],color:2,walls:18,baffle:false}},
 {ch:2,n:16,pl:'ZYGZAK',en:'ZIGZAG',dp:'Zygzak z czterech elementów. Ostatni odcinek musi być prosty.',de:'A zigzag of four optics. The last segment must run straight.',build:'turn',o:{turns:4,turnKinds:['mirror','bender'],color:1,walls:18}},
 {ch:2,n:17,pl:'PRZECIWLEGŁE',en:'OPPOSITE ENDS',dp:'Dwa źródła po przeciwnych stronach. Każde ma własną drogę.',de:'Two emitters on opposite sides. Each gets its own path.',build:'twin',o:{turns:[2,3],colors:[2,4],walls:16}},
 {ch:2,n:18,pl:'SKOŚNA KOMORA',en:'OBLIQUE CHAMBER',dp:'Skośna komora wymaga precyzyjnego kąta.',de:'An oblique chamber demands a precise angle.',build:'turn',o:{turns:4,turnKinds:['bender','mirror'],color:4,walls:18}},
 {ch:2,n:19,pl:'ROZWIDLENIE',en:'FORKING',dp:'Rozwidlenie torów bez rozdzielacza — tylko ukośne odbicia.',de:'A forked path without a splitter, using diagonal reflections only.',build:'turn',o:{turns:3,turnKinds:['mirror','bender'],color:4,walls:14,baffle:false}},
 {ch:2,n:20,pl:'PODWÓJNY OBWÓD',en:'DUAL CIRCUIT',dp:'Podwójny obwód: dwa lasery, dwa rezonatory, zero wspólnych pól.',de:'Dual circuit: two emitters, two receivers, no shared tiles.',build:'twin',o:{turns:[3,2],colors:[4,2],walls:18}},
 // Chapter 3 — splitters
 {ch:3,n:21,pl:'WIDELEC',en:'THE FORK',dp:'Rozdzielacz wysyła kopię wiązki w bok. Oba rezonatory muszą świecić.',de:'A splitter sends a copy sideways. Both receivers must glow.',build:'splitter',o:{preTurns:1,mainTurns:1,branchTurns:1,color:1,walls:16}},
 {ch:3,n:22,pl:'DWA SERCA',en:'TWO HEARTS',dp:'Dwa serca biją jednocześnie: wiązka prosta i jej boczna kopia.',de:'Two hearts beat at once: the straight beam and its side copy.',build:'splitter',o:{preTurns:1,mainTurns:2,branchTurns:1,color:4,walls:18}},
 {ch:3,n:23,pl:'KOPIA',en:'THE COPY',dp:'Jedna wiązka, dwa cele. Kopia musi dotrzeć do krawędzi.',de:'One beam, two goals. The copy must reach the rim.',build:'splitter',o:{preTurns:2,mainTurns:1,branchTurns:1,color:2,walls:18}},
 {ch:3,n:24,pl:'BLIŹNIACZE CELE',en:'TWIN TARGETS',dp:'Bliźniacze cele po dwóch stronach rozdzielacza.',de:'Twin targets on both sides of the splitter.',build:'splitter',o:{preTurns:1,mainTurns:2,branchTurns:1,color:1,walls:20}},
 {ch:3,n:25,pl:'ROZDZIELNIA',en:'SPLIT STATION',dp:'Stacja rozdzielenia: zaplanuj oba ramiona, zanim postawisz element.',de:'Split station: plan both arms before placing the optic.',build:'splitter',o:{preTurns:2,mainTurns:1,branchTurns:1,color:4,walls:20,baffle:false}},
 {ch:3,n:26,pl:'PODWÓJNY DOPŁYW',en:'DUAL FEED',dp:'Podwójny dopływ światła z jednego emitera.',de:'Dual feed of light from a single emitter.',build:'splitter',o:{preTurns:1,mainTurns:1,branchTurns:2,color:2,walls:20}},
 {ch:3,n:27,pl:'BOCZNE RAMIĘ',en:'SIDE ARM',dp:'Boczne ramię wymaga własnego zakrętu.',de:'The side arm needs a turn of its own.',build:'splitter',o:{preTurns:1,mainTurns:1,branchTurns:2,color:1,walls:18}},
 {ch:3,n:28,pl:'RÓWNOCZEŚNIE',en:'SIMULTANEOUS',dp:'Oba rezonatory muszą zapłonąć w tym samym układzie.',de:'Both receivers must ignite in the same arrangement.',build:'splitter',o:{preTurns:1,mainTurns:2,branchTurns:1,color:4,walls:22}},
 {ch:3,n:29,pl:'SYJAMSKI OBWÓD',en:'SIAMESE CIRCUIT',dp:'Syjamski obwód: dwie trasy dzielą jedno źródło.',de:'A Siamese circuit: two routes share one source.',build:'splitter',o:{preTurns:2,mainTurns:1,branchTurns:1,color:2,walls:20}},
 {ch:3,n:30,pl:'DWIE STRONY',en:'BOTH SIDES',dp:'Dwie strony, jeden rozdzielacz i wąskie przejścia między barierami.',de:'Two sides, one splitter and narrow gaps between the barriers.',build:'splitter',o:{preTurns:1,mainTurns:1,branchTurns:1,color:1,walls:18,conduits:2,baffle:false}},
 // Chapter 4 — spectrum
 {ch:4,n:31,pl:'PRZESUNIĘCIE',en:'THE SHIFT',dp:'Laser emituje czerwień, rezonator chce zieleni. Doppler zmienia barwę.',de:'The emitter is red, the receiver wants green. A Doppler changes the colour.',build:'turn',o:{turns:3,turnKinds:['mirror'],color:1,dopplers:1,walls:14}},
 {ch:4,n:32,pl:'FILTR PIERWSZY',en:'FIRST FILTER',dp:'Biała wiązka i filtr: przepuść tylko jedną barwę.',de:'A white beam and a filter: let only one colour through.',build:'turn',o:{turns:3,turnKinds:['mirror'],color:7,filters:1,walls:16}},
 {ch:4,n:33,pl:'TĘCZA',en:'RAINBOW',dp:'Pryzmat rozdziela biel na trzy kolory. Każdy ma własny cel.',de:'A prism splits white into three colours, each with its own goal.',build:'prism',o:{preTurns:1,mirrorBudget:2,walls:16}},
 {ch:4,n:34,pl:'PODWÓJNY KANAŁ',en:'DUAL CHANNEL',dp:'Żółta wiązka i jeden moduł Dopplera. Wybierz stronę przesunięcia świadomie.',de:'A yellow beam and one Doppler module. Choose the shift direction deliberately.',build:'turn',o:{turns:4,turnKinds:['mirror'],color:3,dopplers:1,walls:18}},
 {ch:4,n:35,pl:'BRAMA',en:'THE GATE',dp:'Brama filtruje światło. Bez właściwej barwy rezonator milczy.',de:'The gate filters light. Without the right colour the receiver stays dark.',build:'turn',o:{turns:4,turnKinds:['mirror'],color:7,filters:1,walls:18}},
 {ch:4,n:36,pl:'KANAŁ BARW',en:'COLOUR CHANNEL',dp:'Kanał barw: niebieska wiązka musi zmienić się dokładnie raz.',de:'Colour channel: the blue beam must shift exactly once.',build:'turn',o:{turns:4,turnKinds:['mirror','bender'],color:4,dopplers:1,walls:20}},
 {ch:4,n:37,pl:'PRYZMAT',en:'PRISM',dp:'Pryzmat na drodze białej wiązki. Trzy składowe, trzy kierunki.',de:'A prism in the white beam. Three components, three directions.',build:'prism',o:{preTurns:0,mirrorBudget:2,walls:18}},
 {ch:4,n:38,pl:'TRZY ODCIENIE',en:'THREE SHADES',dp:'Trzy odcienie na trzech krawędziach. Rozdziel i pokieruj każdym.',de:'Three shades on three rims. Split them and steer each one.',build:'prism',o:{preTurns:1,mirrorBudget:3,walls:20,baffle:false}},
 {ch:4,n:39,pl:'ODWROTNY SHIFT',en:'REVERSE SHIFT',dp:'Doppler potrafi przesunąć barwę w drugą stronę. Obrót modułu ma znaczenie.',de:'A Doppler can move a colour the other way. The orientation matters.',build:'turn',o:{turns:4,turnKinds:['mirror'],color:5,dopplers:1,walls:18}},
 {ch:4,n:40,pl:'BIEL ROZBITA',en:'SPLIT WHITE',dp:'Biel rozbita na krawędziach. Jeden pryzmat, trzy drogi.',de:'White shattered at the rims. One prism, three paths.',build:'prism',o:{preTurns:2,mirrorBudget:1,walls:22}},
 // Chapter 5 — entanglement and additive colour
 {ch:5,n:41,pl:'SPLĄTANA PARA',en:'ENTANGLED PAIR',dp:'Splątywacz tworzy dwie przeciwne wiązki. Oba rezonatory muszą być białe.',de:'A tangler creates two opposing beams. Both receivers must be white.',build:'tangler',o:{preTurns:1,legs:[1,1],color:7,walls:18}},
 {ch:5,n:42,pl:'DWA ŚWIATY',en:'TWO WORLDS',dp:'Dwa światy po dwóch stronach splątywacza.',de:'Two worlds on either side of the tangler.',build:'tangler',o:{preTurns:1,legs:[2,1],color:1,walls:20}},
 {ch:5,n:43,pl:'SKOK',en:'THE JUMP',dp:'Teleporter przenosi światło przez martwą strefę.',de:'A teleporter carries light across the dead zone.',build:'teleporter',o:{turns:3,color:4,walls:18}},
 {ch:5,n:44,pl:'PRZESKOK',en:'OVERPASS',dp:'Przeskok nad planszą: wykorzystaj parę teleporterów.',de:'An overpass across the board: use the teleporter pair.',build:'teleporter',o:{turns:4,color:2,walls:22,conduits:1}},
 {ch:5,n:45,pl:'ŻÓŁTY',en:'YELLOW',dp:'Czerwony i zielony razem dają żółty. Oba promienie muszą trafić w ten sam cel.',de:'Red and green make yellow. Both beams must reach the same receiver.',build:'additive',o:{pair:[1,2],turns:[2,2],walls:16}},
 {ch:5,n:46,pl:'MAGENTA',en:'MAGENTA',dp:'Magenta to czerwień i błękit. Zbiegnij je w jednym punkcie.',de:'Magenta is red and blue. Converge both on one point.',build:'additive',o:{pair:[1,4],turns:[2,3],walls:18}},
 {ch:5,n:47,pl:'CYJAN',en:'CYAN',dp:'Cyjan powstaje z zieleni i błękitu. Dwa lasery, jeden rezonator.',de:'Cyan comes from green and blue. Two emitters, one receiver.',build:'additive',o:{pair:[2,4],turns:[3,2],walls:20}},
 {ch:5,n:48,pl:'DWA PROMIENIE',en:'TWIN BEAMS',dp:'Dwa promienie, dwa cele, cztery zakręty.',de:'Two beams, two goals, four turns.',build:'twin',o:{turns:[2,3],colors:[1,4],walls:20,baffle:false}},
 {ch:5,n:49,pl:'OSTATNI SPLOT',en:'FINAL WEAVE',dp:'Ostatni splot: splątywacz i trzy zakręty po obu stronach.',de:'The final weave: a tangler and three turns on both sides.',build:'tangler',o:{preTurns:1,legs:[2,1],color:7,walls:22}},
 {ch:5,n:50,pl:'REZONANS',en:'RESONANCE',dp:'Rezonans: pryzmat, trzy barwy i trzy krawędzie. Finał rozdziału.',de:'Resonance: a prism, three colours and three rims. The chapter finale.',build:'prism',o:{preTurns:2,mirrorBudget:3,walls:24}}
];

const COLORS={pl:['Brak','czerwony','zielony','żółty','niebieski','magenta','cyjan','biały'],
 en:['none','red','green','yellow','blue','magenta','cyan','white']};
const TYPE_LABEL={
 pl:{laser:'LASER',mirror:'LUSTRO',bender:'ZAKRZYWIACZ',filter:'FILTR',prism:'PRYZMAT',doppler:'DOPPLER',splitter:'ROZDZIELACZ',tangler:'SPLĄTYWACZ',target:'REZONATOR',wall:'BARIERA',conduit:'KANAŁ',teleporter:'TELEPORTER'},
 en:{laser:'EMITTER',mirror:'REFLECTOR',bender:'BENDER',filter:'FILTER',prism:'PRISM',doppler:'DOPPLER',splitter:'SPLITTER',tangler:'TANGLER',target:'RESONATOR',wall:'BARRIER',conduit:'CONDUIT',teleporter:'TELEPORTER'}
};
const color=(lang,mask)=>COLORS[lang][mask&7];
const kindLabel=(lang,type)=>TYPE_LABEL[lang][type]||type.toUpperCase();

function buildOne(spec,seed,attempt=0){
 const r=rng(seed);
 let o={...spec.o,color:spec.o.color??null};
 // If a freely-routed variant keeps failing, fall back to a baffled launch.
 if(attempt>=22&&o.baffle===false)o={...o,baffle:true};
 if(attempt>=30&&o.baffle===true)o={...o,baffle:false};
 switch(spec.build){
  case 'turn':return assembleTurnLevel(r,o);
  case 'twin':return assembleTwinLevel(r,o);
  case 'splitter':return assembleSplitterLevel(r,o);
  case 'prism':return assemblePrismLevel(r,o);
  case 'tangler':return assembleTanglerLevel(r,o);
  case 'teleporter':return assembleTeleporterLevel(r,o);
  case 'additive':return assembleAdditiveLevel(r,o);
  default:return null;
 }
}
function familyText(spec,lang,level){
 const targets=level.pieces.filter(p=>p[0]==='target');
 const lasers=level.pieces.filter(p=>p[0]==='laser');
 const move=level.solution[0];
 const type=level.pieces[move.index]?.[0]||'mirror';
 const first={type,x:move.x,y:move.y,angle:move.rot*45};
 const angle=first.angle;
 const t1=targets[0];
 const c1=color(lang,t1?.[4]||0);
 const lc=lasers.map(l=>color(lang,l[4]));
 const cell=x=>`(${x[0]}, ${x[1]})`;
 const typeName=kindLabel(lang,first.type);
 const laser=lasers[0];
 const baffled=Boolean(laser&&level.pieces.some(p=>p[0]==='wall'&&
  p[1]===laser[1]+DX[laser[3]]*2&&p[2]===laser[2]+DY[laser[3]]*2));
 const moveHint=lang==='pl'?
  `Ustaw ${typeName} na ${cell([move.x,move.y])} i obróć do ${angle}°. To pierwszy krok sprawdzonego rozwiązania; następna podpowiedź pojawi się po ułożeniu tego elementu.`
  :`Place the ${typeName} at ${cell([move.x,move.y])} and rotate to ${angle}°. This is the first move of a verified solution; the next clue appears once this optic is in place.`;
 if(spec.build==='additive'){
  const pair=spec.o.pair;
  const cA=color(lang,pair[0]),cB=color(lang,pair[1]);
  const h1=lang==='pl'
   ?`Rezonator ${cell([t1[1],t1[2]])} przyjmie tylko barwę ${c1} — sumę barw ${cA} i ${cB}. Pojedyncza wiązka da zły wynik.`
   :`The receiver at ${cell([t1[1],t1[2]])} accepts only ${c1}, the sum of ${cA} and ${cB}. A single beam gives the wrong result.`;
  const h2=lang==='pl'
   ?'Barwy w tym laboratorium sumują się addytywnie. Dwa lasery muszą dotrzeć do tego samego pola z różnych stron; dobierz zakręty tak, by żaden promień nie zabrał barwy drugiemu celowi.'
   :'Colours add up in this laboratory. Both emitters must reach the same tile from different sides; choose turns so neither beam contaminates another receiver.';
  return {h1,h2,h3:moveHint};
 }
 const targetLine=lang==='pl'
  ?`${targets.length>1?'Rezonatory':'Rezonator'} ${targets.map(t=>`${cell([t[1],t[2]])} (${color(lang,t[4])})`).join(', ')}.`
  :`${targets.length>1?'Receivers':'Receiver'} ${targets.map(t=>`${cell([t[1],t[2]])} (${color(lang,t[4])})`).join(', ')}.`;
 const laserLine=lang==='pl'
  ?`${lasers.length>1?'Lasery emitują':'Laser emituje'} ${lc.join(' i ')}.`
  :`${lasers.length>1?'Emitters produce':'The emitter produces'} ${lc.join(' and ')}.`;
 let h2='';
 switch(spec.build){
  case 'turn':{
   const hasBender=level.pieces.some(p=>p[0]==='bender');
   const hasDop=level.pieces.some(p=>p[0]==='doppler');
   const hasFilter=level.pieces.some(p=>p[0]==='filter');
   if(hasDop)h2=lang==='pl'
    ?'Doppler obraca kanały barw: czerwony→zielony→niebieski→czerwony (lub odwrotnie, zależnie od strony wejścia). Barwy mieszane przesuwają się kanał po kanale — żółty staje się cyjanem, a magenta żółtym. Policz przesunięcia i pamiętaj, że moduł działa tylko na trasie promienia.'
    :'A Doppler rotates colour channels: red→green→blue→red (or backwards, depending on the entry side). Mixed colours shift channel by channel — yellow becomes cyan, magenta becomes yellow. Count the shifts; the module only works on the beam path.';
   else if(hasFilter)h2=lang==='pl'
    ?'Filtr przepuszcza wyłącznie swoje barwy. Biała wiązka traci resztę, więc płyta musi stać prostopadle do promienia, na wolnym odcinku trasy.'
    :'A filter passes only its own colours. A white beam loses the rest, so the plate must sit square to the ray on a clear segment.';
   else if(hasBender)h2=lang==='pl'
    ?'Zakrzywiacz odchyla promień o 45° lub 135°. Trasa może biec po skosie; szukaj ukośnych linii łączących laser z rezonatorem i pamiętaj o kolejności zakrętów.'
    :'A bender deflects the ray by 45° or 135°. The route may run diagonally; look for diagonal lines between emitter and receiver and mind the turn order.';
   else h2=lang==='pl'
    ?`Każde lustro odbija promień o 90°, a ciemna strona pochłania światło. Zaplanuj trasę od rezonatora w stronę emitera — ostatni zakręt jest najważniejszy. ${baffled?'Bariera dwa pola przed laserem wymusza pierwszy ruch.':'Pierwsze lustro możesz ustawić dalej od emitera — nie musi stać tuż przy nim.'}`
    :`Every reflector turns the ray by 90°, and its dark back absorbs light. Plan backwards from the receiver to the emitter; the last turn matters most. ${baffled?'A barrier two tiles ahead of the emitter forces the opening move.':'The first reflector can sit farther from the emitter; it need not be right next to it.'}`;
   break;
  }
  case 'splitter':
   h2=lang==='pl'
    ?'Rozdzielacz przepuszcza wiązkę prosto i wysyła jej kopię w bok. Oba rezonatory muszą świecić jednocześnie, więc najpierw znajdź pole, z którego oba ramiona mają wolną drogę do krawędzi.'
    :'A splitter passes the beam straight and sends a copy sideways. Both receivers must glow at once, so first find a tile from which both arms have a clear path to the rim.';
   break;
  case 'prism':
   h2=lang==='pl'
    ?'Pryzmat rozszczepia biel na trzy składowe, każda wychodzi pod innym kątem. Ustaw go tak, by czerwona, zielona i niebieska wiązka miały osobne, wolne drogi do swoich krawędzi.'
    :'A prism splits white into three components, each leaving at a different angle. Place it so red, green and blue each have a separate clear path to their rims.';
   break;
  case 'tangler':
   h2=lang==='pl'
    ?'Splątywacz przyjmuje światło tylko z jednej strony i rozdziela każdy kanał na parę promieni biegnących w przeciwnych kierunkach. Po obu stronach muszą powstać kompletne trasy do rezonatorów.'
    :'A tangler accepts light from one side only and splits every channel into a pair of beams running in opposite directions. Both sides need complete routes to their receivers.';
   break;
  case 'teleporter':
   h2=lang==='pl'
    ?'Teleporter przenosi wiązkę do następnego teleportera w tej samej linii, pomijając wszystko pomiędzy. Wykorzystaj skok, by ominąć martwą strefę, a potem poprowadź światło zakrętami.'
    :'A teleporter jumps the beam to the next teleporter on the same line, skipping everything between. Use the jump to bypass the dead zone, then steer the light with turns.';
   break;
  case 'twin':
   h2=lang==='pl'
    ?'To dwa niezależne obwody. Zaplanuj każdy osobno, ale pamiętaj, że elementy nie mogą się nakładać, a promienie nie mogą wpadać do cudzego rezonatora.'
    :'These are two independent circuits. Plan each separately, remembering that optics cannot overlap and beams must not enter the other receiver.';
   break;
  default:
   h2=lang==='pl'?'Prześledź drogę światła od emitera do celu.':'Trace the light from the emitter to the goal.';
 }
 const colourLevel=level.pieces.some(p=>['doppler','filter','prism','tangler'].includes(p[0]));
 const h1=colourLevel
  ?(lang==='pl'
   ?`${targetLine} ${laserLine} Barwa musi się zmienić albo rozdzielić po drodze, inaczej rezonator otrzyma zły kolor.`
   :`${targetLine} ${laserLine} The colour must change or split en route, otherwise the receiver gets the wrong light.`)
  :(lang==='pl'
   ?`${targetLine} ${laserLine} W linii prostej światło nie dociera do celu — potrzebne są odbicia.`
   :`${targetLine} ${laserLine} No direct line reaches the goal; reflections are required.`);
 return {h1,h2,h3:moveHint};
}

function finalize(spec,built,seed){
 const r=rng(seed^0x9e3779b9);
 const level=built.level;
 const initialLocations=new Set(level.pieces.map(p=>p[1]+','+p[2]));
 if(initialLocations.size!==level.pieces.length)return null;
 // structural terrain first; the authored beam is never touched
 addRandomWalls(level,level.solution,r,spec.o.walls??16);
 if(spec.o.conduits)addConduits(level,level.solution,r,spec.o.conduits);
 const idx=movableIndexes(level);
 if(idx.length<3||idx.length>5)return null;
 const pre=solveResult(level,level.solution);
 if(!pre.won||pre.truncated||pre.unsupported.length)return null;
 const check=validateCandidate(level,level.solution);
 if(!check.won||check.startsSolved)return null;
 return {level,idx,seed};
}

const limitArg=process.argv.find(a=>a.startsWith('--limit='));
const LIMIT=limitArg?Number(limitArg.split('=')[1]):roster.length;
const outArg=process.argv.find(a=>a.startsWith('--out='));
const OUT=outArg?outArg.split('=')[1]:'src/expert-levels.js';
const stats=[];
const levels=[];
for(const spec of roster.slice(0,LIMIT)){
 let solved=null;
 for(let attempt=0;attempt<40&&!solved;attempt++){
  const seed=100000+spec.n*7919+attempt*104729;
  let built=buildOne(spec,seed,attempt);
  if(!built)continue;
  const prepared=finalize(spec,built,seed);
  if(!prepared)continue;
  const {level,idx}=prepared;
  const harden=awaitHarden(level,idx,seed,attempt);
  if(!harden)continue;
  const bad=checkShortcuts(level,idx,{maxChecks:300000});
  if(bad.length)continue;
  const res=solveResult(level,level.solution);
  if(!res.won||res.truncated||res.unsupported.length)continue;
  const hints=familyText(spec,'pl',level);
  const hintsEn=familyText(spec,'en',level);
  const chapter=chapterMeta(spec.ch);
  const first=level.solution[0];
  level.title={pl:spec.pl,en:spec.en};
  level.description={pl:spec.dp,en:spec.de};
  level.hints=[{pl:hints.h1,en:hintsEn.h1},{pl:hints.h2,en:hintsEn.h2},{pl:hints.h3,en:hintsEn.h3}];
  level.hintFocus={x:first.x,y:first.y};
  level.chapter=chapter;
  level.difficulty=spec.ch;
  level.mechanics=[...new Set(level.pieces.map(p=>p[0]).filter(t=>t!=='laser'&&t!=='target'&&t!=='wall'))];
  solved={level,idx,attempt,harden};
 }
 if(!solved){
  console.error('FAILED level',spec.n,spec.pl);
  process.exitCode=1;
  continue;
 }
 const {level,idx,attempt}=solved;
 levels.push(level);
 const wallCount=level.pieces.filter(p=>p[0]==='wall').length;
 const conduitCount=level.pieces.filter(p=>p[0]==='conduit').length;
 stats.push({n:spec.n,title:spec.pl,family:spec.build,movables:idx.length,pieces:level.pieces.length,walls:wallCount,conduits:conduitCount,attempt});
 console.log(`#${String(spec.n).padStart(2,'0')} ${spec.pl.padEnd(22)} ${spec.build.padEnd(10)} mov=${idx.length} pieces=${String(level.pieces.length).padStart(2)} walls=${String(wallCount).padStart(2)} try=${attempt+1}`);
}

function awaitHarden(level,idx,seed,attempt){
 // Local import avoids a circular top-level import in older Node versions.
 return hardenLevel(level,idx,seed,attempt);
}
import {harden} from './design/core.mjs';
function hardenLevel(level,idx,seed,attempt){
 return harden(level,level.solution,idx,{
  maxWalls:40,maxRounds:160,checkBudget:120000,finalBudget:300000,
  maxOrders:64,seed:seed^(attempt*31),verbose:false
 });
}

const banner=`// CHROMATRON / REBORN — EXPERT CAMPAIGN
// 50 machine-verified puzzles generated by scripts/generate-expert-levels.mjs.
// Every level carries an authored solution checked by the live optics engine;
// the generator additionally removed all winning layouts that omit one optic
// within a bounded breadth-first search (see docs/EXPERT_CAMPAIGN.md).
// These layouts are independently authored and are NOT original Chromatron levels.

export const EXPERT_CHAPTERS = ${JSON.stringify(chapters,null,1)};

export const EXPERT_LEVELS = ${JSON.stringify(levels,null,1)};
`;
writeFileSync(OUT,banner);
console.log('\nWrote',OUT,'with',levels.length,'levels');
console.log('Total pieces',levels.reduce((a,l)=>a+l.pieces.length,0));
