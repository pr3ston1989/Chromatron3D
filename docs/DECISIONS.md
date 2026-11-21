# Decyzje

## 18 listopada 2026 · Faza 0

- Gałąź `visual-overhaul` od commitu `5dd8864` stanowi punkt odniesienia. Gałąź obejmuje zmiany po kolejnych krokach.
- Tryb `?debug=1` używa prywatnego magazynu w pamięci karty. Wybór dowolnej planszy i zagrania z automatu korzystają z tej samej walidacji pola, stanu i historii co gra.
- Powtarzalny pomiar używa stałego ziarna otoczenia w trybie debug, wyboru biomu i profilu grafiki. Zrzuty mają osobny krok zamrożenia animacji. FPS mierzymy przy działających animacjach.
- Produkcyjna telemetria nie jest potrzebna do porównania. Dane pomiarowe i zrzuty zostają lokalnie w ignorowanym katalogu `screenshots`, ponieważ narzędzie może też otworzyć prywatne kampanie.
- Bazowy zestaw obejmuje cztery plansze pokazowe z czterema różnymi biomami. Weryfikacja 200 układów i pomiar pamięci między nimi należą do fazy 4.

## 18 listopada 2026 · Faza 1

- Obserwatorium pryzmatyczne jest rekomendacją do pilotażu. Ceramika, granat i miedź tworzą czytelne warstwy, a pierścień kalibracyjny wyraża temat optyki dużą sylwetką. Wybór lub połączenie wariantów należy do właściciela.
- Ilustracje używają wspólnego kąta 3/4, cyjanowej wiązki i pustej siatki, aby można było ocenić różnice w materiałach, świetle i głębi. Modele do gry będą podlegać ocenie z rzeczywistą geometrią siatki i całą paletą mechaniczną RGB.
- Właściciel wybrał wszystkie cztery kierunki dla zróżnicowania plansz. Projekt zachowuje wspólne proporcje i język form dla optyki. Światy rozróżnia przez materiały i konstrukcję pod platformą, dominanty otoczenia oraz ruch i światło.

## 18 listopada 2026 · Faza 2, bramka próbek

- Rozdzielacz otrzymał rozwidlone ramiona wokół optycznego bisektora. W podglądzie obok niego jest obecne lustro, żeby sprawdzić odróżnialność sylwetki bez identyfikatora i przy tej samej skali.
- Główny GLB planszy używa ceramiki Obserwatorium. Cztery podglądy wykończeń korzystają ze wspólnych proporcji. Dalsze różnice w geometrii otoczenia i podstaw są tematem pilotażu światów.
- Próbki używają niewymagających dodatkowego dekodera GLB. Graphify wskazał `createOpticModelLoader()` i `cloneOptic()` jako miejsca integracji przyrządów. Weryfikacja korzysta z tej samej klasy `GLTFLoader` co przeglądarka.

## 18 listopada 2026 · Faza 2 po akceptacji i faza 3 A

- Właściciel zatwierdził trzy próbki. Geometrię przyrządów uporządkowano w rodziny ze wspólną podstawą. Symbol funkcji pozostaje w sylwetce głowicy. Zachowane są osie portów, nazwa `glow` i portrety zasobnika.
- Optyka pozostaje pod ścieżkami produkcyjnymi `public/models/optics`. Rodziny architektury i rekwizytów mają osobne GLB w `assets/models/scenery`. Moduły zastępują zespoły starszych brył podczas kompozycji kolejnych światów.
- Do pilota wybrano demonstracyjną planszę 8 z rozdzielaczem. To bezpieczny punkt porównania, który można sfotografować z normalnym interfejsem. W tle modelowany łuk i soczewka tworzą dwie główne formy, a cicha animacja zależy od trybu ograniczonego ruchu.
- Docelowy podział 8 × 25 to założenie scenografii opisane w [WORLDS.md](WORLDS.md). Dotychczasowa kolejność plansz w kampanii jest punktem odniesienia.

## 18 listopada 2026 · korekta pilota po referencji

- Właściciel wskazał koncepcję Stoczni orbitalnej jako wzorzec dla pilota. Na tej samej planszy demo ustawiono niższą kamerę, otwartą kratownicę, chłodne światło i obręb planetarny. Obserwatorium pozostaje osobnym światem w planie kampanii.
- Na ilustracji wiązka jest cyjanowa, a na planszy demonstracyjnej steruje się niebieskim emiterem. Kolor efektów wynika z maski emitera. Zrzuty sceny wykonano po rozwiązaniu istniejącej zagadki w Chromium.

## 18 listopada 2026 · faza 3 B i regresja

- Właściciel polecił kontynuować po poprawionej Stoczni. Wszystkie osiem światów ma osobną kompozycję, zestaw oświetlenia i motyw dźwiękowy wyprowadzony ze wspólnego tematu. Atlas i ekran wejścia korzystają z tego samego przypisania.
- Przy powrocie scena używa tych samych siatek GLB i pamięci instancji. Ładowanie scenerii działa niezależnie od planszy logicznej, więc grę można rozpocząć w trakcie pobierania modeli. Kolejność i mechanika zagadek nie zależą od stanu renderera.
- Rozwiązania prywatnych plansz oraz przykładowe podpowiedzi z dokładnym położeniem zapisujemy tylko lokalnie. Do pomiarów, publikowalnych zrzutów i arkuszy używamy plansz demonstracyjnych.
- Powtórne obejście zapisuje oznaczenia ukończenia. Ukończona plansza może otworzyć się od układu początkowego, więc test sprawdza status ukończenia niezależnie od położenia przyrządów.

## 18 listopada 2026 · interfejs gry i podpowiedzi

- Interfejs korzysta z palety świata przypisanego do planszy. Akcent złoty oznacza akcję podpowiedzi oraz bieżącą planszę na mapie. Po prawej gracz widzi gniazda przyrządów z portretami renderowanymi z właściwych GLB, a na telefonie ma przewijaną półkę przy dolnej krawędzi.
- Obserwacja wprowadza w zagadkę. Technika opisana po polsku zostawia graczowi wybór pola. Opis trzeciej wskazówki łączy ruch odczytany ze zweryfikowanego prywatnego rozwiązania z oczekiwanym efektem wiązki.
- Tekst redakcyjny jest powiązany z odciskiem układu i planu. Na zmodyfikowanej trasie gra dobiera działanie na podstawie bieżących wiązek. Zestaw lokalny zawiera dokładne ruchy, a plik w repozytorium zawiera wskazówki opisowe.

## 20 listopada 2026 · precyzja na ekranie dotykowym

- Drugi palec przełącza gest na zmianę przybliżenia. Krótkie dotknięcie zajmuje pole po podniesieniu palca. Anulowanie przeciągania pozostawia przyrząd w jego położeniu początkowym. Oba rodzaje przybliżania korzystają z limitów kamery i respektują ograniczony ruch.

## 20 listopada 2026 · przebudowa układu gry

- Po uwadze o podobieństwie do aplikacji przeniesiono cel i postęp nad scenę, a sterowanie do jednej dolnej belki. Jej szerokość reaguje na liczbę przyrządów. Obrót, zwrot do zasobnika i opis pojawiają się nad belką dla wybranego przyrządu.
- Atlas pokazuje podgląd świata z publicznej demonstracji. Samouczek ma osiem kart z ujęciami, a kampania klasyczna pokazuje dwie siatki po 25 poziomów. Podgląd zmienia się po wskazaniu dostępnej karty lub przejściu do niej klawiaturą.
- Na szerokich widokach przesunięto kadr planszy w górę. W niskim poziomym oknie przesunięcie jest większe, żeby ostatni rząd pól pozostał nad belką.

## 20 listopada 2026 · ekran tytułowy i obsługa rozgrywki

- Ścieżka domyślna zaczyna się w menu. Gracz wraca do bieżącej planszy z tego samego zapisu, z którego korzysta rozgrywka. Bezpośredni link `?play=1` wznawia planszę od razu.
- Górne okno przejmuje klawiaturę oraz blokuje kontrolki znajdujące się pod nim. Zamknięcie przywraca fokus do przycisku otwierającego. Po ukończeniu ostatniej planszy główna akcja otwiera mapę kampanii.
- „Przenieś” uzbraja przeniesienie dla pojedynczego wybranego przyrządu. Pole docelowe zatwierdza się po zwolnieniu wskaźnika. Zajęte pole pokazuje komunikat i pozostawia akcję aktywną. Udany ruch trafia do historii cofania.

## 21 listopada 2026 · klawiatura i cofanie resetu

- Kursor klawiatury wskazuje jedno pole, a strzałki wynikają z aktualnego kierunku kamery. Enter korzysta z tych samych warunków ustawiania co wskaźnik. Spacja włącza wspólną akcję przeniesienia wybranego przyrządu. Komunikat podaje współrzędne zgodne z podpowiedziami i nazwę zawartości.
- Reset dodaje migawkę układu do historii przy rzeczywistej zmianie. Cofnięcie odtwarza położenia, kąty i zawartość zasobnika. Nowy stan natychmiast aktualizuje zapis planszy. Historia pozostaje dostępna w bieżącej sesji na planszy.

## 21 listopada 2026 · precyzyjny widok z góry

- Widok prostopadły dopasowuje rozmiar i położenie siatki do wolnej przestrzeni między sterowaniem. W poziomym oknie panel wybranego przyrządu znajduje się z boku. Otwarcie panelu podczas chwytania przyrządu aktualizuje kadr po zakończeniu gestu.
- W widoku prostopadłym wskaźnik wybiera pole siatki, a przy powrocie do perspektywy obowiązuje trafienie w widoczną powierzchnię modelu. Przełączenie przywraca zachowane ustawienie kamery perspektywicznej. Każde wejście do widoku z góry na nowo dopasowuje całą planszę.

## 21 listopada 2026 · przewijanie zasobnika

- Na ekranie dotykowym zasobnik pozostawia poziomy gest przeglądarce. Wyraźny ruch w górę rozpoczyna podnoszenie przyrządu. Dotknięcie kafelka nadal wybiera przyrząd do ustawienia na planszy.
- Strzałki pojawiają się po przekroczeniu szerokości zasobnika. Przy przewijaniu większej liczby kart zachowują część bieżącego widoku, a na końcu pozostają widoczne z informacją o niedostępności danego kierunku.

## 21 listopada 2026 · symbole optyki w widoku z góry

- Symbole pojawiają się po ustawieniu kamery prostopadle do planszy. Osobna warstwa interfejsu zostawia trafianie w pola płótnu gry. Położenie i wielkość symboli wynikają z rzutu aktualnej siatki, niezależnie od rozdzielczości renderera.
- Symbole rozróżniają rodzaj przyrządu. Obwódka nadaje dodatkową informację o kolorze lasera, filtra lub rezonatora. Ustawienie wyświetlania jest zapisywane lokalnie.

## 21 listopada 2026 · czytelność siatki w widoku z góry

- Cienkie rowki w modelu platformy znikają miejscami po pomniejszeniu. W rzucie z góry granice pól dopełnia jedna płaszczyzna z materiałem, który wylicza szerokość i wygładzenie linii w pikselach renderera. W widoku ukośnym rowki nadal wynikają z geometrii pokładu.
- Siatka jest wyrównana do 15 × 15 pól. Głębokość sceny pozwala wiązkom i przyrządom zasłonić linie tam, gdzie się przecinają. Na jasnych platformach linie otrzymują ciemny odcień świata, a zapasowy zestaw ciemnych kafelków korzysta z jasnej siatki.

## 21 listopada 2026 · prowadzenie przez następny ruch

- Akcja „Pokaż na planszy” pojawia się po odblokowaniu zweryfikowanego trzeciego etapu. Po jej wybraniu fioletowy znacznik wskazuje pole, a przy sterowaniu pozostaje krótka instrukcja. Wcześniejsze etapy zachowują dotychczasowy zakres wskazówek.
- Instrukcja uwzględnia ruchy, obrót i historię. Obrót podaje docelowy kąt, liczbę kroków i krótszy kierunek. Wyłączenie prowadzenia, zmiana planszy lub jej rozwiązanie usuwa instrukcję z planszy. Koszt rozlicza się podczas odblokowania etapu.
