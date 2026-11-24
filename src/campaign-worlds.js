const world=(id,pl,en,legacyId,sky,haze,fog,key,edge,deck,art)=>Object.freeze({
 id,pl,en,legacyId,sky,haze,fog,key,edge,tileA:sky,accent:edge,deck,...art
});

export const CAMPAIGN_WORLDS=Object.freeze([
 world('observatory','Obserwatorium pryzmatyczne','Prism Observatory','orbital',
  0x101a32,0x395272,0x192e4f,0xe4eeff,0x82d7ff,'kepler',{scene:'kepler'}),
 world('heliostat','Ogród heliostatów','Heliostat Garden','verdant',
  0x212a30,0xa37856,0x515d60,0xffdfb3,0xd3b471,'garden',{
   face:.48,groove:.65,dust:0xc5ac82,air:'sunset',masonry:true,surface:'limestone',footing:{body:0x766044,bevel:0x9a8059,substructure:0x554940},
   models:[
    ['garden-heliostat-authored',[-9.9,-7.75,-13.0],1.43,-.41,'left'],
    ['heliostat-orchard',[-11.8,-12.9,-13.2],[1.22,1.27,1.21],-.42,'cliff'],
    ['heliostat-aqueduct',[20.5,-8.95,4.9],1.17,-.60,'right'],
    ['heliostat-orchard',[20.8,-14.6,6.0],[1.4,1.2,1.32],-.55],
    ['heliostat-aqueduct',[15.1,-15.6,-27.8],1.28,-.56,'horizon'],
    ['heliostat-orchard',[-16.4,-10.6,3.1],[1.04,1.02,1.10],-.38],
    ['heliostat-garden-spring',[9.7,-9.65,15.8],1.27,-.68],
    ['heliostat-orchard',[26,-18.8,-25],[1.62,1.02,1.48],-.22,'horizon'],
    ['heliostat-orchard',[29,-20,-43],[2.62,1.45,2.82],-.57,'horizon'],
    ['heliostat-orchard',[44,-23,-57],[3.16,1.79,2.85],-.35,'horizon']
   ]
  }),
 world('grotto','Kryształowa grota','Crystal Grotto','nebula',
  0x0f1428,0x4e6582,0x313a54,0xffefe2,0xbb9ee1,'grotto',{
   face:.54,groove:.61,dust:0xaba4db,air:'cavern',masonry:true,footing:{body:0x493a5b,bevel:0x6b5985},
   models:[
    ['grotto-buttress',[-13.3,-24.0,-10.4],1.47,-.32,'cliff'],
    ['grotto-fault-shelf',[12.8,-23.8,10.5],1.47,-.54,'cliff'],
    ['grotto-survey',[12.8,-8.4,10.5],1.47,-.54,'cliff'],
    ['grotto-crystal-seam',[-13.8,-8.7,-15.7],1.17,-.41,'cliff'],
    ['grotto-crystal-seam',[21,-13.1,-10.9],1.53,-.47,'cliff'],
    ['grotto-fault-shelf',[24,-25.0,-22],1.12,.62,'cliff'],
    ['grotto-escarpment',[19,-34,-24],[2.15,1.94,2.55],-.77],
    ['grotto-escarpment',[38,-46,-40],[3.18,1.98,2.35],-.46]
   ]
  }),
 world('shipyard','Stocznia orbitalna','Orbital Shipyard','orbital',
  0x0d2039,0x203f62,0x233c57,0xdbebff,0x65c6ce,'shipyard',{face:.59,glow:.31}),
 world('frost','Laboratorium polarne','Polar Laboratory','polar',
  0x162b41,0x528093,0x435d76,0xdaefff,0x94e6ff,'shipyard',{
   face:.59,groove:.73,dust:0xc0d8e4,deckTint:0xc7dcff,air:'aurora',surface:'frost',
   models:[
    ['frost-escarpment',[-12.2,-9.4,-13.8],[1.13,1.28,1.39],-.39,'cliff'],
    ['frost-traverser',[17.5,-5.88,6.2],1.19,-.47,'right'],
    ['frost-escarpment',[20,-13.3,8.3],[1.18,1.19,1.38],-.67,'cliff'],
    ['frost-escarpment',[14.3,-18,-34],[1.94,1.6,1.40],.21,'horizon'],
    ['frost-escarpment',[38,-20,-49],[2.16,1.82,2.03],-.45,'horizon'],
    ['frost-traverser',[25,-9,-19],.9,-.28,'horizon']
   ]
  }),
 world('forge','Kuźnia widmowa','Spectral Forge','nebula',
  0x251622,0x8c412c,0x613235,0xffc99b,0xf3a85d,'deck',{
   face:.48,groove:.59,dust:0xd9a172,deckTint:0xd8c5b4,air:'embers',surface:'alloy',footing:{body:0x453337,bevel:0x835f45},
   models:[
    ['forge-smelter',[-11.5,-7.9,-14.9],1.56,-.42,'left'],
    ['forge-basalt',[-13.2,-12.1,-13.8],[1.41,1.2,1.5],-.38,'cliff'],
    ['maintenance-crane',[16.9,-8.1,5.5],1.51,-.55,'right'],
    ['forge-basalt',[17.5,-12.7,6.5],[1.38,1.54,1.44],-.50,'cliff'],
    ['forge-basalt',[-17.5,-10.9,13.6],[1.28,1.33,1.5],-.25,'cliff'],
    ['forge-smelter',[27,-13.1,-26.2],1.27,-.65,'horizon'],
    ['forge-basalt',[32,-18.5,-36],[2.3,1.65,1.52],-.61,'horizon']
   ]
  }),
 world('abyss','Optyka głębinowa','Abyssal Optics','verdant',
  0x071a2e,0x327984,0x214957,0xbaecf2,0x7de0d3,'garden',{
   face:.53,groove:.60,dust:0xa3d1c9,deckTint:0xbce7e9,air:'current',footing:{body:0x2b4a52,bevel:0x5a8a8b},
   models:[
    ['abyss-habitat',[-11.9,-7.45,-14.1],1.37,-.52,'left'],
    ['abyss-reef',[-13.2,-11.95,-14.4],[1.34,1.28,1.33],-.57,'cliff'],
    ['abyss-reef',[16,-9.47,5.2],[1.42,1.31,1.49],-.49,'cliff'],
    ['abyss-reef',[-17.1,-9.2,12.6],[1.65,1.58,1.4],-.24,'cliff'],
    ['abyss-habitat',[26,-13.0,-26],1.42,-.73,'horizon'],
    ['abyss-reef',[27,-17,-33],[2.55,1.42,1.82],-.53,'horizon']
   ]
  }),
 world('sanctuary','Sanktuarium soczewek','Lens Sanctuary','polar',
  0x101528,0x4d6988,0x333e58,0xf5ded0,0xc1b7eb,'grotto',{
   face:.53,groove:.60,dust:0xb6afd7,deckTint:0xe1d4eb,air:'twilight',masonry:true,footing:{body:0x424359,bevel:0x6a677b},
   models:[
    ['sanctuary-gate',[-10.8,-8.73,-17.4],1.31,-.52,'left'],
    ['sanctuary-collimator',[18.7,-7.8,7.1],1.28,-.54,'right'],
    ['sanctuary-terrace',[18.7,-12.1,7.1],1.32,-.54,'cliff'],
    ['sanctuary-terrace',[-11.1,-12.7,-17.8],1.35,-.52,'cliff'],
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
