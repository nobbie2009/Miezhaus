# ChatGPT-Sammelblätter – alle 144 Grafiken mit 26 Prompts

Diese Datei wird automatisch erzeugt (`npm run gfx:docs`).

ChatGPT erstellt pro Nachricht ein Bild. Damit du nicht 144-mal fragen und umbenennen musst, zeichnet ChatGPT hier **Sammelblätter**: mehrere Grafiken in einem Raster. Das Importskript schneidet die Blätter automatisch in Einzeldateien mit den richtigen Namen.

## Ablauf

1. Neuen ChatGPT-Chat öffnen, den **Start-Prompt** senden.
2. Die 26 Blatt-Prompts nacheinander senden (am besten nach Blatt 10 einen neuen Chat mit Start-Prompt beginnen).
3. Jedes Ergebnis herunterladen und **nur** als `sheet_01.png`, `sheet_02.png` … speichern (die Nummer steht über jedem Prompt).
4. Alle Blätter nach `gfx-incoming/` legen und `npm run gfx:import` ausführen → fertig, alle Einzelgrafiken liegen benannt unter `public/gfx/`.

Hinweise: Achte darauf, dass das Raster sauber ist (gleich große Felder, keine Ränder). Gelingt ein Blatt nicht, einfach neu erzeugen lassen: „Bitte noch einmal, das Raster muss exakt gleich große Felder (z. B. 4×4) ohne Rand haben.“ Sammelblätter liefern etwas weniger Detail als Einzelbilder – für einzelne Lieblingsmotive kannst du jederzeit die Einzel-Prompts aus `docs/CHATGPT_PROMPTS.md` nutzen; Einzeldateien überschreiben dann den Blatt-Ausschnitt.

## Start-Prompt (zuerst senden)

```
Du bist Art-Director und Illustrator für das deutsche Browser-Wirtschaftsspiel „Mietshaus Tycoon“. Darin verwaltet man ein Mietshaus aus den 1950er/60er Jahren in einer deutschen Stadt: Wohnungen vermieten, Reparaturen beauftragen, Modernisieren. Das Haus wird in einer flachen Frontalansicht gezeigt, die aus vielen Einzelgrafiken (Texturen und Objekten) zusammengesetzt wird.

Ich schicke dir gleich nacheinander einzelne Bildaufträge. Erstelle für jeden Auftrag genau EIN Bild und halte über alle Bilder hinweg exakt denselben Stil ein:

Stil für ALLE Bilder (bitte bei jedem Bild exakt einhalten):
- Modernes 2D-Illustrationsspiel, leicht illustrierter Flat-/Semi-Flat-Look, saubere Kanten, dezente Texturen, kein Fotorealismus, kein 3D-Render.
- Reine Frontalansicht (wie eine Fassadenzeichnung), keine Isometrie, keine Schrägperspektive. Licht von oben links, weiche Schatten nach rechts unten.
- Warme, gedeckte Farbpalette: Putz beige/ocker/sand, Ziegel rotbraun, Holz mittelbraun, Grün gedämpft olivgrün, Akzente Senfgelb und Petrolblau. Keine Neonfarben, kein reines Schwarz.
- Freundliche, ruhige Stimmung, mitteleuropäische Stadt (deutsches Mietshaus der 1950er/60er Jahre).
- KEIN Text, keine Buchstaben, keine Logos, keine Wasserzeichen im Bild (außer ausdrücklich verlangt).
- Gleichbleibende Strichstärke und Detailtiefe über alle Bilder, damit alles wie aus einem Guss wirkt. Auch klein (ca. 40 Pixel) noch gut erkennbar.

Personen: vielfältig (Alter, Geschlecht, Herkunft, Kleidung), sympathisch und respektvoll, ohne Klischees oder Karikaturen.

Bestätige kurz, dass du den Stil verstanden hast. Erstelle noch kein Bild.
```

---

## sheet_01.png – Gebäude-Texturen

Raster 4×4, ergibt: facade_good.png, facade_worn.png, facade_damaged.png, facade_insulated.png, roof_good.png, roof_worn.png, roof_damaged.png, basement.png, basement_damp.png, stairwell.png, ground_grass.png, ground_dry.png, ground_snow.png

```
Erstelle EIN Bild im Format 1024×1024 als Sammelblatt (Sprite-Sheet) mit einem exakten Raster aus 4 Spalten × 4 Zeilen gleich großer Felder.
Regeln für das Raster:
- Alle Felder exakt gleich groß, KEINE Rahmen, KEINE Trennlinien, KEINE Abstände zwischen den Feldern, KEINE Nummern oder Beschriftungen.
- Jedes Motiv bleibt vollständig innerhalb seines Feldes und ragt nicht in Nachbarfelder.
- Reihenfolge: zeilenweise von links oben nach rechts unten.
- Jedes Feld ist eine eigenständige, möglichst nahtlos kachelbare Materialfläche, die das Feld vollständig ausfüllt.
- Die letzten 3 Feld(er) bleiben leer (neutrales Hellgrau).

Inhalt der Felder:
1. Glatter, frisch gestrichener mineralischer Fassadenputz in warmem Sandbeige, feine gleichmäßige Körnung, ohne Fenster oder Kanten.
2. Derselbe Fassadenputz wie „gepflegt“, aber verblasst und leicht fleckig, graue Schmutzschlieren, vereinzelte kleine Ausbesserungen, ohne Fenster oder Kanten.
3. Derselbe Fassadenputz, stark verwittert: Haarrisse, abgeplatzte Stellen mit sichtbarem Mauerwerk darunter, dunkle Feuchteflecken, grünlicher Algenschleier, ohne Fenster oder Kanten.
4. Moderner, sehr glatter heller Oberputz eines gedämmten Hauses in hellem Cremeweiß mit leichtem Warmton, minimal strukturiert, wirkt neu und hochwertig.
5. Rote Tondachziegel (Biberschwanz oder Frankfurter Pfanne) in sauberen Reihen, frontal von vorne gesehen, gleichmäßig, intakt.
6. Dieselben Dachziegel, verwittert und ausgeblichen, Moos in den Fugen, einzelne leicht verschobene Ziegel.
7. Dieselben Dachziegel, schwer beschädigt: fehlende und zerbrochene Ziegel mit dunklen Lücken, verrutschte Reihen, Moos und Flechten.
8. Sockelmauerwerk aus grauem Naturstein bzw. dunklen Klinkern, robust, leicht unregelmäßig.
9. Dasselbe Sockelmauerwerk, durchfeuchtet: dunkle nasse Bereiche, weiße Salzausblühungen, etwas grüner Bewuchs.
10. Schmales senkrechtes Fassadenband eines Treppenhauses: Glasbausteine bzw. senkrechte Putzfaschen in etwas dunklerem Beige, nahtlos nach oben und unten fortsetzbar.
11. Schmaler Bodenstreifen von der Seite: gepflegter kurzer Rasen über einer dünnen Schicht Erde, gleichmäßig.
12. Derselbe Bodenstreifen, ungepflegt: trockenes gelbliches Gras, kahle Erdstellen, etwas Unkraut.
13. Derselbe Bodenstreifen, mit Schnee bedeckt, leicht bläuliche Schatten.

Halte dich an den vereinbarten Stil des Spiels.
```

---

## sheet_02.png – Gebäude-Objekte (1/2)

Raster 4×4, ergibt: window_old.png, window_new.png, balcony.png, door_entrance.png, door_entrance_new.png, door_broken.png, chimney.png, smoke.png, solar_panels.png, heat_pump.png, boiler_ok.png, boiler_broken.png, tree_spring.png, tree_summer.png, tree_autumn.png, tree_winter.png

```
Erstelle EIN Bild im Format 1024×1024 als Sammelblatt (Sprite-Sheet) mit einem exakten Raster aus 4 Spalten × 4 Zeilen gleich großer Felder.
Regeln für das Raster:
- Alle Felder exakt gleich groß, KEINE Rahmen, KEINE Trennlinien, KEINE Abstände zwischen den Feldern, KEINE Nummern oder Beschriftungen.
- Jedes Motiv bleibt vollständig innerhalb seines Feldes und ragt nicht in Nachbarfelder.
- Reihenfolge: zeilenweise von links oben nach rechts unten.
- Jedes Objekt steht einzeln und frei in seinem Feld auf transparentem Hintergrund, mit etwas Abstand zu den Feldrändern. Bei den Fenstern sind die Glasflächen transparent.
- Der gesamte Hintergrund ist transparent (PNG mit Alphakanal).

Inhalt der Felder:
1. Ein einzelnes altes zweiflügeliges Holzfenster in Frontalansicht: braun gestrichener Holzrahmen mit Mittelsprosse und Quersprosse, steinerne Fensterbank unten. Die GLASFLÄCHEN müssen KOMPLETT TRANSPARENT sein (nur Rahmen, Sprossen und Fensterbank sichtbar).
2. Ein einzelnes modernes Kunststofffenster in Frontalansicht: weißer, schlanker Rahmen, Mittelpfosten, helle Fensterbank. Die GLASFLÄCHEN müssen KOMPLETT TRANSPARENT sein (nur Rahmen und Fensterbank sichtbar).
3. Ein langes, flaches Balkongeländer in Frontalansicht aus dunkelgrau lackiertem Metall mit senkrechten Stäben und schmalem Handlauf, sehr breites Querformat.
4. Klassische Haustür eines Mietshauses der 60er Jahre in Frontalansicht: dunkelbraunes Holz mit kleinem Glaseinsatz, Türgriff, Stufe davor, kleines Vordach.
5. Moderne Haustür in Frontalansicht: anthrazit, mit Glasstreifen, Edelstahlgriff, daneben Klingelanlage mit Kamera, kleines Vordach.
6. Dieselbe alte Haustür, beschädigt: Scheibe gesprungen, Tür steht einen Spalt offen, Kratzer, defekter Türschließer.
7. Ein gemauerter Schornstein aus rotbraunen Ziegeln mit Abdeckplatte, Frontalansicht, schmal und hoch.
8. Eine weiche, hellgraue Rauchwolke aus mehreren runden Puffs, halbtransparent wirkend.
9. Ein Feld aus 4×2 dunkelblauen Photovoltaikmodulen mit silbernem Rahmen, leicht schräg von vorne gesehen, als läge es auf einem Dach.
10. Ein Außengerät einer Luft-Wärmepumpe in Frontalansicht: hellgraues Gehäuse mit großem runden Lüftergitter, auf kleinen Füßen.
11. Ein Heizkessel im Keller in Frontalansicht: weißes Gehäuse mit Rohren, Manometer und kleiner Anzeige mit grünem Licht, im Sichtfenster eine blaue Flamme.
12. Derselbe Heizkessel mit Störung: rotes Warnlicht, ein Warndreieck-Aufkleber, kleine Dampfwolke, eine Pfütze darunter, keine Flamme.
13. Ein freistehender Laubbaum (Linde) im Frühling: hellgrünes junges Laub, ein paar weiße Blüten, Stamm sichtbar.
14. Derselbe Baum im Sommer: dichte, sattgrüne Krone.
15. Derselbe Baum im Herbst: Krone in Orange-, Rot- und Gelbtönen, einige fallende Blätter.
16. Derselbe Baum im Winter: kahle Äste, etwas Schnee auf den Ästen.

Halte dich an den vereinbarten Stil des Spiels.
```

---

## sheet_03.png – Gebäude-Objekte (2/2)

Raster 4×4, ergibt: bins.png, bins_overflow.png, bikes.png, flowers.png, scaffold.png, graffiti.png, mold_spot.png, crack.png, rat.png, sign_for_rent.png

```
Erstelle EIN Bild im Format 1024×1024 als Sammelblatt (Sprite-Sheet) mit einem exakten Raster aus 4 Spalten × 4 Zeilen gleich großer Felder.
Regeln für das Raster:
- Alle Felder exakt gleich groß, KEINE Rahmen, KEINE Trennlinien, KEINE Abstände zwischen den Feldern, KEINE Nummern oder Beschriftungen.
- Jedes Motiv bleibt vollständig innerhalb seines Feldes und ragt nicht in Nachbarfelder.
- Reihenfolge: zeilenweise von links oben nach rechts unten.
- Jedes Objekt steht einzeln und frei in seinem Feld auf transparentem Hintergrund, mit etwas Abstand zu den Feldrändern. Bei den Fenstern sind die Glasflächen transparent.
- Der gesamte Hintergrund ist transparent (PNG mit Alphakanal).
- Die letzten 6 Feld(er) bleiben leer (transparent).

Inhalt der Felder:
1. Zwei ordentliche Mülltonnen nebeneinander (grau für Restmüll, blau für Papier), Deckel geschlossen, Frontalansicht.
2. Dieselben Mülltonnen überquellend, Deckel offen, daneben zwei prall gefüllte Müllsäcke und ein Karton.
3. Ein Fahrradständer aus Metallbügeln mit zwei abgestellten Fahrrädern in Seitenansicht, eines mit Korb.
4. Ein schmales, langes Blumenbeet mit bunten Blumen (rot, gelb, lila) und etwas Grün, flaches Querformat.
5. Ein Ausschnitt eines Baugerüsts aus Stahlrohren mit Holzbohlen und diagonaler Strebe, Frontalansicht, so gestaltet, dass es sich nahtlos nebeneinander und übereinander wiederholen lässt. Zwischenräume transparent.
6. Ein schnell gesprühter, unleserlicher bunter Graffiti-Schriftzug (Tag) mit Farbnasen – abstrakt, keine lesbaren Wörter.
7. Ein unregelmäßiger dunkler Feuchte-/Schimmelfleck mit grünlich-schwarzen Rändern.
8. Ein verzweigter Putzriss, dunkle feine Linie mit kleinen Abplatzungen, senkrecht verlaufend.
9. Eine kleine graue Ratte in Seitenansicht, freundlich-comichaft, nicht eklig.
10. Ein kleines rechteckiges Schild, wie es innen ans Fenster gehängt wird, weißer Grund mit blauem Rand und einem stilisierten Haus-mit-Schlüssel-Symbol. KEIN Text.

Halte dich an den vereinbarten Stil des Spiels.
```

---

## sheet_04.png – Mieterporträts (1/4)

Raster 3×3, ergibt: quiet_longterm_1.png, quiet_longterm_2.png, quiet_longterm_3.png, young_family_1.png, young_family_2.png, young_family_3.png, busy_professional_1.png, busy_professional_2.png, busy_professional_3.png

```
Erstelle EIN Bild im Format 1024×1024 als Sammelblatt (Sprite-Sheet) mit einem exakten Raster aus 3 Spalten × 3 Zeilen gleich großer Felder.
Regeln für das Raster:
- Alle Felder exakt gleich groß, KEINE Rahmen, KEINE Trennlinien, KEINE Abstände zwischen den Feldern, KEINE Nummern oder Beschriftungen.
- Jedes Motiv bleibt vollständig innerhalb seines Feldes und ragt nicht in Nachbarfelder.
- Reihenfolge: zeilenweise von links oben nach rechts unten.
- Jedes Feld ist ein eigenes quadratisches Porträt (Kopf und Schultern) mit eigenem ruhigen Pastell-Hintergrund. Alle Porträts im gleichen Stil.

Inhalt der Felder:
1. Porträt (Kopf und Schultern) eines Mieters: Mann um 70, graue kurze Haare, Strickjacke, sanftes Lächeln, heller Hautton. Lebenssituation: Ruhiger Langzeitmieter – Schätzt Beständigkeit, meldet sich selten, bleibt gerne lange. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.
2. Porträt (Kopf und Schultern) eines Mieters: Frau Mitte 50, kurze dunkle Haare, Brille, Bluse, dunkelbrauner Hautton. Lebenssituation: Ruhiger Langzeitmieter – Schätzt Beständigkeit, meldet sich selten, bleibt gerne lange. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.
3. Porträt (Kopf und Schultern) eines Mieters: Mann Anfang 40 mit gepflegtem Bart, Hemd, ruhiger Blick, olivfarbener Hautton. Lebenssituation: Ruhiger Langzeitmieter – Schätzt Beständigkeit, meldet sich selten, bleibt gerne lange. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.
4. Porträt (Kopf und Schultern) eines Mieters: junges Paar Anfang 30 mit Kleinkind auf dem Arm, mittelbrauner Hautton bzw. heller Hautton. Lebenssituation: Junge Familie – Braucht Platz, freut sich über Fahrradkeller und Hof, etwas lauter. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.
5. Porträt (Kopf und Schultern) eines Mieters: Mutter Mitte 30 mit zwei Kindern, dunkelbrauner Hautton. Lebenssituation: Junge Familie – Braucht Platz, freut sich über Fahrradkeller und Hof, etwas lauter. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.
6. Porträt (Kopf und Schultern) eines Mieters: Vater Ende 20 mit Baby im Tragetuch, heller Hautton mit Sommersprossen. Lebenssituation: Junge Familie – Braucht Platz, freut sich über Fahrradkeller und Hof, etwas lauter. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.
7. Porträt (Kopf und Schultern) eines Mieters: Frau Mitte 30 im Blazer mit Smartphone, olivfarbener Hautton. Lebenssituation: Beruflich stark eingespannt – Zahlt zuverlässig, erwartet aber schnelle Reaktionen und moderne Ausstattung. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.
8. Porträt (Kopf und Schultern) eines Mieters: Mann Ende 30, Hemd ohne Krawatte, Laptoptasche über der Schulter, dunkelbrauner Hautton. Lebenssituation: Beruflich stark eingespannt – Zahlt zuverlässig, erwartet aber schnelle Reaktionen und moderne Ausstattung. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.
9. Porträt (Kopf und Schultern) eines Mieters: Person Anfang 40 mit kurzen Haaren, Rollkragenpullover, Kaffeebecher, heller Hautton. Lebenssituation: Beruflich stark eingespannt – Zahlt zuverlässig, erwartet aber schnelle Reaktionen und moderne Ausstattung. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels.
```

---

## sheet_05.png – Mieterporträts (2/4)

Raster 3×3, ergibt: student_1.png, student_2.png, student_3.png, handy_1.png, handy_2.png, handy_3.png, demanding_1.png, demanding_2.png, demanding_3.png

```
Erstelle EIN Bild im Format 1024×1024 als Sammelblatt (Sprite-Sheet) mit einem exakten Raster aus 3 Spalten × 3 Zeilen gleich großer Felder.
Regeln für das Raster:
- Alle Felder exakt gleich groß, KEINE Rahmen, KEINE Trennlinien, KEINE Abstände zwischen den Feldern, KEINE Nummern oder Beschriftungen.
- Jedes Motiv bleibt vollständig innerhalb seines Feldes und ragt nicht in Nachbarfelder.
- Reihenfolge: zeilenweise von links oben nach rechts unten.
- Jedes Feld ist ein eigenes quadratisches Porträt (Kopf und Schultern) mit eigenem ruhigen Pastell-Hintergrund. Alle Porträts im gleichen Stil.

Inhalt der Felder:
1. Porträt (Kopf und Schultern) eines Mieters: junge Frau Anfang 20 mit Locken und Hoodie, mittelbrauner Hautton. Lebenssituation: Preisbewusster Student – Kleines Budget, tolerant gegenüber Altbaucharme, zieht nach dem Studium oft weiter. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.
2. Porträt (Kopf und Schultern) eines Mieters: junger Mann Anfang 20 mit Brille und Rucksack, heller Hautton. Lebenssituation: Preisbewusster Student – Kleines Budget, tolerant gegenüber Altbaucharme, zieht nach dem Studium oft weiter. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.
3. Porträt (Kopf und Schultern) eines Mieters: junge Frau Mitte 20 mit Kopfhörern um den Hals und Jeansjacke, ostasiatische Gesichtszüge. Lebenssituation: Preisbewusster Student – Kleines Budget, tolerant gegenüber Altbaucharme, zieht nach dem Studium oft weiter. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.
4. Porträt (Kopf und Schultern) eines Mieters: Frau Mitte 40 in Arbeitslatzhose mit Werkzeuggürtel, heller Hautton. Lebenssituation: Handwerklich begabt – Repariert Kleinigkeiten gerne selbst und hilft auch mal im Haus. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.
5. Porträt (Kopf und Schultern) eines Mieters: Mann um 60 mit Schiebermütze und Akkuschrauber, dunkelbrauner Hautton. Lebenssituation: Handwerklich begabt – Repariert Kleinigkeiten gerne selbst und hilft auch mal im Haus. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.
6. Porträt (Kopf und Schultern) eines Mieters: junger Mann mit kariertem Hemd und Zollstock in der Brusttasche, olivfarbener Hautton. Lebenssituation: Handwerklich begabt – Repariert Kleinigkeiten gerne selbst und hilft auch mal im Haus. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.
7. Porträt (Kopf und Schultern) eines Mieters: Frau Mitte 50, elegant, Seidenhalstuch, prüfender Blick, heller Hautton. Lebenssituation: Anspruchsvoller Mieter – Hat hohe Erwartungen an Zustand und Service – zahlt dafür auch mehr. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.
8. Porträt (Kopf und Schultern) eines Mieters: Mann Mitte 40 im Anzug, kritisch hochgezogene Augenbraue, mittelbrauner Hautton. Lebenssituation: Anspruchsvoller Mieter – Hat hohe Erwartungen an Zustand und Service – zahlt dafür auch mehr. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.
9. Porträt (Kopf und Schultern) eines Mieters: Person Ende 30 mit Designerbrille, minimalistischer Kleidung, südasiatische Gesichtszüge. Lebenssituation: Anspruchsvoller Mieter – Hat hohe Erwartungen an Zustand und Service – zahlt dafür auch mehr. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels.
```

---

## sheet_06.png – Mieterporträts (3/4)

Raster 3×3, ergibt: helpful_neighbor_1.png, helpful_neighbor_2.png, helpful_neighbor_3.png, temp_financial_1.png, temp_financial_2.png, temp_financial_3.png, gardener_1.png, gardener_2.png, gardener_3.png

```
Erstelle EIN Bild im Format 1024×1024 als Sammelblatt (Sprite-Sheet) mit einem exakten Raster aus 3 Spalten × 3 Zeilen gleich großer Felder.
Regeln für das Raster:
- Alle Felder exakt gleich groß, KEINE Rahmen, KEINE Trennlinien, KEINE Abstände zwischen den Feldern, KEINE Nummern oder Beschriftungen.
- Jedes Motiv bleibt vollständig innerhalb seines Feldes und ragt nicht in Nachbarfelder.
- Reihenfolge: zeilenweise von links oben nach rechts unten.
- Jedes Feld ist ein eigenes quadratisches Porträt (Kopf und Schultern) mit eigenem ruhigen Pastell-Hintergrund. Alle Porträts im gleichen Stil.

Inhalt der Felder:
1. Porträt (Kopf und Schultern) eines Mieters: ältere Frau um 70 mit Paket im Arm und warmem Lächeln, dunkelbrauner Hautton. Lebenssituation: Hilfsbereiter Nachbar – Kennt alle im Haus, nimmt Pakete an und schlichtet Streit. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.
2. Porträt (Kopf und Schultern) eines Mieters: Mann Mitte 50 mit Einkaufstasche, freundlich, heller Hautton. Lebenssituation: Hilfsbereiter Nachbar – Kennt alle im Haus, nimmt Pakete an und schlichtet Streit. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.
3. Porträt (Kopf und Schultern) eines Mieters: junge Frau Ende 20, hält lächelnd eine Tür auf, olivfarbener Hautton. Lebenssituation: Hilfsbereiter Nachbar – Kennt alle im Haus, nimmt Pakete an und schlichtet Streit. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.
4. Porträt (Kopf und Schultern) eines Mieters: Mann Mitte 30 im Pullover, nachdenklich aber zuversichtlich, heller Hautton. Lebenssituation: Vorübergehend finanziell klamm – Gerade in einer schwierigen Phase – mit Entgegenkommen oft ein treuer Mieter. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.
5. Porträt (Kopf und Schultern) eines Mieters: Frau Anfang 40 mit dem Schulranzen ihres Kindes, müde aber freundlich, mittelbrauner Hautton. Lebenssituation: Vorübergehend finanziell klamm – Gerade in einer schwierigen Phase – mit Entgegenkommen oft ein treuer Mieter. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.
6. Porträt (Kopf und Schultern) eines Mieters: Person Ende 20 mit Kellnerschürze, optimistisch, ostasiatische Gesichtszüge. Lebenssituation: Vorübergehend finanziell klamm – Gerade in einer schwierigen Phase – mit Entgegenkommen oft ein treuer Mieter. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.
7. Porträt (Kopf und Schultern) eines Mieters: Frau um 60 mit Strohhut und Pflanzkelle, heller Hautton. Lebenssituation: Begeisterte Hobbygärtnerin – Pflegt Hof und Beete mit Hingabe, wenn man sie lässt. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.
8. Porträt (Kopf und Schultern) eines Mieters: Mann Mitte 30 mit Gartenhandschuhen und Tomatenpflanze, dunkelbrauner Hautton. Lebenssituation: Begeisterte Hobbygärtnerin – Pflegt Hof und Beete mit Hingabe, wenn man sie lässt. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.
9. Porträt (Kopf und Schultern) eines Mieters: Frau Ende 20 mit Kräutertopf, olivfarbener Hautton. Lebenssituation: Begeisterte Hobbygärtnerin – Pflegt Hof und Beete mit Hingabe, wenn man sie lässt. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels.
```

---

## sheet_07.png – Mieterporträts (4/4)

Raster 3×3, ergibt: high_energy_1.png, high_energy_2.png, high_energy_3.png, frequent_caller_1.png, frequent_caller_2.png, frequent_caller_3.png

```
Erstelle EIN Bild im Format 1024×1024 als Sammelblatt (Sprite-Sheet) mit einem exakten Raster aus 3 Spalten × 3 Zeilen gleich großer Felder.
Regeln für das Raster:
- Alle Felder exakt gleich groß, KEINE Rahmen, KEINE Trennlinien, KEINE Abstände zwischen den Feldern, KEINE Nummern oder Beschriftungen.
- Jedes Motiv bleibt vollständig innerhalb seines Feldes und ragt nicht in Nachbarfelder.
- Reihenfolge: zeilenweise von links oben nach rechts unten.
- Jedes Feld ist ein eigenes quadratisches Porträt (Kopf und Schultern) mit eigenem ruhigen Pastell-Hintergrund. Alle Porträts im gleichen Stil.
- Die letzten 3 Feld(er) bleiben leer (neutrales Hellgrau).

Inhalt der Felder:
1. Porträt (Kopf und Schultern) eines Mieters: junger Mann mit Gaming-Headset und Kapuzenpulli, mittelbrauner Hautton. Lebenssituation: Hoher Energieverbrauch – Heizt gern warm, arbeitet viel von zu Hause – Heizkosten sind ein Thema. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.
2. Porträt (Kopf und Schultern) eines Mieters: Frau Mitte 30 in Wolldecke gehüllt mit Teetasse, heller Hautton. Lebenssituation: Hoher Energieverbrauch – Heizt gern warm, arbeitet viel von zu Hause – Heizkosten sind ein Thema. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.
3. Porträt (Kopf und Schultern) eines Mieters: Person Anfang 30 mit Kamera um den Hals, dunkelbrauner Hautton. Lebenssituation: Hoher Energieverbrauch – Heizt gern warm, arbeitet viel von zu Hause – Heizkosten sind ein Thema. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.
4. Porträt (Kopf und Schultern) eines Mieters: Frau Ende 60 mit Telefon am Ohr und Notizblock, heller Hautton. Lebenssituation: Ruft häufig an – Meldet jede Kleinigkeit – das ist anstrengend, verhindert aber teure Folgeschäden. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.
5. Porträt (Kopf und Schultern) eines Mieters: Mann Mitte 40 mit Smartphone am Ohr und Brille, olivfarbener Hautton. Lebenssituation: Ruft häufig an – Meldet jede Kleinigkeit – das ist anstrengend, verhindert aber teure Folgeschäden. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.
6. Porträt (Kopf und Schultern) eines Mieters: Frau Mitte 30 mit Klemmbrett und Stift, dunkelbrauner Hautton. Lebenssituation: Ruft häufig an – Meldet jede Kleinigkeit – das ist anstrengend, verhindert aber teure Folgeschäden. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels.
```

---

## sheet_08.png – Ereignis-Illustrationen (1/7)

Raster 2×2, ergibt: storm.png, heavy_rain.png, frost.png, heatwave.png

```
Erstelle EIN Bild im Format 1536×1024 als Sammelblatt (Sprite-Sheet) mit einem exakten Raster aus 2 Spalten × 2 Zeilen gleich großer Felder.
Regeln für das Raster:
- Alle Felder exakt gleich groß, KEINE Rahmen, KEINE Trennlinien, KEINE Abstände zwischen den Feldern, KEINE Nummern oder Beschriftungen.
- Jedes Motiv bleibt vollständig innerhalb seines Feldes und ragt nicht in Nachbarfelder.
- Reihenfolge: zeilenweise von links oben nach rechts unten.
- Jedes Feld ist eine eigene kleine Szene im Querformat, Motiv mittig.

Inhalt der Felder:
1. Ein Mietshaus im Sturm: der Baum biegt sich, Dachziegel fliegen, dunkle Wolken, Regen peitscht von der Seite.
2. Starkregen über dem Hof eines Mietshauses: Wasser staut sich, Pfützen, überlaufender Gully, Wasser drückt in ein Kellerfenster.
3. Strenger Frost: Eiszapfen an der Dachrinne, beschlagene Fenster, verschneiter Hof, eine Person mit Schal pustet in die Hände.
4. Hitzewelle: flirrende Luft über den Dächern, grelle Sonne, geschlossene Rollläden, eine Person fächelt sich auf dem Balkon Luft zu.

Halte dich an den vereinbarten Stil des Spiels.
```

---

## sheet_09.png – Ereignis-Illustrationen (2/7)

Raster 2×2, ergibt: energy_price_shock.png, material_price_rise.png, new_contractor.png, subsidy_program.png

```
Erstelle EIN Bild im Format 1536×1024 als Sammelblatt (Sprite-Sheet) mit einem exakten Raster aus 2 Spalten × 2 Zeilen gleich großer Felder.
Regeln für das Raster:
- Alle Felder exakt gleich groß, KEINE Rahmen, KEINE Trennlinien, KEINE Abstände zwischen den Feldern, KEINE Nummern oder Beschriftungen.
- Jedes Motiv bleibt vollständig innerhalb seines Feldes und ragt nicht in Nachbarfelder.
- Reihenfolge: zeilenweise von links oben nach rechts unten.
- Jedes Feld ist eine eigene kleine Szene im Querformat, Motiv mittig.

Inhalt der Felder:
1. Ein Gaszähler bzw. Stromzähler im Keller, daneben eine Rechnung und ein steil nach oben zeigender Pfeil-Graph (ohne Zahlen und ohne Text).
2. Baustoffe auf Paletten (Zement, Ziegel, Dämmplatten) mit Preisschildern, auf denen nur nach oben zeigende Pfeile zu sehen sind (keine Zahlen).
3. Ein Handwerkertransporter vor dem Haus, eine freundliche Handwerkerin in Arbeitskleidung mit Werkzeugkoffer winkt.
4. Ein Schreibtisch mit Bescheid (Siegel/Stempel, kein lesbarer Text), Taschenrechner und Skizze eines gedämmten Hauses mit Sonne.

Halte dich an den vereinbarten Stil des Spiels.
```

---

## sheet_10.png – Ereignis-Illustrationen (3/7)

Raster 2×2, ergibt: energy_audit.png, neighbor_conflict.png, community_party.png, tenant_job_loss.png

```
Erstelle EIN Bild im Format 1536×1024 als Sammelblatt (Sprite-Sheet) mit einem exakten Raster aus 2 Spalten × 2 Zeilen gleich großer Felder.
Regeln für das Raster:
- Alle Felder exakt gleich groß, KEINE Rahmen, KEINE Trennlinien, KEINE Abstände zwischen den Feldern, KEINE Nummern oder Beschriftungen.
- Jedes Motiv bleibt vollständig innerhalb seines Feldes und ragt nicht in Nachbarfelder.
- Reihenfolge: zeilenweise von links oben nach rechts unten.
- Jedes Feld ist eine eigene kleine Szene im Querformat, Motiv mittig.

Inhalt der Felder:
1. Ein Energieberater mit Wärmebildkamera vor der Fassade, auf dem Kameradisplay farbige Wärmeverluste (rot/gelb an Fenstern und Dach).
2. Zwei Nachbarn diskutieren gestikulierend im Treppenhaus vor ihren Wohnungstüren, angespannte, aber nicht aggressive Stimmung.
3. Fröhliches Hoffest: Lichterketten, Biertischgarnitur, Grill, Nachbarn verschiedenen Alters lachen zusammen, Kinder spielen.
4. Eine Person sitzt nachdenklich am Küchentisch mit Papieren und Taschenrechner, abends, warmes Lampenlicht – ernst, aber würdevoll.

Halte dich an den vereinbarten Stil des Spiels.
```

---

## sheet_11.png – Ereignis-Illustrationen (4/7)

Raster 2×2, ergibt: fire_inspection.png, kitchen_request.png, garden_volunteer.png, diy_stairwell.png

```
Erstelle EIN Bild im Format 1536×1024 als Sammelblatt (Sprite-Sheet) mit einem exakten Raster aus 2 Spalten × 2 Zeilen gleich großer Felder.
Regeln für das Raster:
- Alle Felder exakt gleich groß, KEINE Rahmen, KEINE Trennlinien, KEINE Abstände zwischen den Feldern, KEINE Nummern oder Beschriftungen.
- Jedes Motiv bleibt vollständig innerhalb seines Feldes und ragt nicht in Nachbarfelder.
- Reihenfolge: zeilenweise von links oben nach rechts unten.
- Jedes Feld ist eine eigene kleine Szene im Querformat, Motiv mittig.

Inhalt der Felder:
1. Eine Prüferin mit Klemmbrett im Treppenhaus zeigt auf einen Rauchwarnmelder an der Decke, daneben ein Feuerlöscher.
2. Eine alte, abgenutzte Küche, daneben schwebend ein Katalogbild einer modernen hellen Einbauküche.
3. Eine Mieterin pflanzt im Hof Blumen in Hochbeete, Gießkanne, Sonnenschein.
4. Ein Mieter streicht auf einer Leiter das Treppenhaus in frischer heller Farbe, Farbeimer und Abdeckfolie.

Halte dich an den vereinbarten Stil des Spiels.
```

---

## sheet_12.png – Ereignis-Illustrationen (5/7)

Raster 2×2, ergibt: vandalism.png, bridge_loan.png, chimney_sweep.png, pipe_warning.png

```
Erstelle EIN Bild im Format 1536×1024 als Sammelblatt (Sprite-Sheet) mit einem exakten Raster aus 2 Spalten × 2 Zeilen gleich großer Felder.
Regeln für das Raster:
- Alle Felder exakt gleich groß, KEINE Rahmen, KEINE Trennlinien, KEINE Abstände zwischen den Feldern, KEINE Nummern oder Beschriftungen.
- Jedes Motiv bleibt vollständig innerhalb seines Feldes und ragt nicht in Nachbarfelder.
- Reihenfolge: zeilenweise von links oben nach rechts unten.
- Jedes Feld ist eine eigene kleine Szene im Querformat, Motiv mittig.

Inhalt der Felder:
1. Der Hauseingang am Morgen: Graffiti an der Wand, beschädigte Briefkästen, die Haustür steht offen.
2. Gespräch in einer Bankfiliale: Beraterin und Kunde am Tisch, Unterlagen, ernste aber konstruktive Atmosphäre.
3. Ein Schornsteinfeger in schwarzer Kluft mit Zylinder, Kehrbesen und Leine auf dem Dach neben dem Schornstein.
4. Ein korrodiertes Wasserrohr im Keller mit Rostflecken und einem kleinen Tropfen, darunter eine kleine Pfütze, Taschenlampenlicht.

Halte dich an den vereinbarten Stil des Spiels.
```

---

## sheet_13.png – Ereignis-Illustrationen (6/7)

Raster 2×2, ergibt: insurance_offer.png, helpful_neighbor.png, investor_inquiry.png, press_praise.png

```
Erstelle EIN Bild im Format 1536×1024 als Sammelblatt (Sprite-Sheet) mit einem exakten Raster aus 2 Spalten × 2 Zeilen gleich großer Felder.
Regeln für das Raster:
- Alle Felder exakt gleich groß, KEINE Rahmen, KEINE Trennlinien, KEINE Abstände zwischen den Feldern, KEINE Nummern oder Beschriftungen.
- Jedes Motiv bleibt vollständig innerhalb seines Feldes und ragt nicht in Nachbarfelder.
- Reihenfolge: zeilenweise von links oben nach rechts unten.
- Jedes Feld ist eine eigene kleine Szene im Querformat, Motiv mittig.

Inhalt der Felder:
1. Ein Versicherungsmakler überreicht eine Mappe mit Schutzschild-Symbol vor dem Haus.
2. Eine Nachbarin nimmt ein Paket an und reicht es lächelnd einem anderen Nachbarn im Treppenhaus.
3. Ein Mann und eine Frau in Business-Kleidung betrachten das Mietshaus von der Straße aus, einer hält ein Tablet.
4. Eine aufgeschlagene Lokalzeitung auf einem Tisch, darauf ein großes Foto des gepflegten Mietshauses (Überschrift nur als unlesbare Linien).

Halte dich an den vereinbarten Stil des Spiels.
```

---

## sheet_14.png – Ereignis-Illustrationen (7/7)

Raster 2×2, ergibt: generic.png

```
Erstelle EIN Bild im Format 1536×1024 als Sammelblatt (Sprite-Sheet) mit einem exakten Raster aus 2 Spalten × 2 Zeilen gleich großer Felder.
Regeln für das Raster:
- Alle Felder exakt gleich groß, KEINE Rahmen, KEINE Trennlinien, KEINE Abstände zwischen den Feldern, KEINE Nummern oder Beschriftungen.
- Jedes Motiv bleibt vollständig innerhalb seines Feldes und ragt nicht in Nachbarfelder.
- Reihenfolge: zeilenweise von links oben nach rechts unten.
- Jedes Feld ist eine eigene kleine Szene im Querformat, Motiv mittig.
- Die letzten 3 Feld(er) bleiben leer (neutrales Hellgrau).

Inhalt der Felder:
1. Ein Hausflur mit Briefkastenanlage, ein Brief steckt im Schlitz, freundliches Licht.

Halte dich an den vereinbarten Stil des Spiels.
```

---

## sheet_15.png – Renovierungsmaßnahmen (1/4)

Raster 3×3, ergibt: apt_paint.png, apt_floor.png, apt_kitchen.png, apt_bath.png, apt_full.png, apt_thermostat.png, stairwell_upgrade.png, outdoor_design.png, bike_storage.png

```
Erstelle EIN Bild im Format 1536×1024 als Sammelblatt (Sprite-Sheet) mit einem exakten Raster aus 3 Spalten × 3 Zeilen gleich großer Felder.
Regeln für das Raster:
- Alle Felder exakt gleich groß, KEINE Rahmen, KEINE Trennlinien, KEINE Abstände zwischen den Feldern, KEINE Nummern oder Beschriftungen.
- Jedes Motiv bleibt vollständig innerhalb seines Feldes und ragt nicht in Nachbarfelder.
- Reihenfolge: zeilenweise von links oben nach rechts unten.
- Jedes Feld zeigt das fertige Ergebnis einer Maßnahme als kleine Szene im Querformat.

Inhalt der Felder:
1. Renovierungsmaßnahme „Wände streichen“: Malerarbeiten in allen Räumen. Frischer Eindruck, schnell und günstig. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
2. Renovierungsmaßnahme „Böden erneuern“: Neues Vinyl- oder Parkettboden in Wohn- und Schlafräumen. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
3. Renovierungsmaßnahme „Küche erneuern“: Neue Einbauküche mit energieeffizienten Geräten. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
4. Renovierungsmaßnahme „Bad modernisieren“: Neue Sanitärobjekte, Fliesen, bodengleiche Dusche. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
5. Renovierungsmaßnahme „Komplettsanierung der Wohnung“: Böden, Wände, Küche, Bad und Elektrik – die Wohnung ist danach wie neu. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
6. Renovierungsmaßnahme „Smarte Thermostate“: Programmierbare Heizkörperthermostate senken den Verbrauch der Wohnung. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
7. Renovierungsmaßnahme „Treppenhaus aufwerten“: Neuer Anstrich, Bodenbelag, Briefkastenanlage und Beleuchtung. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
8. Renovierungsmaßnahme „Außenbereich gestalten“: Neue Bepflanzung, Sitzbank, eingehauster Müllplatz. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
9. Renovierungsmaßnahme „Fahrradstellplätze schaffen“: Überdachte, abschließbare Fahrradbügel im Hof. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).

Halte dich an den vereinbarten Stil des Spiels.
```

---

## sheet_16.png – Renovierungsmaßnahmen (2/4)

Raster 3×3, ergibt: laundry_room.png, community_room.png, fire_safety.png, security_upgrade.png, electrical_renewal.png, pipe_renewal.png, basement_seal.png, roof_renovation.png, facade_renewal.png

```
Erstelle EIN Bild im Format 1536×1024 als Sammelblatt (Sprite-Sheet) mit einem exakten Raster aus 3 Spalten × 3 Zeilen gleich großer Felder.
Regeln für das Raster:
- Alle Felder exakt gleich groß, KEINE Rahmen, KEINE Trennlinien, KEINE Abstände zwischen den Feldern, KEINE Nummern oder Beschriftungen.
- Jedes Motiv bleibt vollständig innerhalb seines Feldes und ragt nicht in Nachbarfelder.
- Reihenfolge: zeilenweise von links oben nach rechts unten.
- Jedes Feld zeigt das fertige Ergebnis einer Maßnahme als kleine Szene im Querformat.

Inhalt der Felder:
1. Renovierungsmaßnahme „Waschkeller verbessern“: Gemeinschaftswaschküche mit Anschlüssen, Trockenraum und Lüftung. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
2. Renovierungsmaßnahme „Gemeinschaftsraum einrichten“: Ehemaliger Trockenboden wird zum Treffpunkt für Hausbewohner. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
3. Renovierungsmaßnahme „Brandschutz nachrüsten“: Rauchwarnmelder in allen Wohnungen, Feuerlöscher, Fluchtwegbeschilderung. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
4. Renovierungsmaßnahme „Haustür & Gegensprechanlage“: Neue Haustür mit Sicherheitsschloss und Video-Gegensprechanlage. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
5. Renovierungsmaßnahme „Elektrik erneuern“: Neue Steigleitungen, Zählerschrank und FI-Schutzschalter. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
6. Renovierungsmaßnahme „Strangsanierung“: Erneuerung aller Wasser- und Abwasserstränge. Laut und aufwendig, aber nachhaltig. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
7. Renovierungsmaßnahme „Keller abdichten“: Horizontalsperre und Außenabdichtung gegen aufsteigende Feuchtigkeit. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
8. Renovierungsmaßnahme „Dach sanieren & dämmen“: Neueindeckung mit Aufsparrendämmung. Dicht für Jahrzehnte. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
9. Renovierungsmaßnahme „Fassade erneuern“: Putz ausbessern und neuer Anstrich – ohne Dämmung. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).

Halte dich an den vereinbarten Stil des Spiels.
```

---

## sheet_17.png – Renovierungsmaßnahmen (3/4)

Raster 3×3, ergibt: facade_insulation.png, windows_replace.png, heating_condensing.png, heating_heatpump.png, heating_district.png, hydraulic_balance.png, efficient_pumps.png, led_lighting.png, waste_sorting.png

```
Erstelle EIN Bild im Format 1536×1024 als Sammelblatt (Sprite-Sheet) mit einem exakten Raster aus 3 Spalten × 3 Zeilen gleich großer Felder.
Regeln für das Raster:
- Alle Felder exakt gleich groß, KEINE Rahmen, KEINE Trennlinien, KEINE Abstände zwischen den Feldern, KEINE Nummern oder Beschriftungen.
- Jedes Motiv bleibt vollständig innerhalb seines Feldes und ragt nicht in Nachbarfelder.
- Reihenfolge: zeilenweise von links oben nach rechts unten.
- Jedes Feld zeigt das fertige Ergebnis einer Maßnahme als kleine Szene im Querformat.

Inhalt der Felder:
1. Renovierungsmaßnahme „Fassade dämmen (WDVS)“: Wärmedämmverbundsystem mit neuem Oberputz. Die größte Einzelmaßnahme gegen Wärmeverlust. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
2. Renovierungsmaßnahme „Fenster austauschen“: Dreifach verglaste Kunststofffenster in allen Wohnungen. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
3. Renovierungsmaßnahme „Gas-Brennwertkessel einbauen“: Moderner Brennwertkessel. Bewährt, vergleichsweise günstig. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
4. Renovierungsmaßnahme „Wärmepumpe installieren“: Luft-Wasser-Wärmepumpe. Hohe Investition, sehr effizient – am besten mit gedämmter Hülle. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
5. Renovierungsmaßnahme „Fernwärme anschließen“: Anschluss an das städtische Fernwärmenetz. Wenig Wartung, stabile Preise. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
6. Renovierungsmaßnahme „Hydraulischer Abgleich“: Heizkörper werden optimal mit Wärme versorgt, die Pumpe arbeitet effizient. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
7. Renovierungsmaßnahme „Hocheffizienzpumpen“: Tausch der alten Heizungs- und Zirkulationspumpen. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
8. Renovierungsmaßnahme „LED-Beleuchtung & Bewegungsmelder“: Sparsame Beleuchtung in Treppenhaus, Keller und Außenbereich. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
9. Renovierungsmaßnahme „Mülltrennung verbessern“: Wertstoffinseln, Biotonne und Infotafeln. Weniger Restmüll, geringere Gebühren. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).

Halte dich an den vereinbarten Stil des Spiels.
```

---

## sheet_18.png – Renovierungsmaßnahmen (4/4)

Raster 3×3, ergibt: rainwater.png, solar_pv.png, green_roof.png

```
Erstelle EIN Bild im Format 1536×1024 als Sammelblatt (Sprite-Sheet) mit einem exakten Raster aus 3 Spalten × 3 Zeilen gleich großer Felder.
Regeln für das Raster:
- Alle Felder exakt gleich groß, KEINE Rahmen, KEINE Trennlinien, KEINE Abstände zwischen den Feldern, KEINE Nummern oder Beschriftungen.
- Jedes Motiv bleibt vollständig innerhalb seines Feldes und ragt nicht in Nachbarfelder.
- Reihenfolge: zeilenweise von links oben nach rechts unten.
- Jedes Feld zeigt das fertige Ergebnis einer Maßnahme als kleine Szene im Querformat.
- Die letzten 6 Feld(er) bleiben leer (neutrales Hellgrau).

Inhalt der Felder:
1. Renovierungsmaßnahme „Regenwassernutzung“: Zisterne für Gartenbewässerung und Toilettenspülung im Erdgeschoss. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
2. Renovierungsmaßnahme „Photovoltaikanlage“: Solaranlage mit ca. 24 kWp auf dem Dach. Deckt Allgemeinstrom, Überschuss wird eingespeist. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
3. Renovierungsmaßnahme „Begrünung von Hof und Garagendach“: Extensive Begrünung, Insektenhotel, Hochbeete für Bewohner. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).

Halte dich an den vereinbarten Stil des Spiels.
```

---

## sheet_19.png – Bauteil-Icons

Raster 4×3, ergibt: icon_roof.png, icon_facade.png, icon_windows.png, icon_heating.png, icon_pipes.png, icon_sanitary.png, icon_electrical.png, icon_stairwell.png, icon_basement.png, icon_outdoor.png

```
Erstelle EIN Bild im Format 1536×1024 als Sammelblatt (Sprite-Sheet) mit einem exakten Raster aus 4 Spalten × 3 Zeilen gleich großer Felder.
Regeln für das Raster:
- Alle Felder exakt gleich groß, KEINE Rahmen, KEINE Trennlinien, KEINE Abstände zwischen den Feldern, KEINE Nummern oder Beschriftungen.
- Jedes Motiv bleibt vollständig innerhalb seines Feldes und ragt nicht in Nachbarfelder.
- Reihenfolge: zeilenweise von links oben nach rechts unten.
- Jedes Feld enthält genau ein flaches Icon, zentriert, transparenter Hintergrund.
- Der gesamte Hintergrund ist transparent (PNG mit Alphakanal).
- Die letzten 2 Feld(er) bleiben leer (transparent).

Inhalt der Felder:
1. Flaches Symbol-Icon für das Gebäudebauteil „Dach“ (Eindeckung, Dachstuhl, Rinnen. Schützt vor Nässe und Wärmeverlust.). Klare Silhouette, 2–3 Farben, auf 24 Pixel lesbar.
2. Flaches Symbol-Icon für das Gebäudebauteil „Fassade“ (Putz, Anstrich, ggf. Dämmung. Prägt den ersten Eindruck.). Klare Silhouette, 2–3 Farben, auf 24 Pixel lesbar.
3. Flaches Symbol-Icon für das Gebäudebauteil „Fenster“ (Dichtheit und Wärmeschutz. Undichte Fenster fördern Zugluft und Schimmel.). Klare Silhouette, 2–3 Farben, auf 24 Pixel lesbar.
4. Flaches Symbol-Icon für das Gebäudebauteil „Heizungsanlage“ (Wärmeerzeuger, Pumpen, Verteilung. Bestimmt Heizkosten und Ausfallrisiko.). Klare Silhouette, 2–3 Farben, auf 24 Pixel lesbar.
5. Flaches Symbol-Icon für das Gebäudebauteil „Wasserleitungen“ (Steig- und Fallleitungen. Korrosion führt zu Leckagen und Wasserschäden.). Klare Silhouette, 2–3 Farben, auf 24 Pixel lesbar.
6. Flaches Symbol-Icon für das Gebäudebauteil „Sanitäranlagen“ (Abwasser, Fallrohre, Hebeanlage. Verstopfungen führen zu Rückstau.). Klare Silhouette, 2–3 Farben, auf 24 Pixel lesbar.
7. Flaches Symbol-Icon für das Gebäudebauteil „Elektroinstallation“ (Verteiler, Steigleitungen, Absicherung. Mängel sind sicherheitsrelevant.). Klare Silhouette, 2–3 Farben, auf 24 Pixel lesbar.
8. Flaches Symbol-Icon für das Gebäudebauteil „Treppenhaus“ (Gemeinsamer Eingang, Beleuchtung, Briefkästen. Visitenkarte des Hauses.). Klare Silhouette, 2–3 Farben, auf 24 Pixel lesbar.
9. Flaches Symbol-Icon für das Gebäudebauteil „Keller“ (Abstellräume, Hausanschlüsse. Feuchtigkeit führt zu Schimmel und Lagerproblemen.). Klare Silhouette, 2–3 Farben, auf 24 Pixel lesbar.
10. Flaches Symbol-Icon für das Gebäudebauteil „Außenbereich“ (Hof, Garten, Müllplatz, Zuwege. Ungepflegt zieht er Müll und Ungeziefer an.). Klare Silhouette, 2–3 Farben, auf 24 Pixel lesbar.

Halte dich an den vereinbarten Stil des Spiels.
```

---

## sheet_20.png – Himmel Frühling (ggf. mit Stadtsilhouette)

ergibt: sky_spring.png

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Frühlingshimmel, hellblau mit wenigen weißen Wolken, am unteren Rand eine sehr dezente, blasse Silhouette einer Altstadt (Dächer, Kirchturm). Die Bildmitte unten bleibt frei, dort steht später das Haus.
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 1600:900 beschnitten.
Halte dich an den vereinbarten Stil.
```

---

## sheet_21.png – Himmel Sommer (ggf. mit Stadtsilhouette)

ergibt: sky_summer.png

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Sommerhimmel, kräftiges Blau, Sonne oben rechts, ein, zwei Schönwetterwolken, dezente blasse Stadtsilhouette unten. Bildmitte frei.
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 1600:900 beschnitten.
Halte dich an den vereinbarten Stil.
```

---

## sheet_22.png – Himmel Herbst (ggf. mit Stadtsilhouette)

ergibt: sky_autumn.png

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Herbsthimmel, warmes Pfirsich-/Orangelicht, ziehende graue Wolken, dezente Stadtsilhouette unten. Bildmitte frei.
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 1600:900 beschnitten.
Halte dich an den vereinbarten Stil.
```

---

## sheet_23.png – Himmel Winter (ggf. mit Stadtsilhouette)

ergibt: sky_winter.png

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Winterhimmel, kühles Grau-Blau, leichter Schneefall, verschneite Dächer in der blassen Stadtsilhouette unten. Bildmitte frei.
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 1600:900 beschnitten.
Halte dich an den vereinbarten Stil.
```

---

## sheet_24.png – Startbildschirm (Straßenszene)

ergibt: start.png

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Stimmungsvolle Straßenszene einer deutschen Wohnstraße in der Abenddämmerung: Reihe von Mietshäusern der 50er/60er Jahre, erleuchtete Fenster, Bäume, parkende Fahrräder, warmes Laternenlicht. Weitwinkel, ruhig, gut als unscharfer Hintergrund nutzbar.
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 1920:1080 beschnitten.
Halte dich an den vereinbarten Stil.
```

---

## sheet_25.png – Spiellogo (quadratisch)

ergibt: logo.png

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Spiel-App-Icon: ein stilisiertes Mietshaus mit Satteldach und leuchtenden Fenstern auf dunkelblauem, abgerundetem Quadrat, Dach in Senfgelb/Orange. Einfach, klar, wiedererkennbar.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil.
```

---

## sheet_26.png – Schriftzug „Mietshaus Tycoon“

ergibt: logo_wide.png

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Schriftzug „Mietshaus Tycoon“ (genau diese Schreibweise) in kräftiger, freundlicher Display-Schrift, links daneben das kleine Haus-Icon, Farben Dunkelblau und Senfgelb. Hier IST Text ausdrücklich erwünscht.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil.
```
