# Projekt wizualny

## Cztery zaakceptowane kierunki

| Świat | Plansza i konstrukcja | Dominanty otoczenia | Światło i ruch |
| --- | --- | --- | --- |
| Obserwatorium pryzmatyczne | Ciepła ceramika, granatowy cokół i miedź. | Pierścień kalibracyjny i niskie gniazdo soczewki, za nimi warstwy granatowej mgły. | Ciepły klucz i chłodne wypełnienie. Powolny ruch wewnętrznej ramy soczewki. |
| Kryształowa grota | Neutralny liliowy wierzch na ciemnej śliwkowej podstawie. | Wyspy przytłumionego ametystu z obu stron, głębia w osi planszy. | Rozproszone fioletowe wypełnienie i delikatny ruch pyłu. |
| Ogród heliostatów | Wapień, patynowany brąz i chłodny jadeit w cofniętych panelach. | Heliostat, niski łuk, dalsze tarasy w zielonej mgle. | Łagodne światło z góry, wolny obrót heliostatu. Jasność horyzontu poniżej pokładu. |
| Stocznia orbitalna | Tytan, grafit, widoczna kratownica i małe bursztynowe wskaźniki. | Duże żebro dokujące, odległy pylon i niski łuk planety. | Chłodne wypełnienie, łagodny ruch statku serwisowego poza planszą. |

[Cztery koncepcje](concepts/README.md) wyznaczają rodziny materiałów, światła i form. W fazie 3 rodziny mogą dać warianty o odrębnych sylwetkach i nastroju. Przyrządy zachowują swoją tożsamość między światami.

## Kontrast, skala i kompozycja

- Wiązka i miejsce kontaktu mają najwyższą jasność punktową. Kontrast pokładu z obrysem przewyższa kontrast tła. Sprawdzamy pełne spektrum na wybranych pokładach w 1920 × 1080 i 390 × 844.
- Pokład równy w całej siatce 15 × 15, odstęp środków pól 1,30 m. Krawędzie płyt i rowki mają niższy kontrast od przyrządów. Zmiana wyglądu poszczególnych pól wyraża stan mechaniki.
- W rzucie z góry linie granic pól zachowują szerokość co najmniej jednego piksela renderera, także przy zmniejszonym renderze. Siatka leży tuż nad podłogą i pozostaje pod wiązkami oraz przyrządami.
- Przyrząd odróżnia się kształtem, rozkładem trzech wartości jasności i geometrią kierunkową. Lustro ma płaską powierzchnię odbijającą, rozdzielacz wyraźne otwarte rozwidlenie. Kolor emisji dopełnia sylwetkę.
- W widoku z góry małe symbole o wysokim kontraście pomagają rozpoznać przyrządy także przy małym rozmiarze siatki. Są odsunięte od środka pola. Kształt identyfikuje mechanizm, a kolor obwódki wybranych przyrządów uzupełnia informację o widmie.
- Plansza utrzymuje rytm symetryczny, a otoczenie kadrują dwie lub trzy duże formy z przerwami między sylwetkami. Ruchome części i dominanty są poza siatką. Dalsze plany mają coraz słabszy kontrast i nasycenie.
- Domyślny kadr odniesienia to perspektywa o pionowym FOV 40°, odległość 44 m, azymut −0,80 rad, elewacja 0,86 rad. Oceniamy też w grze widok pionowy, z góry i po obrocie. W trybie ograniczonego ruchu otoczenie zachowuje statyczną kompozycję.

## Paleta materiałów

Kolory sRGB. Tabela i moduł Blendera stosują domieszkę czerni 19% i 38% oraz bieli 20% i 40%. `cyan` i `amber` są akcentami emisyjnymi scenografii. Obudowy mają płaskie cieniowanie i fazowane krawędzie, a powierzchnie używają jednolitych materiałów PBR bez tekstur obrazkowych.

| Nazwa materiału | Cień 2 | Cień 1 | Baza | Światło 1 | Światło 2 |
| --- | --- | --- | --- | --- | --- |
| `obsidian` | `#0E141F` | `#131B29` | `#172132` | `#454D5B` | `#747A84` |
| `graphite` | `#19202C` | `#212A3A` | `#293447` | `#545D6C` | `#7F8591` |
| `navy` | `#182538` | `#20304A` | `#273B5B` | `#52627C` | `#7D899D` |
| `steel` | `#31404E` | `#405365` | `#4F677D` | `#728597` | `#95A4B1` |
| `titanium` | `#626D76` | `#808E9A` | `#9EAFBE` | `#B1BFCB` | `#C5CFD8` |
| `ceramic` | `#8A877E` | `#B4B0A4` | `#DED9CB` | `#E5E1D5` | `#EBE8E0` |
| `limestone` | `#827055` | `#A9936F` | `#D1B589` | `#DAC4A1` | `#E3D3B8` |
| `copper` | `#6D4733` | `#8E5D42` | `#AF7352` | `#BF8F75` | `#CFAB97` |
| `bronze` | `#58412B` | `#735539` | `#8E6946` | `#A5876B` | `#BBA590` |
| `jade` | `#334A45` | `#42605B` | `#527770` | `#75928D` | `#97ADA9` |
| `olive` | `#404935` | `#545F45` | `#687555` | `#869177` | `#A4AC99` |
| `plum` | `#2B2135` | `#382C45` | `#453655` | `#6A5E77` | `#8F8699` |
| `amethyst` | `#51455C` | `#695B79` | `#827095` | `#9B8DAA` | `#B4A9BF` |
| `lilac` | `#73697B` | `#968AA1` | `#B9AAC7` | `#C7BBD2` | `#D5CCDD` |
| `cyan` | `#3F7B80` | `#52A0A7` | `#65C6CE` | `#84D1D8` | `#A3DDE2` |
| `amber` | `#8C693B` | `#B6894D` | `#E1A95F` | `#E7BA7F` | `#EDCB9F` |

Mechanika wiązek używa masek R=1, G=2, B=4. Kolory z gry w kolejności maski 1–7 to `#FF3B62`, `#6AFBA1`, `#FFE778`, `#6399FF`, `#ED65FF`, `#5FF8EF`, `#FFFFFF`. Kolory portów i rezonatorów zależne od stanu korzystają z tej samej palety.

## Geometria i eksport

| Kategoria | Limit trójkątów na model |
| --- | ---: |
| Powtarzana wkładka lub panel obwodu | 180 |
| Mały rekwizyt i roślina | 300 |
| Przyrząd optyczny | 600 |
| Średnia dekoracja i pojazd | 600 |
| Platforma i lokalny budynek | 1500 |
| Duża sylwetka horyzontu | 2000 |

Jeden metr na jednostkę, origin w środku podstawy na Z=0 w Blenderze, glTF Y-up dla Three.js (`X,Y,Z` → `X,Z,−Y`). Przyrządy utrzymują środek pola jako punkt obrotu w poziomie. Nazwy techniczne ASCII z małymi literami, rzeczowniki łączone myślnikiem. Podglądy mają kadr detaliczny 3/4 oraz widok w skali gry.

## Interfejs gry

Tytuł i miejsce są nad sceną po lewej, a cyfra planszy i postęp rezonatorów po prawej. Jedna fazowana belka reaguje na liczbę przyrządów. Zawiera podpowiedzi, historię ruchów, zasobnik i kamerę. Panel obrotu otwiera się nad belką po wybraniu elementu. Na wąskich ekranach portret służy do odkładania przyrządu na planszę, a przesunięcie etykiety przewija poziomy zasobnik.

Tytuły i nawigacja używają Barlow Condensed, a opisy Space Grotesk. Ciemny granat (`#101522`) i ciepła biel (`#F8F3EB`) tworzą bazę. Bursztynowy (`#FFCC75`) prowadzi do kampanii i podpowiedzi, a kolor świata wskazuje postęp i wybrany przyrząd. Mapa wykorzystuje zrzuty ośmiu publicznych scen bez interfejsu. Każda klasyczna kampania ma dwa oddzielne sektory po 25 pól.

Ekran tytułowy używa ujęcia ukończonej demonstracji Stoczni orbitalnej. Ilustracja przechodzi pod tytułem i akcją „Graj” albo „Kontynuuj”. Pod akcją widać świat i numer planszy. Na telefonie tytuł jest nad ilustracją, a menu jest przy dolnej krawędzi w zasięgu kciuka. Podczas pobytu w menu obraz sceny 3D pozostaje zatrzymany.

Bursztynowy obrys pojedynczego pola oznacza kursor klawiatury. Zwięzły komunikat przy brzegu podaje współrzędne i zawartość, a obrót oraz zaznaczenie przyrządu zachowują swoje dotychczasowe wskaźniki.
