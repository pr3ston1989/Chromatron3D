import {PNG} from 'pngjs';

// Let viewport and HUD observers settle, then take one composited game frame.
// Decode on the test runner so PNG data never makes a round trip through the
// game's WebGL process or into the Playwright trace as a base64 argument.
export async function captureFrame(page){
 await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(()=>{
  window.__debug.renderStill();done();
 }))));
 return PNG.sync.read(await page.screenshot({scale:'css'}));
}

export function luminance(frame,x,y){
 const index=(Math.round(y)*frame.width+Math.round(x))*4;
 const {data}=frame;
 return data[index]*.2126+data[index+1]*.7152+data[index+2]*.0722;
}

export function projectCells(page,cells){
 return page.evaluate(cells=>cells.map(([x,y])=>window.chromatron.projectCell(x,y)),cells);
}
