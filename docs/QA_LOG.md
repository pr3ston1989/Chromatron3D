# QA

## 18 listopada 2026 · Faza 0

- Blender 5.3.0 uruchomił `bpy` w trybie headless.
- Playwright zainstalował lokalny Chromium 158.0.8127.18 i zgodny Headless Shell.

### Stan wyjściowy

Próba obejmuje plansze demo 1, 3, 6 i 8. Każdej przypisano inny obecny
biom. Tryb Płynność, DPR 1, Chromium headless. Próby trwają co najmniej
4 sekundy i liczą odstępy `requestAnimationFrame`. Dane sceny obejmują cały
render z przebiegami postprocessingu. Liczba tekstur oznacza obiekty Three.js.

| Plansza i biom | SwiftShader 1080p | Radeon 1080p | SwiftShader 390 × 844 | Radeon 390 × 844 |
| --- | ---: | ---: | ---: | ---: |
| 1 · Orbitalny | 0,72 | 3,72 (pierwsze uruchomienie) | 3,06 | 58,76 |
| 3 · Roślinny | 0,12 | 49,80 | 0,60 | 59,26 |
| 6 · Polarny | 0,50 | 56,77 | 2,48 | 60,00 |
| 8 · Mgławica | 0,65 | 54,78 | 2,49 | 60,01 |

Wartości są w FPS. SwiftShader używa procesora, co odtwarza wynik bliski 1 FPS
przy 1080p. Radeon korzystał z ANGLE i Direct3D11. Ponowna, 12-sekundowa
próba orbitalna po 12 sekundach rozgrzewki dała 51,93 FPS. Zimny pomiar
sprzętowy miał duży postój przy starcie. W zbiorczej próbie Radeon przy
1080p wykonał 316–496 wywołań rysowania i 156–238 tys. trójkątów na klatkę,
z 27–32 obiektami tekstur. W trybie SwiftShader najwolniejsze próbki mają
pojedyncze klatki, przydatne do wykrycia takiego spowolnienia.

- Pierwsza próba sprzętowa zgłosiła 404 dla `favicon.ico`. Dodano odnośnik
  do istniejącego obrazu pryzmatu. Na Radeon pojawiło się ostrzeżenie
  kompilatora FXAA, a przy zrzutach SwiftShader ostrzeżenia o `ReadPixels`.
- Powtórka orbitalna po poprawce ikony, 12 sekund rozgrzewki i 12 sekund
  pomiaru, dała 60,01 FPS. Mediana i 95. percentyl czasu klatki wyniosły
  17 ms, bez błędów konsoli. Ostrzeżenie kompilatora FXAA nadal występuje.
- Pliki `capture.json`, osiem ujęć w każdej próbie i arkusz leżą w
  `screenshots/2026-11-18/`. Badane plansze są pokazowe.
- `npm run check` po poprawce ikony: 221 testów i poprawny build. Vite zgłasza
  ostrzeżenie o rozmiarze głównego modułu. W Chromium przeszły 3 testy E2E:
  cztery lokalne kampanie, izolacja trybu debug i widoki 1366 × 768, 1280 × 720,
  1093 × 614.

### Audyt wizualny

Ocena redakcyjna na skali 1–5. Czytelność obejmuje zdolność odczytania siatki,
wiązki i przyrządów na obu rozdzielczościach. Atrakcyjność obejmuje kompozycję,
materiały i głębię.

| Biom | Czytelność | Atrakcyjność | Obserwacja |
| --- | ---: | ---: | --- |
| Orbitalny | 3 | 2 | Niebieska wiązka jest jasna, ale szary dziedziniec i żółte drzewa rywalizują z przyrządami. Powtarzane maszty nie budują kadru. |
| Roślinny | 3 | 2 | Czerwień działa na zielonym tle. Jasne liście oraz wielobarwne kafle stają się drugą warstwą sygnałów. |
| Polarny | 2 | 2 | Zimne otoczenie i niebieska platforma mają zbliżone walory. W pionie narożniki wystają poza widok, a górny panel nachodzi na planszę. |
| Mgławica | 3 | 2 | Najciemniejsze pola tracą kontakt z krawędzią. Nagłe brzegi gruntu i podobne sylwetki otoczenia osłabiają głębię. |

Losowe warianty patyny i jasne wstawki na kaflach są ozdobne. Ich kontrast
sugeruje graczowi dodatkowe reguły. Brzegi planszy i wiązka już wspierają
temat optyki. Najmocniej odciąga uwagę rozproszona scenografia, którą
warto zastąpić dwoma dużymi akcentami poza polem gry. Obecny profil
Płynność ogranicza odbicia i postprocessing. W fazie 3 ocenimy materiały
i głębię przy tym samym budżecie, a w fazie 4 zmierzymy osobno pierwszy
start, wielokrotną zmianę plansz i najwyższy profil.

### Plan wynikający z audytu

1. Ustalić podporządkowanie tła planszy i wiązce na czterech kierunkach
   wizualnych.
2. Po wyborze zbudować prostą hierarchię materiałów i ograniczyć
   dekorację do większych, rzadszych sylwetek.
3. Porównać biomy ze stanem wyjściowym na obu ekranach przed powieleniem
   rozwiązania. Wydajność mierzyć na ciepłym i zimnym stanie.

## 18 listopada 2026 · Faza 1

Obejrzano cztery ilustracje 1672 × 941 w pełnym rozmiarze i na wspólnym
arkuszu porównawczym. Oceny 1–5 dotyczą ilustracji w ujęciu 3/4.
Właściwe wymiary i kadrowanie z interfejsem będą oceniane na pilotażu w grze.

| Kierunek | Czytelność | Atrakcyjność | Do sprawdzenia w grze |
| --- | ---: | ---: | --- |
| Obserwatorium pryzmatyczne | 4 | 4 | Ograniczyć świecące kreski poza siatką. Odróżnić wszystkie przyrządy po sylwetce przy zmniejszeniu. |
| Kryształowa grota | 4 | 3 | Ostudzić dominujący fiolet i rozdzielić korpusy optyki od podłoża. Sprawdzić magentę wiązki i wskaźników. |
| Ogród heliostatów | 3 | 4 | Przyciemnić horyzont i skrajne łuki. Sprawdzić żółty promień na wapieniu. |
| Stocznia orbitalna | 4 | 4 | Sprawdzić czytelność niebieskiej wiązki na chłodnym pokładzie. Uspokoić bursztynowe światła na dużym wsporniku. |

Na ilustracjach wiązka jest czytelna i siatka odsłonięta. Liczba kafli,
ułożenie przyrządów i przebieg promienia są poglądowe. Następny krok
to wybór właściciela.

## 18 listopada 2026 · Faza 2, bramka próbek

Blender 5.3.0 wyeksportował trzy próbki. Każda ma geometryczne wykończenie,
przynajmniej trzy wartości jasności, materiał emisyjny i podstawę na Y=0
po konwersji do glTF. Po imporcie zweryfikowano rendery detali oraz wspólną
scenę z parametrami kamery gry. Oceny dotyczą próbek w scenie kontrolnej.

| Próbka | Trójkąty / limit | Ocena | Obserwacja |
| --- | ---: | ---: | --- |
| Platforma | 1498 / 1500 | 4/5 | 225 równych pól, grubość 17,9% boku. Poprawka dodała widoczny pierścień lewitacji od spodu. W ujęciu kamery gry widać głównie wierzch. |
| Rozdzielacz | 532 / 600 | 4/5 | Poszerzenie ramion otworzyło prześwit. Sylwetka odróżnia się od lustra w kadrze desktop; przy 390 px różnica jest subtelna. |
| Pojazd serwisowy | 576 / 600 | 4/5 | Widełki i para napędów są widoczne nawet w mniejszym ujęciu. Lampy zlewają się ze skrzydłem od przodu; najlepiej czytelna jest sylwetka. |

Przy 390 × 844 kadr przycina boczne narożniki pokładu. Ocena czytelności
całego kadru mobilnego wynosi 3/5. Faza 3 powinna sprawdzić dopasowanie
siatki z rzeczywistym HUD-em i torami o innych kolorach. Wykończenia czterech
światów obejrzano na tej samej geometrii.

`npm run check`: 222 testy i build. Test kontraktu GLB weryfikuje
budżety, materiały, liczbę kafli oraz wczytanie do Three.js. Chromium:
2/2, w tym tryb debug oraz układy 1366 × 768, 1280 × 720 i 1093 × 614.

## 18 listopada 2026 · Faza 2 po akceptacji

Przejrzano rendery 22 przyrządów i 28 modułów scenografii. W porównaniu
przyrządów poprawiono otwarcie przewodu, odstęp podwójnego reflektora,
profil bramki barw podstawowych i płaską koronę gwiazdy. Testy potwierdzają
czyste nazwy materiału `glow`, ustawienie podstawy na Y=0 i budżety
180/600 trójkątów. Doppler ma 392 trójkąty, a wcześniej miał 3620.

Rendery porównawcze dają 4/5 za wspólny styl i zróżnicowanie typów.
W zbiorczym widoku 390 px podobne elementy z trzech rodzin (bramki,
portale i moduły radialne) bywają trudne do rozpoznania samą sylwetką.
Ocena typów w pełnej gęstości na telefonie wynosi 3/5. W grze dostępne są
także podpisy i panel wybranego przyrządu. Poprawiono połączenie żebra
dokującego i uzupełniono oś wirnika w scenografii.

[Arkusz optyki](../assets/previews/overhaul/catalog-optics.png) ·
[Kamera gry 1920 × 1080](../assets/previews/overhaul/catalog-camera-1920x1080.png) ·
[Kamera gry 390 × 844](../assets/previews/overhaul/catalog-camera-390x844.png) ·
[Arkusz scenografii](../assets/previews/overhaul/catalog-scenery.png).

## 18 listopada 2026 · Faza 3 A

Porównanie demonstracyjnej planszy 8 w Chromium na Radeon, tryb Płynność,
DPR 1. Przed zmianą wykorzystano próbę fazy 0 z biomem mgławicy. Po zmianie
pomiar wykonano przez 6 sekund po 12 sekundach rozgrzewki.

| Rozdzielczość | FPS przed → po | 95. percentyl klatki przed → po | Wywołania rysowania przed → po | Trójkąty przed → po |
| --- | ---: | ---: | ---: | ---: |
| 1920 × 1080 | 54,78 → 60,01 | 33 → 17 ms | 335 → 92 | 156 385 → 7497 |
| 390 × 844 | 60,01 → 60,00 | 17 → 17 ms | 287 → 92 | 147 453 → 7497 |

W tej próbie zero błędów konsoli. Na desktopie wystąpiło wcześniejsze
ostrzeżenie kompilatora FXAA dla Direct3D11.

| Ocena redakcyjna | Przed | Po |
| --- | ---: | ---: |
| Czytelność układu | 3 | 4 |
| Kontrast i hierarchia | 2 | 4 |
| Spójność palety | 2 | 4 |
| Głębia i atrakcyjność | 2 | 4 (desktop), 3 (telefon) |
| Odrębność od poprzednich biomów | 3 | 4 |
| Widoczne artefakty | 3 | 4 |

W pierwszym ujęciu pokład był prześwietlony i oba obiekty stały po jednej
stronie kadru. W kolejnych dwóch iteracjach zmieniono azymuty, przygaszono
ceramikę, podparto konstrukcje i poszerzono rowki. Kamera telefonu objęła
wszystkie cztery skrajne pola między panelami. Górny panel nadal zasłania
fragment łuku z tła, a pojazd jest częściowo ucięty po prawej. Zakres
mobilnej próby optycznej obejmuje niebieską wiązkę i jeden rozdzielacz.

Przeszło 223 testów i build oraz siedem przypadków Chromium w dwóch
uruchomieniach. Sprawdzono m.in. wybór fizycznego przyrządu z planszy,
rozwiązanie i cofnięcie ruchu, powrót do pilota, import lokalnej kampanii,
pochłaniacze, atlas oraz trzy małe widoki laptopowe. W nowym teście pierwsza
wersja błędnie oczekiwała wartości zwrotnej z `undo()`. Po korekcie test
sprawdza stan gry po cofnięciu i przechodzi.

[Desktop przed](../assets/previews/overhaul/observatory/before-desktop.png) ·
[Desktop po](../assets/previews/overhaul/observatory/after-desktop.png) ·
[Telefon przed](../assets/previews/overhaul/observatory/before-mobile.png) ·
[Telefon po](../assets/previews/overhaul/observatory/after-mobile.png).

## 18 listopada 2026 · korekta pilota Stoczni orbitalnej

Referencją właściciela jest [wizualizacja Stoczni](concepts/04-stocznia-orbitalna.png).
Próbę przeprowadzono na pokazowej planszy 8. Chromium rozwiązał ją z
istniejącymi ruchami, osiągnął stan 2/2, a okno zwycięstwa zamknięto
klawiszem Escape przed zrzutem.

Obniżono kąt kamery, dodano odsłoniętą kratownicę pod tytanowym pokładem,
duże ukośne żebro, dalszy dok z pylonem oraz łuk planety rysowany w shaderze.
W kolejnych dwóch przeglądach uspokojono jasność planety, usunięto
ziarno postprocessingu dla tej sceny i dopracowano geometrię doku.
Wiązka ma świetlny rdzeń i niebieską poświatę na pokładzie.

| Rozdzielczość | FPS | 95. percentyl klatki | Wywołania rysowania | Trójkąty |
| --- | ---: | ---: | ---: | ---: |
| 1920 × 1080 | 60,01 | 17 ms | 90 | 6204 |
| 390 × 844 | 59,81 | 17 ms | 90 | 6204 |

Chromium i Radeon, profil Zrównoważona, DPR 1. Pomiar przez 5 sekund po
9 sekundach rozgrzewki. Zero ostrzeżeń i błędów konsoli w tych dwóch
ujęciach. Przeszły 223 testy i build oraz dwa testy Chromium,
w tym test narożników, wyboru rozdzielacza, rozwiązania i cofnięcia ruchu.

Czytelność siatki i zgodność kompozycji z kierunkiem Stoczni oceniono
na 4/5 na desktopie. W pionie siatka i optyka pozostają dostępne, ale
panel zagadki przykrywa większość dalekiego doku. To obniża ocenę
kompozycji pionowej do 3/5.

[Zrzut gry 1920 × 1080](../assets/previews/overhaul/shipyard/desktop.png) ·
[Zrzut gry 390 × 844](../assets/previews/overhaul/shipyard/mobile.png).

## 18 listopada 2026 · faza 3 B

Przejrzano 16 zrzutów z gry w 1920 × 1080 i 390 × 844. W drugim przejściu
przygaszono dalszy plan, usunięto ziarno poza rozgrywką, wyrównano
położenie wspólnych podstaw i sprawdzono kamery. Poniższa ocena
dotyczy reprezentatywnych plansz demonstracyjnych, w skali 1–5.

| Świat | Czytelność siatki | Kontrast wiązki | Spójność | Głębia desktop / telefon | Odrębność | Artefakty |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Obserwatorium | 4 | 4 | 4 | 4 / 3 | 4 | 4 |
| Ogród heliostatów | 4 | 4 | 4 | 4 / 3 | 4 | 4 |
| Kryształowa grota | 4 | 4 | 4 | 4 / 4 | 4 | 4 |
| Laboratorium polarne | 4 | 4 | 4 | 4 / 3 | 4 | 4 |
| Kuźnia widmowa | 4 | 4 | 4 | 4 / 3 | 4 | 4 |
| Optyka głębinowa | 4 | 4 | 4 | 4 / 3 | 4 | 4 |
| Sanktuarium soczewek | 4 | 4 | 4 | 4 / 4 | 4 | 4 |
| Stocznia orbitalna | 4 | 4 | 4 | 4 / 3 | 4 | 4 |

Na telefonie widoczność instrumentów jest ważniejsza od wysokości głównej
dekoracji. W kilku światach górny panel zasłania fragment tła.
[Arkusz desktopowy](../assets/previews/overhaul/worlds/desktop.png) ·
[Arkusz mobilny](../assets/previews/overhaul/worlds/mobile.png).

## 18 listopada 2026 · faza 4

- Załadowano 200 plansz z czterech lokalnych, prywatnych kampanii. Każde
  rozwiązanie sprawdził silnik optyczny. Chromium wykonał ruchy na każdej
  planszy, uzyskał wynik rozgrywki i zapisał ukończenie 200/200.
- Drugie przejście znalazło 200/200 oznaczeń ukończenia. W 104 planszach
  powstało drugie zweryfikowane rozwiązanie przez zmianę jednego położenia
  lub kąta. To ograniczona próba sąsiedztwa, więc liczba jednoznacznych
  zagadek pozostaje nieustalona.
- Podczas drugiego przejścia użyta sterta JavaScript po czyszczeniu
  wyniosła 28,5–30,4 MB, z 39 obiektami tekstur i 995–999 geometriami
  Three.js. Próbki są co 25 plansz. Nie zaobserwowano stałego wzrostu
  rejestru geometrii i tekstur. Liczniki obiektów nie są pomiarem VRAM.
- Czas od otwarcia Chromium do gotowości API wyniósł 7,8 s w przebiegu
  z lokalnymi kampaniami i równolegle wykonywanymi testami. W przebiegu
  200 plansz wystąpiło zero błędów konsoli i jedno ostrzeżenie FXAA.
- Przeszło 225 testów node i build. 30 testów Chromium obejmuje m.in.
  układ planszy, kliknięcia, ruchy, skróty, ustawienia jakości, język,
  atlas, widmo i cofanie. Dodatkowy test Web Audio sprawdza włączenie
  motywu kliknięciem, wytwarzanie nut i zatrzymanie po wyciszeniu.
- Odtworzono zasłonięcie planszy lewym panelem przy 768 × 1024. Panele
  tabletu w pionie przeniesiono nad i pod planszę. Test regresji
  potwierdza dostęp do narożników w 768 × 1024, 390 × 844 i 844 × 390
  oraz małe widoki laptopowe 1366 × 768, 1280 × 720 i 1093 × 614.
- Oddzielny pomiar sprzętowy na Radeon w profilu Zrównoważona dał
  59,99–60,02 FPS dla wszystkich ośmiu demonstracji w 1920 × 1080
  i 390 × 844. Stocznia w Płynności miała około 60 FPS w sześciu
  dodatkowych rozdzielczościach, łącznie z 2560 × 1440 i 768 × 1024.
  Równoległy przebieg testów z renderowaniem programowym chwilowo obniżał
  wyniki pomiaru sprzętowego. Dane są pomiarem tego komputera.
- Programowy SwiftShader na tej samej Stoczni w Płynności osiągnął
  4,91 FPS w 1093 × 614 i 7,50 FPS w 390 × 844. Wymuszone renderowanie
  na CPU pozostaje wąskim gardłem. Brak pomiaru na osobnym słabszym GPU.

Powtórzenie z prywatnymi danymi korzysta z `node tools/full-regression.mjs`.
Wyniki i rozwiązania w formacie używanym do pisania podpowiedzi są przechowywane lokalnie.

## 18 listopada 2026 · bramka fazy 5

Przygotowano dziesięć polskich zestawów do oceny, po trzy odsłony.
Próbki obejmują lustro, zakrzywiacz, spięte tory splątywacza, rozdzielanie
wiązki, filtrowanie i zmianę barwy, komplementor, pryzmat oraz bramki.
Każdy dokładny ruch należy do rozwiązania zweryfikowanego w silniku.
Arkusz z dokładnymi ruchami pozostaje w lokalnym
`test-results/full-regression/hint-review.md`. Bramka wymaga decyzji
o tonie i szczegółowości przed pisaniem pozostałych zestawów.

## 18 listopada 2026 · fazy 5 i 6 oraz interfejs gry

- Zweryfikowano po trzy polskie wskazówki na każdej z 200 plansz. Test porównuje dokładne pole i obrót z rozwiązaniem, a następnie przechodzi zagadkę kolejnymi wskazówkami. Sprawdza też, czy wskazówka otwarcia ustępuje następnej po wykonaniu ruchu i czy drugi etap nie zdradza współrzędnych.
- Napisano od nowa techniki, które wcześniej sprowadzały się do odczytu koloru. Przy pokrewnych układach szukano różnych punktów zaczepienia. Przykłady obejmują wygaszenie trzech wejść w Chromatronie II, układ dwóch osi ruchomego portalu w Chromatronie IV oraz różnicę między przyrządem blokującym i przyrządem zachowującym kierunek. Jeżeli potwierdzenie efektu wymaga drugiej wiązki lub partnera portalu, wskazówka podaje ten warunek. Automatyczny test sprawdza ruch, a sens tekstu podlegał redakcji z użyciem przebiegu wiązek.
- Wszystkie 200 plansz ukończono i ponownie otwarto w Chromium. 104 plansze mają co najmniej drugi układ zweryfikowany w silniku. Licznik błędów przeglądarki wyniósł zero. Radeon zgłosił ostrzeżenie kompilatora shadera FXAA. Po wypełnieniu pamięci podręcznej liczniki obiektów Three.js utrzymywały 50 tekstur i 969–973 geometrie przy ponownych otwarciach.
- Regresja zapisała `data/hints.pl.json`, `data/solutions.json` i `test-results/final-overhaul/report.json`. `level-results.csv` zawiera pomiar dla 200 plansz. Walidacja silnika na tym komputerze zajęła 0,05–0,63 ms na planszę, a odtworzenie ruchów przez API Chromium 21–416 ms. Obie wartości mierzą czas pracy programu.
- Krótkie próbki na Radeon w trybie Płynność, 1093 × 614, dały średnio 59,1 FPS dla 200 plansz. Zakres 29,9–60,1 FPS obejmuje klatki tuż po zmianie planszy. Dłuższe pomiary w trybie Zrównoważona dla ośmiu publicznych demonstracji dały 60,00–60,01 FPS w 1920 × 1080 i 390 × 844. Jeden pomiar Stoczni w 2560 × 1440 podczas równoległych testów dał 46,31 FPS. Brak dodatkowego sprzętu do porównania.
- Na telefonie przeniesiono przycisk widma do nagłówka półki. Na laptopie zweryfikowano układy 1366 × 768, 1280 × 720, 1093 × 614 i 1024 × 640 oraz zachowanie szuflad trybu skupienia. Wybór wyposażenia klawiaturą zachowuje fokus po odświeżeniu portretu. Przeciągnięcie portretu umieszcza przyrząd na planszy.
- Przeszło 225 testów Node, build Vite i 32 testy Playwright na sprzętowym Chromium. Testy biblioteki klasycznej i trybu debug powtórzono również w SwiftShader. Ostatni opublikowany przebieg CI na `main` (`5dd8864`) był zielony.

Ocena wizualna publicznych demonstracji w arkuszu `test-results/final-overhaul/contact-sheet.png`.

| Świat | Ocena / 5 | Obserwacja |
| --- | ---: | --- |
| Obserwatorium pryzmatyczne | 4 | Łuk i soczewka tworzą czytelną ramę, ceramika dobrze oddziela planszę od tła. |
| Ogród heliostatów | 4 | Ciepły pokład dobrze odcina się od zielonego horyzontu. Tarasy są kanciaste. |
| Kryształowa grota | 4 | Kryształy wyznaczają boki kadru. Widok mobilny pokazuje mniej głębi. |
| Laboratorium polarne | 4 | Chłodne iglice nadają scenie charakter. Jasna niebieska wiązka jest dobrze widoczna. |
| Kuźnia widmowa | 4 | Reaktor i suwnica różnicują sylwetki. Na małym ekranie widać głównie reaktor. |
| Optyka głębinowa | 4 | Zieleń pokładu i morski horyzont tworzą wyraźną odmianę. Sylwetki tarasów przypominają Ogród. |
| Sanktuarium soczewek | 4 | Złote łuki prowadzą wzrok do centrum. Tło używa części motywów Obserwatorium. |
| Stocznia orbitalna | 4 | Otwarta kratownica i planetarny horyzont są najbliżej wzorca użytkownika. Przy dużym przybliżeniu przydałyby się drobniejsze detale połaci. |

Oceny dotyczą reprezentatywnych demonstracji. Ciasne skupiska podobnych przyrządów w większych zagadkach nadal korzystają z opisu przy wskazaniu i widoku z góry. Podpowiedzi polskie mają pełną redakcję, a w angielskiej wersji autorski jest pierwszy etap. Dalsze angielskie wskazówki korzystają z aktualnego układu. Pełna zgodność dowolnych ścieżek światła z oryginalnymi programami pozostaje do sprawdzenia.

## 20 listopada 2026 · gesty dotykowe

- Test w emulacji 390 × 844 potwierdza zmianę przybliżenia przy wybranym lustrze, zwolnienie palców po geście, ustawienie lustra na wybranym polu i przeciągnięcie go na sąsiednie pole. Osobne anulowanie przeciągania zachowuje współrzędne. Próbę wykonano w Chromium na Radeon i w SwiftShader.
- Przeszło 225 testów Node, build Vite i 33 testy Playwright na sprzętowym Chromium. Gesty sprawdzono w emulacji dotyku.

## 20 listopada 2026 · nowy układ gry

- Przegląd w Chromium wykazał zasłonięcie przedniego narożnika przez belkę w 844 × 390. Po zmianie kadrowania test potwierdził dostęp do narożników w 844 × 390, 390 × 844 i 768 × 1024. Test laptopowy sprawdza tę samą własność w 1366 × 768, 1280 × 720, 1093 × 614 i 1024 × 640.
- Przeszły 225 testów Node, build Vite i 33 testy Playwright na Radeon. Test biblioteki potwierdza dwa sektory po 25 plansz w każdej kampanii. Odtworzenie 200 plansz potwierdziło wszystkie rozwiązania i wskazówki. Lokalny raport znajduje się w `test-results/new-interface-campaigns/report.json`.
- Zrzuty publicznych demonstracji w 1366 × 768, 390 × 844 i 844 × 390 są w `test-results/new-interface/`. Osobno zapisano mapę na laptopie i telefonie. Próbki z dwóch demonstracji dały na tym Radeon około 60 FPS w każdej z tych rozdzielczości.

## 20 listopada 2026 · audyt menu i sterowania

| Obszar | Ustalenie | Priorytet dalszej pracy |
| --- | --- | --- |
| Start i powrót | Menu wznawia ostatni układ. Po finale akcja główna otwiera mapę, a menu pozostaje dostępne po zakończeniu. | Zmierzyć na słabszym urządzeniu czas od „Graj” do pierwszej interaktywnej klatki. |
| Klawiatura | Tab obsługuje menu, zasobnik i okna. Skróty obracają przyrząd. Wybór pola planszy nadal wymaga wskaźnika. | Wysoki. Dodać kursor pola, strzałki, zatwierdzanie i komunikat o zawartości pola. |
| Mysz i kliknięcia | Widoczna powierzchnia modelu wygrywa w teście trafienia. Całe pole pomaga wybrać mały model. Celowanie przy nakładających się głowicach nadal zależy od perspektywy. | Średni. Porównać spokojny obrys aktywnego pola i skrót widoku z góry na gęstych planszach. |
| Dotyk | Dwa dotknięcia mogą przenieść przyrząd. Gest dwóch palców przybliża planszę. Najważniejsze czynności w belce mają powiększone obszary dotyku. | Wysoki. Sprawdzić na fizycznym iPhonie i Androidzie, szczególnie poziomy ekran z paskami systemowymi, przeciąganie z zasobnika i reakcję na przerwanie gestu. |
| Historia | Cofanie obejmuje normalny ruch i obrót. Reset przeładowuje planszę i czyści historię. | Średni. Umożliwić odzyskanie poprzedniego układu bezpośrednio po przypadkowym resecie. |

Przeszły 225 testów Node i build Vite. Pełny przebieg Chromium wykrył problem z fokusem po imporcie z instrukcji. Po poprawce przeszły ponowne próby importu, ustawień, wznowienia zapisu, ostatniej planszy, podpowiedzi i ruchu dotykiem. Trzy nowe scenariusze menu przeszły także w SwiftShader. Odtworzono oraz ponownie otwarto 200 lokalnych plansz z zerem błędów przeglądarki. Raport jest w `test-results/menu-campaigns/report.json`.

## 21 listopada 2026 · plansza klawiaturą i cofanie resetu

- W widoku 1093 × 614 test przechodzi klawiaturą z menu do zasobnika, wybiera lustro, ustawia je na planszy, obraca, przenosi i cofa ruch. Sprawdza też zawartość pola i dostęp do czterech narożników w widoku z góry po wybraniu przyrządu.
- W teście zapisu reset usuwa bieżący szkic, cofnięcie przywraca położenie i obrót lustra, a ponowienie zapisuje stan początkowy. Po odświeżeniu gra odtwarza stan zapisany przy ostatniej czynności.
- Przeszły 226 testów Node, build Vite i 37 testów Playwright w Chromium ze sprzętowym WebGL. Scenariusze klawiatury oraz cofania resetu powtórzono również w Chromium z renderowaniem programowym. Zrzut widoku planszy jest w `test-results/keyboard-board.png`.

## 21 listopada 2026 · dostępność pól w widoku z góry

- Pomiar ze Stocznią orbitalną i wybranym rozdzielaczem wykazał, że interfejs przechwytywał kliknięcia na 30 polach w 1093 × 614, 75 w 844 × 390 i 134 w 640 × 360.
- Test zlicza trafienia we wszystkie 225 środków pól oraz sprawdza klikalność i szerokość przycisków przy dziewięciu rozmiarach od 320 × 568 do 1366 × 768, z tabletem 768 × 1024. Sprawdza też wybór dwóch sąsiednich luster, stabilny kadr podczas chwytania i zachowanie wcześniejszego obrotu oraz zoomu po wyjściu z widoku z góry.
- Wszystkie pola były dostępne przy każdym z dziewięciu rozmiarów. W emulacji dotyku udało się przenieść ten sam rozdzielacz do narożników w pionie i w poziomie. Przeszły 226 testów Node, build Vite i 38 scenariuszy Playwright w Chromium.
- Podglądy są w `test-results/precision-390x844.png` oraz `test-results/precision-640x360.png`.

## 21 listopada 2026 · pełny zasobnik i gesty

- W emulacji 390 × 844 poziome przesunięcie od środka portretu wcześniej pozostawiało zasobnik przy zerowym przesunięciu. Po poprawce przewija karty bez podnoszenia przyrządu. Przeciągnięcie w górę podnosi przyrząd, anulowanie zostawia go w zasobniku, a puszczenie na wolnym polu ustawia go na planszy.
- Strzałki przewijania sprawdzono w 1366 × 768, 1280 × 720, 1093 × 614 i 640 × 360. W 390 × 844 test dociera do ostatniej karty i sprawdza krótką etykietę przy zachowaniu pełnej nazwy dostępnej dla czytnika ekranu. Mały zasobnik ukrywa strzałki.
- Przeszło 226 testów Node, build Vite i pełny przebieg 40 scenariuszy Playwright na sprzętowym Chromium. Nowe scenariusze gestów i przewijania przeszły również w SwiftShader. Zrzuty menu oraz demonstracyjnej Stoczni orbitalnej po załadowaniu modeli są w `test-results/current-game/`.

## 21 listopada 2026 · symbole w widoku z góry

- Test stawia obok siebie lustro i rozdzielacz. Sprawdza rozróżnialne kształty, położenie poza środkiem pola, odstęp między symbolami oraz trafienie w pole po kliknięciu przez symbol. Wymiary okien to 1366 × 768, 1280 × 720, 1093 × 614, 390 × 844 i 640 × 360.
- Znacznik wraca razem z rozdzielaczem po cofnięciu zwrotu do zasobnika. Wyłączenie symboli w menu jest zachowane po przeładowaniu. Kamera kończy przejście również po naciśnięciu planszy w trakcie animacji.
- Na demonstracjach Stoczni i Ogrodu symbole są widoczne przy modelach i obok głównej osi wiązki. W 640 × 360 kontrast części linii siatki nadal jest słaby. Zrzuty dla obu światów są w `test-results/current-game/symbols-*.png`.
- Przeszło 226 testów Node, build Vite i 41 scenariuszy Chromium. Nowy scenariusz przeszedł również w SwiftShader.

## 21 listopada 2026 · siatka na małym ekranie

- Na demonstracji Stoczni orbitalnej w 640 × 360 warunek różnicy jasności co najmniej 12/255 spełniało wcześniej 8 z 14 pionowych linii wewnętrznych. Po poprawce test wykrywa 14 linii pionowych i 14 poziomych. Każda linia jest mierzona w pięciu miejscach, z których do porównania trafia mediana.
- Test przełącza w Stoczni profile grafiki i rozmiary 640 × 360, 1093 × 614, 390 × 844, 1280 × 720 i 1366 × 768. Na zrzutach bieżącej gry sprawdzono także Ogród heliostatów. Porównanie znajduje się w `test-results/current-game/grid-before-640x360.png` i `test-results/current-game/grid-demo-8-640x360.png`.
- Przeszło 226 testów Node, build Vite i 42 scenariusze Chromium. Test kontrastu przeszedł także w SwiftShader.

## 21 listopada 2026 · zweryfikowana podpowiedź na planszy

- Scenariusz demonstracji „Podwójny zakręt” odblokowuje trzy stopnie pomocy za łącznie pięć kredytów. Sprawdza przejście od przeniesienia pierwszego lustra do jego obrotu, wskazanie drugiego pola, cofnięcie, ponowne otwarcie prowadzenia, zmianę języka i schowanie instrukcji po wygranej. W czasie prowadzenia każde pole pozostaje klikalne w rozmiarach 390 × 844, 640 × 360, 1093 × 614, 1280 × 720 i 1366 × 768.
- Testy lokalnych czterech kampanii odtwarzają instrukcje od początku do rozwiązania każdej z 200 plansz. Sprawdzają zgodność zaznaczonego pola i kąta oraz zachowanie tekstów autorskich w oknie podpowiedzi.
- Scenariusz modeli orbitalnych wskazuje teraz konkretny biom. Poprzednia próba losowała szereg pakietów i mogła skończyć bez sceny orbitalnej, mimo dostępności wszystkich modeli.
- Podgląd prowadzenia w działającej demonstracji zapisano w `test-results/current-game/hint-guide-390x844.png`.
- Przeszło 226 testów Node, build Vite i 43 scenariusze Chromium. Prowadzenie i rozliczanie kredytów sprawdzono również w SwiftShader.

## 21 listopada 2026 · przegląd kampanii

- W Chromium przejście po zakładkach czterech lokalnych kampanii zachowuje aktywną planszę do wyboru nowej. Po wejściu do czwartej kampanii i odświeżeniu gra odtwarza wybór. Ponowne wskazanie aktywnej zagadki na mapie zachowuje cofanie i ponawianie.
- Przeszło pięć scenariuszy Chromium, 226 testów Node i build Vite.

## 21 listopada 2026 · wznowienie z menu tytułowego

- Na demonstracji po ukończeniu pierwszej planszy menu proponuje drugą i zachowuje propozycję po odświeżeniu. Ukończenie ostatniej zagadki udostępnia mapę, a jej zamknięcie przywraca fokus głównej akcji. Test częściowego układu zachowuje wcześniejsze ustawienie lustra po odświeżeniu.
- Przeszło pięć scenariuszy menu w Chromium, 226 testów Node i build Vite.
