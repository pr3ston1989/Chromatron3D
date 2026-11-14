import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmdirSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {localCampaignPlugin} from '../scripts/local-campaigns.mjs';

test('both local servers supply the installed library only to a loopback game page',()=>{
 const directory=mkdtempSync(join(tmpdir(),'chromatron-empty-'));
 try{
  const plugin=localCampaignPlugin(directory);
  for(const install of [plugin.configureServer,plugin.configurePreviewServer]){
   let handle;
   install({middlewares:{use(fn){handle=fn}}});
   function request({host='127.0.0.1:5173',peer='127.0.0.1',site='same-origin'}={}){
    let output;
    const headers={};
    handle({url:'/local-campaigns.js',method:'GET',headers:{host,'sec-fetch-site':site},socket:{remoteAddress:peer}},
     {setHeader:(k,v)=>{headers[k]=v},end:body=>{output=body}},err=>{if(err)throw err});
    return {headers,output};
   }
   assert.equal(request().output,'globalThis.chromatronLocalCampaigns=[];');
   assert.equal(request().headers['Cache-Control'],'private, no-store');
   assert.equal(request({peer:'192.0.2.1'}).output,undefined);
   assert.equal(request({host:'remote.example'}).output,undefined);
   assert.equal(request({site:'cross-site'}).output,undefined);
  }
 }finally{rmdirSync(directory)}
});
