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
