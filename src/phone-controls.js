// The same controls retain their keyboard handlers, ARIA state and translations.
export function mountPhoneControls(portrait){
 const tools=document.querySelector('#phone-tools');
 const menu=tools.querySelector('.phone-tools-menu');
 const dock=document.querySelector('.game-dock');
 const diagnostics=document.querySelector('#app').classList.contains('orbital-pilot')
  ?[]:[['analysis-toggle',menu,'phoneAnalysis'],['spectral-toggle',menu]];
 const placements=[
  ...diagnostics,['reset',menu,'phoneReset'],['camera-preset',dock]
 ].map(([id,host,label])=>{
  const button=document.getElementById(id);
  const placeholder=document.createComment(id);
  button.before(placeholder);
  if(label){
   const caption=document.createElement('span');
   caption.dataset.i18n=label;caption.className='phone-tool-label';
   button.append(caption);
  }
  return {button,placeholder,host};
 });
 function layout(){
  tools.open=false;
  for(const {button,placeholder,host} of placements){
   if(portrait.matches)host.append(button);
   else placeholder.after(button);
  }
 }
 menu.addEventListener('click',event=>{
  if(event.target.closest('button'))tools.open=false;
 });
 tools.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&tools.open){
   event.stopPropagation();tools.open=false;tools.querySelector('summary').focus();
  }
 });
 document.addEventListener('pointerdown',event=>{
  if(tools.open&&!tools.contains(event.target))tools.open=false;
 });
 portrait.addEventListener('change',layout);
 layout();
}

export function createPhoneOverview(button,grid,palette,onNavigate){
 const canvas=button.querySelector('canvas');
 const ctx=canvas.getContext('2d');
 const clamp=v=>Math.max(0,Math.min(grid,v));
 button.addEventListener('click',event=>{
  const box=canvas.getBoundingClientRect();
  if(!box.width)return;
  const x=event.detail?clamp((event.clientX-box.left)*grid/box.width):grid/2;
  const y=event.detail?clamp((event.clientY-box.top)*grid/box.height):grid/2;
  onNavigate(x-grid/2,y-grid/2);
 });
 return (pieces,segments,cx,cy,across,down)=>{
  if(!ctx)return;
  ctx.setTransform(canvas.width/grid,0,0,canvas.height/grid,0,0);
  ctx.fillStyle='#101b2b';ctx.fillRect(0,0,grid,grid);
  ctx.lineWidth=.28;
  for(const s of segments){
   ctx.beginPath();ctx.strokeStyle=palette[s.color];
   ctx.moveTo(s.x+.5,s.y+.5);ctx.lineTo(s.nx+.5,s.ny+.5);ctx.stroke();
  }
  for(const p of pieces){
   if(p.inTray)continue;
   ctx.fillStyle=palette[p.color]&&p.color?palette[p.color]:'#aebdce';
   if(p.type==='target'){
    ctx.beginPath();ctx.arc(p.x+.5,p.y+.5,.55,0,2*Math.PI);ctx.fill();
   }else ctx.fillRect(p.x+.06,p.y+.06,.88,.88);
  }
  const left=clamp(cx-across/2),top=clamp(cy-down/2);
  const w=clamp(cx+across/2)-left,h=clamp(cy+down/2)-top;
  ctx.fillStyle='#96dfff17';ctx.fillRect(left,top,w,h);
  ctx.lineWidth=.26;ctx.strokeStyle='#a4edff';
  ctx.strokeRect(left+.13,top+.13,Math.max(0,w-.26),Math.max(0,h-.26));
 };
}
