/**
 * Optional visual overview of the living world. Never changes puzzle geometry,
 * optical raycasts, hint state or saved progress.
 */
export const SCENIC_CAMERA=Object.freeze({
 distance:60,yaw:-1.05,pitch:.98
});
export function snapshotPuzzleCamera({zoomTarget,boardFocus,yaw,pitch,cameraTop}){
 if(!Number.isFinite(zoomTarget)||!Number.isFinite(yaw)||!Number.isFinite(pitch))
  throw new Error('Invalid camera position');
 return {zoomTarget,boardFocus:Boolean(boardFocus),yaw,pitch,cameraTop:Boolean(cameraTop)};
}
export function scenicCameraDistance(distance,portraitScale,focusScale,scenic=false){
 return distance*portraitScale*(scenic?1:focusScale);
}
