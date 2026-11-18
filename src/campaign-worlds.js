const world=(id,pl,en,legacyId,sky,haze,fog,key,edge,deck,art)=>Object.freeze({
 id,pl,en,legacyId,sky,haze,fog,key,edge,tileA:sky,accent:edge,deck,...art
});

export const CAMPAIGN_WORLDS=Object.freeze([
 world('observatory','Obserwatorium pryzmatyczne','Prism Observatory','orbital',
  0x101a32,0x395272,0x242f48,0xffe5c8,0x75d3e1,'deck',{
   face:.49,groove:.58,dust:0x7b9ab5,
   models:[
    ['observatory-arc',[-7,-3.8,-18],.99,-.58,'left'],
    ['observatory-lens',[18,-3.9,-5],.88,-.64,'right'],
    ['observatory-landing',[-7,-5,-18],1.03,-.58],
    ['observatory-landing',[18,-5.34,-5],[.48,1,1.04],-.64],
    ['observatory-iris',[18,-3.60,-5],.88,-.64,'iris'],
    ['skyline-ridge',[22,-16,-34],[1.85,2.6,2.54],-.57],
    ['skyline-ridge',[39,-24,-51],[2.9,3.12,2.5],-.57]
   ],scatter:['survey-mast',.62,0x5c7184]
  }),
 world('heliostat','Ogród heliostatów','Heliostat Garden','verdant',
  0x14252d,0x567976,0x3b534e,0xffe4b2,0xd3b471,'garden',{
   face:.48,groove:.65,dust:0x889c73,
   models:[
    ['garden-heliostat',[-7,-4.45,-18],1.55,-.80,'left'],
    ['garden-arcade',[19,-4,-5],.97,-.65,'right'],
    ['garden-terrace',[-9,-8.2,-20],[.75,1.0,1.53],-.67],
    ['garden-terrace',[22,-8.2,-9],[.90,1.14,1.51],-.69],
    ['greenhouse-habitat',[27,-5.9,-29],.87,-.59],
    ['garden-terrace',[27,-15,-38],[2.9,2.3,2.3],-.62],
    ['wind-turbine',[22,-3.7,-15],.62,-.61,'turn']
   ],scatter:['garden-fern',.90,0x788360]
  }),
 world('grotto','Kryształowa grota','Crystal Grotto','nebula',
  0x180e24,0x503956,0x442b4c,0xece2ff,0xa889ca,'grotto',{
   face:.54,groove:.61,dust:0x9c82b3,
   models:[
    ['grotto-buttress',[-7,-6,-17],1.48,-.69,'left'],
    ['grotto-buttress',[19,-6,-3],[.91,1.31,.99],.29,'right'],
    ['grotto-ridge',[-8,-9.2,-24],[.94,1.86,1.41],-.60],
    ['grotto-ridge',[23,-13.6,-22],[1.54,1.92,1.72],-.54],
    ['grotto-ridge',[37,-9,-46],[2.6,3.5,1.9],-.65]
   ],scatter:['amethyst-shard',1.31,0x8e6f9f]
  }),
 world('shipyard','Stocznia orbitalna','Orbital Shipyard','orbital',
  0x0d2039,0x203f62,0x233c57,0xdbebff,0x65c6ce,'shipyard',{face:.59,glow:.31}),
 world('frost','Laboratorium polarne','Polar Laboratory','polar',
  0x16293b,0x627d92,0x496279,0xcfeaff,0x9acdde,'shipyard',{
   face:.59,groove:.73,dust:0xc0d8e4,deckTint:0xc7dcff,
   models:[
    ['frost-spires',[-8,-4.9,-18],1.45,-.65,'left'],
    ['tracking-dish',[19,-3.6,-5],1.42,-.62,'turn'],
    ['observatory-landing',[19,-4.9,-5],[.58,1,.93],-.62],
    ['skyline-ridge',[21,-9,-31],[1.65,2.22,1.42],-.59],
    ['frost-spires',[33,-12.6,-34],[2.0,2.25,1.7],-.50],
    ['skyline-ridge',[39,-13,-49],[2.9,3.31,2.5],-.61]
   ],scatter:['ice-shard',1.25,0xc5d5e9]
  }),
 world('forge','Kuźnia widmowa','Spectral Forge','nebula',
  0x1d1521,0x674655,0x503249,0xffc795,0xe7a570,'deck',{
   face:.48,groove:.59,dust:0xde9b60,deckTint:0xddc8ba,
   models:[
    ['ring-reactor',[-6.8,-3.55,-17.5],1.41,-.66,'left'],
    ['maintenance-crane',[20,-3.95,-5],1.67,-.56,'right'],
    ['dock-landing',[20,-5.10,-5],[1.35,.95,1.45],-.56],
    ['grotto-ridge',[18,-13.2,-32],[1.64,2.8,2.2],-.48],
    ['grotto-ridge',[35,-18,-41],[2.90,3.12,2.28],-.61],
    ['survey-mast',[21,-3.6,-16],1.43,-.73,'pulse']
   ],scatter:['reclaimed-metal',1.14,0x957a76]
  }),
 world('abyss','Optyka głębinowa','Abyssal Optics','verdant',
  0x081e29,0x326171,0x245160,0xc8efe9,0x79c5b7,'garden',{
   face:.53,groove:.60,dust:0x88c3bb,deckTint:0xb4e3e5,
   models:[
    ['dock-relay',[-8,-6,-18],1.55,-.61,'left'],
    ['garden-heliostat',[18,-4.1,-4],1.12,-.56,'turn'],
    ['garden-terrace',[20,-8.6,-6],[.84,1.46,1.63],-.50],
    ['greenhouse-habitat',[24,-4.7,-26],1.03,-.54],
    ['garden-terrace',[25,-13,-34],[2.1,1.7,2.1],-.49],
    ['garden-terrace',[41,-20,-51],[2.9,2.05,2.1],-.63]
   ],scatter:['garden-fern',1.19,0x668f8c]
  }),
 world('sanctuary','Sanktuarium soczewek','Lens Sanctuary','polar',
  0x17162c,0x514873,0x383553,0xefddff,0xc2b8e3,'grotto',{
   face:.56,groove:.60,dust:0xba9acb,deckTint:0xe1d8ef,
   models:[
    ['garden-arcade',[-8,-4.9,-17.5],1.29,-.57,'left'],
    ['garden-arcade',[16,-5.5,-15],1.17,-.58],
    ['observatory-lens',[18,-4.25,-3],1.0,-.59,'right'],
    ['observatory-iris',[18,-3.91,-3],1.0,-.59,'iris'],
    ['grotto-ridge',[19,-13,-32],[1.98,2.5,2.29],-.52],
    ['grotto-ridge',[38,-21,-46],[3.0,3.0,2.5],-.63]
   ],scatter:['amethyst-shard',.94,0x9f83af]
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
