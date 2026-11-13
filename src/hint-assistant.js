import {trace} from './optics.js';
import {colorName} from './analysis.js';
import {verifyPuzzleSolution} from './puzzle-solver.js';

const text=(lang,pl,en)=>lang==='en'?en:pl;
const pieceLabel=(lang,type)=>{
 const labels={
  mirror:['lustrem','mirror'],bender:['zakrzywiaczem','bender'],
  filter:['filtrem','filter'],prism:['pryzmatem','prism'],
  splitter:['rozdzielaczem','splitter'],doppler:['modułem Dopplera','Doppler module'],
  tangler:['splątywaczem','tangler']
 };
 const [pl,en]=labels[type]||[type,type];
 return lang==='en'?en:pl;
};
const direction=(a,b)=>(b.x>a.x?'w prawo':b.x<a.x?'w lewo':'')+
 (b.y>a.y?' w dół':b.y<a.y?' w górę':'');
export function contextualHint(level,pieces,step,lang='pl',solution=null){
 const result=trace(pieces);
 const wanted=pieces.filter(p=>p.type==='target'&&!p.inTray)
  .find(p=>(result.received.get(p.id)||0)!==p.color);
 const confirmed=Array.isArray(solution)&&verifyPuzzleSolution(level,solution).valid;
 const pending=confirmed?solution.find(move=>{
  const p=pieces[move.index];
  return p&&(p.inTray||p.x!==move.x||p.y!==move.y||p.rot!==move.rot);
 }):null;
 if(step===1){
  if(wanted){
   const current=result.received.get(wanted.id)||0;
   const required=colorName(wanted.color,lang),received=colorName(current,lang);
   return {
    body:text(lang,
     `Rezonator na polu (${wanted.x}, ${wanted.y}) potrzebuje barwy ${required}, a teraz odbiera ${current?received:'brak światła'}. Sprawdź, gdzie promień zmienia kierunek lub kolor.`,
     `The receiver at (${wanted.x}, ${wanted.y}) needs ${required}, but currently receives ${current?received:'no light'}. Trace where the beam changes direction or color.`),
    focus:null,verified:false
   };
  }
  return {body:text(lang,'Wszystkie rezonatory świecą prawidłowo. Układ jest już rozwiązany.','All receivers have the required colors. This puzzle is already solved.'),focus:null,verified:result.won};
 }
 if(step===2){
  if(pending){
   const p=pieces[pending.index];
   const label=pieceLabel(lang,p.type);
   const dx=pending.x-p.x,dy=pending.y-p.y;
   const move=(dx||dy)?text(lang,'Warto sprawdzić jego położenie na torze wiązki.','Consider its position along the beam.'):
    text(lang,'Przyjrzyj się orientacji jego aktywnej powierzchni.','Inspect the orientation of its active surface.');
   return {
    body:text(lang,`Skup się na elemencie: ${label}. ${move}`,
     `Focus on the ${label}. ${move}`),
    focus:{x:pending.x,y:pending.y},verified:true
   };
  }
  if(wanted){
   return {body:text(lang,
    'Prześledź drogę światła od emitera do nieaktywnego rezonatora. Wybierz element, który może zmienić kierunek albo barwę wiązki.',
    'Trace the light from the emitter to the unlit receiver. Choose an optic that can redirect the beam or change its wavelength.'),
    focus:null,verified:false};
  }
  return {body:text(lang,'Sprawdź dodatkowe kolory docierające do celów.','Check whether targets receive unwanted additional colors.'),focus:null,verified:false};
 }
 if(step===3){
  if(confirmed&&pending){
   const part=pieces[pending.index];
   const label=pieceLabel(lang,part.type);
   const angle=pending.rot*45;
   return {body:text(lang,
    `Ustaw element ${label} na (${pending.x}, ${pending.y}) i ustaw kąt ${angle}°. To krok ze sprawdzonego rozwiązania; jeśli masz już ten element ustawiony, sprawdź następny.`,
    `Place the ${label} at (${pending.x}, ${pending.y}) and rotate to ${angle}°. This move comes from a verified solution.`),
    focus:{x:pending.x,y:pending.y},verified:true
   };
  }
  if(confirmed)return {
   body:text(lang,'Wszystkie kroki sprawdzonego rozwiązania są już na planszy. Sprawdź, czy dodatkowy element nie zaburza wiązki.',
    'All verified moves are in place. Check whether another optic is interfering with the path.'),
   focus:null,verified:true
  };
  return {
   body:text(lang,'Brak jeszcze sprawdzonego rozwiązania tej planszy. Nie ujawniamy zgadywanego ruchu — uruchom analizę rozwiązania.',
    'No verified solution has been found for this puzzle. The game will not invent a move. Run solution analysis first.'),
   focus:null,verified:false
  };
 }
 return {body:'',focus:null,verified:false};
}
