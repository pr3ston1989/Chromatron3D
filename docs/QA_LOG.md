# QA

## 28 listopada 2026 · Kuźnia Widmowa

- Zrzut wyjściowy pokazał płaskie pokrywy na formach i odległy piec zlewający się w jedną plamę. Przerobiono piec i otwartą linię odlewniczą, a w dalszym planie osadzono śluzę z pomostem i bocznym korytem. Drugi przebieg dodał detal pomostu i przygasił emisję w formach. Dalsze zbocza pozostają oszczędne wizualnie.
- Blender wyeksportował 2132 trójkąty pieca, 1956 linii odlewniczej, 2196 śluzy i 2880 terenu. Test odczytuje geometrię i sprawdza, czy metal jest na odkrytej górze form, a spływ dochodzi do poziomu lawy.
- W grze sprawdzono Kuźnię w 1672 × 941, 1366 × 768, 1280 × 720, 1093 × 614 i emulacji telefonu 390 × 844 oraz po czterech ćwierćobrotach przy obniżonej kamerze. Wszystkie 225 pól było widocznych. Osiem scen przeszło sprawdzenie na monitorze i w emulacji telefonu.
- Test przeglądarkowy sprawdza animację lawy na zrzucie fragmentu śluzy i zatrzymanie jej przy ograniczonym ruchu. Polecenie `npm run check` zakończyło się wynikiem 258/258 i poprawną kompilacją.

## 27 listopada 2026 · ciągły teren, ruch dalszego planu i ekran ładowania

- Sześć nieorbitalnych scen korzysta z ciągłych siatek krajobrazu. Testy wczytują GLB, sprawdzają dwanaście stóp każdej platformy, podpory głównych budowli oraz ciągłość powierzchni przy próbkowaniu wokół planszy. Dwa ramiona łączą terminale Stoczni z ramą platformy.
- W Chrome sprawdzono zrzuty ośmiu demonstracji w 1672 × 941, 1366 × 768, 1280 × 720, 1093 × 614 i 390 × 844. Wszystkie środki pól pozostały widoczne. Obrót widoku sprawdzono także na sześciu osadzonych planszach i w Stoczni. 390 × 844 to emulacja telefonu.
- Porównanie klatek w Grocie, Kuźni i Stoczni wykryło ozdobny ruch w zwykłych ustawieniach. Po włączeniu ograniczonego ruchu porównywane fragmenty pozostały nieruchome.
- Playwright weryfikuje ekran ładowania przy celowo wstrzymanym module JavaScript oraz ponowny start po błędzie sieciowym. Przy poprawnym starcie menu odzyskuje fokus, a pod ekranem ładowania nie da się używać przycisków gry.
- Osobne porównanie `?benchmark=orbital` z poprzednim `main` objęło ujęcie 1672 × 941, ten sam profil grafiki i demonstrację „Trzy barwy”. Obie wersje załadowały te same modele i zachowały położenie kamery. Niewielkie różnice obrazu dotyczyły okolicy poświaty wiązki przy barierze.

## 27 listopada 2026 · nowe modele heliostatu i instrumentu południkowego

- Podglądy Blendera pokazały zbyt jednolite podstawy i mało wyrazisty kontur ruiny. Heliostat dostał kamienną podstawę oddzieloną od mosiężnej ramy, przekładnie i osobne szklane panele. W ruinie poszerzono przerwany pierścień i zachowano fragmenty szklanych filtrów.
- Heliostat ma 3072 trójkąty, tarasowe zbocze 4422, a ruiny 3690. Test zasobów wczytuje trzy pliki GLB, weryfikuje ich materiały i potwierdza użycie modeli w kampanii.
- W przeglądarce opóźniono pobranie nowego heliostatu. Po doczytaniu dwa lustra pozostały w tych samych miejscach i dały się niezależnie przesuwać.

## 27 listopada 2026 · grunt pod platformami i osiem światów kampanii

- Test zasobów wczytuje siatki GLB i potwierdza kontakt 72 stóp podpór z terenem. Każda platforma poza orbitą ma dwanaście punktów podparcia. Najwyższy fragment gruntu nadal znajduje się poniżej siatki gry.
- Kompilacja produkcyjna w Chrome pokazała osiem demonstracji w 1672 × 941 i 390 × 844. Każde ujęcie miało 225 widocznych pól i konsolę bez błędów. Sześć osadzonych plansz sprawdzono też po czterech ćwierćobrotach kamery przy niskiej elewacji.
- Publiczne rozwiązania wszystkich ośmiu demonstracji wykonano w grze podczas odświeżania mapy kampanii. Porównania klatek w Stoczni, Kuźni i Grocie pokazały ruch w zwykłym trybie oraz zero zmian powyżej progu po włączeniu ograniczonego ruchu.

## 25 listopada 2026 · wspólny panel rezonatora

Kampania i Węzeł Keplera korzystają z karty jednego rezonatora otwieranej
przyciskiem „i” albo wskazaniem rezonatora na planszy. Testy odtwarzają też
profil ze starym ustawieniem „Widmo”. Karta zamyka się przy zmianie planszy,
a Escape przywraca fokus przyciskowi informacji.

## 25 listopada 2026 · Laboratorium polarne

- Porównanie w `screenshots/laboratorium-polarne` obejmuje kadr z monitora i pionowy widok w emulacji telefonu. Światło lodu przy planszy przyciemniono po pierwszej próbie, a dalekie kopie lodowca zastąpiono grańmi z 396 trójkątów na model.
- Test zasobów śledzi cztery pale stacji i podstawę radiometru do powierzchni lodu. Stacja ma 2290 trójkątów, bliska ściana lodowca 1816, a radiometr 1100. Ujęcia w profilu zrównoważonym w 1672 × 941, 1366 × 768 i 390 × 844 potwierdziły widoczność wszystkich pól.
- Porównanie klatek prawego brzegu wykryło ruch przy zwykłych ustawieniach i zero zmian powyżej progu po włączeniu ograniczonego ruchu. Na zintegrowanym Radeonie krótka próba profilu zrównoważonego dała ok. 60 kl./s przy 1366 × 768 oraz ok. 37 kl./s przy 1672 × 941. Profil płynności przy 1672 × 941 uzyskał ok. 46 kl./s.

## 24 listopada 2026 · Optyka głębinowa

- Porównanie z gry w `screenshots/glebiny` obejmuje monitor i emulację dotyku. Po pierwszej próbie przesunięto kominy do przedniego planu, zmieniono pokład na chłodną ceramikę i odsunięto tor pojazdu od ikony informacji.
- Test Playwright sprawdza widoczność 225 pól przy obrocie kamery, na trzech typowych rozdzielczościach laptopa i w widoku dotykowym. Dwie klatki fragmentu rafy porównano z animacją oraz z preferencją ograniczonego ruchu.
- Trzy modele przechodzą sprawdzenie materiałów, podstawy Y-up i położenia pod poziomem gry. Obserwatorium ma 3584 trójkąty, rafa 2904, a pojazd 1090.

## 24 listopada 2026 · Ogród heliostatów i Sanktuarium soczewek

- Zrzuty z gry w 1672 × 941 i 390 × 844 potwierdziły widoczność 225 pól w obu scenach. Kadry i porównanie przed i po są w `screenshots/ogrod-sanktuarium`.
- Test Playwright w 1280 × 720 sprawdził cztery ćwierćobroty kamery w Ogrodzie, Grocie i Sanktuarium. Osobny test dotykowy sprawdził wszystkie osiem plansz w widoku z góry.
- Test zasobów sprawdza źródła Blendera, materiały i budżety trzech modeli. Kaskada ma 4696 trójkątów, kolimator 2392, a zerwany most 1962.

## 24 listopada 2026 · scenografia ośmiu światów

- Zrzuty 1672 × 941 i 390 × 844 pokazują osiem publicznych zagadek. Pierwsze ujęcia ujawniły kolizję tarasu Sanktuarium, zbyt jasne tło Kuźni i fragment bazaltu nad narożnikiem planszy na telefonie. Po korektach wszystkie środki pól pozostały widoczne.
- Chromium w 1366 × 768, 1280 × 720, 1093 × 614 i 390 × 844 sprawdziło widoczność 225 pól każdej planszy. Osobny przebieg sprawdził osiem plansz w dotykowym widoku z góry. Przeszły też próby obrotu kamery przy małej elewacji, meteorów, czytelności łupku i rozwiązania Stoczni.
- Zrzuty i wyniki renderowania zapisano w `screenshots/biomy/final`. Ilustracje mapy kampanii pochodzą z rozwiązanych zagadek demonstracyjnych. Każdy z 15 nowych modeli ma podgląd, źródło Blendera oraz plik GLB.

## 24 listopada 2026 · plansza dotykowa i Kryształowa Grota

W Chrome z emulacją dotyku na 320 × 568 i 390 × 844 rozegrano „Pierwsze światło”.
Test otwiera mapę z góry, powiększa pola, przesuwa obraz jednym palcem, wraca do
widoku całej planszy i wybiera lustro z zasobnika. Następnie powiększa widok
ponownie, stawia lustro, obraca je i sprawdza zwycięstwo. Osobne scenariusze
obejmują anulowanie przeciągania, gest dwoma palcami i próbę postawienia
przyrządu na zajętym polu. W przybliżeniu minimapa pokazuje trasę światła
i widoczny wycinek. Test dotyka jej prawego brzegu, wraca do pełnej planszy
i sprawdza współrzędne postawionego lustra. Fizyczny ekran telefonu wymaga
osobnej próby.

W grocie test zasobów wczytuje modele z GLB, mierzy budżet geometrii i sprawdza
trafienie trzech kotew pomostu w półkę skalną. Podglądy modeli są w
`assets/previews/overhaul/scenery`. Zdjęcia z faktycznej rozgrywki można
odtworzyć następującymi poleceniami.

```powershell
node tools/shoot.mjs --levels 3 --sizes 1366x768,390x844 --backend native --quality balanced
node tools/shoot.mjs --levels 3 --sizes 390x844 --backend native --quality balanced --phone-detail
```

## 23 listopada 2026 · faktura pokładów

Na „Spektrum” porównano identyczny kadr przed dodaniem materiału, po pierwszym
wypaleniu i po korekcie. Pierwszy łupek miał zbyt wąskie, ostro oświetlone
pasma. W drugiej wersji poszerzono użylenie i spłycono relief. Test sprawdza
na zrzucie kontrast wewnątrz 15 pustych pól i porównuje go z kontrastem fug
w 1366 × 768, 1280 × 720, 1093 × 614 i 390 × 844. W ukośnym ujęciu
telefonicznym wąska spoina obejmuje także skraj płyty, kiedy jej fizyczna
szerokość spada poniżej piksela renderera. Osobne testy sprawdzają
linie siatki z góry, widoczność pól i siedem kolorów wiązek.

W Chrome na zintegrowanym Radeonie wykonano zrzuty ośmiu biomów w profilu
zrównoważonym przy 1366 × 768. W czterech porównanych scenach liczby
wywołań rysowania i trójkątów przed zmianą i po niej były
identyczne. Węzeł Keplera przeszedł oddzielną kontrolę widoczności 225 pól.
Na „Spektrum”, po zakończeniu równoległych testów przeglądarkowych,
cztery naprzemienne pomiary po 3 s dały po 60 kl./s w wariancie z fakturą
i bez niej (91 wywołań rysowania, 22 902 trójkąty).
Porównanie jest w `screenshots/poklad/porownanie.png`, pełne kadry kampanii
w `screenshots/poklad/final`, a ujęcia stacji w `screenshots/poklad/kepler`.

## 23 listopada 2026 · kaseta filtra na planszy „Spektrum”

Z góry metalowy pierścień dawnego filtra zasłaniał soczewkę. W zasobniku
filtry o różnych barwach miały identyczne turkusowe miniatury. Na tej samej
planszy i przy tej samej kamerze porównano stary pierścień z nową kasetą.
W drugiej wersji pogłębiono kolor przy krawędzi szkła, a uchwyt dostał skos
widoczny od góry i z boku. W miniaturach rozjaśniono szkło. Model ma 3036
trójkątów przy budżecie 5500.

Na planszy czerwone światło kończy się na zielonym filtrze. Na układzie
kontrolnym biała wiązka wychodzi z tej samej kasety jako zielona. Test GLB
sprawdza obie powierzchnie soczewki i górny uchwyt we wszystkich ośmiu
obrotach. Test Chromium rozpoznaje barwy z pikseli siedmiu miniatur,
przeciąga zieloną kasetę z zasobnika i odczytuje kolor uchwytu oraz wiązek
w 1366 × 768, 1280 × 720, 1093 × 614 i 390 × 844.
Zrzuty porównawcze są w `screenshots/filtr/final`. Pełny kadr z poziomu 3
jest w `screenshots/filtr/laptop/demo-003_1366x768.png`. Na zintegrowanym
Radeonie ta plansza osiągnęła 59,8 kl./s w czterosekundowym pomiarze po
rozgrzaniu, w profilu zrównoważonym.

## 23 listopada 2026 · pryzmat na planszy „Trzy barwy”

W pierwszym ujęciu nowego modelu jasna korona szkła zlewała się z pokładem.
Przyciemniliśmy dolne fasety, odsłoniliśmy ściany między uchwytami i dodaliśmy
widoczny w szkle ślad przechodzącej wiązki. Końcowy model ma 2060 trójkątów.
Na tym samym polu biały laser dał trzy wyjścia RGB, czerwony jedno czerwone
wyjście, a rozdzielacz z białym wejściem dwa białe wyjścia.

Test z eksportowanym GLB sprawdza prześwit do szkła dla ośmiu obrotów
i obu tabel dyspersji. W Chromium test odczytał kolor czterech odcinków
z klatki rozwiązanej planszy oraz wskazał pryzmat w 1366 × 768, 1280 × 720,
1093 × 614 i 390 × 844. Porównanie z tej samej kamery jest w
`screenshots/pryzmat-final/porownanie.png`, pełne ujęcie laptopowe w
`screenshots/pryzmat-final/demo-007_1093x614.png`. Krótki pomiar na
zintegrowanej grafice Radeon w profilu filmowym dał 43 kl./s w 1093 × 614
i 14 kl./s w 2880 × 1620. W tym większym rozmiarze poprzedni model również
osiągał 14 kl./s.

## 23 listopada 2026 · lustro i rozdzielacz

Przy ukośnym padaniu turkusowej wiązki dawna płytka rozdzielacza była
widoczna niemal wyłącznie z boku. Pierwsze dwa szklane kliny zlewały się
z jasnym pokładem. W końcowym modelu podniesiono ich zewnętrzne krawędzie,
przyciemniono szkło i odsłonięto szczelinę nad powłoką dzielącą wiązkę.
Model z oprawą ma 1712 trójkątów. Test GLB sprawdza pierwszy kontakt
promienia przy ośmiu obrotach i ośmiu kierunkach padania. W Chromium
lustro zasiliło jeden odbiornik, a rozdzielacz dwa. Wskazanie nowego modelu
sprawdzono w 1366 × 768, 1280 × 720, 1093 × 614 i 390 × 844, a na najmniejszym
laptopie również obrót prawym kliknięciem i cofnięcie. Ujęcie porównawcze
jest w `screenshots/rozdzielacz-final/13-lustro-i-rozdzielacz.png`, a pełny
kadr laptopowy w `screenshots/rozdzielacz-final/15-laptop.png`.

## 23 listopada 2026 · szlif odbiornika

W pierwszej próbie jasnozielone fasety zlewały się na ekranie. Podniesienie
korony i skupienie poświaty wewnątrz kamienia odsłoniło schodki szlifu.
Odbiornik z oprawą ma 1016 trójkątów. Test rzeczywistego GLB potwierdza,
że na wysokości 0,78 m pierwszą powierzchnią trafioną z każdego z ośmiu
kierunków jest kamień. Chromium sprawdziło siedem barw, w tym niebieski
odbiornik z turkusową wiązką, w 1366 × 768, 1280 × 720, 1093 × 614 i 390 × 844.
Porównanie tego samego odbiornika przed i po trafieniu jest w
`screenshots/kepler-szlif/10-krysztal-bez-wiazki.png` i `04-krysztal.png`.

## 23 listopada 2026 · przekaźnik Węzła Keplera

Model ma 7300 trójkątów przy budżecie 7800. W pierwszym ujęciu skrzydła
układały się w poziomy pasek. Po zmianie ustawienia masztu i ścieńczeniu
ramek widać osobne ogniwa i zmianę refleksu podczas obrotu. Test GLB sprawdza
nieruchomy maszt, oś skrzydeł, pełny obrót pierścienia i pozycję spoczynkową.
Przegląd w Chromium obejmuje oba kąty kamery, rzut z góry i 225 pól
na trzech rozmiarach laptopowych oraz na telefonie. Zbliżenie jest w
`screenshots/kepler-przekaznik/09-przekaznik.png`.

## 22 listopada 2026 · oblot Węzła Keplera

- Test odczytuje rzeczywisty GLB z Blendera i próbkuje pełną 57-sekundową
  trasę promu co ćwierć sekundy. Kadłub pozostaje poza obrysem planszy
  i poniżej powierzchni pól. Po oblocie wraca do swojego miejsca na pomoście.
- Natywne Chromium na AMD Radeon sprawdziło 225 pól podczas lotu przy
  1366 × 768, 1280 × 720, 1093 × 614 i 390 × 844. Układ zagadki pozostał
  ten sam. Po włączeniu ograniczenia ruchu prom zaparkował, antena wróciła
  do pozycji spoczynkowej, a meteor zniknął.
- Ujęcie meteoru i nagranie z działającego poziomu są w
  `screenshots/kepler-oblot/07-meteor.png` i `screenshots/kepler-oblot/06-oblot.webm`.

## 22 listopada 2026 · obrót myszą i powłoki optyczne

Prawy przycisk myszy sprawdzono na planszy, na karcie zasobnika i na wolnym
polu podczas ustawiania. Test liczy kroki obrotu, cofa ruch i sprawdza też
przeciągnięcie prawym przyciskiem oraz próbę obrócenia stałego emitera.
Przeszedł przy 1366 × 768, 1280 × 720 i 1093 × 614.

Dwa ujęcia tej samej zagadki z działającej gry są w
`screenshots/kepler-przeglad/03-pole-w-pracy.png` i `02-widok-boczny.png`.
Po obejrzeniu pierwszej próby obniżono łuk serwisowy. Natywny WebGL na AMD
Radeon potwierdził widoczność 225 pól w obu ujęciach, w rzucie z góry
i w czterech rozmiarach ekranu, w tym 390 × 844. Test modelu GLB sprawdza
położenie i zwrot powłoki lustra po ponownym zaznaczeniu.

## 22 listopada 2026 · Węzeł Keplera

Porównano ten sam stan Chromatron 1–15 z czterema aktywnymi rezonatorami
w `screenshots/kepler-crystals` i `screenshots/kepler-fotonika`.
Po pierwszej próbie prom przeniesiono z dolnej krawędzi na lewy pomost.
Ograniczono też poświatę białej wiązki przy filtrach. Ocena wizualna 4/5.
Przy dużym oddaleniu kształty urządzeń są czytelniejsze od grawerów na podstawach.

Chromium z natywnym WebGL na AMD Radeon potwierdziło widoczność 225 pól
z obu ujęć, z góry oraz w rozmiarach 1366 × 768, 1280 × 720, 1093 × 614
i 390 × 844. Konsola gry była wolna od błędów. Przeszły 234 testy Node,
build Vite i sześć scenariuszy Playwright obejmujących modele, chwytanie
lustra, wiązki, barierę, odbicia oraz zmianę jakości.

Siódmy scenariusz porównał piksele wszystkich siedmiu barw wiązek oraz
czynnych i nieczynnych kryształów na jasnym pokładzie. Przy pierwszej próbie
zielony nieczynny odbiornik miał zbyt słabe nasycenie. Po przyciemnieniu
neutralnych refleksów pomiar przeszedł dla wszystkich czterech rozdzielczości
oraz profili filmowego, zrównoważonego i wydajnego.

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

## 21 listopada 2026 · klawiatura na mapie

- Test przełącza cztery zakładki lokalnych kampanii bez przeładowania zagadki. Test listy demonstracyjnej sprawdza strzałki, Home, End, Tab i Enter w 1366 × 768, 1280 × 720, 1093 × 614 i 390 × 844.
- Przeszło siedem scenariuszy mapy i menu w Chromium, 226 testów Node i build Vite.
- Widok czwartej kampanii w 390 × 844 i 1366 × 768 zapisano w `test-results/current-game/campaign-navigation-*.png`.

## 21 listopada 2026 · ekran ukończenia

- Test sprawdza nazwę bieżącej i następnej planszy, liczbę aktywnych rezonatorów i postęp kampanii. Wszystkie trzy akcje są dostępne w 1366 × 768, 1280 × 720, 1093 × 614, 640 × 360 i 390 × 844. Po finale główna akcja otwiera mapę.
- Przeszły cztery scenariusze Chromium sprawdzające kampanie, menu i finał, 226 testów Node i build Vite.

## 21 listopada 2026 · podgląd rozwiązanej planszy

- Test z emulacją dotyku zamyka ekran ukończenia, sprawdza zachowanie rozwiązania, ponownie otwiera wynik i potwierdza saldo bez ponownego naliczenia nagrody. Cofnięcie obrotu przywraca przycisk podpowiedzi w belce gry.
- Próba przy renderowaniu programowym ujawniła opóźnione kadrowanie po dotknięciu karty w zasobniku i nakładanie samouczka na obrót. Kadr jest teraz przeliczany przy zmianie wyboru, a samouczek uwzględnia rzeczywistą wysokość panelu. Test sprawdza pole ustawienia oraz odstęp samouczka od obrotu.
- Zrzuty aktualnej demonstracji są w `test-results/current-game/victory-390x844.png` i `test-results/current-game/victory-640x360.png`.
- Końcowa regresja przeszła 46 scenariuszy Chromium, 226 testów Node i build Vite. Próba dotykowa przeszła osobno w SwiftShader. W osobnym przebiegu Chromium rozwiązano i ponownie otwarto po 200 zagadek z lokalnych kampanii bez błędów i z zachowanymi oznaczeniami ukończenia. Raport zapisano w `test-results/progression-200-report.json`.
