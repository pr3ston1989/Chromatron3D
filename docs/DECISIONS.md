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
