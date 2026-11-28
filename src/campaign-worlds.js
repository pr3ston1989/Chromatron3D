const world=(id,pl,en,legacyId,sky,haze,fog,key,edge,deck,art)=>Object.freeze({
 id,pl,en,legacyId,sky,haze,fog,key,edge,tileA:sky,accent:edge,deck,...art
});

export const CAMPAIGN_FOOTING_Y=-8.88;

export const CAMPAIGN_WORLDS=Object.freeze([
 world('observatory','Obserwatorium pryzmatyczne','Prism Observatory','orbital',
  0x101a32,0x395272,0x192e4f,0xe4eeff,0x82d7ff,'kepler',{scene:'kepler'}),
 world('heliostat','Ogród heliostatów','Heliostat Garden','verdant',
  0x212a30,0xa37856,0x515d60,0xffdfb3,0xd3b471,'garden',{
   face:.48,groove:.65,dust:0xc5ac82,air:'sunset',masonry:true,surface:'limestone',footing:{body:0x766044,bevel:0x9a8059,substructure:0x554940},
   traffic:{model:'ambient-survey-glider',period:30,duration:10,offset:2.6,
    from:[17,-2.4,-25],to:[32,-2.1,-14.5],scale:.83},
   models:[
    ['heliostat-terrain',[0,-40,0],[1,1,1],0,'ground'],
    ['heliostat-optical-collector',[-10.5,-9.1,-13.4],1.25,-.26,'left'],
    ['heliostat-aqueduct',[20.5,-8.95,4.9],1.17,-.60,'right'],
    ['heliostat-aqueduct',[15.1,-15.6,-27.8],1.28,-.56,'horizon'],
    ['heliostat-orchard',[-16.4,-10.6,3.1],[1.04,1.02,1.10],-.38],
    ['heliostat-garden-spring',[9.7,-9.65,15.8],1.27,-.68],
    ['heliostat-ravine',[21.5,-14.7,-16.0],1.34,-.43]
   ]
  }),
 world('grotto','Kryształowa grota','Crystal Grotto','nebula',
  0x0f1428,0x4e6582,0x313a54,0xffefe2,0xbb9ee1,'grotto',{
   face:.54,groove:.61,dust:0xaba4db,air:'cavern',masonry:true,footing:{body:0x493a5b,bevel:0x6b5985},
   traffic:{model:'ambient-cavern-moth',period:24,duration:13,offset:3.5,count:4,
    from:[27.1,-4.7,.7],to:[34.2,-5.9,8.9],scale:.69},
   currents:[{count:22,origin:[30.38,-15.2,10.62],spread:[1.24,.41,1.02],travel:[1.30,.94,1.49],
    tint:0x689faf,size:.89,length:1.38,opacity:.21,rate:.29}],
   models:[
    ['grotto-terrain',[0,-40,0],[1,1,1],0,'ground'],
    ['grotto-buttress',[-17.9,-24.65,-17.9],1.34,-.16,'cliff'],
    ['grotto-survey',[12.8,-8.62,10.5],1.47,-.54,'cliff'],
    ['grotto-pump-causeway',[-11.8,-20.0556,-10.4],1.28,-.35],
    ['grotto-calcite-spring',[30.85,-20.22,6.16],1.19,-.29],
    ['grotto-crystal-seam',[-13.8,-8.7,-15.7],1.17,-.41,'cliff'],
    ['grotto-crystal-seam',[27.5,-12.23,-1.5],1.13,-.48],
    ['grotto-escarpment',[24,-32.4,-28],[2.15,1.78,2.49],-.77],
    ['grotto-escarpment',[43,-48,-43],[3.18,1.87,2.35],-.46]
   ]
  }),
 world('shipyard','Stocznia orbitalna','Orbital Shipyard','orbital',
  0x0d2039,0x203f62,0x233c57,0xdbebff,0x65c6ce,'shipyard',{face:.59,glow:.31}),
 world('frost','Laboratorium polarne','Polar Laboratory','polar',
  0x0b162c,0x365c78,0x385067,0xdcf0ff,0x94e6ff,'shipyard',{
   face:.59,groove:.65,dust:0xa7c3d5,deckTint:0xd4e7ff,air:'aurora',surface:'frost',
   footing:{body:0x24394c,bevel:0x485b70},
   traffic:{model:'ambient-survey-glider',period:37,duration:12,offset:4.8,
    from:[17.5,-3.4,-11.4],to:[34,-2.6,-.7],scale:.87,
    palette:{'Survey glider body':0x9db8c9,'Glider solar laminate':0x28435f}},
   currents:[{count:27,origin:[22.6,-12.37,6.7],spread:[4.91,.48,2.38],travel:[6.82,.47,1.63],
    tint:0xa5cede,size:.44,length:2.44,opacity:.19,rate:.42}],
   models:[
    ['frost-terrain',[0,-40,0],[1,1,1],0,'ground'],
    ['frost-optical-lab',[-10.5,-10.62,-13.9],1.20,-.41],
    ['frost-icefall',[-15.1,-13.5,-16.1],[1.06,.84,1.01],-.58],
    ['frost-radiometer',[10.2,-10.07,15.7],1.34,-.43,'pulse'],
    ['frost-core-bridge',[28.75,-15.08,6.9],1,1.32],
    ['frost-icefall',[-17.5,-11.6,10.4],[1.18,.96,1.51],.39]
   ]
  }),
 world('forge','Kuźnia widmowa','Spectral Forge','nebula',
  0x1b1620,0x713b30,0x542d32,0xffc99b,0xf3a85d,'deck',{
   face:.48,groove:.59,dust:0xd9a172,deckTint:0xd8c5b4,air:'embers',surface:'slate',footing:{body:0x453337,bevel:0x835f45},
   traffic:{model:'ambient-forge-hauler',period:17,shuttle:true,offset:2.7,heading:-.54,
    from:[21.2,-10.5,-8.5],to:[27.8,-10.5,-4.5],scale:.68},
   currents:[{count:34,origin:[11.1,-4.7,14.5],spread:[4.6,.4,2.1],travel:[2.9,2.65,-.65],
    tint:0xffa557,size:.065,length:.29,opacity:.82,rate:.61},
   {count:23,origin:[-11.4,-3.2,-13.7],spread:[3.2,.28,1.9],travel:[3.4,2.1,.56],
    tint:0x92716a,size:.65,length:1.48,opacity:.23,rate:.28},
   {count:22,origin:[29.7,-15.8,9.2],spread:[1.58,.52,1.63],travel:[2.65,5.1,1.74],
    tint:0xd6956f,size:.88,length:1.72,opacity:.19,rate:.34}],
   models:[
    ['forge-terrain',[0,-40,0],[1,1,1],0,'ground'],
    ['forge-furnace-bank',[-10.9,-8.8,-13.6],1.31,-.41],
    ['forge-casting-line',[9.8,-9.29,15.1],1.23,-.51],
    ['forge-service-rail',[24.5,-13.8,-6.5],1.16,-.54],
    ['forge-basalt',[-17.5,-11.8,10.4],[1.25,1.13,1.35],-.31],
    ['forge-spillway',[31.8,-17.13,5.5],1,-.51]
   ]
  }),
 world('abyss','Optyka głębinowa','Abyssal Optics','verdant',
  0x041322,0x215974,0x183a4d,0xbde0f2,0x73c9c4,'deck',{
   face:.50,groove:.59,dust:0x88bebc,deckTint:0xaeced2,air:'current',footing:{body:0x223941,bevel:0x487176},
   traffic:{model:'ambient-pelagic-fish',period:23,duration:14,offset:3.1,count:7,
    from:[18.7,-6.0,-17.3],to:[27.5,-6.6,-4.5],scale:.83},
   models:[
    ['abyss-terrain',[0,-40,0],[1,1,1],0,'ground'],
    ['abyss-observatory',[-9.7,-7.85,-13.4],1.27,-.36,'left'],
    ['abyss-vent-reef',[18.7,-11.75,5.0],[1.42,1.39,1.48],-.46],
    ['abyss-vent-reef',[9.3,-8.65,16.4],1.31,-.33,'vent'],
    ['abyss-vent-reef',[-17.7,-9.65,10.8],[1.37,1.17,1.42],.61],
    ['abyss-survey-rov',[15.7,-4.45,9.2],1.46,-.57,'survey'],
    ['abyss-reef',[18,-11.4,-18],[1.74,1.35,1.58],-.36,'horizon'],
    ['abyss-observatory',[28,-18.0,-30],1.53,-.58,'horizon'],
    ['abyss-vent-reef',[41,-22.1,-45],[2.26,1.71,1.83],-.62,'horizon']
   ]
  }),
 world('sanctuary','Sanktuarium soczewek','Lens Sanctuary','polar',
  0x101528,0x4d6988,0x333e58,0xf5ded0,0xc1b7eb,'grotto',{
   face:.53,groove:.60,dust:0xb6afd7,deckTint:0xe1d4eb,air:'twilight',masonry:true,footing:{body:0x424359,bevel:0x6a677b},
   currents:[{count:15,origin:[16.9,-6.1,-20.8],spread:[7.9,.32,1.3],travel:[10.4,.72,1.4],
    tint:0x9595b6,size:1.06,length:3.3,opacity:.18,rate:.15}],
   models:[
    ['sanctuary-terrain',[0,-40,0],[1,1,1],0,'ground'],
    ['sanctuary-meridian',[-10.4,-8.5,-15.4],[1.00,1.19,1.10],-.43,'left'],
    ['sanctuary-collimator',[18.7,-7.8,7.1],1.28,-.54,'right'],
    ['sanctuary-broken-span',[17,-12.6,-24.4],1.45,-.53],
    ['sanctuary-broken-span',[34,-17.8,-41],1.91,-.72,'horizon'],
    ['sanctuary-terrace',[-12.0,-9.4,12.8],1.08,-.30],
    ['grotto-escarpment',[36,-46,-54],[1.82,1.64,2.00],-.54,'horizon']
   ]
  })
]);

const byId=new Map(CAMPAIGN_WORLDS.map(world=>[world.id,world]));
const demo=['observatory','heliostat','grotto','frost','forge','abyss','sanctuary','shipyard'];

export function campaignWorld(campaign,index){
 if(!Number.isInteger(index)||index<0)return null;
 if(campaign==='demo')return byId.get(demo[index])??null;
 if(/^classic[1-4]$/.test(campaign)&&index<50)
  return CAMPAIGN_WORLDS[(Number(campaign.at(-1))-1)*2+Math.floor(index/25)];
 return null;
}

export function getCampaignWorld(id){return byId.get(id)??null}

export function scenerySeed(campaign,index){
 let hash=2166136261;
 for(const char of campaign+':'+index)hash=Math.imul(hash^char.charCodeAt(0),16777619);
 return hash>>>0;
}
