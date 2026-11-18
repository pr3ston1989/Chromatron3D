# Projekt wizualny

## Zasady obowiązujące przy wyborze kierunku

- Wiązka i jej kontakt z elementem mają najwyższą jasność punktową. Plansza ma być czytelna przed otoczeniem zarówno w 1920 × 1080, jak i 390 × 844.
- Kompozycję otoczenia budują 2–3 duże formy poza siatką 15 × 15, obszary pustej przestrzeni i dalszy plan o słabszym kontraście. Pionowe obiekty poza siatką muszą też pozostawić czytelne wszystkie kafle w widoku 3/4.
- Kolory wiązki wynikają z kanałów R, G i B. Po zmianie kolorystyki sceny zachowujemy rozpoznawalność czerwieni, zieleni, błękitu, żółci, magenty, cyjanu i bieli.
- Model źródłowy ma 1 jednostkę na metr, początek układu w środku podstawy i podstawę na Z=0 w Blenderze. GLB dla Three.js używa pionowej osi Y.
- Obowiązuje płaskie cieniowanie, fazy z geometrii i wspólne materiały. Nazwy plików opisują funkcję i zawierają małe litery z łącznikami.
- Robocze limity to 180 trójkątów dla powtarzanych elementów, 300 dla małego rekwizytu, 600 dla pojazdu i mechanizmu, 1500 dla platformy lub budynku i 2000 dla dużej sylwetki horyzontu. Elementy optyczne oceniamy także pod kątem odróżnialności typu i kierunku obrotu.

## Paleta przed wyborem

Obecna paleta próbna ma 16 kolorów. Dwa jaśniejsze i dwa ciemniejsze tony powstają ze zdefiniowanych kroków w [tools/style.py](../tools/style.py). Akcenty emisyjne w próbce to cyjan i bursztyn. Ostateczną paletę, podpalety motywów i kryteria wybranego stylu zapiszemy po bramce fazy 1.

| Zestaw | Obecne kolory bazowe |
| --- | --- |
| Cienie i stal | `#14202B` `#283844` `#222949` `#4E6874` |
| Korpus i ceramika | `#306875` `#82999E` `#D4DFDA` `#F2E9D4` |
| Detale i sygnały | `#BD6A47` `#D3A15F` `#FFBE5E` `#54CBCC` |
| Barwy środowisk | `#92D5F5` `#66A578` `#B18BD8` `#E47C6E` |
