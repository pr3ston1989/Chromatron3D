export const LANGUAGES = ['pl', 'en'];
const strings = {
  pl:{
    coachChoose:'1. Wybierz lustro',coachChooseDetail:'Kliknij podświetlone LUSTRO w panelu elementów. To właśnie nim zmienisz kierunek światła.',
    coachPlace:'2. Ustaw lustro na planszy',coachPlaceDetail:'Kliknij wolne pole na drodze lasera lub przeciągnij lustro z panelu. Podświetlenie pokaże możliwe miejsce.',
    coachRotate:'3. Obróć lustro',coachRotateDetail:'Naciśnij Q lub E (albo kliknij lustro ponownie). Skieruj niebieską wiązkę na świecący rezonator.',
    coachDismiss:'Ukryj samouczek',
    analysisToggle:'Analizuj światło (V)',analysisHeading:'ANALIZATOR WIĄZEK',analysisIntro:'Sprawdź barwy i miejsca pochłaniania wiązek bez ujawniania rozwiązania.',
    analysisSources:'EMITERY',analysisSegments:'ODCINKI WIĄZEK',analysisTargetHeading:'REZONATORY',analysisAbsorption:'POCHŁONIĘTE PROMIENIE',
    analysisCorrect:'ZGODNY',analysisWrong:'NIEZGODNY',analysisNoLight:'BRAK ŚWIATŁA',analysisNeed:'Wymagany',analysisReceived:'Otrzymany',
    analysisNone:'Brak punktów pochłaniania',analysisWarning:'Uwaga: niektóre specjalne interakcje nie są jeszcze obsługiwane w prototypie.',
    analysisClose:'Zamknij analizę',analysisCameraIso:'WIDOK IZOMETRYCZNY',analysisCameraTop:'WIDOK Z GÓRY',cameraSwitch:'Zmień widok kamery (C)',
    online:'SYSTEM OPTYCZNY AKTYWNY',experiment:'EKSPERYMENT',prototype:'PROTOTYP',chapter:'ROZDZIAŁ 01 // PODSTAWY',resonators:'AKTYWNE REZONATORY',
    reset:'↺ OD NOWA',returnTray:'↤ DO ZASOBNIKA',spectral:'◈ ANALIZATOR WIDMA',spectralSource:'LASER',spectralTarget:'REZONATOR',spectralNeed:'WYMAGANE',spectralReceived:'OTRZYMANE',spectralEmits:'EMITUJE',undoTitle:'Cofnij ruch (Ctrl+Z)',redoTitle:'Ponów ruch (Ctrl+Y)',optics:'ELEMENTY OPTYCZNE',selectHelp:'WYBIERZ ELEMENT · Q/E: OBRÓT',camera:'◉ WIDOK IZOMETRYCZNY',opticalArray:'— TABLICA OPTYCZNA 3D',
    controls:'KLIKNIJ: WYBIERZ / PRZESUŃ · PRZECIĄGNIJ: OBRÓĆ · ROLKA: ZOOM',
    manualTitle:'STERUJ ŚWIATŁEM.',manualIntro:'Skieruj laser na rezonator o odpowiednim kolorze. Wybierz ruchomy element i kliknij wolne pole, aby go przesunąć. Q / E obraca element o 45°. Przeciągaj puste miejsce, by obracać kamerę.',
    manualExtra:'Ctrl+Z cofa ruch. Rolka myszy przybliża widok. Podpowiedzi pomagają bez konieczności szukania gotowego rozwiązania.',
    prototypeNote:'Na razie to autorskie plansze demonstracyjne, a nie 200 poziomów z oryginalnych gier.',
    understood:'ROZUMIEM',complete:'EKSPERYMENT UKOŃCZONY',aligned:'ŚWIATŁO USTAWIONE.',completeDesc:'Wszystkie rezonatory otrzymały właściwe kolory światła.',next:'NASTĘPNA ZAGADKA →',
    hintButton:'PODPOWIEDŹ',hintTitle:'NIE MOŻESZ RUSZYĆ DALEJ?',hintIntro:'Odsłaniaj wskazówki stopniowo. Podpowiedzi nie blokują postępu.',hintReveal:'ODKRYJ WSKAZÓWKĘ',hintAgain:'KOLEJNA WSKAZÓWKA',hintStep:'WSKAZÓWKA {step} / 3',hintType1:'OBSERWUJ',hintType2:'SPRÓBUJ',hintType3:'KONKRETNY KIERUNEK',hintSkip:'POMIŃ ZAGADKĘ →',hintClose:'WRÓĆ DO GRY',
    hintFallback1:'Porównaj kolor lasera z kolorem rezonatora. Sprawdź, dokąd biegnie wiązka.',hintFallback2:'Przesuń element optyczny na tor lasera i obracaj go po 45 stopni.',hintFallback3:'Zacznij od ostatniego zakrętu przed rezonatorem. Możesz też pominąć zagadkę i wrócić później.',
    selectLocked:'Ten element jest nieruchomy',selectFirst:'Najpierw wybierz ruchomy element',cellOccupied:'To pole jest zajęte',imported:'Zaimportowano {count} poziomów',skipNotice:'Zagadkę pominięto (nie zaliczono jej jako rozwiązanej)',lastLevel:'To ostatnia dostępna plansza',allHints:'Odkryto już wszystkie trzy wskazówki',
    languageAria:'Switch to English',helpAria:'Instrukcja',soundAria:'Dźwięk',hintAria:'System podpowiedzi',statusSolved:'UKOŃCZONA',statusSkipped:'POMINIĘTA',
    typeLaser:'LASER',typeMirror:'LUSTRO',typeFilter:'FILTR',typeSplitter:'ROZDZIELACZ',typePrism:'PRYZMAT',typeTarget:'REZONATOR',typeBender:'ZAKRZYWIACZ',typeDoppler:'DOPPLER',typeTangler:'SPLĄTYWACZ',typeWall:'BARIERA',typeConduit:'KANAŁ',typeTeleporter:'TELEPORTER'
  },
  en:{
    coachChoose:'1. Pick up the mirror',coachChooseDetail:'Click the highlighted MIRROR in the components panel. You will use it to redirect the laser.',
    coachPlace:'2. Place the mirror',coachPlaceDetail:'Click an empty tile in the laser beam, or drag the mirror from the panel. The tile preview shows where it will land.',
    coachRotate:'3. Rotate the mirror',coachRotateDetail:'Press Q or E (or click the mirror again). Aim the blue laser at the glowing resonator.',
    coachDismiss:'Hide tutorial',
    analysisToggle:'Inspect beams (V)',analysisHeading:'BEAM ANALYZER',analysisIntro:'Inspect wavelengths and absorbed beams without revealing puzzle solutions.',
    analysisSources:'EMITTERS',analysisSegments:'BEAM SEGMENTS',analysisTargetHeading:'RESONATORS',analysisAbsorption:'ABSORBED BEAMS',
    analysisCorrect:'MATCHED',analysisWrong:'MISMATCH',analysisNoLight:'NO LIGHT',analysisNeed:'Required',analysisReceived:'Received',
    analysisNone:'No absorbed beams',analysisWarning:'Note: some specialty optical interactions are not yet supported in this prototype.',
    analysisClose:'Close beam analyzer',analysisCameraIso:'ISOMETRIC VIEW',analysisCameraTop:'TOP VIEW',cameraSwitch:'Change camera preset (C)',
    online:'OPTICAL SYSTEM ONLINE',experiment:'EXPERIMENT',prototype:'PROTOTYPE',chapter:'CHAPTER 01 // FUNDAMENTALS',resonators:'RESONATORS ONLINE',
    reset:'↺ RESET',returnTray:'↤ RETURN TO TRAY',spectral:'◈ SPECTRAL INSPECTOR',spectralSource:'EMITTER',spectralTarget:'RESONATOR',spectralNeed:'REQUIRED',spectralReceived:'RECEIVED',spectralEmits:'EMITS',undoTitle:'Undo move (Ctrl+Z)',redoTitle:'Redo move (Ctrl+Y)',optics:'OPTICAL COMPONENTS',selectHelp:'SELECT AN OPTIC · Q/E: ROTATE',camera:'◉ ISOMETRIC VIEW',opticalArray:'— 3D OPTICAL ARRAY',
    controls:'CLICK: SELECT / MOVE · DRAG: ORBIT · WHEEL: ZOOM',
    manualTitle:'CONTROL THE LIGHT.',manualIntro:'Redirect each laser into the matching resonator. Select an optical component and click an empty cell to move it. Q / E rotates by 45°. Drag empty space to orbit the camera.',
    manualExtra:'Ctrl+Z undoes a move. Mouse wheel zooms. The hint system helps you progress without immediately revealing a full solution.',
    prototypeNote:'These are original demonstration puzzles, not yet the 200 levels from the classic games.',
    understood:'UNDERSTOOD',complete:'EXPERIMENT COMPLETE',aligned:'LIGHT ALIGNED.',completeDesc:'All resonators have received their correct colors.',next:'NEXT EXPERIMENT →',
    hintButton:'HINT',hintTitle:'STUCK ON A PUZZLE?',hintIntro:'Reveal clues gradually. Using hints never locks your progress.',hintReveal:'REVEAL A CLUE',hintAgain:'NEXT CLUE',hintStep:'CLUE {step} / 3',hintType1:'OBSERVE',hintType2:'EXPERIMENT',hintType3:'NEXT STEP',hintSkip:'SKIP PUZZLE →',hintClose:'BACK TO GAME',
    hintFallback1:'Compare the color of the laser with the resonator. See where the beam is currently going.',hintFallback2:'Place an optic in the beam path and rotate it by 45 degrees.',hintFallback3:'Work backward from the target and find the final turn. You can also skip this puzzle and return later.',
    selectLocked:'This component is fixed in place',selectFirst:'Select a movable optic first',cellOccupied:'Cell occupied',imported:'Imported {count} levels',skipNotice:'Puzzle skipped (not counted as solved)',lastLevel:'This is the last available puzzle',allHints:'All three clues have been revealed',
    languageAria:'Zmień na polski',helpAria:'How to play',soundAria:'Sound',hintAria:'Hint system',statusSolved:'SOLVED',statusSkipped:'SKIPPED',
    typeLaser:'LASER',typeMirror:'REFLECTOR',typeFilter:'FILTER',typeSplitter:'SPLITTER',typePrism:'PRISM',typeTarget:'RESONATOR',typeBender:'BENDER',typeDoppler:'DOPPLER',typeTangler:'TANGLER',typeWall:'BARRIER',typeConduit:'CONDUIT',typeTeleporter:'TELEPORTER'
  }
};
export const normalizeLanguage=v=>LANGUAGES.includes(v)?v:'pl';
export function t(lang,key,params={}){
 const raw=strings[normalizeLanguage(lang)][key]??strings.en[key]??key;
 return raw.replace(/\{(\w+)\}/g,(_,name)=>String(params[name]??''));
}
export function loc(value,lang){
 if(typeof value==='string')return value;
 if(!value)return '';
 return String(value[normalizeLanguage(lang)]??value.en??value.pl??'');
}
export function applyLanguage(lang,root=document){
 const language=normalizeLanguage(lang);
 root.documentElement.lang=language;
 root.querySelectorAll('[data-i18n]').forEach(el=>{el.textContent=t(language,el.dataset.i18n)});
 root.querySelectorAll('[data-i18n-title]').forEach(el=>{el.title=t(language,el.dataset.i18nTitle)});
 root.querySelectorAll('[data-i18n-aria]').forEach(el=>{el.setAttribute('aria-label',t(language,el.dataset.i18nAria))});
}
