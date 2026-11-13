# Wielowarstwowy, żyjący horyzont (etap 2)

## Dlaczego istnieje

Kilka modeli obok planszy to jeszcze nie świat. Między średnim planem,
planetami i gwiazdami potrzebne są wyraźne **sylwetki infrastruktury**,
przesłonięcia i światła. Horyzont jest więc częścią scenografii, a nie
losowym zbiorem świecących drobinek.

## Co powstało

`src/space-horizon.js` buduje dla każdego z czterech biomów **trzy duże
konstrukcje dalekiego planu**, rozmieszczone w dużej odległości od planszy:

| Biom | Sylwetka dalekiego planu | Czytelna aktywność |
|---|---|---|
| Orbital | Wielki pierścień przeładunkowy ze szprychami i dokami | Wolny obrót mechanizmu, światła sygnalizacyjne |
| Verdant | Stara arka-biosfera z wiszącymi ogrodami | Subtelny obrót i zielone sygnały |
| Polar | Rozległa stacja telemetryczna i ramiona anteny | Powolne przeszukiwanie przestrzeni |
| Nebula | Rozbity reaktor orbitalny, krzyżujące się obręcze i odłamki | Rozproszone, pulsujące sygnały energetyczne |

Każdy biom otrzymuje też trzy **duże, subtelne płaszczyzny mgławicy**
na różnych głębokościach. Wykorzystują one już obecny w grze, współdzielony
`makeNebulaTexture`, bez pobierania obrazów lub dodawania nowych tekstur.
Kolor i intensywność są stonowane, żeby nie przytłoczyć wiązki.

## Budżet GPU

| Tryb | Konstrukcje horyzontu | Dodatkowe warstwy mgławicy |
|---|---:|---:|
| Płynność | 1 | 1 |
| Zrównoważony | 2 | 2 |
| Filmowy | 3 | 3 |

Grupy i geometrie powstają **tylko raz na biom**; przełączanie poziomu
zmienia ich położenie/orientację i widoczność. Ruch jest bardzo powolny:
bez krótkich błysków, bez nieprzewidywalnych przelotów przez pole gry.
`prefers-reduced-motion` zatrzymuje aktualizację mechanizmów i pulsowanie
sygnałów. Daleka infrastruktura pozostaje całkowicie poza układem 15×15
oraz poza listą elementów wybieranych przez raycaster.

Kompozycja kontruje obrót losowanego nieba, by główne sylwetki pozostały
w rozpoznawalnych obszarach kadru. Drobny jitter zależy od ziarna poziomu
i daje odmienne otoczenie między eksperymentami.

## Kolejne kroki

Plan całości: [LIVING_SCENERY_PLAN.md](LIVING_SCENERY_PLAN.md).
Ten etap dotyczy dalekiego planu i poczucia głębi. W następnym etapie
należy ulepszyć **zróżnicowane aktywności**: ruch serwisowy przy dokach,
pojedyncze prace mechanizmów, spory/pył śnieżny i przejrzystą sygnalizację.
Ostateczną jakość trzeba ocenić na fizycznym GPU i na screenshotach kilku
poziomów każdego biomu; samo zaliczenie CI nie gwarantuje jakości artystycznej.
