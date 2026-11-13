/**
 * Compact, bespoke technical silhouettes for the equipment tray.
 * No emoji/font glyphs: outline, reflective face and danger bands are readable
 * regardless of the user's OS font. Trusted static SVG markup only.
 */
const common='viewBox="0 0 48 48" width="42" height="42" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"';
const ico={
 laser:'<path d="M8 34l12-12 7 7-12 12-7-7Z" fill="#193246" stroke="#91d5ee" stroke-width="2"/><path d="M19 22l12-12 7 7-11 12-8-7Z" fill="#5b7f9d" stroke="#d6edfc" stroke-width="2"/><circle cx="35" cy="13" r="4" fill="#ddffff"/><path d="M36 7l3-5m-6 6-5-3m11 12 5 3" stroke="#7bdcff" stroke-width="2"/>',
 mirror:'<path d="M9 40h30" stroke="#4a708c" stroke-width="3" stroke-linecap="round"/><path d="M21 10h7v28h-7z" transform="rotate(42 24 24)" fill="#162433" stroke="#536b7f" stroke-width="2"/><path d="M19.2 12.4l4 2.4-13.3 21.6-4-2.4z" transform="translate(7 -1)" fill="#dcfaff" stroke="#6bdcff" stroke-width="1"/><path d="M34 12l5-5m-4 11 8-1" stroke="#8ce9ff" stroke-width="2" stroke-linecap="round"/>',
 wall:'<path d="M9 17l16-9 15 8v22l-15 7L9 36V17Z" fill="#263849" stroke="#abc8d9" stroke-width="1.8"/><path d="M9 17l16 9 15-10M25 26v19" stroke="#69899b" stroke-width="2"/><path d="M12 26l8 5m-6 0 6 4" stroke="#ffbd70" stroke-width="3"/><path d="M30 28l6-3" stroke="#ffbd70" stroke-width="2"/>',
 target:'<circle cx="24" cy="24" r="18" fill="#19334a" stroke="#83b6d6" stroke-width="2"/><circle cx="24" cy="24" r="12" stroke="#8be9ff" stroke-width="3"/><path d="M24 12l9 12-9 12-9-12 9-12Z" fill="#b8f6ff" stroke="#e8fdff" stroke-width="2"/><circle cx="24" cy="24" r="3" fill="#fff"/>',
 prism:'<path d="M24 5L5 40h38L24 5Z" fill="#2b5568" stroke="#c0f3ff" stroke-width="2"/><path d="M14 22l16 9" stroke="#ff8fa1" stroke-width="3"/><path d="M14 26l17 9" stroke="#baf4bd" stroke-width="3"/><path d="M13 30l17 9" stroke="#87a9ff" stroke-width="3"/>',
 filter:'<rect x="11" y="8" width="26" height="32" rx="3" fill="#254b63" stroke="#b2edff" stroke-width="2"/><rect x="16" y="13" width="16" height="22" fill="#72d9ff" fill-opacity=".56" stroke="#a3f5ff" stroke-width="1"/><path d="M9 12h30M9 36h30" stroke="#4b93ad" stroke-width="2"/>',
 splitter:'<rect x="11" y="7" width="26" height="33" rx="3" stroke="#8ddfff" stroke-width="2" fill="#203748"/><path d="M17 35L31 13" stroke="#e1faff" stroke-width="4"/><path d="M7 24h12m11 0h12" stroke="#7ddfff" stroke-width="2"/><path d="M27 14l14-9" stroke="#ffcb81" stroke-width="2"/>',
 bender:'<path d="M7 36h34" stroke="#7599ae" stroke-width="3"/><path d="M15 30l18-17 5 5-18 17-5-5Z" fill="#e1f6ff" stroke="#85daff" stroke-width="2"/><path d="M9 16l10 7 4-7" stroke="#ffb67a" stroke-width="3"/>',
 doppler:'<circle cx="24" cy="24" r="16" fill="#16334b" stroke="#8cdeff" stroke-width="3"/><path d="M10 24h28M26 17l9 7-9 7" stroke="#efc984" stroke-width="3"/><path d="M15 16c3-4 9-5 13-3" stroke="#8addff" stroke-width="2"/>',
 tangler:'<circle cx="16" cy="23" r="11" stroke="#93ebff" stroke-width="3"/><circle cx="32" cy="23" r="11" stroke="#ffc489" stroke-width="3"/><path d="M20 14l8 18m-8 0 8-18" stroke="#f6fbff" stroke-width="2"/>',
 conduit:'<rect x="10" y="5" width="28" height="38" rx="5" stroke="#78b2d4" stroke-width="3" fill="#1b364b"/><path d="M16 7v34m16-34v34" stroke="#a0eaff" stroke-width="2"/><path d="M23 17v14" stroke="#ffcf88" stroke-width="3"/>',
 teleporter:'<circle cx="24" cy="24" r="17" stroke="#9edaff" stroke-width="3"/><circle cx="24" cy="24" r="11" stroke="#83ccff" stroke-width="2"/><circle cx="24" cy="24" r="5" fill="#8be8ff"/><path d="M24 1v8m0 30v8M1 24h8m30 0h8" stroke="#aaf4ff" stroke-width="2"/>'
};
export function opticIcon(type){
 return '<svg '+common+'>'+ (ico[type]??ico.mirror) +'</svg>';
}
