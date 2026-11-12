import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

/**
 * Precision-instrument details shared by the browser and future packaged PC app.
 * All dimensions are in game-world units; all geometry stays within a tile.
 * Never affects puzzle collision/solver; visual-only.
 */
export function detailEmitter(THREE,group,rot,color){
 const root=new THREE.Group();
 root.name='precision-laser-emitter';
 group.add(root);
 const titanium=new THREE.MeshPhysicalMaterial({color:0x304b5e,metalness:.87,roughness:.22,clearcoat:.48});
 const graphite=new THREE.MeshStandardMaterial({color:0x091829,metalness:.62,roughness:.38});
 const silver=new THREE.MeshPhysicalMaterial({color:0xadcddd,metalness:.93,roughness:.15,clearcoat:.55});
 const energy=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.84,toneMapped:false});
 const axis=new THREE.Vector3([0,1,1,1,0,-1,-1,-1][rot],0,[-1,-1,0,1,1,1,0,-1][rot]).normalize();
 const ringAxis=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),axis);
 function add(geo,mat,x,y,z,name){
  const m=new THREE.Mesh(geo,mat);
  m.name=name;m.position.set(x,y,z);root.add(m);return m;
 }
 // Four thermal jackets, visible around the barrel and indicating engineering purpose.
 for(const length of [.075,.18,.30,.41]){
  const ring=add(new THREE.TorusGeometry(.211,.018,8,28),silver,axis.x*length,.53,axis.z*length,'machined-barrel-ring');
  ring.quaternion.copy(ringAxis);
 }
 // Eight radial cooling cuts form a physical heat sink at the back of the lens.
 for(let i=0;i<8;i++){
  const angle=i*Math.PI/4;
  const distance=.36;
  const fin=add(new RoundedBoxGeometry(.08,.065,.18,2,.012),titanium,
   Math.sin(angle)*distance,.37,Math.cos(angle)*distance,'heatsink-fin');
  fin.rotation.y=angle;
 }
 const shroud=add(new THREE.CylinderGeometry(.255,.285,.095,24),graphite,axis.x*.60,.53,axis.z*.60,'optical-collar');
 shroud.quaternion.copy(ringAxis);
 const glass=add(new THREE.CylinderGeometry(.161,.161,.035,24),energy,axis.x*.68,.53,axis.z*.68,'laser-wavelength-lens');
 glass.quaternion.copy(ringAxis);
 // Small forward-facing marker shows the beam direction without extra bloom.
 const heading=add(new THREE.ConeGeometry(.052,.12,3),energy,axis.x*.51,.83,axis.z*.51,'direction-index');
 heading.quaternion.copy(ringAxis);
 return root;
}

export function detailResonator(THREE,group,{color,active=false}={}){
 const root=new THREE.Group();
 root.name='precision-resonator';
 group.add(root);
 const ceramic=new THREE.MeshPhysicalMaterial({color:0x1a2b41,metalness:.35,roughness:.24,clearcoat:.55});
 const chrome=new THREE.MeshPhysicalMaterial({color:0xa8cbda,metalness:.85,roughness:.17,clearcoat:.75});
 const energy=new THREE.MeshBasicMaterial({color,transparent:true,opacity:active?.95:.54,toneMapped:false});
 function add(geo,mat,x,y,z,name){
  const m=new THREE.Mesh(geo,mat);m.name=name;m.position.set(x,y,z);root.add(m);return m;
 }
 // Machined aperture vanes frame the receiving crystal, never mask it.
 for(let i=0;i<8;i++){
  const angle=i*Math.PI/4;
  const r=.38;
  const vane=add(new RoundedBoxGeometry(.09,.14,.20,2,.017),ceramic,
   Math.sin(angle)*r,.49,Math.cos(angle)*r,'iris-vane');
  vane.rotation.y=angle;
  const light=add(new THREE.BoxGeometry(.037,.018,.095),active?energy:chrome,
   Math.sin(angle)*r,.572,Math.cos(angle)*r,'wavelength-index');
  light.rotation.y=angle;
 }
 const brim=add(new THREE.TorusGeometry(.47,.029,10,48),chrome,0,.31,0,'receiver-outer-collar');
 brim.rotation.x=Math.PI/2;
 const shield=add(new THREE.TorusGeometry(.345,.013,9,48),energy,0,.65,0,'receiver-color-halo');
 shield.rotation.x=Math.PI/2;
 return root;
}
