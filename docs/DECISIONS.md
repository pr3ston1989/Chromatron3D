# Decyzje

## 18 listopada 2026 · Faza 0

- Gałąź `visual-overhaul` od commitu `5dd8864` stanowi punkt odniesienia. Gałąź obejmuje zmiany po kolejnych krokach.
- Tryb `?debug=1` używa prywatnego magazynu w pamięci karty. Wybór dowolnej planszy i zagrania z automatu korzystają z tej samej walidacji pola, stanu i historii co gra.
- Powtarzalny pomiar używa stałego ziarna otoczenia w trybie debug, wyboru biomu i profilu grafiki. Zrzuty mają osobny krok zamrożenia animacji. FPS mierzymy przy działających animacjach.
- Produkcyjna telemetria nie jest potrzebna do porównania. Dane pomiarowe i zrzuty zostają lokalnie w ignorowanym katalogu `screenshots`, ponieważ narzędzie może też otworzyć prywatne kampanie.
- Bazowy zestaw obejmuje cztery plansze pokazowe z czterema różnymi biomami. Weryfikacja 200 układów i pomiar pamięci między nimi należą do fazy 4.
