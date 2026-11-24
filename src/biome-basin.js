const BASINS={
 heliostat:{height:-17.5,base:0x203e37,tint:0x567774,fog:0x655b56,mode:0},
 frost:{height:-18,base:0x172f43,tint:0x608fa5,fog:0x486077,mode:1},
 forge:{height:-14,base:0x271722,tint:0xff6c1f,fog:0x552b2a,mode:2},
 abyss:{height:-17,base:0x142e42,tint:0x559a9f,fog:0x215666,mode:3},
 sanctuary:{height:-20,base:0x252139,tint:0x4d4b68,fog:0x4c4d6a,mode:0}
};

export function createBiomeBasin(THREE,id){
 const spec=BASINS[id];
 if(!spec)return null;
 const material=new THREE.ShaderMaterial({
  uniforms:{
   seconds:{value:0},base:{value:new THREE.Color(spec.base)},
   tint:{value:new THREE.Color(spec.tint)},mist:{value:new THREE.Color(spec.fog)},mode:{value:spec.mode}
  },
  vertexShader:`
   varying vec3 ground;
   void main(){
    vec4 point=modelMatrix*vec4(position,1.);
    ground=point.xyz;
    gl_Position=projectionMatrix*viewMatrix*point;
   }`,
  fragmentShader:`
   varying vec3 ground;
   uniform vec3 base,tint,mist;
   uniform float seconds,mode;
   float strata(vec2 p){
    return .58*sin(p.x*.34+p.y*.22)
          +.25*sin(p.y*.41-p.x*.78)
          +.17*cos(p.x*1.16+p.y*.88);
   }
   void main(){
    vec2 p=ground.xz;
    float broad=strata(p*.48);
    float ridges=strata(p+vec2(4.*broad,-2.*broad));
    vec3 color=mix(base,tint,.18+.18*ridges+.11*broad);
    if(mode==2.){
     // Dark crust moves separately from the main lava flow.
     float channel=abs(p.x*.18+.65*sin(p.y*.15)-.65);
     float bank=1.-smoothstep(.30,.92,channel);
     float crust=smoothstep(.31,.67,strata(p*.83+vec2(-seconds*.14,seconds*.24)));
     color=base*(.58+.29*ridges)+tint*bank*(.39+.91*crust);
    }else if(mode==3.){
     vec2 q=p+vec2(seconds*.23,-seconds*.18);
     float caustic=pow(max(0.,1.-abs(strata(q*.73))*3.8),5.);
     color+=tint*.26*caustic;
    }else if(mode==1.){
     float ice=exp(-27.*abs(ridges-.13));
     color+=tint*.14*ice;
    }
    float distanceToEye=length(cameraPosition-ground);
    float fog=1.-exp(-.00018*distanceToEye*distanceToEye);
    color=mix(color,mist,fog*.91);
    gl_FragColor=vec4(color,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`
 });
 const basin=new THREE.Mesh(new THREE.PlaneGeometry(240,240),material);
 basin.rotation.x=-Math.PI*.5;
 basin.position.y=spec.height;
 basin.name='Basin floor';
 return basin;
}
