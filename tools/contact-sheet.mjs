import {readFile,readdir} from 'node:fs/promises';
import {resolve,join,basename} from 'node:path';
import {parseArgs} from 'node:util';
import {launchChromium} from './capture-browser.mjs';

const {positionals,values}=parseArgs({allowPositionals:true,options:{
  columns:{type:'string',default:'4'}, out:{type:'string'}
}});
if(!positionals.length)throw Error('Usage: node tools/contact-sheet.mjs <folder or PNG files> [--out output.png]');
const columns=Number(values.columns);
if(!Number.isInteger(columns)||columns<1||columns>8)throw Error('The sheet needs 1–8 columns');
const files=positionals.length===1&&!positionals[0].toLowerCase().endsWith('.png')?
  (await readdir(positionals[0])).filter(name=>name.endsWith('.png')&&name!=='contact-sheet.png')
    .sort().map(name=>join(positionals[0],name)):positionals;
if(!files.length)throw Error('No PNG files found');
const output=resolve(values.out||(files===positionals?'contact-sheet.png':join(positionals[0],'contact-sheet.png')));
const cards=await Promise.all(files.map(async(file)=>({label:basename(file),
  src:'data:image/png;base64,'+(await readFile(file)).toString('base64')})));
const browser=await launchChromium();
try{
  const page=await browser.newPage({viewport:{width:Math.min(columns,cards.length)*390+36,height:850}});
  await page.setContent(`<style>
    *{box-sizing:border-box}body{margin:0;padding:18px;background:#091019;color:#e8eef6;font:15px system-ui}
    main{display:grid;gap:14px;grid-template-columns:repeat(${columns}, minmax(0, 1fr))}
    figure{margin:0;padding:8px;border:1px solid #2a394d;background:#101b29}
    img{display:block;width:100%;height:auto;max-height:310px;object-fit:contain;background:#0b1420}
    figcaption{padding:8px 2px 2px;overflow-wrap:anywhere}
  </style><main></main>`);
  await page.evaluate(async data=>{
    const root=document.querySelector('main');
    await Promise.all(data.map(async ({src,label})=>{
      const figure=document.createElement('figure');
      const img=new Image();
      img.src=src;img.alt=label;
      const caption=document.createElement('figcaption');
      caption.textContent=label;
      figure.append(img,caption);root.append(figure);
      await img.decode();
    }));
  },cards);
  await page.screenshot({path:output,fullPage:true});
  console.log(output);
} finally { await browser.close(); }
