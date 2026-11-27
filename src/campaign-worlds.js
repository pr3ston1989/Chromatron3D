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
   ground:{'Fractured slate':0x887a5a,'Amethyst growth faces':0x8a975c,
    'Sanctuary terrace body':0x826d4a,'Sanctuary terrace bevel':0xaa966d,'Sanctuary terrace substructure':0x4d4637},
   models:[
    ['grotto-fault-shelf',[0,-18.40,0],[2.61,.85,3.60],-.13,'ground'],
    ['sanctuary-terrace',[-.8,-11.35,.8],[2.44,1.02,3.89],-.08,'ground'],
    ['heliostat-optical-collector',[-10.5,-9.1,-13.4],1.25,-.26,'left'],
    ['heliostat-orchard',[-11.8,-12.9,-13.2],[1.22,1.27,1.21],-.42,'cliff'],
    ['heliostat-aqueduct',[20.5,-8.95,4.9],1.17,-.60,'right'],
    ['heliostat-orchard',[20.8,-14.6,6.0],[1.4,1.2,1.32],-.55],
    ['heliostat-aqueduct',[15.1,-15.6,-27.8],1.28,-.56,'horizon'],
    ['heliostat-orchard',[-16.4,-10.6,3.1],[1.04,1.02,1.10],-.38],
    ['heliostat-garden-spring',[9.7,-9.65,15.8],1.27,-.68],
    ['heliostat-ravine',[21.5,-14.7,-16.0],1.34,-.43],
    ['frost-ridge',[31,-22.7,-38],[1.95,1.24,2.82],-.57,'horizon'],
    ['frost-ridge',[56,-34.7,-60],[3.16,1.98,2.85],-.35,'horizon']
   ]
  }),
 world('grotto','Kryształowa grota','Crystal Grotto','nebula',
  0x0f1428,0x4e6582,0x313a54,0xffefe2,0xbb9ee1,'grotto',{
   face:.54,groove:.61,dust:0xaba4db,air:'cavern',masonry:true,footing:{body:0x493a5b,bevel:0x6b5985},
   currents:[{count:55,origin:[-15.1,-4.7,-9.6],spread:[1.05,.46,.55],travel:[.50,-7.6,.3],
    tint:0x9eb9d7,size:.25,length:1.42,opacity:.40,rate:.53}],
   models:[
    ['grotto-fault-shelf',[.25,-21.1,-.35],[2.58,1.07,3.65],-.09,'ground'],
    ['grotto-buttress',[-13.3,-24.0,-10.4],1.47,-.32,'cliff'],
    ['grotto-fault-shelf',[12.8,-23.8,10.5],1.47,-.54,'cliff'],
    ['grotto-survey',[12.8,-8.4,10.5],1.47,-.54,'cliff'],
    ['grotto-pump-causeway',[-11.8,-5.63,-10.4],1.28,-.35],
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
  0x0b162c,0x365c78,0x385067,0xdcf0ff,0x94e6ff,'shipyard',{
   face:.59,groove:.65,dust:0xa7c3d5,deckTint:0xd4e7ff,air:'aurora',surface:'frost',
   footing:{body:0x24394c,bevel:0x485b70},
   ground:{'Fractured slate':0x879ead,'Amethyst growth faces':0xa2c1cc},
   models:[
    ['grotto-fault-shelf',[0,-20.32,0],[2.68,1.04,3.72],-.07,'ground'],
    ['frost-icefall',[.2,-13.02,-.2],[1.53,1.24,2.51],-.12,'ground'],
    ['frost-optical-lab',[-10.5,-10.62,-13.9],1.20,-.41],
    ['frost-icefall',[-10.5,-14.1,-13.9],[1.48,1.14,1.38],-.58],
    ['frost-icefall',[10.2,-13.2,15.7],[1.28,1.11,1.19],-.37],
    ['frost-radiometer',[10.2,-10.07,15.7],1.34,-.43,'pulse'],
    ['frost-icefall',[-17.5,-11.6,10.4],[1.18,.96,1.51],.39],
    ['frost-ridge',[24,-19.7,-23.8],[1.57,.95,1.38],-.47,'horizon'],
    ['frost-ridge',[38,-26.1,-42],[2.24,1.25,1.69],-.35,'horizon']
   ]
  }),
 world('forge','Kuźnia widmowa','Spectral Forge','nebula',
  0x1b1620,0x713b30,0x542d32,0xffc99b,0xf3a85d,'deck',{
   face:.48,groove:.59,dust:0xd9a172,deckTint:0xd8c5b4,air:'embers',surface:'alloy',footing:{body:0x453337,bevel:0x835f45},
   ground:{'Fractured slate':0x483b3d,'Amethyst growth faces':0x674735},
   currents:[{count:34,origin:[11.1,-4.7,14.5],spread:[4.6,.4,2.1],travel:[2.9,2.65,-.65],
    tint:0xffa557,size:.065,length:.29,opacity:.82,rate:.61},
   {count:23,origin:[-11.4,-3.2,-13.7],spread:[3.2,.28,1.9],travel:[3.4,2.1,.56],
    tint:0x92716a,size:.65,length:1.48,opacity:.23,rate:.28}],
   models:[
    ['grotto-fault-shelf',[.25,-18.95,.20],[2.68,.91,3.76],-.05,'ground'],
    ['forge-basalt',[.5,-13.7,.6],[2.01,1.62,2.66],.10,'ground'],
    ['forge-furnace-bank',[-10.9,-8.8,-13.6],1.31,-.41],
    ['forge-basalt',[-10.9,-13.3,-13.6],[1.26,.99,1.38],-.38],
    ['forge-casting-line',[9.8,-9.29,15.1],1.23,-.51],
    ['forge-basalt',[9.8,-13.7,15.1],[1.20,.91,1.25],-.51],
    ['forge-basalt',[-17.5,-11.8,10.4],[1.25,1.13,1.35],-.31],
    ['forge-smelter',[22.5,-10.5,-18.9],1.37,-.65,'horizon'],
    ['forge-basalt',[31,-16.3,-29],[2.1,1.55,1.49],-.61,'horizon']
   ]
  }),
 world('abyss','Optyka głębinowa','Abyssal Optics','verdant',
  0x041322,0x215974,0x183a4d,0xbde0f2,0x73c9c4,'deck',{
   face:.50,groove:.59,dust:0x88bebc,deckTint:0xaeced2,air:'current',footing:{body:0x223941,bevel:0x487176},
   ground:{'Fractured slate':0x466479,'Amethyst growth faces':0x5c7e77},
   models:[
    ['grotto-fault-shelf',[.12,-21.0,0],[2.82,1.08,3.77],-.09,'ground'],
    ['abyss-observatory',[-9.7,-7.85,-13.4],1.27,-.36,'left'],
    ['abyss-reef',[-9.7,-12.2,-13.4],[1.35,1.26,1.27],-.55,'cliff'],
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
   ground:{'Fractured slate':0x555066,'Amethyst growth faces':0x797387},
   models:[
    ['grotto-fault-shelf',[0,-20.55,0],[2.73,.79,3.70],-.23,'ground'],
    ['sanctuary-terrace',[0,-12.08,0],[2.72,1.17,4.66],.04,'ground'],
    ['sanctuary-meridian',[-10.4,-8.5,-15.4],[1.00,1.19,1.10],-.43,'left'],
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
