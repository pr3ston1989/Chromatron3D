# Inwentarz modeli · faza 2

Rozmiary w metrach, w kolejności X × Y × Z w Three.js. Y oznacza wysokość.
Wymiary plików GLB wynikają z ich obwiedni przed skalowaniem instancji.
„Do przeglądu” oznacza model działający w grze, który porównamy ze wspólnym stylem.

## Plansza i elementy optyczne

| Obiekt | Rola i miejsce | Aktualny rozmiar | Limit trójkątów | Status |
| --- | --- | --- | ---: | --- |
| Korpus, cokół, kil, pokrywa, listwy i detale narożne | `main.js`, `world-art.js`; korpus pod polem gry | GLB 21,05 × 3,75 × 21,05; awaryjna bryła 21 × 0,75 × 21 | 1500 | Próbka gotowa, 1498 trójkątów |
| Kafel i wpuszczona linia podziału | `main.js`; instancje siatki 15 × 15 | GLB 1,24 × 0,22 × 1,24; linia 1,144 × 0,012 × 0,016 | 180 | GLB; sprawdzić uproszczenie i jednolity kolor |
| Skala na bokach siatki | `world-art.js`; pozycja kafli | 0,30 × 0,013 × 0,025 | 180 | Generowana; ocenić przy pilotażu |
| Kaseta pochłaniacza, listwa świetlna i powierzchnia chwytająca | `beam-perimeter.js`; obrzeże rozgrywki, 60 kaset | GLB 1,31 × 0,96 × 0,28; powierzchnia 1,313 × 0,38 × 0,13 | 180 | GLB kasety; funkcjonalna powierzchnia instancjonowana |
| Narożnik i żebro pochłaniacza | `beam-perimeter.js`; łączniki | 0,59 × 1,18 × 0,59; 0,36 × 0,78 × 0,50 | 180 | Generowane |
| Ściana | `public/models/optics/wall.glb`; zapora | 1,04 × 0,47 × 1,02 | 180 | Nowy GLB w grze, 138 trójkątów |
| Emiter | `laser.glb`; źródło wiązki | 0,77 × 0,88 × 1,09 | 600 | Nowy GLB w grze, 342 trójkątów |
| Lustro | `mirror.glb`; odbicie | 0,77 × 0,95 × 1,09 | 600 | Nowy GLB w grze, 200 trójkątów |
| Zaginacz | `bender.glb`; skręt toru | 0,87 × 0,95 × 1,09 | 600 | Nowy GLB w grze, 226 trójkątów |
| Filtr | `filter.glb`; wydziela kolor | 0,77 × 0,92 × 1,09 | 600 | Nowy GLB w grze, 284 trójkątów |
| Pryzmat | `prism.glb`; rozszczepia kolory | 1,04 × 0,89 × 1,09 | 600 | Nowy GLB w grze, 174 trójkątów |
| Doppler | `doppler.glb`; przesuwa kolor | 1,04 × 0,91 × 1,09 | 600 | Nowy GLB w grze, 392 trójkątów |
| Rozdzielacz | `splitter.glb`; rozwidla tor wiązki | 1,04 × 0,87 × 1,09 | 600 | Próbka gotowa, 532 trójkąty |
| Splątywacz | `tangler.glb`; wiąże parę torów | 1,04 × 0,84 × 1,09 | 600 | Nowy GLB w grze, 344 trójkątów |
| Rezonator | `target.glb`; cel zagadki | 1,04 × 0,61 × 1,09 | 600 | Nowy GLB w grze, 260 trójkątów |
| Przewód | `conduit.glb`; przejście po osi | 0,77 × 0,78 × 1,09 | 600 | Nowy GLB w grze, 300 trójkątów |
| Teleporter | `teleporter.glb`; przeniesienie | 1,04 × 0,98 × 1,09 | 600 | Nowy GLB w grze, 248 trójkątów |
| Wielofiltr | `multiFilter.glb`; filtr wielokanałowy | 1,04 × 0,65 × 1,09 | 600 | Nowy GLB w grze, 240 trójkątów |
| Skrętnik | `twister.glb`; kierunek zależny od wejścia | 1,04 × 0,63 × 1,09 | 600 | Nowy GLB w grze, 250 trójkątów |
| Komplementor | `complementor.glb`; uzupełnia kanały | 1,04 × 0,89 × 1,09 | 600 | Nowy GLB w grze, 164 trójkątów |
| Bramka logiczna | `logicGate.glb`; przetwarza wejścia | 1,04 × 0,77 × 1,09 | 600 | Nowy GLB w grze, 284 trójkątów |
| Gwiazda | `starburst.glb`; wiele wyjść | 1,04 × 0,63 × 1,09 | 600 | Nowy GLB w grze, 328 trójkątów |
| Ruchomy teleporter | `mobileTeleporter.glb`; połówka pary | 1,04 × 0,98 × 1,09 | 600 | Nowy GLB w grze, 300 trójkątów |
| Podwójny reflektor | `dualReflector.glb`; dwustronny odbłyśnik | 0,77 × 0,95 × 1,09 | 600 | Nowy GLB w grze, 324 trójkątów |
| Czterokrotny zaginacz | `quadBender.glb`; zwrotnica | 1,04 × 0,63 × 1,09 | 600 | Nowy GLB w grze, 224 trójkątów |
| Pole zajęte | `occupiedSquare.glb`; blokada montażu | 1,04 × 0,30 × 1,09 | 180 | Nowy GLB w grze, 138 trójkątów |
| Bramka barw podstawowych | `primaryLogicGate.glb`; filtruje wejścia | 1,04 × 0,77 × 1,09 | 600 | Nowy GLB w grze, 288 trójkątów |

## Otoczenie generowane i modele zastępcze

| Obiekt | Rola i miejsce | Aktualny rozmiar | Limit trójkątów | Status |
| --- | --- | --- | ---: | --- |
| Łuki dokujące | `world-art.js`; ramy planu dolnego | R 16,3 / 20,8 / 27, przekrój 0,11 / 0,055 / 0,055 | 2000 | Przegląd kompozycji |
| Pływający dok, wkład i pas | `world-art.js`; cztery gniazda poza planszą | 4,50 × 0,36 × 2,80; 3,60 × 0,035 × 2,10; 3,70 × 0,025 × 0,065 | 600 | Generowane |
| Płyta i fundament dziedzińca | `terrain-biomes.js`; relief oraz brzegi otoczenia | 54 × 0,84 × 14 i 14 × 0,84 × 26 | 1500 | Geometria terenu zależna od kompozycji |
| Pojazd serwisowy orbitalny | `ambient-life.js`; bliski patrol poza siatką | GLB 2,48 × 0,77 × 1,86, zastępczy kadłub 2,20 × 0,65 × 1,05 | 600 | Próbka gotowa, 576 trójkątów |
| Patrole polarny, roślinny i mgławicowy | `ambient-life.js`; bliskie pojazdy | kadłub 2,20 × 0,65 × 1,05 / R 0,82 / R 0,98; skrzydło 3,10 × 0,11 × 0,26, napędy R 0,208 | 600 | Generowane |
| Podstawa maszyny i słup | `ambient-life.js`; wspólne podpory | 4,30 × 0,42 × 3,30; R 0,24–0,33, H 4 | 600 | Generowane |
| Suwnica, chwytak i lampa | `ambient-life.js`; scena orbitalna | ramię 4,10 × 0,24 × 0,40; chwytak 1,36 × 1,15 × 1,15; lampa R 0,40 | 600 | Generowane |
| Turbina i łopatki | `ambient-life.js`; scena roślinna | piasta R 0,74, łopatka R 0,75, H 2,50 | 600 | Generowane |
| Antena i przeciwwaga | `ambient-life.js`; scena polarna | czasza R 1,50; przeciwwaga 4,10 × 0,24 × 0,40 | 600 | Generowane |
| Rezonator otoczenia | `ambient-life.js`; scena mgławicowa | dwa pierścienie R 2 / 1,32; rdzeń R 0,74 | 600 | Generowane |
| Stacja dokująca, hub i pomost | `space-horizon.js`; scena orbitalna | obręcze R 9,10 / 7,70 / 4,10; hub R 2,80, H 3,40; pomost 7 × 0,90 × 2,70 | 2000 | Generowane |
| Biosfera, obręcze, ogród | `space-horizon.js`; scena roślinna | hala 13,68 × 5,17 × 7,60; obręcze R 5,70–10; korony R 1,10, H 2,80 | 2000 | Generowane |
| Teleskop, maszt i iglice | `space-horizon.js`; scena polarna | dysk R 4,90, H 0,35; obręcze R 10,60 / 6,50; maszt H 9; iglice R 0,75, H 4–6 | 2000 | Generowane |
| Reaktor, obręcze i odłamki | `space-horizon.js`; scena mgławicowa | rdzeń R 4,20; obręcze R 5,60–10,60; odłamki R 1,40–2,08 | 2000 | Generowane |
| Stężenia oraz lampy sygnałowe | `space-horizon.js`; podpory i punkty świetlne | stężenia R 0,09–0,20; lampy R 0,38 | 180 | Generowane |
| Przekaźnik przy brzegu | `living-world.js`; maszt, czasza, lampa | maszt R 0,03–0,04 H 0,4–1; czasza R 0,15–0,25; lampa R 0,035 | 300 | Generowane |
| Płat mchu, liść, lód, kryształ i odłamek złomu | `world-biomes.js`; instancje obrzeża | płat mchu R 0,28; liść R 0,11, H 0,42; lód R 0,095–0,16, H 0,28–0,75; kryształ R 0,15–0,32; złom R 0,16 lub 0,42 × 0,20 × 0,58 | 300 | Generowane |
| Planeta, pierścień, asteroidy | `world-biomes.js`; plan daleki | planeta R 6,20–8,20; pierścień do 1,85 R; asteroida R 0,90 przed skalą | 2000 | Przegląd sylwetki tła |
| Pojazd daleki | `distant-traffic.js`; plan daleki | kadłub R 0,54; skrzydło 2,50 × 0,08 × 0,34 | 300 | Generowane |

## Pozostałe modele GLB do przeglądu

| Zestaw i lokacja | Model / rozmiar | Limit trójkątów na model |
| --- | --- | ---: |
| Dominanty `public/models/biomes` | `orbital` 6,90 × 4,76 × 7,13; `verdant` 7,83 × 3,89 × 7,57; `polar` 7,41 × 3,67 × 7,16; `nebula` 8,13 × 7,26 × 7,89 | 2000 |
| Zabudowa orbitalna `public/models/midground` | `orbital-comms` 3,60 × 7,05 × 3,60; `orbital-dock` 6,00 × 1,95 × 3,21 | 1500 |
| Zabudowa roślinna `public/models/midground` | `verdant-greenhouse` 5,80 × 2,07 × 3,15; `verdant-root-tower` 3,80 × 4,90 × 3,00 | 1500 |
| Zabudowa polarna `public/models/midground` | `polar-bridge` 6,00 × 2,84 × 2,24; `polar-geolab` 4,94 × 4,07 × 3,38 | 1500 |
| Zabudowa mgławicowa `public/models/midground` | `nebula-resonators` 5,40 × 4,15 × 5,40; `nebula-wreckage` 5,16 × 3,20 × 4,97 | 1500 |
| Cztery tarasy `public/models/terraces` | 4,71 × 2,77–2,78 × 2,29–2,48 | 600 |
| Cztery zestawy osłon i flory `public/models/terraces` | 1,93–1,95 × 1,91–2,32 × 1,54–1,88 | 300 |

Lasery i ich smugi, cienie kontaktowe, obrysy, retikule, podgląd ruchu, wskazówki, poświata, iskry, pył, owady w tle i smugi pojazdów to generowane efekty i interfejs. Spis geometrii tych warstw i modułów historycznych jest w [inwentaryzacji technicznej](../tools/primitive-inventory.md).

## Próbki do zatwierdzenia

| Model | Nowy rozmiar w Three.js | Podgląd |
| --- | --- | --- |
| [Platforma](../assets/models/overhaul-platform-deck.glb) | 21,12 × 3,78 × 21,12 | [Góra](../assets/previews/overhaul/overhaul-platform-deck.png) · [Spód](../assets/previews/overhaul/overhaul-platform-deck-underside.png) |
| [Rozdzielacz](../assets/models/overhaul-beam-splitter.glb) | 0,98 × 0,86 × 1,00 | [Detal](../assets/previews/overhaul/overhaul-beam-splitter.png) |
| [Pojazd](../assets/models/overhaul-service-skiff.glb) | 2,86 × 0,83 × 2,60 | [Detal](../assets/previews/overhaul/overhaul-service-skiff.png) |

[Arkusz modeli](../assets/previews/overhaul/contact-sheet.png) ·
[Cztery wykończenia](../assets/previews/overhaul/deck-finishes.png) ·
[Kamera gry w 1080p](../assets/previews/overhaul/game-camera-1920x1080.png) ·
[Kamera gry w 390 × 844](../assets/previews/overhaul/game-camera-390x844.png).

## Biblioteka modułów otoczenia

Moduły poniżej są wyeksportowane do `assets/models/scenery`. Oznaczenie pilota dotyczy wdrożonego poziomu demonstracyjnego. Pozostałe moduły są gotowe do kompozycji w fazie 3. Zastępują zestawy wcześniejszych brył, więc jeden model może mieć kilka zastosowań.

| GLB | Rola | Rozmiar | Trójkąty |
| --- | --- | --- | ---: |
| `amethyst-shard` | Instancja kryształu przy krawędzi | 0,71 × 0,70 × 0,44 | 132 |
| `basalt-remnant` | Odłamki skalne do planu dalekiego | 2,27 × 1,54 × 1,42 | 132 |
| `dock-gantry` | Główne żebro stoczni | 12,36 × 6,72 × 2,16 | 608 |
| `dock-landing` | Platforma i gniazda serwisowe stoczni | 6,10 × 2,27 × 3,54 | 172 |
| `dock-relay` | Pylon na horyzoncie | 7,24 × 6,54 × 2,40 | 244 |
| `frost-spires` | Główna sylwetka lodowa | 9,73 × 6,10 × 5,50 | 308 |
| `garden-arcade` | Kamienna forma ramująca Ogród | 9,81 × 4,67 × 2,16 | 872 |
| `garden-fern` | Roślinność tarasów | 1,32 × 0,95 × 0,70 | 188 |
| `garden-heliostat` | Dominanta optyczna Ogrodu | 5,72 × 4,36 × 3,76 | 800 |
| `garden-terrace` | Moduł krajobrazu ogrodowego | 28,00 × 4,20 × 6,55 | 92 |
| `greenhouse-habitat` | Biosfera i zamiennik starej szklarni | 9,20 × 3,76 × 5,86 | 828 |
| `grotto-buttress` | Kryształowa dominanta Groty | 9,73 × 6,10 × 5,50 | 220 |
| `grotto-ridge` | Dalsza warstwa skalna | 28,00 × 4,20 × 6,55 | 92 |
| `ice-shard` | Mały lód, instancja na obrzeżu | 0,53 × 0,75 × 0,33 | 132 |
| `maintenance-crane` | Główna maszyna dokująca | 4,81 × 2,96 × 2,96 | 280 |
| `moss-cover` | Kępy mchu | 0,93 × 0,39 × 0,58 | 132 |
| `observatory-arc` | Łuk kalibracyjny w pilocie | 11,99 × 6,11 × 2,16 | 784 |
| `observatory-iris` | Ruchomy wkład soczewki w pilocie | 3,93 × 3,95 × 0,77 | 536 |
| `observatory-landing` | Podstawa łuku i soczewki w pilocie | 13,54 × 1,45 × 4,39 | 270 |
| `observatory-lens` | Gniazdo soczewki w pilocie | 5,72 × 2,69 × 3,76 | 236 |
| `perimeter-brace` | Instancjonowane żebro pochłaniacza | 0,36 × 0,78 × 0,50 | 108 |
| `perimeter-corner` | Narożnik pochłaniacza | 0,61 × 1,18 × 0,61 | 108 |
| `reclaimed-metal` | Mała grupa złomu poza siatką | 0,81 × 0,25 × 0,51 | 132 |
| `ring-reactor` | Duży rezonator i zamiennik reaktora | 6,00 × 5,15 × 4,40 | 640 |
| `skyline-ridge` | Trzy warstwy horyzontu w pilocie | 28,00 × 4,20 × 6,55 | 92 |
| `survey-mast` | Przekaźnik przy brzegu | 0,45 × 0,73 × 0,43 | 178 |
| `tracking-dish` | Czasza obserwacyjna i odpowiednik teleskopu | 4,34 × 3,35 × 2,96 | 288 |
| `wind-turbine` | Maszyna tarasu w Ogrodzie | 4,34 × 2,92 × 2,96 | 334 |

Dodatkowe platformy `overhaul-platform-grotto`, `overhaul-platform-garden` i `overhaul-platform-shipyard` mają po 1498 trójkątów. Dotychczasowy kafel, chwytacz wiązki, stare kompozycje biomów i obudowy pozostają dostępne dla plansz poza pilotem.

[Arkusz 22 przyrządów](../assets/previews/overhaul/catalog-optics.png) ·
[Przyrządy w skali gry](../assets/previews/overhaul/catalog-camera-1920x1080.png) ·
[Arkusz 28 modułów otoczenia](../assets/previews/overhaul/catalog-scenery.png).
