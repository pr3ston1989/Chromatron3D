export const LANGUAGES = ['pl', 'en'];
const strings = {
  pl:{
    focusEnter:'Powiększ przestrzeń planszy (B)',focusExit:'Przywróć panele boczne (B)',missionDrawer:'Pokaż / ukryj panel zagadki',toolDrawer:'Pokaż / ukryj narzędzia',
    fullscreenEnter:'Przełącz pełny ekran (F)',fullscreenExit:'Opuść pełny ekran (F)',fullscreenUnavailable:'Przeglądarka nie zezwoliła na przełączenie pełnego ekranu.',
    graphicsQuality:'GRAFIKA',graphicsQualityAria:'Jakość grafiki i odbić',graphicsAuto:'AUTO',graphicsPerformance:'PŁYNNOŚĆ',graphicsBalanced:'ZRÓWNOWAŻONA',graphicsCinematic:'FILMOWA',

    tipPlace:'Kliknij, aby postawić',tipOccupied:'Pole zajęte',tipSelect:'Kliknij, aby zaznaczyć · przeciągnij, aby przesunąć',tipFixed:'Element nieruchomy',
    guideIncoming:'WIĄZKA WPADA',guideOutgoing:'WIĄZKA WYCHODZI',
    rotateLeft:'Obróć lustro w lewo o 45° (Q)',
    rotateRight:'Obróć lustro w prawo o 45° (E)',
    cancelSelection:'Odznacz / anuluj (Esc)',
    placementCaption:'WYBIERZ POLE NA PLANSZY',
    selectedCaption:'WYBRANY ELEMENT — OBRÓĆ LUB PRZECIĄGNIJ',
    emptyTray:'Wszystkie elementy tego typu są już na planszy. Kliknij element na planszy, aby go wybrać.',
    coachRotateDetail:'Obróć wybrane lustro przyciskami ↶ / ↷ lub klawiszami Q / E. Powierzchnia odbijająca jest jasna, tylna strona ciemna.',

    coachChoose:'1. Wybierz lustro',coachChooseDetail:'Kliknij podświetlone LUSTRO w panelu elementów. To właśnie nim zmienisz kierunek światła.',
    coachPlace:'2. Ustaw lustro na planszy',coachPlaceDetail:'Kliknij wolne pole na drodze lasera lub przeciągnij lustro z panelu. Podświetlenie pokaże możliwe miejsce.',
    coachRotate:'3. Obróć lustro',coachRotateDetail:'Użyj Q / E lub przycisków ↶ / ↷, aby obrócić lustro. Jasna powierzchnia odbija, a ciemna tylna strona zatrzymuje wiązkę.',
    coachDismiss:'Ukryj samouczek',
    analysisToggle:'Analizuj światło (V)',analysisHeading:'ANALIZATOR WIĄZEK',analysisIntro:'Sprawdź barwy i miejsca pochłaniania wiązek bez ujawniania rozwiązania.',
    analysisSources:'EMITERY',analysisSegments:'ODCINKI WIĄZEK',analysisTargetHeading:'REZONATORY',analysisAbsorption:'POCHŁONIĘTE PROMIENIE',
    analysisCorrect:'ZGODNY',analysisWrong:'NIEZGODNY',analysisNoLight:'BRAK ŚWIATŁA',analysisNeed:'Wymagany',analysisReceived:'Otrzymany',
    analysisNone:'Brak punktów pochłaniania',analysisWarning:'Uwaga: niektóre specjalne interakcje nie są jeszcze obsługiwane w prototypie.',
    analysisClose:'Zamknij analizę',analysisCameraIso:'WIDOK IZOMETRYCZNY',analysisCameraTop:'WIDOK Z GÓRY',cameraSwitch:'Zmień widok kamery (C)',
    draftSaved:'◈ UKŁAD ZAPISANY NA TYM URZĄDZENIU',atlasInProgress:'W TRAKCIE',
    atlasOpen:'▦ MAPA POZIOMÓW',atlasOpenAria:'Mapa poziomów (M)',atlasEyebrow:'CHROMATRON / MAPA MISJI',atlasTitle:'WYBÓR POZIOMU',
    atlasClose:'Zamknij mapę poziomów',atlasSummary:'UKOŃCZONO {done} Z {total} · ODBLOKOWANO {unlocked}',atlasSolved:'UKOŃCZONY',atlasSkipped:'POMINIĘTY',atlasAvailable:'DOSTĘPNY',atlasLocked:'ZABLOKOWANY',atlasNow:'AKTUALNY',atlasLevel:'POZIOM {number}',atlasIntro:'EKSPERYMENT {number} / {total}',stageNew:'NOWY POZIOM',stageResume:'WZNOWIENIE ZAGADKI',stageReplay:'POWTÓRKA',atlasLockedHint:'Ukończ poprzedni poziom lub użyj pominięcia, by odblokować następny.',atlasHelp:'Rozwiązanie lub pominięcie poziomu odblokowuje kolejny. Ukończone poziomy można powtarzać.',
    online:'SYSTEM OPTYCZNY AKTYWNY',experiment:'EKSPERYMENT',prototype:'PROTOTYP',classicPack:'IMPORTOWANE',chapter:'ROZDZIAŁ 01 // PODSTAWY',resonators:'AKTYWNE REZONATORY',
    reset:'↺ OD NOWA',returnTray:'↤ DO ZASOBNIKA',spectral:'◈ ANALIZATOR WIDMA',spectralSource:'LASER',spectralTarget:'REZONATOR',spectralNeed:'WYMAGANE',spectralReceived:'OTRZYMANE',spectralEmits:'EMITUJE',undoTitle:'Cofnij ruch (Ctrl+Z)',redoTitle:'Ponów ruch (Ctrl+Y)',optics:'ELEMENTY OPTYCZNE',selectHelp:'WYBIERZ · PRZECIĄGNIJ · Q/E: OBRÓT',camera:'◉ WIDOK IZOMETRYCZNY',opticalArray:'— TABLICA OPTYCZNA 3D',
    controls:'KLIKNIJ: WYBIERZ / POSTAW · PRZECIĄGNIJ ELEMENT: PRZESUŃ · Q/E: OBRÓĆ',
    manualTitle:'STERUJ ŚWIATŁEM.',manualIntro:'Skieruj laser na rezonator o odpowiednim kolorze. Wybierz element z zasobnika i kliknij wolne pole, aby go ustawić. Element na planszy przesuwaj przeciągnięciem. Q / E obraca w obie strony. Przeciągaj puste miejsce, by obracać kamerę.',
    manualExtra:'Ctrl+Z cofa ruch. Rolka obraca wybrany element; Shift+rolka przybliża widok. M otwiera mapę poziomów, a Esc ją zamyka. Podpowiedzi pomagają bez konieczności szukania gotowego rozwiązania.',
    prototypeNote:'Na razie to autorskie plansze demonstracyjne, a nie 200 poziomów z oryginalnych gier.',
    understood:'ROZUMIEM',complete:'EKSPERYMENT UKOŃCZONY',aligned:'ŚWIATŁO USTAWIONE.',completeDesc:'Wszystkie rezonatory otrzymały właściwe kolory światła.',next:'NASTĘPNA ZAGADKA →',
    creditsLabel:'KREDYTY PODPOWIEDZI',earnedCredits:'ZDOBYTO +{amount} KREDYTÓW ZA PIERWSZE ROZWIĄZANIE',noRewardRepeat:'Ta zagadka była już ukończona — punkty przyznawane są raz.',creditsRequired:'Brakuje kredytów. Rozwiązuj nowe zagadki, aby zdobywać kolejne.',hintCostFree:'PIERWSZA PODPOWIEDŹ — GRATIS',hintCostPaid:'KOSZT KOLEJNEJ PODPOWIEDZI: {cost} ◆',hintNeedVerified:'Nie można jeszcze ujawnić konkretnego ruchu: potrzebne jest sprawdzone rozwiązanie.',hintAnalysisRunning:'Analizuję możliwe rozwiązanie w tle…',hintAnalysisUnavailable:'Pełna odpowiedź nie jest jeszcze dostępna dla tej planszy. Pierwsze wskazówki pozostają aktywne.',classicImportIntro:'Zaimportuj lokalny JSON z poziomami Chromatron 1–4 albo własny rozpakowany UPX plik EXE z Chromatron 1.14. Dane pozostają w przeglądarce; zgodność mechaniki wymaga dalszych testów.',classicImportButton:'IMPORTUJ POZIOMY (.EXE / .JSON)',classicImportSuccess:'Wczytano {count} plansz. Wierność zasad oryginału nadal wymaga porównania.',classicImportError:'Nie można wczytać pliku: {message}',dropZoneTitle:'UPUŚĆ PLIKI CHROMATRON',dropZoneHint:'Przeciągnij rozpakowane EXE (1–4) lub JSON z poziomami',    hintButton:'PODPOWIEDŹ',hintTitle:'NIE MOŻESZ RUSZYĆ DALEJ?',hintIntro:'Odsłaniaj wskazówki stopniowo. Podpowiedzi nie blokują postępu.',hintReveal:'ODKRYJ WSKAZÓWKĘ',hintAgain:'KOLEJNA WSKAZÓWKA',hintStep:'WSKAZÓWKA {step} / 3',hintType1:'OBSERWUJ',hintType2:'SPRÓBUJ',hintType3:'KONKRETNY KIERUNEK',hintSkip:'POMIŃ ZAGADKĘ →',hintClose:'WRÓĆ DO GRY',
    hintFallback1:'Porównaj kolor lasera z kolorem rezonatora. Sprawdź, dokąd biegnie wiązka.',hintFallback2:'Przesuń element optyczny na tor lasera i obracaj go po 45 stopni.',hintFallback3:'Zacznij od ostatniego zakrętu przed rezonatorem. Możesz też pominąć zagadkę i wrócić później.',
    selectLocked:'Ten element jest nieruchomy',selectFirst:'Najpierw wybierz ruchomy element',cellOccupied:'To pole jest zajęte',imported:'Zaimportowano {count} poziomów',skipNotice:'Zagadkę pominięto (nie zaliczono jej jako rozwiązanej)',lastLevel:'To ostatnia dostępna plansza',allHints:'Odkryto już wszystkie trzy wskazówki',
    languageAria:'Switch to English',helpAria:'Instrukcja',soundAria:'Dźwięk',hintAria:'System podpowiedzi',statusSolved:'UKOŃCZONA',statusSkipped:'POMINIĘTA',
    typeLaser:'LASER',typeMirror:'LUSTRO',typeFilter:'FILTR',typeSplitter:'ROZDZIELACZ',typePrism:'PRYZMAT',typeTarget:'REZONATOR',typeBender:'ZAKRZYWIACZ',typeDoppler:'DOPPLER',typeTangler:'SPLĄTYWACZ',typeWall:'BARIERA',typeConduit:'KANAŁ',typeTeleporter:'TELEPORTER'
  },
  en:{
    focusEnter:'Focus on the puzzle board (B)',focusExit:'Restore side panels (B)',missionDrawer:'Show / hide puzzle panel',toolDrawer:'Show / hide equipment tray',
    fullscreenEnter:'Toggle fullscreen (F)',fullscreenExit:'Leave fullscreen (F)',fullscreenUnavailable:'This browser blocked the fullscreen request.',
    graphicsQuality:'GRAPHICS',graphicsQualityAria:'Graphics and reflections quality',graphicsAuto:'AUTO',graphicsPerformance:'PERFORMANCE',graphicsBalanced:'BALANCED',graphicsCinematic:'CINEMATIC',

    tipPlace:'Click to place',tipOccupied:'Occupied cell',tipSelect:'Click to select · drag to move',tipFixed:'Fixed component',
    guideIncoming:'INCOMING LIGHT',guideOutgoing:'REFLECTED LIGHT',
    rotateLeft:'Rotate the mirror 45° left (Q)',
    rotateRight:'Rotate the mirror 45° right (E)',
    cancelSelection:'Deselect / cancel (Esc)',
    placementCaption:'CHOOSE AN EMPTY BOARD TILE',
    selectedCaption:'SELECTED OPTIC — ROTATE OR DRAG TO MOVE',
    emptyTray:'All optics of this type are already on the board. Click one on the board to select it.',
    coachRotateDetail:'Use ↶ / ↷ or Q / E to rotate. The reflective face is bright; the back is dark.',

    coachChoose:'1. Pick up the mirror',coachChooseDetail:'Click the highlighted MIRROR in the components panel. You will use it to redirect the laser.',
    coachPlace:'2. Place the mirror',coachPlaceDetail:'Click an empty tile in the laser beam, or drag the mirror from the panel. The tile preview shows where it will land.',
    coachRotate:'3. Rotate the mirror',coachRotateDetail:'Use Q / E or the ↶ / ↷ buttons to rotate the mirror. The bright front reflects light and the dark back blocks it.',
    coachDismiss:'Hide tutorial',
    analysisToggle:'Inspect beams (V)',analysisHeading:'BEAM ANALYZER',analysisIntro:'Inspect wavelengths and absorbed beams without revealing puzzle solutions.',
    analysisSources:'EMITTERS',analysisSegments:'BEAM SEGMENTS',analysisTargetHeading:'RESONATORS',analysisAbsorption:'ABSORBED BEAMS',
    analysisCorrect:'MATCHED',analysisWrong:'MISMATCH',analysisNoLight:'NO LIGHT',analysisNeed:'Required',analysisReceived:'Received',
    analysisNone:'No absorbed beams',analysisWarning:'Note: some specialty optical interactions are not yet supported in this prototype.',
    analysisClose:'Close beam analyzer',analysisCameraIso:'ISOMETRIC VIEW',analysisCameraTop:'TOP VIEW',cameraSwitch:'Change camera preset (C)',
    draftSaved:'◈ LAYOUT SAVED ON THIS DEVICE',atlasInProgress:'IN PROGRESS',
    atlasOpen:'▦ LEVEL MAP',atlasOpenAria:'Level map (M)',atlasEyebrow:'CHROMATRON / MISSION ATLAS',atlasTitle:'SELECT A LEVEL',
    atlasClose:'Close level map',atlasSummary:'SOLVED {done} OF {total} · UNLOCKED {unlocked}',atlasSolved:'SOLVED',atlasSkipped:'SKIPPED',atlasAvailable:'AVAILABLE',atlasLocked:'LOCKED',atlasNow:'CURRENT',atlasLevel:'LEVEL {number}',atlasIntro:'EXPERIMENT {number} / {total}',stageNew:'NEW PUZZLE',stageResume:'RESUMING PUZZLE',stageReplay:'REPLAY',atlasLockedHint:'Finish or skip the previous puzzle to unlock the next.',atlasHelp:'Solve or skip a puzzle to unlock the next one. Completed puzzles remain replayable.',
    online:'OPTICAL SYSTEM ONLINE',experiment:'EXPERIMENT',prototype:'PROTOTYPE',classicPack:'IMPORTED',chapter:'CHAPTER 01 // FUNDAMENTALS',resonators:'RESONATORS ONLINE',
    reset:'↺ RESET',returnTray:'↤ RETURN TO TRAY',spectral:'◈ SPECTRAL INSPECTOR',spectralSource:'EMITTER',spectralTarget:'RESONATOR',spectralNeed:'REQUIRED',spectralReceived:'RECEIVED',spectralEmits:'EMITS',undoTitle:'Undo move (Ctrl+Z)',redoTitle:'Redo move (Ctrl+Y)',optics:'OPTICAL COMPONENTS',selectHelp:'SELECT · DRAG · Q/E: ROTATE',camera:'◉ ISOMETRIC VIEW',opticalArray:'— 3D OPTICAL ARRAY',
    controls:'CLICK: SELECT / PLACE · DRAG AN OPTIC: MOVE · Q/E: ROTATE',
    manualTitle:'CONTROL THE LIGHT.',manualIntro:'Redirect each laser into the matching resonator. Select a tray optic and click a free tile to place it. Drag an already placed optic to move it. Q and E rotate in opposite directions. Drag empty space to orbit.',
    manualExtra:'Ctrl+Z undoes a move. The wheel rotates a selected optic; Shift+wheel zooms. M opens the level map and Esc closes it. The hint system helps you progress without immediately revealing a full solution.',
    prototypeNote:'These are original demonstration puzzles, not yet the 200 levels from the classic games.',
    understood:'UNDERSTOOD',complete:'EXPERIMENT COMPLETE',aligned:'LIGHT ALIGNED.',completeDesc:'All resonators have received their correct colors.',next:'NEXT EXPERIMENT →',
    creditsLabel:'HINT CREDITS',earnedCredits:'EARNED +{amount} CREDITS FOR FIRST SOLVE',noRewardRepeat:'You already completed this puzzle — credits are awarded once.',creditsRequired:'Not enough credits. Complete new puzzles to earn more.',hintCostFree:'FIRST CLUE — FREE',hintCostPaid:'NEXT CLUE COST: {cost} ◆',hintNeedVerified:'A concrete move cannot be shown until the solution is verified.',hintAnalysisRunning:'Checking possible solutions in the background…',hintAnalysisUnavailable:'A complete verified answer is not available for this puzzle yet. The early clues still work.',classicImportIntro:'Import local Chromatron 1–4 files: unpacked EXE (upx -d) or exported level JSON. You can also drag files onto the game board. All data stays in your browser.',classicImportButton:'IMPORT LEVELS (.EXE / .JSON)',classicImportSuccess:'Loaded {count} puzzles. Full original physics parity still requires verification.',classicImportError:'Could not read file: {message}',dropZoneTitle:'DROP CHROMATRON FILES',dropZoneHint:'Drag unpacked EXE (1–4) or level JSON here',    hintButton:'HINT',hintTitle:'STUCK ON A PUZZLE?',hintIntro:'Reveal clues gradually. Using hints never locks your progress.',hintReveal:'REVEAL A CLUE',hintAgain:'NEXT CLUE',hintStep:'CLUE {step} / 3',hintType1:'OBSERVE',hintType2:'EXPERIMENT',hintType3:'NEXT STEP',hintSkip:'SKIP PUZZLE →',hintClose:'BACK TO GAME',
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
