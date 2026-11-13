/**
 * Short, optics-accurate explanations. These are part of the game UI and
 * deliberately avoid solution spoilers. No player credits are spent.
 */
export const OPTIC_GUIDE=Object.freeze({
 multiFilter:{pl:'Kąt wejścia wybiera kanał niebieski, zielony, czerwony lub całe widmo.',en:'Entry angle selects blue, green, red or the full spectrum.'},
 twister:{pl:'Obraca każdy wpadający promień o 90° w lewo.',en:'Turns every incoming ray a quarter-turn counterclockwise.'},
 complementor:{pl:'Emituje brakujące składowe RGB wzdłuż zgodnych osi. Sprzężenie zwrotne może wyłączyć emisję.',en:'Sends missing RGB channels along matching axes. Conflicting feedback can shut it down.'},
 logicGate:{pl:'Wysyła wspólne kanały z dwóch wejść pod kątem 45° do osi wyjścia.',en:'Emits channels shared by both inputs at 45° to the output axis.'},
 starburst:{pl:'Zmienia wiązkę osiową w cztery ukośne, a ukośną w cztery osiowe.',en:'Fans an axial ray into four diagonals, or a diagonal into four axial rays.'},
 mobileTeleporter:{pl:'Możesz przenieść ten portal, aby połączyć go z kolejnym na linii wiązki.',en:'Move this portal to connect to the next portal along a beam line.'},
 dualReflector:{pl:'Obie strony odbijają światło. Wiązka styczna do lustra zostaje pochłonięta.',en:'Both faces reflect. Light travelling parallel to the mirror is absorbed.'},
 quadBender:{pl:'Z każdego wejścia odchyla promień o dodatkowe 45° względem odbicia lustrzanego.',en:'Bends rays from every direction an extra 45° from the mirror reflection.'},
 occupiedSquare:{pl:'Światło przechodzi przez to pole. Nie można na nim ustawić przyrządu.',en:'Light passes through this cell. Instruments cannot be placed on it.'},
 primaryLogicGate:{pl:'Bramka emituje światło, tylko gdy wspólny sygnał jej wejść ma dokładnie jeden kanał.',en:'Fires only when its two inputs share exactly one primary colour channel.'},
 laser:{
  pl:'Emituje promień w kierunku wskazywanym przez głowicę. Barwa lasera określa jego kanały RGB.',
  en:'Emits light in the direction of its aperture. The laser color defines its RGB channels.'
 },
 target:{
  pl:'Rezonator musi otrzymać dokładnie wymagany kolor. Zbyt dużo światła innej barwy również może przeszkodzić.',
  en:'Receives the exact required color. Extra light of another wavelength can also prevent completion.'
 },
 mirror:{
  pl:'Odbija wiązkę tylko od jasnej strony. Ustawienie kąta co 45° zmienia kierunek odbicia; ciemny tył pochłania światło.',
  en:'Reflects only on its bright face. Rotate in 45° steps to redirect the ray; the dark back absorbs light.'
 },
 bender:{
  pl:'Zakrzywia tor światła pod innym kątem niż zwykłe lustro. Sprawdź stronę wejścia i obracaj o 45°.',
  en:'Bends incoming rays differently from a flat mirror. Check the entry side and rotate by 45°.'
 },
 filter:{
  pl:'Przepuszcza tylko wspólne składowe kolorów wiązki i filtra. Np. filtr czerwony z białego światła pozostawia czerwień.',
  en:'Passes only color channels shared by the beam and filter. A red filter turns white light into red.'
 },
 prism:{
  pl:'Rozszczepia światło na osobne kanały czerwony, zielony i niebieski. Każdy kolor może wyjść w innym kierunku.',
  en:'Splits light into separate red, green and blue channels, potentially travelling in different directions.'
 },
 doppler:{
  pl:'Przesuwa kolor o jeden kanał: z jednej strony czerwony → zielony → niebieski → czerwony, z drugiej w odwrotnej kolejności. Biały pozostaje biały. Obrót zmienia kierunek zmiany.',
  en:'Shifts the wavelength one channel: red → green → blue → red from one side, or the reverse order from the other. White stays white. Rotate to switch direction.'
 },
 splitter:{
  pl:'Rozdziela promień: część może lecieć dalej prosto, a część zostać odbita. To sposób na zasilenie dwóch odbiorników jednym laserem.',
  en:'Branches a beam: some light continues straight while another part reflects. Useful for lighting two receivers with one source.'
 },
 tangler:{
  pl:'Tworzy dwie powiązane wiązki. Doppler działający na jedną z nich zmienia jednocześnie kolor drugiej, nawet po rozdzieleniu torów.',
  en:'Creates a pair of linked beams. Shifting one partner through a Doppler simultaneously changes the other, even on a separate path.'
 },
 conduit:{
  pl:'Przepuszcza światło jedynie wzdłuż swojej osi; wiązki wpadające z boku są blokowane.',
  en:'Transmits light only along its axis; rays entering from the sides are blocked.'
 },
 teleporter:{
  pl:'Przenosi wiązkę do następnego teleportera na tej samej prostej, zachowując kierunek i kolor.',
  en:'Transports the beam to the next teleporter along the same line, preserving its heading and color.'
 },
 wall:{
  pl:'Nieprzezroczysta bariera zatrzymuje wiązkę. Poprowadź promień wokół niej, wykorzystując lustra i inne elementy.',
  en:'An opaque obstacle blocks light. Route the beam around it using mirrors and other optics.'
 }
});
export function opticDescription(type,language='pl'){
 const guide=OPTIC_GUIDE[type];
 return guide?.[language==='en'?'en':'pl']||'';
}
export function opticExample(type,language='pl'){
 const examples={
  doppler:['Przykład: czerwony laser + odpowiednio ustawiony Doppler = zielona wiązka.',
   'Example: red laser + correctly oriented Doppler = green beam.'],
  filter:['Przykład: biały laser + niebieski filtr = niebieskie światło.',
   'Example: white laser + blue filter = blue light.'],
  splitter:['Przykład: rozdziel promień, aby zasilić dwa rezonatory.',
   'Example: split one beam to reach two receivers.'],
  prism:['Przykład: z białej wiązki uzyskaj trzy osobne kolory.',
   'Example: split one white ray into three colored paths.'],
  tangler:['Przykład: Doppler na lewej wiązce zmienia też prawą.',
   'Example: Doppler on the left-hand beam also changes its partner.']
 };
 const val=examples[type];
 return val?.[language==='en'?1:0]||'';
}
