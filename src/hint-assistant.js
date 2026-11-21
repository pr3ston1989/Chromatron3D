import {trace,movable,DX,DY} from './optics.js';
import {colorName,inspectLight} from './analysis.js';
import {createPuzzlePieces,verifyPuzzleSolution} from './puzzle-solver.js';
import {t} from './i18n.js';
import {opticDescription} from './optic-help.js';
import {classicStrategy} from './classic-strategies.js';
import {classicTechnique} from './classic-techniques.js';

const cell=(x,y)=>x+','+y;
const samePart=(one,two)=>one.type===two.type&&(one.type!=='filter'||one.color===two.color);
const directionNames={
 pl:['w górę','ukośnie w prawo i w górę','w prawo','ukośnie w prawo i w dół',
  'w dół','ukośnie w lewo i w dół','w lewo','ukośnie w lewo i w górę'],
 en:['up','up and right','right','down and right','down','down and left','left','up and left']
};
function heading(ray,lang){
 const dir=DX.findIndex((dx,i)=>dx===ray.nx-ray.x&&DY[i]===ray.ny-ray.y);
 return directionNames[lang][dir];
}
function label(piece,lang){
 const name=t(lang,'type'+piece.type[0].toUpperCase()+piece.type.slice(1));
 return piece.type==='filter'?name+' · '+colorName(piece.color,lang):name;
}

// Compare occupied cells by optical function. Two interchangeable mirrors may
// have different inventory IDs even when the player has built the right path.
function nextAction(pieces,solution,actual,solved){
 const live=new Map(pieces.filter(p=>!p.inTray).map(p=>[cell(p.x,p.y),p]));
 const plan=new Map(solution.map(move=>[cell(move.x,move.y),move]));
 function at(key){
  const move=plan.get(key),here=live.get(key);
  if(!move)return here&&movable.has(here.type)?{kind:'remove',part:here,x:here.x,y:here.y}:null;
  const part=pieces[move.index];
  if(here&&!samePart(here,part))return {kind:'remove',part:here,x:move.x,y:move.y};
  if(here?.rot===move.rot)return null;
  if(here)return {kind:'turn',part:here,...move};
  const available=pieces.find(p=>p.inTray&&samePart(p,part));
  const misplaced=available||pieces.find(p=>{
   if(!samePart(p,part))return false;
   const expected=plan.get(cell(p.x,p.y));
   return !expected||!samePart(p,pieces[expected.index]);
  });
  return {kind:available?'place':'move',part:misplaced||part,...move};
 }
 const segmentKey=r=>[r.x,r.y,r.nx,r.ny,r.color].join(',');
 const actualEdges=new Set(actual.segments.map(segmentKey));
 for(const ray of solved.segments){
  if(!actualEdges.has(segmentKey(ray)))continue;
  const action=at(cell(ray.nx,ray.ny));
  if(action)return {action,ray};
 }
 // A portal exit need not receive an incoming segment in the solved trace.
 for(const key of [...plan.keys(),...live.keys()]){
  const action=at(key);
  if(action)return {action};
 }
 return {};
}

export function contextualHint(level,pieces,step,lang='pl',solution=null,liveTrace=null){
 const en=lang==='en';
 const reply=(body,verified=false,focus=null)=>({body,verified,focus});
 const actual=liveTrace??trace(pieces);
 if(actual.won)return reply(en?'Every receiver is lit.':'Wszystkie rezonatory są zasilane.',true);
 const check=Array.isArray(solution)&&verifyPuzzleSolution(level,solution);
 if(check?.valid){
  const authored=step===1&&classicStrategy(level,lang);
  if(authored)return reply(authored,true);
  const {action,ray}=nextAction(pieces,solution,actual,check.result);
  if(action){
   const {part,x,y,rot,kind}=action,focus={x,y},name=label(part,lang);
   let editorial=null;
   if(!en&&step>1&&kind==='place'&&ray){
    const technique=classicTechnique(level,solution);
    if(technique){
     const start=createPuzzlePieces(level);
     const first=nextAction(start,solution,trace(start),check.result).action;
     if(first?.x===x&&first.y===y&&first.rot===rot)editorial=technique;
    }
   }
   // Editorial technique is tied to the verified opening and leaves the tile
   // for the player to discover. As the board changes, use the live beam path.
   if(step===2&&editorial)return reply(editorial.technique,true);
   const pos='('+x+', '+y+')';
   const lead=ray?(en?'Follow the '+colorName(ray.color,lang).toLowerCase()+' beam travelling '+heading(ray,lang)+'. ':
    'Śledź promień o barwie „'+colorName(ray.color,lang)+'”, biegnący '+heading(ray,lang)+'. '):'';
   if(kind==='remove'){
    const body=step===3?(en?'Return '+name+' at '+pos+' to the tray.':'Odłóż do zasobnika element '+name+' z pola '+pos+'.'):
     (en?'Clear '+name+' from this part of the light path.':'Zwolnij tę część toru wiązki. Odłóż element '+name+' do zasobnika.');
    const hint=reply(lead+body,true,step>1?focus:null);
    return step===3?{...hint,instruction:body}:hint;
   }
   if(step===3){
    const from='('+part.x+', '+part.y+')';
    const angle=rot*45+'°';
    if(kind==='turn'){
     const clockwise=(rot-part.rot+8)%8;
     const right=clockwise<=4;
     const turns=right?clockwise:8-clockwise;
     const suffix=turns+' × '+(en?(right?'right':'left'):(right?'w prawo':'w lewo'));
     const instruction=en?'Rotate '+name+' at '+pos+' to '+angle+' ('+suffix+').':
      'Obróć '+name+' na polu '+pos+' do '+angle+' ('+suffix+').';
     return {...reply(instruction,true,focus),instruction};
    }
    const verbs=en?{
     move:'Move '+name+' from '+from+' to '+pos,
     place:'Take '+name+' from the tray and put it at '+pos
    }:{
     move:'Przenieś '+name+' z pola '+from+' na '+pos,
     place:'Weź '+name+' z zasobnika i ustaw na polu '+pos
    };
    const instruction=verbs[kind]+(en?' and set it to ':' pod kątem ')+angle+'.';
    return {...reply(editorial?instruction+' '+editorial.confirmation:instruction,true,focus),instruction};
   }
   const exits=check.result.segments.filter(r=>r.x===x&&r.y===y);
   const outputs=[...new Set(exits.map(r=>colorName(r.color,lang)+' '+heading(r,lang)))];
   const motion=kind==='turn'?(en?'Rotate the optic already on the path.':'Obróć przyrząd, który już leży na torze wiązki.'):
    (en?'Arrange the optic on this light path.':'Wstaw przyrząd w tor wiązki.');
   if(step===1)return reply(lead+motion+' '+(outputs.length?
    (en?'Look for this outgoing light: ':'Szukaj takiego wyjścia wiązki: ')+outputs.join(' · ')+'.':
    opticDescription(part.type,lang)),true);
   const instruction=kind==='turn'?
    (en?'Turn the '+name+' on the highlighted tile. ':'Obróć '+name+' na zaznaczonym polu. '):
    (en?'Use '+name+' on the highlighted tile. ':'Użyj elementu '+name+' na zaznaczonym polu. ');
   const projected=trace(pieces.map(p=>p===part?{...p,x,y,rot,inTray:false}:p));
   const liveOutputs=projected.segments.filter(r=>r.x===x&&r.y===y);
   const result=outputs.length&&liveOutputs.some(r=>outputs.includes(colorName(r.color,lang)+' '+heading(r,lang)));
   if(result){
    const signal=[...new Set(liveOutputs.map(r=>colorName(r.color,lang)+' '+heading(r,lang)))];
    return reply(lead+instruction+(en?'Check for ':'Sprawdź wyjście wiązki — ')+signal.join(' · ')+'.',true,focus);
   }
   // A portal exit or multi-input optic may need a later connection.
   const required=check.result.segments.filter(r=>r.nx===x&&r.ny===y);
   const unseen=required.find(r=>!actual.segments.some(live=>
    live.x===r.x&&live.y===r.y&&live.nx===x&&live.ny===y&&live.color===r.color));
   const expectation=unseen?(en?'This point also needs '+colorName(unseen.color,lang).toLowerCase()+
    ' travelling '+heading(unseen,lang)+'.':
    'Do tego punktu trzeba doprowadzić też wiązkę o barwie „'+colorName(unseen.color,lang)+'”, biegnącą '+heading(unseen,lang)+'.'):
    opticDescription(part.type,lang);
   return reply(lead+instruction+expectation,true,focus);
  }
 }
 if(step===3)return reply(en?'No verified solution is available. Run solution analysis first.':
  'Ten układ nie ma jeszcze potwierdzonego rozwiązania. Uruchom analizę planszy.');
 const report=inspectLight(pieces,actual);
 const stop=report.collisions.find(c=>movable.has(c.type))||report.collisions[0];
 if(stop){
  const name=label(stop,lang);
  return reply(en?'Follow the '+colorName(stop.color,lang).toLowerCase()+' ray to '+name+
   '. It stops there. Try redirecting it before impact, or changing the entry angle.':
   'Prześledź promień o barwie „'+colorName(stop.color,lang)+'” aż do elementu '+name+
   '. Tam promień gaśnie. Spróbuj przekierować go wcześniej lub zmienić kąt wejścia.');
 }
 const target=report.targets.find(p=>!p.correct);
 if(target){
  const excess=target.unexpected,mask=excess||target.missing;
  const color=colorName(mask,lang);
  if(excess)return reply(en?'Trace the '+color+' channel upstream from the receiver. Try diverting that channel before it enters, while keeping the required channels on course.':
   'Rezonator odbiera zbędny sygnał „'+color+'”. Idź po tej wiązce wstecz i spróbuj odprowadzić ten kanał przed celem, zachowując potrzebne składowe.');
  return reply(en?'Work backwards from the receiver along an open row, column or diagonal. Look for an intersection with a beam carrying '+color+'.':
   'Rezonator potrzebuje sygnału „'+color+'”. Idź od niego wstecz wolnym rzędem, kolumną lub przekątną i poszukaj przecięcia z wiązką niosącą tę barwę.');
 }
 return reply(en?'Follow a ray out of its emitter to the first optic.':'Prześledź wiązkę od emitera do pierwszego przyrządu.');
}
