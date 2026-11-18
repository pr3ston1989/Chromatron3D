# Pracownia modeli

Blender 5.3.0: `C:\Tools\blender-5.3.0-windows-x64\blender.exe`.

Źródła modeli są w `tools/assets`. Z katalogu projektu uruchom np.
`& 'C:\Tools\blender-5.3.0-windows-x64\blender.exe' -b -P tools/assets/board-chassis.py`.
Wspólny moduł `style.py` eksportuje GLB do `assets/models` i dwa rendery PNG 512 × 512 do `assets/previews`.
Próbki mają własne materiały PBR z 16 kolorów HEX. Każdy kolor ma dwa jaśniejsze i dwa ciemniejsze odcienie. Podglądom towarzyszy ujęcie pod kątem domyślnej kamery gry.
Blender używa metrów i osi Z do góry. Eksport glTF konwertuje na Y-up, a Three.js
wczytuje model w tej orientacji. Z w Blenderze i Y w grze mają minimum 0 od podstawy.

| Kategoria | Maks. trójkątów na model |
| --- | ---: |
| Element powtarzalny, w tym panele krawędzi | 180 |
| Drobny rekwizyt i roślinność | 300 |
| Pojazd lub mechanizm średniej wielkości | 600 |
| Budynek i główna bryła planszy | 1500 |
| Wielka konstrukcja na horyzoncie | 2000 |

[Inwentaryzacja brył](primitive-inventory.md) zawiera stan przed próbką stylu.

Paleta w `style.py` łączy nocny granat, morską stal i jasną ceramikę. Miedź i bursztyn
oznaczają ruchome złącza i elementy obsługi. Emisja jest ograniczona do cyjanu i bursztynu. Lodowy błękit, zieleń i fiolet służą jako
akcenty biomów.

Domyślna platforma ma 3,75 m grubości. Biom orbitalny używa wariantu z rurami, kratownicą i czterema napędami. Kontrolowany test w Chrome pokazuje modele w widoku 1366 × 768.

## Próbki przebudowy wizualnej

Wspólny moduł `tools/blender/style.py` używa zatwierdzonej [palety czterech światów](../docs/DESIGN_BIBLE.md) i eksportuje płasko cieniowane GLB Y-up. Renderujemy skrypt z czystej sceny. Z katalogu projektu uruchom:

```powershell
$blender = 'C:\Tools\blender-5.3.0-windows-x64\blender.exe'
& $blender -b -t 4 --python-exit-code 2 -P tools/blender/assets/platform-deck.py
& $blender -b -t 4 --python-exit-code 2 -P tools/blender/assets/beam-splitter.py
& $blender -b -t 4 --python-exit-code 2 -P tools/blender/assets/service-skiff.py
& $blender -b -t 4 --python-exit-code 2 -P tools/blender/review.py
```

GLB powstają w `assets/models`, a podglądy w `assets/previews/overhaul`. `review.py` importuje te GLB do sceny kontrolnej z aktualnym lustrem, emiterem i rezonatorami. Używa ustawień kamery gry dla 1920 × 1080 i 390 × 844. Osobno pokazuje cztery wykończenia platformy.

Cały katalog optyki buduje `tools/blender/optical_catalog.py`, a modele otoczenia
buduje `tools/blender/scenery_catalog.py`. Argumenty po `--` ograniczają eksport
do wybranych modeli. Działają też osobne skrypty w `tools/blender/assets`,
np. `optic-mirror.py` i `observatory-arc.py`. Katalog optyki odświeża bieżące
`public/models/optics` i portrety RGBA w `public/portraits`.
`review.py -- catalog` renderuje pełną rodzinę optyki w perspektywie gry.

## Zrzuty i pomiar WebGL

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path (Get-Location) 'test-results/playwright-browsers'
npx.cmd playwright install chromium
node tools/shoot.mjs --levels 1,3,6,8 --themes orbital,verdant,polar,nebula
node tools/contact-sheet.mjs screenshots/YYYY-MM-DD
```

Domyślnie skrypt obejmuje plansze pokazowe, po 1920 × 1080 i 390 × 844, w profilu
`performance`. Zapisuje PNG i `capture.json` z rozdzielczością, backendem WebGL,
FPS i czasami klatek, liczbą wywołań, trójkątów, tekstur, geometrii i komunikatami
konsoli. `--backend native` prosi Chromium o akcelerację sprzętową. `--headed`
uruchamia widoczne okno. `--out` nadpisuje katalog zrzutów. Przy
`--campaign classic1`–`classic4` wyniki zawierają prywatne plansze użytkownika.
Katalog `screenshots` jest ignorowany w Git.
`--levels 8` pokazuje pilot Obserwatorium. Flaga `--pilot-off` przełącza
tę samą demonstracyjną planszę na wcześniejsze otoczenie.

### Sterowanie w trybie debug

Otwórz grę z parametrem `?debug=1`. Wywołania operują na aktywnej kampanii,
a numer planszy zaczyna się od 1. Zmiany stanu i ustawień trwają do opuszczenia
karty lub odświeżenia strony.

| Metoda `window.__debug` | Zachowanie |
| --- | --- |
| `switchCampaign('demo' / 'classic1' … 'classic4')` | Zmiana kampanii dostępnej lokalnie. |
| `loadLevel(n)`, `getLevelCount()`, `getLevelState()` | Wczytanie wskazanej planszy i odczyt kopii stanu. |
| `setTheme(name)` | Wybór `orbital`, `verdant`, `polar`, `nebula` lub `null` dla domyślnego motywu. |
| `freezeAnimations(bool)` | Unieruchomienie warstwy dekoracyjnej do zrzutu przy działającym renderowaniu. |
| `applyMove({index,x,y,rot})` | Ustawienie ruchomego elementu na wolnym polu albo obrót. `index`, `x`, `y` i `rot` są liczone od 0. |
| `applyMove({index,inTray:true})` | Odkłada ustawiony ruchomy element do zasobnika. |
| `isSolved()`, `resetLevel()`, `undo()`, `redo()` | Odczyt wyniku i sterowanie przez zwykłą historię ruchów. |
| `getStats()` | Ostatnie FPS, liczba klatek, wywołań, trójkątów, tekstur i geometrii z Three.js oraz backend WebGL. Liczniki tekstur są proxy dla pamięci GPU. |
