// The same controls retain their keyboard handlers, ARIA state and translations.
export function mountPhoneControls(portrait){
 const tools=document.querySelector('#phone-tools');
 const menu=tools.querySelector('.phone-tools-menu');
 const dock=document.querySelector('.game-dock');
 const placements=[
  ['analysis-toggle',menu,'phoneAnalysis'],['reset',menu,'phoneReset'],
  ['spectral-toggle',menu],['camera-preset',dock]
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
