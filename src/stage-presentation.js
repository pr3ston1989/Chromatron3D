/**
 * Presentation-only context for stage arrivals and the level atlas.
 *
 * No WebGL work or puzzle logic lives here. The biome accent is read from
 * the same palette as the already cached environment, so the opening
 * animation and stage card always describe the visible scenery.
 */
export function stageEntryMode({restored=false,completed=false}={}){
 return restored?'resume':completed?'replay':'new';
}
export function stagePresentation(theme,language='pl',mode='new'){
 if(!theme||typeof theme.id!=='string'||!theme.id||
    !Number.isInteger(theme.edge)||theme.edge<0||theme.edge>0xffffff||
    !['new','resume','replay'].includes(mode))
  throw new Error('Invalid stage presentation');
 return {
  biome:theme.id,
  biomeLabel:language==='en'?theme.en:theme.pl,
  accent:'#'+theme.edge.toString(16).padStart(6,'0'),
  statusKey:mode==='resume'?'stageResume':mode==='replay'?'stageReplay':'stageNew'
 };
}
