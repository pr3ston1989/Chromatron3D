# Stan projektu

## Architektura

| Obszar | Aktualny stan |
| --- | --- |
| Uruchomienie | Vite, moduły JavaScript, Three.js i WebGL2. `index.html` tworzy interfejs HTML, a `src/main.js` łączy rozgrywkę, scenę i interfejs. |
| Plansze | Siatka 15 × 15, zapis elementu `[type,x,y,rot,color]`, indeksy 0–14, osiem kierunków, kolor jako maska RGB. Osiem plansz pokazowych jest w `src/levels.js`. Cztery prywatne kampanie po 50 plansz wczytują się lokalnie z plików użytkownika albo przez import. |
| Mechanika | `src/optics.js` śledzi promienie po siatce, składa kanały RGB przy rezonatorach i rozlicza zakończenie. 22 rodzaje elementów, z czego 14 ruchomych. Są m.in. lustra, rozdzielacze, pryzmaty, filtry, portale, Doppler, splątywacze i bramki. |
| Kamera | Perspektywa 40°, domyślny widok 3/4 z obrotem, zoomem i widokiem z góry. Kamera odsuwa się przy wąskim ekranie. Kliknięcia na elementy używają najbliższej widocznej powierzchni i obsługują też logiczne pole. |
| Światło i scena | Ciepłe światło kierunkowe, światło wypełniające, oświetlenie otoczenia i mgła. EffectComposer łączy scenę, bloom w wyższych profilach, tonację i antyaliasing. Wybrane lustra mają odbicia planarne. Cztery biomy składają się z kilku systemów dekoracji, animacji i modeli GLB. |
| Sterowanie i UI | Mapa kampanii, zasobnik, przeciąganie, obrót, undo/redo, reset, analiza widma, zmiana jakości, tryb skupienia na planszy, pełny ekran. `src/i18n.js` i opisy plansz obsługują PL/EN. |
| Zapisy | `localStorage` przechowuje kampanię, postęp, podpowiedzi i ustawienia. Szkice plansz mają identyfikator pakietu i są walidowane przez `src/puzzle-drafts.js`. |
| Podpowiedzi | `src/classic-strategies.js` ma ręcznie napisane wstępy PL/EN dla 200 znanych plansz. `src/hint-assistant.js` dobiera kolejny krok, a solver i tracker promieni sprawdzają rozwiązanie. Kredyty i postęp są przechowywane lokalnie. |
| Narzędzia | Blender 5.3.0 w `C:\Tools\blender-5.3.0-windows-x64\blender.exe`, sprawdzony bez okna. Playwright 1.65.0 ma projektową instalację Chromium w ignorowanym katalogu `test-results/playwright-browsers`. |

## Praca fazowa

- Faza 0 zakończona: przegląd stanu, tryb `?debug=1`, narzędzia do zrzutów oraz [pomiary i audyt](QA_LOG.md).
- Faza 1 zamknięta. Właściciel wybrał wszystkie cztery [kierunki artystyczne](concepts/README.md). Obecne modele są punktem odniesienia.
- Faza 2 obejmuje potok Blendera oraz trzy próbki przed bramką stylu. Pilotaż wykorzystuje płytę planszy, rozdzielacz i orbitalny pojazd serwisowy.
- Późniejsze fazy pozostają do wykonania w kolejności z [MASTER_PROMPT.md](MASTER_PROMPT.md). Obecne 200 zweryfikowanych w silniku konfiguracji i obecne podpowiedzi są materiałem wejściowym dla faz 4 i 5.

## Punkty odniesienia

- [Format poziomu](LEVEL_FORMAT.md), [kompatybilność](CLASSIC_COMPATIBILITY.md), [inwentaryzacja geometrii](../tools/primitive-inventory.md).
- [Zasady stylu](DESIGN_BIBLE.md), [decyzje](DECISIONS.md), [wyniki testów i audyt](QA_LOG.md).
- Lokalny graf Graphify odświeżono po fazie 0. Miejsca istotne dla przełożenia koncepcji na grę to kamera w `src/main.js`, modele optyki w `src/optical-assets.js` oraz ogranicznik i poświata obwodu w `src/beam-perimeter.js` i `src/board-edge-glow.js`.
