# Stan projektu

## Architektura

| Obszar | Aktualny stan |
| --- | --- |
| Uruchomienie | Vite, moduły JavaScript, Three.js i WebGL2. `index.html` tworzy interfejs HTML, a `src/main.js` łączy rozgrywkę, scenę i interfejs. |
| Plansze | Siatka 15 × 15, zapis elementu `[type,x,y,rot,color]`, indeksy 0–14, osiem kierunków, kolor jako maska RGB. Osiem plansz pokazowych jest w `src/levels.js`. Cztery prywatne kampanie po 50 plansz wczytują się lokalnie z plików użytkownika albo przez import. |
| Mechanika | `src/optics.js` śledzi promienie po siatce, składa kanały RGB przy rezonatorach i rozlicza zakończenie. 22 rodzaje elementów, z czego 14 ruchomych. Są m.in. lustra, rozdzielacze, pryzmaty, filtry, portale, Doppler, splątywacze i bramki. |
| Kamera | Perspektywa 40°, widok 3/4 z obrotem i przełącznikiem widoku z góry. Przybliżenie obsługuje rolkę oraz gest dwóch palców. Kamera odsuwa się przy wąskim ekranie. Wybór elementu używa najbliższej widocznej powierzchni i obsługuje też logiczne pole. |
| Światło i scena | Osiem światów kampanii z autorskimi modelami GLB, osobną paletą, światłem kierunkowym, mgłą i dekoracjami. EffectComposer łączy scenę, bloom w wyższych profilach i antyaliasing. Wybrane lustra mają odbicia planarne. |
| Sterowanie i UI | Menu główne wznawia zapis i otwiera kampanie, ustawienia oraz instrukcję. Nad planszą są cel i postęp. Zasobnik, historia, podpowiedzi i kamera dzielą dolną belkę. Przyrząd można przeciągnąć lub przenieść po wskazaniu nowego pola. Interfejs i opisy plansz obsługują PL/EN. |
| Zapisy | `localStorage` przechowuje kampanię, postęp, podpowiedzi i ustawienia. Szkice plansz mają identyfikator pakietu i są walidowane przez `src/puzzle-drafts.js`. |
| Podpowiedzi | Wszystkie 200 znanych plansz ma obserwację PL/EN oraz polską technikę i opis efektu zweryfikowanego ruchu. `src/hint-assistant.js` dobiera kolejny krok na podstawie obecnego układu, a rozwiązanie sprawdza tracer promieni. Kredyty i postęp są przechowywane lokalnie. |
| Narzędzia | Blender 5.3.0 w `C:\Tools\blender-5.3.0-windows-x64\blender.exe`, sprawdzony bez okna. Playwright 1.65.0 ma projektową instalację Chromium w ignorowanym katalogu `test-results/playwright-browsers`. |

## Praca fazowa

- Faza 0 zakończona: przegląd stanu, tryb `?debug=1`, narzędzia do zrzutów oraz [pomiary i audyt](QA_LOG.md).
- Faza 1 zamknięta. Właściciel wybrał wszystkie cztery [kierunki artystyczne](concepts/README.md). Obecne modele są punktem odniesienia.
- Faza 2 zakończona po zatwierdzeniu próbek. Gra wczytuje 22 nowe GLB optyki i ich portrety. Biblioteka obejmuje także cztery odmiany platformy i 30 modułów otoczenia. [Inwentarz, wymiary i rendery](ASSETS.md).
- Faza 3 obejmuje osiem wdrożonych światów, po 25 plansz w oryginalnej kampanii i po jednej demonstracji na świat. [Przydział i widoki](WORLDS.md).
- Faza 4 potwierdziła 200/200 rozwiązań i oznaczeń ukończenia po ponownym wejściu w Chromium. Dodano pełną regresję i poprawiono układ pionowy tabletu. Dalsze ograniczenia dotyczą czytelności podobnych przyrządów na małym ekranie i porównania wydajności na innych GPU.
- Faza 5 obejmuje 200 polskich zestawów. Drugie odsłonięcie prowadzi do techniki, trzecie podaje pole i obrót oraz wskazuje spodziewany efekt. W razie zmiany drogi wiązki kolejne wskazówki korzystają z aktualnego układu. Pierwotne próbki i eksport do `data/hints.pl.json` pozostają lokalne.
- Faza 6 obejmuje pełną regresję po zmianie interfejsu, pomiary oraz arkusz z ośmiu publicznych demonstracji. Stan pomiarów i ograniczenia są w [QA_LOG.md](QA_LOG.md).
- Po fazie 6 dodano przybliżanie dwoma palcami. Dotknięcie zatwierdza wybrane pole dopiero po podniesieniu palca, więc początek gestu daje czas na zmianę przybliżenia przed postawieniem optyki.
- Menu główne spina start, powrót do częściowego układu i przejście do mapy po finale. Kolejne ulepszenia sterowania są opisane w audycie w [QA_LOG.md](QA_LOG.md).
- Plansza ma sterowanie klawiaturą, kursor pola i lokalizowaną informację o zawartości. Reset jest odwracalny w historii ruchów bieżącej sesji.
- Widok z góry kadruje siatkę między widocznymi kontrolkami. Kliknięcie wybiera pole. Powrót do perspektywy przywraca wcześniejszy kąt i zoom.
- Pełny zasobnik ma strzałki przewijania. Poziomy gest na ekranie dotykowym przewija też od miniatury przyrządu, a rozpoczęcie gestu w górę podnosi przyrząd.
- W widoku z góry mały symbol przy modelu oznacza typ przyrządu. Symbole są dopasowane do kadru i można je wyłączyć w ustawieniach.
- Granice 15 × 15 pól w widoku z góry zachowują czytelność w małych oknach dzięki siatce o szerokości dopasowanej do rozdzielczości renderera.
- Zweryfikowany trzeci etap podpowiedzi można przypiąć do planszy. Znacznik i instrukcja przechodzą do następnego ruchu w miarę gry i cofania.
- Karty kampanii na mapie pokazują zapisany postęp. Wybranie planszy ładuje kampanię, a ponowne wskazanie bieżącej zagadki zachowuje historię ruchów.
- Menu tytułowe pokazuje nazwę docelowej planszy. Po rozwiązaniu proponuje kolejną dostępną zagadkę lub mapę kampanii.
- Klawiaturą można przeglądać zakładki kampanii oraz dostępne plansze przy użyciu strzałek. Enter otwiera wybraną planszę.
- Ekran ukończenia pokazuje wynik bieżącej planszy i dokąd prowadzi główna akcja.
- Ekran ukończenia można zamknąć także dotykiem. Rozwiązana plansza pozwala ponownie przywołać wynik z dolnej belki.

## Punkty odniesienia

- [Format poziomu](LEVEL_FORMAT.md), [kompatybilność](CLASSIC_COMPATIBILITY.md), [inwentaryzacja geometrii](../tools/primitive-inventory.md).
- [Zasady stylu](DESIGN_BIBLE.md), [decyzje](DECISIONS.md), [wyniki testów i audyt](QA_LOG.md).
- Lokalny graf Graphify obejmuje przypisanie w `src/campaign-worlds.js`, pamięć modeli w `src/campaign-art.js`, aktualizację zasobnika w `src/main.js` i przepływ wskazówek przez `src/hint-assistant.js`.
