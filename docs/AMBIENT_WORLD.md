# Żywy świat — etap 3 / ambient biome machinery

Po wdrożeniu 12 modeli GLB i odległych megastruktur Chromatron3D ma
również **aktywne instalacje wokół planszy**, a nie tylko nieruchome dekoracje.
Wszystkie elementy pozostają poza układem optycznym 15×15.

## Cztery rozpoznawalne rodzaje aktywności

| Biom | Pracujące urządzenie | Ruch w przestrzeni | Drobne efekty |
|---|---|---|---|
| Orbitalna stocznia | Dwustanowiskowe suwnice z ramionami i podwieszonymi kontenerami | Drony dostawcze kursują po dalekich liniach serwisowych | Żółto-błękitne sygnalizatory i rzadkie iskry |
| Zarośnięta stacja | Powoli obracane mechanizmy szklarni z dużymi organicznymi łopatami | Powolne kapsuły na zewnętrznych torach | Zielone, świetlne zarodniki i sygnały stacji |
| Lodowe obserwatorium | Talerze telemetryczne skanujące horyzont | Pojazdy badawcze poza perymetrem planszy | Lodowy pył i zimne nadajniki |
| Szkarłatna mgławica | Obracające się pierścienie rezonatorów i rdzenie kryształowe | Kryształowe pojazdy przemieszczają się przy zewnętrznych instalacjach | Rozproszone magentowe impulsy i fragmenty |

`src/ambient-life.js` tworzy osiem instalacji, dwanaście statków/dronów
i wstępnie przydzielone bufory sygnałów i cząstek — po zestawie na każdy
biom. Podczas gry aktywny jest tylko jeden zestaw. Ten etap nie generuje
nowych modeli GLB; ożywia otoczenie pomiędzy **już dostępnymi** modułami GLB.

## Budżet jakości

| Profil | Drony | Pracujące instalacje | Sygnalizatory | Cząstki |
|---|---:|---:|---:|---:|
| Płynność | 1 | 1 | 4 | 6 |
| Zrównoważona | 2 | 2 | 8 | 16 |
| Filmowa | 3 | 2 | 12 | 32 |

Sygnalizatory i cząstki to jedynie **dwie instancjonowane warstwy**
na aktywny biom; zmieniamy gotowe macierze instancji, nie alokujemy
meshów w każdej klatce. Nie są dodawane nowe światła real-time ani mapy
cieni. Statki i mechanizmy działają z niewielką częstotliwością i
z ograniczonym zakresem ruchu; żadna trasa nie przecina pola gry.
Współrzędne i fazy są deterministyczne dla identyfikatora paczki, poziomu
i ziarna sesji. **Zmiana poziomu nie tworzy nowych buforów GPU.**

Przy włączonym `prefers-reduced-motion` zostają zatrzymane wszystkie
mechanizmy i obiekty podróżujące po trasach, a cząstki i sygnalizatory
otrzymują stabilne, nieruchome położenia. Żadne obiekty wizualne nie
biorą udziału w raycastach i modelu fizyki optycznej.

## Testowanie i dalsza praca

- Unit tests: 250 ziarien układów na biom, bezpieczne położenia,
  3 presety, niezależne profile aktywności, animacja i reduced motion,
  brak alokacji Object3D w trakcie animowania.
- Playwright: faktyczna liczba modeli, dronów, świateł i cząstek,
  porównanie wyniku promieni oraz zrzut kadru po załadowaniu sceny.
- Etap 4: **kadrowanie i art direction**. Na zrzutach z laptopa część
  średniego planu jest zasłonięta panelami HUD. Trzeba przygotować
  opcjonalny szerszy kadr prezentacyjny lub dostosować kompozycję
  do użytecznego obszaru ekranu, nie pomniejszając na stałe
  elementów optycznych ani utrudniając przesuwania luster.

Cały plan: [LIVING_SCENERY_PLAN.md](LIVING_SCENERY_PLAN.md).
