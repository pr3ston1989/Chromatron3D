/**
 * UI invariants live independently of the renderer:
 * - Only an optic intentionally taken from the tray enters placement mode.
 * - Clicking an empty board square never teleports an already placed optic.
 * - Every board piece is a separate identity (no shared selection by type).
 * - A drag from an existing optic can move only that exact optic.
 */
export function isFreeCell(pieces, piece, x, y) {
 return Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&x<15&&y>=0&&y<15 &&
  !pieces.some(p=>!p.inTray && p!==piece && p.x===x && p.y===y);
}
export function nextTrayPiece(pieces, type) {
 return pieces.find(p=>p.inTray && p.type===type) || null;
}
export function classifyClick(target, selected, placing) {
 if(target?.piece) return {action:'select', piece:target.piece};
 if(target && Number.isInteger(target.x)&&Number.isInteger(target.y) && placing && selected?.inTray)
  return {action:'place',x:target.x,y:target.y};
 return {action:'clear'};
}
export function mirrorFrontDirection(rotation) {
 // The reflective surface normal is at +6 octants from the optic axis.
 return (rotation+6)%8;
}
export function mirrorAccepts(incomingDirection,rotation) {
 const relative=(incomingDirection-rotation+8)%8;
 return relative>=1&&relative<=3;
}
