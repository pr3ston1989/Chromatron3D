# Inwentaryzacja geometrii tworzonej w kodzie

Rozmiary w metrach, w kolejności X × Y × Z silnika (Y pionowo), przed skalowaniem instancji.
R to promień, H to wysokość; dla torusa podano promień główny i promień przekroju.

| Obiekt lub część jednego modelu | Użycie | Aktualny rozmiar |
| --- | --- | --- |
| **Korpus pod kaflami** | `src/main.js`, pod wszystkimi planszami | 21 × 0,75 × 21 |
| Podest zewnętrzny, kadłub, kil i obręcz | `src/world-art.js`, warstwy pod głównym korpusem | 21,9 × 0,28 × 21,9; 23,1 × 0,38 × 23,1; 24,25 × 0,24 × 24,25; 25 × 0,10 × 25 |
| Lampy i pasy na podwoziu | `src/world-art.js`, dolna obręcz, boki i szwy | 24,1 × 0,07 × 24,1; 21,6 × 0,043 × 0,055; 21,9 × 0,042 × 0,06 (z obrotem) |
| Narożne wentyle i wskaźniki | `src/world-art.js`, cztery narożniki | 0,67 × 0,08 × 0,67; 0,24 × 0,014 × 0,025 |
| Nacięcia skali | `src/world-art.js`, dwa brzegi siatki | 0,30 × 0,013 × 0,025 (z obrotem) |
| **Panele pancerza pochłaniacza** | `src/beam-perimeter.js`, 60 paneli wokół siatki | 1,3052 × 0,96 × 0,29 dla kafla 1,3 |
| Powierzchnie przechwytujące i listwy świetlne | `src/beam-perimeter.js`, po 60 sztuk | 1,313 × 0,38 × 0,13; 1,066 × 0,036 × 0,065 |
| Narożnik i żebro pochłaniacza | `src/beam-perimeter.js`, połączenia i podpory | 0,59 × 1,18 × 0,59; 0,36 × 0,78 × 0,50 |
| Łuki dokujące | `src/world-art.js`, dolny plan tła | R 16,3/20,8/27 z przekrojami 0,11/0,055/0,055, łuk 297° |
| Pływająca platforma dokująca | `src/world-art.js`, cztery dalekie punkty | 4,5 × 0,36 × 2,8; wkład 3,6 × 0,035 × 2,1; pas 3,7 × 0,025 × 0,065 |
| Fundamenty dziedzińców | `src/terrain-biomes.js`, po cztery na biom | 54 × 0,84 × 14 i 14 × 0,84 × 26; wierzch reliefowy ma ten sam obrys |
| **Orbitalny pojazd serwisowy** i polarny odpowiednik | `src/ambient-life.js`, patrol przy planszy | 2,2 × 0,65 × 1,05 kadłub, 3,1 × 0,11 × 0,26 skrzydło, dwa napędy R 0,208 |
| Pojazd roślinny i mgławicowy | `src/ambient-life.js`, odrębne patrole biomów | kadłub R 0,82/0,98, skrzydło i napędy jak w patrolu orbitalnym |
| Fundament i kolumny maszyn | `src/ambient-life.js`, wszystkie biomy | 4,3 × 0,42 × 3,3; R 0,24/0,33, H 4 |
| Suwnica z chwytakiem i sygnałem | `src/ambient-life.js`, biom orbitalny | 4,1 × 0,24 × 0,40; 1,36 × 1,15 × 1,15; R 0,40 |
| Turbina roślinna | `src/ambient-life.js`, biom roślinny | rdzeń R 0,74; pięć łopatek R 0,75, H 2,5; lampa R 0,40 |
| Czasza telemetryczna i przeciwwaga | `src/ambient-life.js`, biom polarny | czasza R 1,50 i rozwarcie 75,6°; ramię 4,1 × 0,24 × 0,40; lampa R 0,40 |
| Rezonator maszynowy | `src/ambient-life.js`, mgławica | pierścienie R 2 i 1,32, przekroje 0,15 i 0,099; rdzeń R 0,74; lampa R 0,40 |
| Daleka stacja dokująca | `src/space-horizon.js`, biom orbitalny | pierścienie R 9,1/7,7/4,1, przekrój 0,30/0,13/0,12; hub R 2,1/2,8, H 3,4; pomosty 7 × 0,9 × 2,7 |
| Daleka biosfera | `src/space-horizon.js`, biom roślinny | obręcze R 10/7,8/5,7, przekrój 0,25; hala 13,68 × 5,17 × 7,6; korony R 1,1, H 2,8 |
| Daleki teleskop | `src/space-horizon.js`, biom polarny | obręcze R 10,6/6,5 i przekrój 0,22/0,12; dysk R 4,9, H 0,35; iglice R 0,75, H 4–6 |
| Daleki reaktor | `src/space-horizon.js`, mgławica | obręcze R 10,6/8,1/5,6, przekrój 0,24/0,17/0,11; rdzeń R 4,2; odłamki R 1,4–2,08 |
| Wsporniki i sygnały megastruktur | `src/space-horizon.js`, wspólne | promień rury 0,09–0,20, zmienna długość; lampy R 0,38 |
| Miniaturowe anteny na obrzeżu | `src/living-world.js`, ruchome przekaźniki | maszt R 0,03/0,04, H 0,4–1; czasza R 0,15–0,25; lampa R 0,035 |
| Asteroidy, planeta i jej pierścień | `src/world-biomes.js`, tło | asteroida R 0,9 przed skalą 0,38–1,98; planeta R 6,2–8,2; pierścień 1,32–1,85 × R planety |
| Małe pojazdy na horyzoncie | `src/world-biomes.js` i `src/distant-traffic.js` | kadłub R 0,54; skrzydło 2,5 × 0,08 × 0,34; smuga R 0,22, H 2,5 |
| Płaty i odłamki na krawędzi | `src/world-biomes.js`, cztery warianty | mech R 0,28; lód R 0,095, H 0,28; kryształ R 0,15; złom R 0,16 |
| Poszycie i drobne liście | `src/world-biomes.js`, instancje przed skalowaniem | liście R 0,11, H 0,42; mech R 0,29; lód R 0,16, H 0,75; kryształ R 0,32; złom 0,42 × 0,2 × 0,58 |

### Elementy pozostałe do odnotowania

| Obiekt | Użycie | Aktualny rozmiar |
| --- | --- | --- |
| Kafel w oczekiwaniu na GLB | `src/main.js`, podmieniany po wczytaniu pliku | 1,261 × 0,22 × 1,261 |
| Oznaczenia kafli, podgląd ruchu i podpowiedzi | `src/main.js`, `src/selection-reticle.js` | linia 1,144 × 0,012 × 0,016; podgląd 1,17 × 0,025 × 1,17; kontur 1,196 × 0,04 × 1,196; pole zaznaczenia 1,183 × 1,183; ramiona 0,1755 × 0,012 × 0,0247; punkt 0,052 × 0,014 × 0,052; pierścień R 0,43/0,032 |
| Promień, kontaktowy cień, obrys planszy i halo sukcesu | `src/beam-batching.js`, `src/optic-contact-shadows.js`, `src/board-edge-glow.js`, `src/victory-vfx.js` | promień R zależny od warstwy wiązki, jednostkowy segment dopasowany do trasy; cień 1,859 × 1,859; listwy 19,62 × 0,12 × 0,06 (z obrotem); pierścień R 0,22–0,285 |
| Poświata pod planszą i cząstki | `src/world-art.js`, `src/ambient-life.js`, `src/living-world.js` | halo R 13,3–31,3; sygnał R 0,40; cząstki R 0,14/0,17/0,24 lub R 0,10, H 0,42; roślinne R 0,18, H 0,85, lodowe R 0,10, H 0,65, mgławicowe R 0,16, orbitalne R 0,09; insekty R 0,06 |
| Stare typy terenu | `src/ground-terrain.js`, bez wywołań gry | pierścień R 12,5–28; płyta 3,8 × 0,18 × 2,4; kratka 1,8 × 0,08 × 1,2; nit R 0,08/0,10, H 0,06; pas 2,5 × 0,025 × 0,12; głaz R 1; mech R 0,65; kępa R 0,15, H 0,35; liść R 0,08; iglica R 0,45, H 2,8; staw R 1,1; odłamki R 0,22/0,18; kryształ R 0,8; kolumna R 0,28/0,30, H 1,2; żyła 3 × 0,02 × 0,06 |
| Stare moduły lustra, emitera i rezonatora | `src/mirror-asset.js` i `src/optical-assets.js`, osiągalne z testów | płyty lustra od 0,13 × 0,67 × 0,99; śruby R 0,035, H 0,018; pierścienie emitera R 0,211/0,018; kołnierz R 0,255/0,285, H 0,095; soczewka R 0,161, H 0,035; pierścienie rezonatora R 0,47/0,029 i 0,345/0,013 |

Cząstki, poświaty, prowadnice, retikule i awaryjny kafel są częścią renderowania.
Przyrządy, zasadniczy kafel, dioramy, modele roślin i główne zabudowania biomów są już w GLB.
