import test from 'node:test';
import assert from 'node:assert/strict';
import {disposeGroupChildren} from '../src/dispose.js';
test('temporary geometries and materials are disposed only once',()=>{
 const stats={geo:0,mat:0,shared:0};
 const geo={dispose(){stats.geo++}};
 const mat={dispose(){stats.mat++}};
 const shared={dispose(){stats.shared++}};
 const mesh1={isMesh:true,geometry:geo,material:mat};
 const mesh2={isMesh:true,geometry:geo,material:[mat,shared]};
 const child={traverse(f){f(mesh1);f(mesh2)}};
 const group={children:[child],remove(x){this.children.splice(this.children.indexOf(x),1)}};
 assert.deepEqual(disposeGroupChildren(group,new Set([shared])),{geometries:1,materials:1});
 assert.deepEqual(stats,{geo:1,mat:1,shared:0});
 assert.equal(group.children.length,0);
});
test('safe with an empty group',()=>{
 assert.deepEqual(disposeGroupChildren({children:[],remove(){}}),{geometries:0,materials:0});
});
