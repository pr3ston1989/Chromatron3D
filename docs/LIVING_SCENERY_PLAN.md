# Chromatron3D — plan pełnej scenografii „żyjącego świata”

## Kierunek wizualny

Nie dokładamy przypadkowych dekoracji. Każdy biom jest miejscem z własną
architekturą, śladami użytkowania, średnim planem i cichą aktywnością.
Środek pozostaje spokojny: wiązki, lustra i pola są zawsze najczytelniejsze.
Największe konstrukcje dominują na obrzeżach, a dalekie tło sygnalizuje skalę
całej stacji. Rozpoznawalna **sylwetka** ma pierwszeństwo przed liczbą polygonów.

### Warstwy kompozycji

| Warstwa | Odległość | Elementy | Zasada |
|---|---|---|---|
| Plansza | 0–10 jednostek | Optyka, czytelna podłoga | Zero dekoracji blokujących interakcje |
| Obrzeże / średni plan | 11–30 | Moduły, mosty, stacje obsługi, skały | Kilka rozpoznawalnych grup GLB |
| Daleki plan | 35–110 | Sylwety flot, instalacje, stacje, planety | Wielowarstwowa głębia i paralaksa |
| Aktywność | Obrzeże i daleki plan | Drony, anteny, nadajniki, pył | Subtelnie, stale, bez krzyżowania promieni |

### Biblioteka modeli (docelowy słownik)

| Biom | Hero — już istnieje | Średni plan — etap 1 | Daleki plan i aktywność |
|---|---|---|---|
| Orbital | Suwnica cargo | **Kontenery i dok serwisowy GLB; wieża nadawcza / radary GLB** | Ruch transportowy, żurawie, sygnalizacja |
| Verdant | Zrujnowany zarośnięty łuk | **Szklarnia / moduł ogrodowy GLB; korzenna wieża GLB** | Zarodniki, pnącza, podświetlenia |
| Polar | Lodowe obserwatorium | **Zamrożony most antenowy GLB; stacja geologiczna GLB** | Dalekie lodowe skały, śnieżny pył, puls beaconów |
| Nebula | Kryształowy reaktor | **Skupisko rezonatorów GLB; kryształowe szczątki GLB** | Dalsze pierścienie, impulsy światła, dryf odłamków |

## Etapy i kryteria ukończenia

1. **Etap 1 — pełniejszy średni plan.** 8 nowych, różnych plików GLB (2/biom)
   obok czterech hero assetów. Ziarno poziomu wybiera jeden z wariantów
   kompozycji, a model, rozmiar i kierunek są dobrane do kamery. Ładowanie
   na żądanie, cache, profile Performance/Balanced/Cinematic. Co najmniej
   3 przejrzyste skupiska obiektów poza planszą; żadnych „paprochów”.
   Oryginalne źródła assetów w repozytorium, bez dodatkowych licencji.
2. **Etap 2 — głębokie tło.** 2–3 plany dalekiej architektury i mgławic;
   zróżnicowany horyzont per biom i per poziom. Dla kamery: wolna paralaksa
   i perspektywa, a nie płaska tapeta. Preferuj współdzielone bufory.
3. **Etap 3 — aktywny świat.** Drony serwisowe, sygnały i beacony, powolne
   mechanizmy, pyłki/iskry/śnieg zależne od biomu. Ruch można wyłączyć
   przez `prefers-reduced-motion`. Żadnych rozpraszających błysków na polu gry.
4. **Etap 4 — art direction i optymalizacja.** Wspólne materiały PBR,
   indywidualna paleta świateł, lepsza integracja modułów z obrzeżami,
   realne screenshoty desktop/mobile i przegląd proporcji w kadrze.
   Pomiar GPU i budżet zasobów na Windows — dopiero wtedy ocena PREMIUM.

## Budżety i walidacja

- Model średniego planu: cel **500–5000 trójkątów, 2–5 materiałów**,
  docelowo kompaktowy GLB (bez ciężkich 4k tekstur).
- **2–4 nowe widoczne obiekty** w trybie Performance,
  **6–8** w Balanced, **8–12** w Cinematic (plus istniejące hero assets).
  Rozsądny limit wywołań rysowania; materiały i geometria współdzielone.
- Żaden mesh scenograficzny nie jest raycastowany ani nie wchodzi do
  układu logicznego 15×15. Oś poza obrębem planszy + margines bounding box.
- Poziomy, podpowiedzi, ceny kredytów i optyka pozostają nietknięte.
- Testy Node: walidacja binarnych modeli, deterministyczne kompozycje,
  bezpieczne odległości, cache i profile jakości.
- Chromium: realny load GLB, aktualizacja biomu, widoczne kompozycje,
  niezmienione promienie i screenshoty desktop/mobile.

## Miernik jakości

Nie liczymy wyłącznie obiektów. Po załadowaniu dowolnego biomu gracz powinien
od razu rozpoznać: **gdzie jest**, **co jest tam eksploatowane** i **co dzieje
się dalej poza planszą**. Jeśli dominują drobne chaotyczne bryły i pusta
przestrzeń, etap nie spełnia celu i wymaga przeróbki kompozycji.
