# Pracownia modeli

Blender 5.3.0: `C:\Tools\blender-5.3.0-windows-x64\blender.exe`.

Źródła modeli są w `tools/assets`. Z katalogu projektu uruchom np.
`& 'C:\Tools\blender-5.3.0-windows-x64\blender.exe' -b -P tools/assets/board-chassis.py`.
Wspólny moduł `style.py` eksportuje GLB do `assets/models` i dwa rendery PNG 512 × 512 do `assets/previews`.
Próbki mają własne materiały PBR z 16 kolorów HEX. Każdy kolor ma dwa jaśniejsze i dwa ciemniejsze odcienie. Podglądom towarzyszy ujęcie pod kątem domyślnej kamery gry.
Blender używa metrów i osi Z do góry. Eksport glTF konwertuje na Y-up, a Three.js
wczytuje model w tej orientacji. Z w Blenderze i Y w grze mają minimum 0 od podstawy.

| Kategoria | Maks. trójkątów na model |
| --- | ---: |
| Element powtarzalny, w tym panele krawędzi | 180 |
| Drobny rekwizyt i roślinność | 300 |
| Pojazd lub mechanizm średniej wielkości | 600 |
| Budynek i główna bryła planszy | 1500 |
| Wielka konstrukcja na horyzoncie | 2000 |

[Inwentaryzacja brył](primitive-inventory.md) zawiera stan przed próbką stylu.

Paleta w `style.py` łączy nocny granat, morską stal i jasną ceramikę. Miedź i bursztyn
oznaczają ruchome złącza i elementy obsługi. Emisja jest ograniczona do cyjanu i bursztynu. Lodowy błękit, zieleń i fiolet służą jako
akcenty biomów.

Domyślna platforma ma 3,75 m grubości. Biom orbitalny używa wariantu z rurami, kratownicą i czterema napędami. Kontrolowany test w Chrome pokazuje modele w widoku 1366 × 768.
