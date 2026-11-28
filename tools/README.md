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

## Kryształowa grota

Edytowalne formacje i stanowisko pomiarowe znajdują się w `assets/models/scenery/grotto-*.blend`. Gra ładuje odpowiadające im pliki GLB. Pigment skały i cienie kontaktowe są zapisane w kolorach wierzchołków. Rysunek łupku pochodzi ze wspólnej próbki materiału pokładu.

Zestaw budowli kampanii obejmuje 43 modele z geometrią, materiałami
PBR i wypalonym cieniowaniem wnęk w kolorach wierzchołków. Pliki `.blend`
i `.glb` są w `assets/models/scenery`, a podglądy w
`assets/previews/overhaul/scenery`. Modele zajmują 274–4696 trójkątów.
Poniższe polecenie przebudowuje wszystkie modele i podglądy. Po `--`
można też podać poszczególne nazwy modeli.

```powershell
& 'C:\Tools\blender-5.3.0-windows-x64\blender.exe' -b --python-exit-code 1 -P tools/blender/assets/biome-landmarks.py -- --preview
```

Modele Optyki głębinowej z tego zestawu to `abyss-observatory` (limit 3900
trójkątów), `abyss-vent-reef` (3300), `abyss-rov-berth` (2350) i
`abyss-survey-rov` (1200). Iluminatory i reflektory pojazdu mają efekty
nakładane w grze. Materiały i wypalone cienie pozostają zapisane w GLB.

Modele Laboratorium polarnego to `frost-optical-lab` (limit 3200 trójkątów),
`frost-icefall` (2400), `frost-radiometer` (1800) i `frost-core-bridge` (2600).
Stacja i radiometr mają pale sięgające lodu. Cztery stopy pomostu stoją na
przeciwległych brzegach szczeliny w `frost-terrain`.

Stocznia korzysta z `shipyard-transfer-dock` i `shipyard-cargo-tug` (limity
3800 i 1400 trójkątów). Kuźnia używa `forge-furnace-bank`,
`forge-casting-line` i `forge-spillway` (limity 3800, 3000 i 2600).
Pomost w Grocie korzysta z `grotto-pump-causeway` (1882 z 2300 trójkątów),
żyła ametystu z `grotto-crystal-seam` (872 z 1500), a kaskada z
`grotto-calcite-spring` (1136 z 2400). Materiał nazwany `Foundry flowing metal`
otrzymuje w grze animowany refleks. Pliki GLB i odpowiadające im edytowalne
źródła `.blend` znajdują się w `assets/models/scenery`.

`heliostat-optical-collector` ma panelową czaszę, przekładnie i kamienny
fundament. `heliostat-ravine` łączy tarasy z przelewami, a `sanctuary-meridian`
ma wyłamane segmenty pierścienia, osadzone w kamiennych pylonach. Limity
wynoszą odpowiednio 4600, 4600 i 4300 trójkątów.

`heliostat-waterworks` ma 3036 z 3600 trójkątów. Kamienna podstawa, arkady i
kanał są nieruchome. Węzeł `Sluice_Wheel` zawiera obręcze, łopatki i oś osadzoną
w dwóch łożyskach. Przelewy w ogrodzie i w ujęciu współdzielą animowany
materiał wody. Przebudowa ujęcia zapisuje źródło Blendera, GLB i podgląd.

```powershell
& 'C:\Tools\blender-5.3.0-windows-x64\blender.exe' -b --python-exit-code 1 -P tools/blender/assets/heliostat-waterworks.py
```

Stanowisko `sanctuary-calibration` ma 1484 z 2300 trójkątów. Model składa się
z kamiennej podstawy i węzła `Calibration_Pivot` z pryzmatem i okuciami.
Węzeł obraca się w grze wokół fizycznej osi. Osobny skrypt zapisuje źródło,
eksport GLB i podgląd PNG.

```powershell
& 'C:\Tools\blender-5.3.0-windows-x64\blender.exe' -b --python-exit-code 1 -P tools/blender/assets/sanctuary-calibration.py
```

Ruchome elementy dalszego planu korzystają z `ambient-survey-glider`
(504 trójkąty), `ambient-cavern-moth` (274), `ambient-pelagic-fish` (340)
i `ambient-forge-hauler` (650). Wagon jeździ po `forge-service-rail`
(1124). Dostępne są źródła Blendera, eksporty GLB i podglądy wszystkich
pięciu modeli. Trasy i częstotliwość zdarzeń konfiguruje `src/campaign-worlds.js`.

`shipyard-service-arm` ma 1684 trójkąty. Gra używa dwóch kopii modelu do
połączenia bliskich terminali z platformą Stoczni.

Sześć krajobrazów ma osobne siatki `*-terrain.blend` i eksporty `*-terrain.glb`
w tym samym katalogu. Każdy ma 2880 trójkątów, materiał PBR i pigment zapisany
w wierzchołkach. Skrypt zawiera rzędne gruntu pod fundamentami oraz przebieg
ścieżek. Eksport używa osi Y-up, a powierzchnia jest osadzona w grze na −40 m.

```powershell
& 'C:\Tools\blender-5.3.0-windows-x64\blender.exe' -b --python-exit-code 1 -P tools/blender/assets/biome-terrain.py -- --preview
```

```powershell
& 'C:\Tools\blender-5.3.0-windows-x64\blender.exe' -b --python-exit-code 1 -P tools/blender/scenery_catalog.py -- grotto-buttress grotto-fault-shelf grotto-escarpment
& 'C:\Tools\blender-5.3.0-windows-x64\blender.exe' -b --python-exit-code 1 -P tools/blender/assets/grotto-survey.py
```

## Dok serwisowy Węzła Keplera

Poziom wzorcowy otwiera się z parametrem `?benchmark=orbital`. Przy dostępnej
lokalnej kampanii wykorzystuje zagadkę Chromatron 1–15. Galeria ciśnieniowa,
ramiona doku, wsporniki, radiatory, prom na pomoście i antena kierunkowa są osobnymi siatkami w
`assets/models/benchmark/kepler-service-dock.blend`. Gra wczytuje ich wspólny
eksport GLB o tej samej nazwie. Podstawa doku znajduje się 6,80 m poniżej planszy.

Łuk serwisowy przy galerii ma osobny plik `assets/models/benchmark/station/transit-gate.blend`.
Skrypt `tools/blender/assets/transit-gate.py` buduje go razem z wózkiem inspekcyjnym
i eksportuje sąsiedni GLB. Wózek porusza się po łuku, a tryb ograniczonego ruchu zatrzymuje go.

```powershell
& 'C:\Tools\blender-5.3.0-windows-x64\blender.exe' -b --python-exit-code 1 -P tools/blender/assets/kepler-dock.py
node tools/review-kepler-dock.mjs
```

Druga komenda sprawdza widoczność 225 pól w lokalnej grze i zapisuje dwa
zrzuty z kamery gracza w katalogu `screenshots/kepler-service-dock`.
Wariant `node tools/review-kepler-dock.mjs screenshots/kepler-oblot --optics --motion`
nagrywa rzeczywisty start promu i przelot meteoru do `06-oblot.webm`. Dwa
ruchome węzły tego samego GLB mają osie w kadłubie promu i łożysku czaszy.
`src/kepler-traffic.js` prowadzi je po trasie, a `src/sky-meteor.js` rysuje
smugę za geometrią planszy i otoczenia. Systemowe ograniczenie ruchu parkuje
prom i wyłącza przeloty.

## Instrumenty i bariera pola

Gra korzysta z 22 modeli i portretów w `assets/models/optical-bench`.
Edytowalne siatki znajdują się w `optical-bench.blend`, a receptury w
`tools/blender/assets/orbital-instruments.py` i `tools/blender/optical_specialties.py`.
Wszystkie głowice pracują w układzie z osią wiązki na wysokości 0,78 m.
Odbiornik ma kwadratowy szlif schodkowy ze ściętymi narożnikami i cztery metalowe
łapy poniżej pasa wejścia wiązki. Barwę kamienia wyznacza wymaganie zagadki,
a okienka w podstawie zapalają się przy zgodności odebranego widma.
Materiał w `src/optic-model-loader.js` oblicza wewnętrzne odbicie od dolnych faset.
Sam odbiornik i jego portret można odtworzyć poleceniem
`blender -b -P tools/blender/assets/orbital-instruments.py -- target`.

Lustro ma płaską srebrzoną powierzchnię, zakrzywiacz wklęsły profil, a filtr
dwuwypukłą soczewkę. Rozdzielacz ma dwa szklane kliny, których zewnętrzne
krawędzie unoszą się ponad wspólną płytkę półprzepuszczalną. Dwa miedziane
uchwyty oznaczają oś, wzdłuż której przyrząd zatrzymuje światło.
`src/optic-illumination.js` podświetla powłoki w miejscu przejścia wiązki.
Dla każdej strony filtra pobiera osobny kolor z toru promieni.

Kaseta filtra ma dwie odsłonięte powierzchnie soczewki. Kolorowa wstawka
w uchwycie pozwala rozpoznać filtr także od góry. Polecenie
`blender -b -P tools/blender/assets/orbital-instruments.py -- filter`
zapisuje model oraz miniatury `portraits/filter-0.png` do `filter-7.png`
w katalogu `assets/models/optical-bench`. Numer oznacza maskę RGB planszy.

Pryzmat ma pojedynczą, trójkątną bryłę szkła na stoliku z trzema śrubami
poziomującymi. Szkło przesuwa widoczny ślad wiązki zgodnie z kątem patrzenia
na fasetę. Kolory po obu stronach przyrządu pochodzą z symulacji. Przy zmianie
obrysu szkła w funkcji `prism` trzeba także dopasować przekrój w
`src/optic-illumination.js` na wysokości wiązki (0,78 m).
Eksport modelu i portretu można powtórzyć z katalogu projektu poleceniem
`blender -b -P tools/blender/assets/orbital-instruments.py -- prism`.

Wiązkę rysują trzy warstwy. Rdzeń i poświata zwracają się do kamery,
a rozproszone światło pada na płaszczyznę pokładu. Moduł
`src/beam-profile.js` łączy kolejne odcinki o wspólnym kolorze
i kierunku aż do urządzenia lub bariery. Ślad cząstek zachowuje kierunek emisji.

Listwę bariery eksportuje `tools/blender/assets/field-rail.py`. Cztery
płaszczyzny pochłaniające w `src/collector-field.js` pobierają pozycję
i kolor każdego trafienia z wyniku symulacji. Wariant stacji z galerią
przekaźnika i pancerzem pokładu można odtworzyć przez uruchomienie
`tools/blender/assets/orbital-benchmark.py` w Blenderze z argumentami
`-- --station`. W `assets/models/benchmark/station/relay-crown.glb` są
osobne węzły masztu, pierścienia i skrzydeł. Pierścień wykonuje obrót
w 72 s. Przy ograniczonym ruchu skrzydła i pierścień mają stałą pozycję.

```powershell
node tools/review-kepler-dock.mjs screenshots/kepler-fotonika --optics
```

Opcja `--optics` zapisuje siedem barw odbiornika na osobnym układzie testowym.
Porównuje również lustro i rozdzielacz przy tym samym kącie padania i sprawdza
wybieranie rozdzielacza w widoku laptopowym i telefonicznym.
Jeżeli pierwsza kampania jest dostępna lokalnie, zapisuje też ten sam kryształ
na planszy przed doprowadzeniem światła i po nim.

## Próbki przebudowy wizualnej

### Materiały powierzchni planszy

Plik `assets/materials/deck/deck-surfaces.blend` zawiera pięć próbek z edytowalnymi
węzłami materiałów. Aby przebudować próbki i mapy z receptur, uruchom z katalogu projektu

```powershell
& 'C:\Tools\blender-5.3.0-windows-x64\blender.exe' -b -t 4 --python-exit-code 2 -P tools/blender/materials/panel-surfaces.py
```

Każdy PNG 256 × 256 zawiera liniowe dane. R opisuje odcień, G szorstkość,
a B i A nachylenie powierzchni w dwóch osiach. Gra wczytuje jedną mapę
dla danego wykończenia i wybiera z niej fragment dla każdej płyty.
`src/panel-surface.js` dopasowuje skalę do rozstawu pól i osłabia detal
przy oddaleniu kamery.

### Modele platform

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
`--levels 1,2,3,4,5,6,7,8` obejmuje wszystkie nowe światy. Flaga
`--pilot-off` przełącza plansze na zestaw odniesienia. Opcja `--solved-demo`
wykonuje zweryfikowane ruchy na planszy pokazowej i zamyka okno zwycięstwa przed zrzutem.

### Pełna regresja

```powershell
node tools/full-regression.mjs
```

Skrypt weryfikuje rozwiązania z prywatnych plików `original`, wykonuje ruchy
w Chromium, ponownie odwiedza wszystkie plansze i mierzy pamięć po każdych
25. Wyniki zapisuje do `test-results/full-regression`, a prywatne ruchy do
ignorowanego `data/solutions.json`. `--skip-screenshots` uruchamia tylko część
regresyjną, a `--backend swiftshader` wybiera renderowanie programowe.

### Sterowanie w trybie debug

Otwórz grę z parametrem `?debug=1`. Wywołania operują na aktywnej kampanii,
a numer planszy zaczyna się od 1. Zmiany stanu i ustawień trwają do opuszczenia
karty lub odświeżenia strony.

| Metoda `window.__debug` | Zachowanie |
| --- | --- |
| `switchCampaign('demo' / 'classic1' … 'classic4')` | Zmiana kampanii dostępnej lokalnie. |
| `loadLevel(n)`, `getLevelCount()`, `getLevelState()` | Wczytanie wskazanej planszy i odczyt kopii stanu. |
| `setTheme(name)` | ID z `src/campaign-worlds.js`, wcześniejsze `orbital`, `verdant`, `polar`, `nebula` lub `null` dla motywu kampanii. |
| `freezeAnimations(bool)` | Unieruchomienie warstwy dekoracyjnej do zrzutu przy działającym renderowaniu. |
| `freezeAnimations(true,{onDemand:true})`, `renderStill()` | W testach obrazu rysuje pełną klatkę gry na żądanie, po zmianie kamery lub rozmiaru okna. `freezeAnimations(false)` wznawia animację. |
| `applyMove({index,x,y,rot})` | Ustawienie ruchomego elementu na wolnym polu albo obrót. `index`, `x`, `y` i `rot` są liczone od 0. |
| `applyMove({index,inTray:true})` | Odkłada ustawiony ruchomy element do zasobnika. |
| `isSolved()`, `resetLevel()`, `undo()`, `redo()` | Odczyt wyniku i sterowanie przez zwykłą historię ruchów. |
| `getStats()` | Ostatnie FPS, liczba klatek, wywołań, trójkątów, tekstur i geometrii z Three.js oraz backend WebGL. Liczniki tekstur są proxy dla pamięci GPU. |
