/**
 * Dispose temporary Three.js scene objects after a move/reset.
 * Materials intentionally shared across the whole scene must be protected.
 * Dispose resources only once even if several meshes reference them.
 */
export function disposeGroupChildren(group, sharedMaterials=new Set()){
 const geometry=new Set(),materials=new Set();
 for(const child of [...group.children]){
  child.traverse(obj=>{
   if(!obj.isMesh)return;
   if(obj.geometry)geometry.add(obj.geometry);
   const mats=Array.isArray(obj.material)?obj.material:[obj.material];
   for(const mat of mats)if(mat&&!sharedMaterials.has(mat))materials.add(mat);
  });
  group.remove(child);
 }
 for(const geo of geometry)geo.dispose();
 for(const mat of materials)mat.dispose();
 return {geometries:geometry.size,materials:materials.size};
}
