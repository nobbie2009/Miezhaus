# ChatGPT-Prompts für Einzelbilder

Automatisch erzeugt (`npm run gfx:docs`). Schneller geht es mit `docs/CHATGPT_SAMMELBLAETTER.md` (26 Prompts) oder vollautomatisch mit `npm run gfx:generate` (siehe README). Diese Einzel-Prompts eignen sich, um einzelne Motive in höherer Qualität nachzuarbeiten. Dateien exakt wie angegeben benennen, nach `gfx-incoming/` legen, `npm run gfx:import`.

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

## Priorität 1

### 1. Fassadenputz – gepflegt
Dateiname: `facade_good.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Glatter, frisch gestrichener mineralischer Fassadenputz in warmem Sandbeige, feine gleichmäßige Körnung, ohne Fenster oder Kanten.
Das Bild muss NAHTLOS KACHELBAR sein: linke/rechte und obere/untere Kante passen exakt aneinander, keine Vignette, keine auffälligen Einzelelemente, gleichmäßige Beleuchtung, die ganze Fläche ist Material.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 2. Fassadenputz – abgenutzt
Dateiname: `facade_worn.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Derselbe Fassadenputz wie „gepflegt“, aber verblasst und leicht fleckig, graue Schmutzschlieren, vereinzelte kleine Ausbesserungen, ohne Fenster oder Kanten.
Das Bild muss NAHTLOS KACHELBAR sein: linke/rechte und obere/untere Kante passen exakt aneinander, keine Vignette, keine auffälligen Einzelelemente, gleichmäßige Beleuchtung, die ganze Fläche ist Material.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 3. Fassadenputz – beschädigt (Risse, Abplatzungen, Flecken)
Dateiname: `facade_damaged.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Derselbe Fassadenputz, stark verwittert: Haarrisse, abgeplatzte Stellen mit sichtbarem Mauerwerk darunter, dunkle Feuchteflecken, grünlicher Algenschleier, ohne Fenster oder Kanten.
Das Bild muss NAHTLOS KACHELBAR sein: linke/rechte und obere/untere Kante passen exakt aneinander, keine Vignette, keine auffälligen Einzelelemente, gleichmäßige Beleuchtung, die ganze Fläche ist Material.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 4. Dachziegel – intakt
Dateiname: `roof_good.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Rote Tondachziegel (Biberschwanz oder Frankfurter Pfanne) in sauberen Reihen, frontal von vorne gesehen, gleichmäßig, intakt.
Das Bild muss NAHTLOS KACHELBAR sein: linke/rechte und obere/untere Kante passen exakt aneinander, keine Vignette, keine auffälligen Einzelelemente, gleichmäßige Beleuchtung, die ganze Fläche ist Material.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 5. Dachziegel – verwittert, Moos
Dateiname: `roof_worn.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Dieselben Dachziegel, verwittert und ausgeblichen, Moos in den Fugen, einzelne leicht verschobene Ziegel.
Das Bild muss NAHTLOS KACHELBAR sein: linke/rechte und obere/untere Kante passen exakt aneinander, keine Vignette, keine auffälligen Einzelelemente, gleichmäßige Beleuchtung, die ganze Fläche ist Material.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 6. Dachziegel – lückenhaft, verschoben
Dateiname: `roof_damaged.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Dieselben Dachziegel, schwer beschädigt: fehlende und zerbrochene Ziegel mit dunklen Lücken, verrutschte Reihen, Moos und Flechten.
Das Bild muss NAHTLOS KACHELBAR sein: linke/rechte und obere/untere Kante passen exakt aneinander, keine Vignette, keine auffälligen Einzelelemente, gleichmäßige Beleuchtung, die ganze Fläche ist Material.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 7. Kellermauerwerk / Sockel (Naturstein oder Ziegel)
Dateiname: `basement.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Sockelmauerwerk aus grauem Naturstein bzw. dunklen Klinkern, robust, leicht unregelmäßig.
Das Bild muss NAHTLOS KACHELBAR sein: linke/rechte und obere/untere Kante passen exakt aneinander, keine Vignette, keine auffälligen Einzelelemente, gleichmäßige Beleuchtung, die ganze Fläche ist Material.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 8. Fenster alt (Holzrahmen, Sprossen) – Glasfläche transparent lassen
Dateiname: `window_old.png` · 1024×1024 (quadratisch) · Zielgröße 160×168

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Ein einzelnes altes zweiflügeliges Holzfenster in Frontalansicht: braun gestrichener Holzrahmen mit Mittelsprosse und Quersprosse, steinerne Fensterbank unten. Die GLASFLÄCHEN müssen KOMPLETT TRANSPARENT sein (nur Rahmen, Sprossen und Fensterbank sichtbar).
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 9. Fenster neu (weißer Kunststoffrahmen) – Glasfläche transparent
Dateiname: `window_new.png` · 1024×1024 (quadratisch) · Zielgröße 160×168

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Ein einzelnes modernes Kunststofffenster in Frontalansicht: weißer, schlanker Rahmen, Mittelpfosten, helle Fensterbank. Die GLASFLÄCHEN müssen KOMPLETT TRANSPARENT sein (nur Rahmen und Fensterbank sichtbar).
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 10. Haustür
Dateiname: `door_entrance.png` · 1024×1536 (Hochformat) · Zielgröße 112×184

```
Erstelle ein Bild im Format 1024×1536 (Hochformat).
Klassische Haustür eines Mietshauses der 60er Jahre in Frontalansicht: dunkelbraunes Holz mit kleinem Glaseinsatz, Türgriff, Stufe davor, kleines Vordach.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 11. Heizkessel (läuft)
Dateiname: `boiler_ok.png` · 1536×1024 (Querformat) · Zielgröße 144×104

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Ein Heizkessel im Keller in Frontalansicht: weißes Gehäuse mit Rohren, Manometer und kleiner Anzeige mit grünem Licht, im Sichtfenster eine blaue Flamme.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 12. Heizkessel (Störung/Ausfall)
Dateiname: `boiler_broken.png` · 1536×1024 (Querformat) · Zielgröße 144×104

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Derselbe Heizkessel mit Störung: rotes Warnlicht, ein Warndreieck-Aufkleber, kleine Dampfwolke, eine Pfütze darunter, keine Flamme.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 13. Ruhiger Langzeitmieter – Variante 1
Dateiname: `quiet_longterm_1.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Porträt (Kopf und Schultern) eines Mieters: Mann um 70, graue kurze Haare, Strickjacke, sanftes Lächeln, heller Hautton. Lebenssituation: Ruhiger Langzeitmieter – Schätzt Beständigkeit, meldet sich selten, bleibt gerne lange. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 14. Junge Familie – Variante 1
Dateiname: `young_family_1.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Porträt (Kopf und Schultern) eines Mieters: junges Paar Anfang 30 mit Kleinkind auf dem Arm, mittelbrauner Hautton bzw. heller Hautton. Lebenssituation: Junge Familie – Braucht Platz, freut sich über Fahrradkeller und Hof, etwas lauter. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 15. Beruflich stark eingespannt – Variante 1
Dateiname: `busy_professional_1.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Porträt (Kopf und Schultern) eines Mieters: Frau Mitte 30 im Blazer mit Smartphone, olivfarbener Hautton. Lebenssituation: Beruflich stark eingespannt – Zahlt zuverlässig, erwartet aber schnelle Reaktionen und moderne Ausstattung. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 16. Preisbewusster Student – Variante 1
Dateiname: `student_1.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Porträt (Kopf und Schultern) eines Mieters: junge Frau Anfang 20 mit Locken und Hoodie, mittelbrauner Hautton. Lebenssituation: Preisbewusster Student – Kleines Budget, tolerant gegenüber Altbaucharme, zieht nach dem Studium oft weiter. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 17. Handwerklich begabt – Variante 1
Dateiname: `handy_1.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Porträt (Kopf und Schultern) eines Mieters: Frau Mitte 40 in Arbeitslatzhose mit Werkzeuggürtel, heller Hautton. Lebenssituation: Handwerklich begabt – Repariert Kleinigkeiten gerne selbst und hilft auch mal im Haus. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 18. Anspruchsvoller Mieter – Variante 1
Dateiname: `demanding_1.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Porträt (Kopf und Schultern) eines Mieters: Frau Mitte 50, elegant, Seidenhalstuch, prüfender Blick, heller Hautton. Lebenssituation: Anspruchsvoller Mieter – Hat hohe Erwartungen an Zustand und Service – zahlt dafür auch mehr. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 19. Hilfsbereiter Nachbar – Variante 1
Dateiname: `helpful_neighbor_1.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Porträt (Kopf und Schultern) eines Mieters: ältere Frau um 70 mit Paket im Arm und warmem Lächeln, dunkelbrauner Hautton. Lebenssituation: Hilfsbereiter Nachbar – Kennt alle im Haus, nimmt Pakete an und schlichtet Streit. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 20. Vorübergehend finanziell klamm – Variante 1
Dateiname: `temp_financial_1.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Porträt (Kopf und Schultern) eines Mieters: Mann Mitte 30 im Pullover, nachdenklich aber zuversichtlich, heller Hautton. Lebenssituation: Vorübergehend finanziell klamm – Gerade in einer schwierigen Phase – mit Entgegenkommen oft ein treuer Mieter. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 21. Begeisterte Hobbygärtnerin – Variante 1
Dateiname: `gardener_1.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Porträt (Kopf und Schultern) eines Mieters: Frau um 60 mit Strohhut und Pflanzkelle, heller Hautton. Lebenssituation: Begeisterte Hobbygärtnerin – Pflegt Hof und Beete mit Hingabe, wenn man sie lässt. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 22. Hoher Energieverbrauch – Variante 1
Dateiname: `high_energy_1.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Porträt (Kopf und Schultern) eines Mieters: junger Mann mit Gaming-Headset und Kapuzenpulli, mittelbrauner Hautton. Lebenssituation: Hoher Energieverbrauch – Heizt gern warm, arbeitet viel von zu Hause – Heizkosten sind ein Thema. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 23. Ruft häufig an – Variante 1
Dateiname: `frequent_caller_1.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Porträt (Kopf und Schultern) eines Mieters: Frau Ende 60 mit Telefon am Ohr und Notizblock, heller Hautton. Lebenssituation: Ruft häufig an – Meldet jede Kleinigkeit – das ist anstrengend, verhindert aber teure Folgeschäden. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 24. Spiellogo (quadratisch)
Dateiname: `logo.png` · 1024×1024 (quadratisch) · Zielgröße 512×512

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Spiel-App-Icon: ein stilisiertes Mietshaus mit Satteldach und leuchtenden Fenstern auf dunkelblauem, abgerundetem Quadrat, Dach in Senfgelb/Orange. Einfach, klar, wiedererkennbar.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

## Priorität 2

### 25. Fassade gedämmt (glatter, heller Oberputz)
Dateiname: `facade_insulated.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Moderner, sehr glatter heller Oberputz eines gedämmten Hauses in hellem Cremeweiß mit leichtem Warmton, minimal strukturiert, wirkt neu und hochwertig.
Das Bild muss NAHTLOS KACHELBAR sein: linke/rechte und obere/untere Kante passen exakt aneinander, keine Vignette, keine auffälligen Einzelelemente, gleichmäßige Beleuchtung, die ganze Fläche ist Material.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 26. Kellermauerwerk feucht (Ausblühungen)
Dateiname: `basement_damp.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Dasselbe Sockelmauerwerk, durchfeuchtet: dunkle nasse Bereiche, weiße Salzausblühungen, etwas grüner Bewuchs.
Das Bild muss NAHTLOS KACHELBAR sein: linke/rechte und obere/untere Kante passen exakt aneinander, keine Vignette, keine auffälligen Einzelelemente, gleichmäßige Beleuchtung, die ganze Fläche ist Material.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 27. Treppenhaus-Achse (Glasbausteine/Putzband)
Dateiname: `stairwell.png` · 1024×1536 (Hochformat) · Zielgröße 128×256

```
Erstelle ein Bild im Format 1024×1536 (Hochformat).
Schmales senkrechtes Fassadenband eines Treppenhauses: Glasbausteine bzw. senkrechte Putzfaschen in etwas dunklerem Beige, nahtlos nach oben und unten fortsetzbar.
Das Bild muss NAHTLOS KACHELBAR sein: linke/rechte und obere/untere Kante passen exakt aneinander, keine Vignette, keine auffälligen Einzelelemente, gleichmäßige Beleuchtung, die ganze Fläche ist Material.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 28. Rasen gepflegt
Dateiname: `ground_grass.png` · 1536×1024 (Querformat) · Zielgröße 256×64

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Schmaler Bodenstreifen von der Seite: gepflegter kurzer Rasen über einer dünnen Schicht Erde, gleichmäßig.
Das Bild muss NAHTLOS KACHELBAR sein: linke/rechte und obere/untere Kante passen exakt aneinander, keine Vignette, keine auffälligen Einzelelemente, gleichmäßige Beleuchtung, die ganze Fläche ist Material.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 29. Rasen verwildert/trocken
Dateiname: `ground_dry.png` · 1536×1024 (Querformat) · Zielgröße 256×64

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Derselbe Bodenstreifen, ungepflegt: trockenes gelbliches Gras, kahle Erdstellen, etwas Unkraut.
Das Bild muss NAHTLOS KACHELBAR sein: linke/rechte und obere/untere Kante passen exakt aneinander, keine Vignette, keine auffälligen Einzelelemente, gleichmäßige Beleuchtung, die ganze Fläche ist Material.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 30. Boden verschneit
Dateiname: `ground_snow.png` · 1536×1024 (Querformat) · Zielgröße 256×64

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Derselbe Bodenstreifen, mit Schnee bedeckt, leicht bläuliche Schatten.
Das Bild muss NAHTLOS KACHELBAR sein: linke/rechte und obere/untere Kante passen exakt aneinander, keine Vignette, keine auffälligen Einzelelemente, gleichmäßige Beleuchtung, die ganze Fläche ist Material.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 31. Himmel Frühling (ggf. mit Stadtsilhouette)
Dateiname: `sky_spring.png` · 1536×1024 (Querformat) · Zielgröße 1600×900

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Frühlingshimmel, hellblau mit wenigen weißen Wolken, am unteren Rand eine sehr dezente, blasse Silhouette einer Altstadt (Dächer, Kirchturm). Die Bildmitte unten bleibt frei, dort steht später das Haus.
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 1600:900 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 32. Himmel Sommer (ggf. mit Stadtsilhouette)
Dateiname: `sky_summer.png` · 1536×1024 (Querformat) · Zielgröße 1600×900

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Sommerhimmel, kräftiges Blau, Sonne oben rechts, ein, zwei Schönwetterwolken, dezente blasse Stadtsilhouette unten. Bildmitte frei.
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 1600:900 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 33. Himmel Herbst (ggf. mit Stadtsilhouette)
Dateiname: `sky_autumn.png` · 1536×1024 (Querformat) · Zielgröße 1600×900

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Herbsthimmel, warmes Pfirsich-/Orangelicht, ziehende graue Wolken, dezente Stadtsilhouette unten. Bildmitte frei.
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 1600:900 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 34. Himmel Winter (ggf. mit Stadtsilhouette)
Dateiname: `sky_winter.png` · 1536×1024 (Querformat) · Zielgröße 1600×900

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Winterhimmel, kühles Grau-Blau, leichter Schneefall, verschneite Dächer in der blassen Stadtsilhouette unten. Bildmitte frei.
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 1600:900 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 35. Balkongeländer
Dateiname: `balcony.png` · 1536×1024 (Querformat) · Zielgröße 416×48

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Ein langes, flaches Balkongeländer in Frontalansicht aus dunkelgrau lackiertem Metall mit senkrechten Stäben und schmalem Handlauf, sehr breites Querformat.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 36. Schornstein
Dateiname: `chimney.png` · 1024×1536 (Hochformat) · Zielgröße 64×144

```
Erstelle ein Bild im Format 1024×1536 (Hochformat).
Ein gemauerter Schornstein aus rotbraunen Ziegeln mit Abdeckplatte, Frontalansicht, schmal und hoch.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 37. Photovoltaik-Feld (Draufsicht schräg)
Dateiname: `solar_panels.png` · 1536×1024 (Querformat) · Zielgröße 320×120

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Ein Feld aus 4×2 dunkelblauen Photovoltaikmodulen mit silbernem Rahmen, leicht schräg von vorne gesehen, als läge es auf einem Dach.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 38. Wärmepumpen-Außengerät
Dateiname: `heat_pump.png` · 1024×1024 (quadratisch) · Zielgröße 136×120

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Ein Außengerät einer Luft-Wärmepumpe in Frontalansicht: hellgraues Gehäuse mit großem runden Lüftergitter, auf kleinen Füßen.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 39. Baum Frühling
Dateiname: `tree_spring.png` · 1024×1536 (Hochformat) · Zielgröße 160×240

```
Erstelle ein Bild im Format 1024×1536 (Hochformat).
Ein freistehender Laubbaum (Linde) im Frühling: hellgrünes junges Laub, ein paar weiße Blüten, Stamm sichtbar.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 40. Baum Sommer
Dateiname: `tree_summer.png` · 1024×1536 (Hochformat) · Zielgröße 160×240

```
Erstelle ein Bild im Format 1024×1536 (Hochformat).
Derselbe Baum im Sommer: dichte, sattgrüne Krone.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 41. Baum Herbst
Dateiname: `tree_autumn.png` · 1024×1536 (Hochformat) · Zielgröße 160×240

```
Erstelle ein Bild im Format 1024×1536 (Hochformat).
Derselbe Baum im Herbst: Krone in Orange-, Rot- und Gelbtönen, einige fallende Blätter.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 42. Baum Winter (kahl)
Dateiname: `tree_winter.png` · 1024×1536 (Hochformat) · Zielgröße 160×240

```
Erstelle ein Bild im Format 1024×1536 (Hochformat).
Derselbe Baum im Winter: kahle Äste, etwas Schnee auf den Ästen.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 43. Mülltonnen ordentlich
Dateiname: `bins.png` · 1536×1024 (Querformat) · Zielgröße 120×80

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Zwei ordentliche Mülltonnen nebeneinander (grau für Restmüll, blau für Papier), Deckel geschlossen, Frontalansicht.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 44. Mülltonnen überquellend, Müllsäcke
Dateiname: `bins_overflow.png` · 1536×1024 (Querformat) · Zielgröße 140×80

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Dieselben Mülltonnen überquellend, Deckel offen, daneben zwei prall gefüllte Müllsäcke und ein Karton.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 45. Baugerüst (kachelbar, transparent)
Dateiname: `scaffold.png` · 1024×1024 (quadratisch) · Zielgröße 128×128

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Ein Ausschnitt eines Baugerüsts aus Stahlrohren mit Holzbohlen und diagonaler Strebe, Frontalansicht, so gestaltet, dass es sich nahtlos nebeneinander und übereinander wiederholen lässt. Zwischenräume transparent.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 46. Ruhiger Langzeitmieter – Variante 2
Dateiname: `quiet_longterm_2.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Porträt (Kopf und Schultern) eines Mieters: Frau Mitte 50, kurze dunkle Haare, Brille, Bluse, dunkelbrauner Hautton. Lebenssituation: Ruhiger Langzeitmieter – Schätzt Beständigkeit, meldet sich selten, bleibt gerne lange. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 47. Ruhiger Langzeitmieter – Variante 3
Dateiname: `quiet_longterm_3.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Porträt (Kopf und Schultern) eines Mieters: Mann Anfang 40 mit gepflegtem Bart, Hemd, ruhiger Blick, olivfarbener Hautton. Lebenssituation: Ruhiger Langzeitmieter – Schätzt Beständigkeit, meldet sich selten, bleibt gerne lange. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 48. Junge Familie – Variante 2
Dateiname: `young_family_2.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Porträt (Kopf und Schultern) eines Mieters: Mutter Mitte 30 mit zwei Kindern, dunkelbrauner Hautton. Lebenssituation: Junge Familie – Braucht Platz, freut sich über Fahrradkeller und Hof, etwas lauter. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 49. Junge Familie – Variante 3
Dateiname: `young_family_3.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Porträt (Kopf und Schultern) eines Mieters: Vater Ende 20 mit Baby im Tragetuch, heller Hautton mit Sommersprossen. Lebenssituation: Junge Familie – Braucht Platz, freut sich über Fahrradkeller und Hof, etwas lauter. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 50. Beruflich stark eingespannt – Variante 2
Dateiname: `busy_professional_2.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Porträt (Kopf und Schultern) eines Mieters: Mann Ende 30, Hemd ohne Krawatte, Laptoptasche über der Schulter, dunkelbrauner Hautton. Lebenssituation: Beruflich stark eingespannt – Zahlt zuverlässig, erwartet aber schnelle Reaktionen und moderne Ausstattung. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 51. Beruflich stark eingespannt – Variante 3
Dateiname: `busy_professional_3.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Porträt (Kopf und Schultern) eines Mieters: Person Anfang 40 mit kurzen Haaren, Rollkragenpullover, Kaffeebecher, heller Hautton. Lebenssituation: Beruflich stark eingespannt – Zahlt zuverlässig, erwartet aber schnelle Reaktionen und moderne Ausstattung. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 52. Preisbewusster Student – Variante 2
Dateiname: `student_2.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Porträt (Kopf und Schultern) eines Mieters: junger Mann Anfang 20 mit Brille und Rucksack, heller Hautton. Lebenssituation: Preisbewusster Student – Kleines Budget, tolerant gegenüber Altbaucharme, zieht nach dem Studium oft weiter. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 53. Preisbewusster Student – Variante 3
Dateiname: `student_3.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Porträt (Kopf und Schultern) eines Mieters: junge Frau Mitte 20 mit Kopfhörern um den Hals und Jeansjacke, ostasiatische Gesichtszüge. Lebenssituation: Preisbewusster Student – Kleines Budget, tolerant gegenüber Altbaucharme, zieht nach dem Studium oft weiter. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 54. Handwerklich begabt – Variante 2
Dateiname: `handy_2.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Porträt (Kopf und Schultern) eines Mieters: Mann um 60 mit Schiebermütze und Akkuschrauber, dunkelbrauner Hautton. Lebenssituation: Handwerklich begabt – Repariert Kleinigkeiten gerne selbst und hilft auch mal im Haus. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 55. Handwerklich begabt – Variante 3
Dateiname: `handy_3.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Porträt (Kopf und Schultern) eines Mieters: junger Mann mit kariertem Hemd und Zollstock in der Brusttasche, olivfarbener Hautton. Lebenssituation: Handwerklich begabt – Repariert Kleinigkeiten gerne selbst und hilft auch mal im Haus. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 56. Anspruchsvoller Mieter – Variante 2
Dateiname: `demanding_2.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Porträt (Kopf und Schultern) eines Mieters: Mann Mitte 40 im Anzug, kritisch hochgezogene Augenbraue, mittelbrauner Hautton. Lebenssituation: Anspruchsvoller Mieter – Hat hohe Erwartungen an Zustand und Service – zahlt dafür auch mehr. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 57. Anspruchsvoller Mieter – Variante 3
Dateiname: `demanding_3.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Porträt (Kopf und Schultern) eines Mieters: Person Ende 30 mit Designerbrille, minimalistischer Kleidung, südasiatische Gesichtszüge. Lebenssituation: Anspruchsvoller Mieter – Hat hohe Erwartungen an Zustand und Service – zahlt dafür auch mehr. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 58. Hilfsbereiter Nachbar – Variante 2
Dateiname: `helpful_neighbor_2.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Porträt (Kopf und Schultern) eines Mieters: Mann Mitte 50 mit Einkaufstasche, freundlich, heller Hautton. Lebenssituation: Hilfsbereiter Nachbar – Kennt alle im Haus, nimmt Pakete an und schlichtet Streit. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 59. Hilfsbereiter Nachbar – Variante 3
Dateiname: `helpful_neighbor_3.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Porträt (Kopf und Schultern) eines Mieters: junge Frau Ende 20, hält lächelnd eine Tür auf, olivfarbener Hautton. Lebenssituation: Hilfsbereiter Nachbar – Kennt alle im Haus, nimmt Pakete an und schlichtet Streit. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 60. Vorübergehend finanziell klamm – Variante 2
Dateiname: `temp_financial_2.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Porträt (Kopf und Schultern) eines Mieters: Frau Anfang 40 mit dem Schulranzen ihres Kindes, müde aber freundlich, mittelbrauner Hautton. Lebenssituation: Vorübergehend finanziell klamm – Gerade in einer schwierigen Phase – mit Entgegenkommen oft ein treuer Mieter. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 61. Vorübergehend finanziell klamm – Variante 3
Dateiname: `temp_financial_3.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Porträt (Kopf und Schultern) eines Mieters: Person Ende 20 mit Kellnerschürze, optimistisch, ostasiatische Gesichtszüge. Lebenssituation: Vorübergehend finanziell klamm – Gerade in einer schwierigen Phase – mit Entgegenkommen oft ein treuer Mieter. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 62. Begeisterte Hobbygärtnerin – Variante 2
Dateiname: `gardener_2.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Porträt (Kopf und Schultern) eines Mieters: Mann Mitte 30 mit Gartenhandschuhen und Tomatenpflanze, dunkelbrauner Hautton. Lebenssituation: Begeisterte Hobbygärtnerin – Pflegt Hof und Beete mit Hingabe, wenn man sie lässt. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 63. Begeisterte Hobbygärtnerin – Variante 3
Dateiname: `gardener_3.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Porträt (Kopf und Schultern) eines Mieters: Frau Ende 20 mit Kräutertopf, olivfarbener Hautton. Lebenssituation: Begeisterte Hobbygärtnerin – Pflegt Hof und Beete mit Hingabe, wenn man sie lässt. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 64. Hoher Energieverbrauch – Variante 2
Dateiname: `high_energy_2.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Porträt (Kopf und Schultern) eines Mieters: Frau Mitte 30 in Wolldecke gehüllt mit Teetasse, heller Hautton. Lebenssituation: Hoher Energieverbrauch – Heizt gern warm, arbeitet viel von zu Hause – Heizkosten sind ein Thema. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 65. Hoher Energieverbrauch – Variante 3
Dateiname: `high_energy_3.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Porträt (Kopf und Schultern) eines Mieters: Person Anfang 30 mit Kamera um den Hals, dunkelbrauner Hautton. Lebenssituation: Hoher Energieverbrauch – Heizt gern warm, arbeitet viel von zu Hause – Heizkosten sind ein Thema. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 66. Ruft häufig an – Variante 2
Dateiname: `frequent_caller_2.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Porträt (Kopf und Schultern) eines Mieters: Mann Mitte 40 mit Smartphone am Ohr und Brille, olivfarbener Hautton. Lebenssituation: Ruft häufig an – Meldet jede Kleinigkeit – das ist anstrengend, verhindert aber teure Folgeschäden. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 67. Ruft häufig an – Variante 3
Dateiname: `frequent_caller_3.png` · 1024×1024 (quadratisch) · Zielgröße 256×256

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Porträt (Kopf und Schultern) eines Mieters: Frau Mitte 30 mit Klemmbrett und Stift, dunkelbrauner Hautton. Lebenssituation: Ruft häufig an – Meldet jede Kleinigkeit – das ist anstrengend, verhindert aber teure Folgeschäden. Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.

Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 68. Sturm über dem Haus
Dateiname: `storm.png` · 1536×1024 (Querformat) · Zielgröße 1200×500

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Ein Mietshaus im Sturm: der Baum biegt sich, Dachziegel fliegen, dunkle Wolken, Regen peitscht von der Seite.
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 1200:500 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 69. Starkregen, Wasser im Hof
Dateiname: `heavy_rain.png` · 1536×1024 (Querformat) · Zielgröße 1200×500

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Starkregen über dem Hof eines Mietshauses: Wasser staut sich, Pfützen, überlaufender Gully, Wasser drückt in ein Kellerfenster.
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 1200:500 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 70. Strenger Frost, Eiszapfen
Dateiname: `frost.png` · 1536×1024 (Querformat) · Zielgröße 1200×500

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Strenger Frost: Eiszapfen an der Dachrinne, beschlagene Fenster, verschneiter Hof, eine Person mit Schal pustet in die Hände.
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 1200:500 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 71. Steigende Energiepreise (Zähler/Rechnung)
Dateiname: `energy_price_shock.png` · 1536×1024 (Querformat) · Zielgröße 1200×500

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Ein Gaszähler bzw. Stromzähler im Keller, daneben eine Rechnung und ein steil nach oben zeigender Pfeil-Graph (ohne Zahlen und ohne Text).
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 1200:500 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 72. Streit im Treppenhaus
Dateiname: `neighbor_conflict.png` · 1536×1024 (Querformat) · Zielgröße 1200×500

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Zwei Nachbarn diskutieren gestikulierend im Treppenhaus vor ihren Wohnungstüren, angespannte, aber nicht aggressive Stimmung.
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 1200:500 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 73. Mieter in finanzieller Sorge
Dateiname: `tenant_job_loss.png` · 1536×1024 (Querformat) · Zielgröße 1200×500

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Eine Person sitzt nachdenklich am Küchentisch mit Papieren und Taschenrechner, abends, warmes Lampenlicht – ernst, aber würdevoll.
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 1200:500 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 74. Allgemeines Ereignis (Briefkasten/Hausflur)
Dateiname: `generic.png` · 1536×1024 (Querformat) · Zielgröße 1200×500

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Ein Hausflur mit Briefkastenanlage, ein Brief steckt im Schlitz, freundliches Licht.
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 1200:500 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 75. Schriftzug „Mietshaus Tycoon“
Dateiname: `logo_wide.png` · 1536×1024 (Querformat) · Zielgröße 1200×300

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Schriftzug „Mietshaus Tycoon“ (genau diese Schreibweise) in kräftiger, freundlicher Display-Schrift, links daneben das kleine Haus-Icon, Farben Dunkelblau und Senfgelb. Hier IST Text ausdrücklich erwünscht.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

## Priorität 3

### 76. Startbildschirm (Straßenszene)
Dateiname: `start.png` · 1536×1024 (Querformat) · Zielgröße 1920×1080

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Stimmungsvolle Straßenszene einer deutschen Wohnstraße in der Abenddämmerung: Reihe von Mietshäusern der 50er/60er Jahre, erleuchtete Fenster, Bäume, parkende Fahrräder, warmes Laternenlicht. Weitwinkel, ruhig, gut als unscharfer Hintergrund nutzbar.
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 1920:1080 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 77. Haustür modern mit Klingelanlage
Dateiname: `door_entrance_new.png` · 1024×1536 (Hochformat) · Zielgröße 112×184

```
Erstelle ein Bild im Format 1024×1536 (Hochformat).
Moderne Haustür in Frontalansicht: anthrazit, mit Glasstreifen, Edelstahlgriff, daneben Klingelanlage mit Kamera, kleines Vordach.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 78. Haustür beschädigt/offen
Dateiname: `door_broken.png` · 1024×1536 (Hochformat) · Zielgröße 112×184

```
Erstelle ein Bild im Format 1024×1536 (Hochformat).
Dieselbe alte Haustür, beschädigt: Scheibe gesprungen, Tür steht einen Spalt offen, Kratzer, defekter Türschließer.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 79. Rauchwolke
Dateiname: `smoke.png` · 1024×1024 (quadratisch) · Zielgröße 96×96

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Eine weiche, hellgraue Rauchwolke aus mehreren runden Puffs, halbtransparent wirkend.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 80. Fahrradständer mit Rädern
Dateiname: `bikes.png` · 1536×1024 (Querformat) · Zielgröße 140×80

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Ein Fahrradständer aus Metallbügeln mit zwei abgestellten Fahrrädern in Seitenansicht, eines mit Korb.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 81. Blumenbeet
Dateiname: `flowers.png` · 1536×1024 (Querformat) · Zielgröße 140×48

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Ein schmales, langes Blumenbeet mit bunten Blumen (rot, gelb, lila) und etwas Grün, flaches Querformat.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 82. Graffiti-Schmiererei
Dateiname: `graffiti.png` · 1536×1024 (Querformat) · Zielgröße 160×64

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Ein schnell gesprühter, unleserlicher bunter Graffiti-Schriftzug (Tag) mit Farbnasen – abstrakt, keine lesbaren Wörter.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 83. Feuchte-/Schimmelfleck
Dateiname: `mold_spot.png` · 1536×1024 (Querformat) · Zielgröße 96×64

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Ein unregelmäßiger dunkler Feuchte-/Schimmelfleck mit grünlich-schwarzen Rändern.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 84. Putzriss
Dateiname: `crack.png` · 1024×1536 (Hochformat) · Zielgröße 96×128

```
Erstelle ein Bild im Format 1024×1536 (Hochformat).
Ein verzweigter Putzriss, dunkle feine Linie mit kleinen Abplatzungen, senkrecht verlaufend.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 85. Ratte
Dateiname: `rat.png` · 1536×1024 (Querformat) · Zielgröße 48×32

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Eine kleine graue Ratte in Seitenansicht, freundlich-comichaft, nicht eklig.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 86. Schild „Zu vermieten“
Dateiname: `sign_for_rent.png` · 1536×1024 (Querformat) · Zielgröße 120×40

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Ein kleines rechteckiges Schild, wie es innen ans Fenster gehängt wird, weißer Grund mit blauem Rand und einem stilisierten Haus-mit-Schlüssel-Symbol. KEIN Text.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 87. Hitzewelle
Dateiname: `heatwave.png` · 1536×1024 (Querformat) · Zielgröße 1200×500

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Hitzewelle: flirrende Luft über den Dächern, grelle Sonne, geschlossene Rollläden, eine Person fächelt sich auf dem Balkon Luft zu.
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 1200:500 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 88. Baustoffe werden teurer
Dateiname: `material_price_rise.png` · 1536×1024 (Querformat) · Zielgröße 1200×500

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Baustoffe auf Paletten (Zement, Ziegel, Dämmplatten) mit Preisschildern, auf denen nur nach oben zeigende Pfeile zu sehen sind (keine Zahlen).
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 1200:500 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 89. Neuer Handwerksbetrieb
Dateiname: `new_contractor.png` · 1536×1024 (Querformat) · Zielgröße 1200×500

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Ein Handwerkertransporter vor dem Haus, eine freundliche Handwerkerin in Arbeitskleidung mit Werkzeugkoffer winkt.
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 1200:500 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 90. Förderprogramm (Fördermittelbescheid)
Dateiname: `subsidy_program.png` · 1536×1024 (Querformat) · Zielgröße 1200×500

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Ein Schreibtisch mit Bescheid (Siegel/Stempel, kein lesbarer Text), Taschenrechner und Skizze eines gedämmten Hauses mit Sonne.
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 1200:500 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 91. Energieberater mit Wärmebildkamera
Dateiname: `energy_audit.png` · 1536×1024 (Querformat) · Zielgröße 1200×500

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Ein Energieberater mit Wärmebildkamera vor der Fassade, auf dem Kameradisplay farbige Wärmeverluste (rot/gelb an Fenstern und Dach).
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 1200:500 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 92. Hoffest
Dateiname: `community_party.png` · 1536×1024 (Querformat) · Zielgröße 1200×500

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Fröhliches Hoffest: Lichterketten, Biertischgarnitur, Grill, Nachbarn verschiedenen Alters lachen zusammen, Kinder spielen.
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 1200:500 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 93. Brandschutz-Begehung
Dateiname: `fire_inspection.png` · 1536×1024 (Querformat) · Zielgröße 1200×500

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Eine Prüferin mit Klemmbrett im Treppenhaus zeigt auf einen Rauchwarnmelder an der Decke, daneben ein Feuerlöscher.
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 1200:500 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 94. Wunsch nach neuer Küche
Dateiname: `kitchen_request.png` · 1536×1024 (Querformat) · Zielgröße 1200×500

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Eine alte, abgenutzte Küche, daneben schwebend ein Katalogbild einer modernen hellen Einbauküche.
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 1200:500 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 95. Mieterin pflegt den Hof
Dateiname: `garden_volunteer.png` · 1536×1024 (Querformat) · Zielgröße 1200×500

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Eine Mieterin pflanzt im Hof Blumen in Hochbeete, Gießkanne, Sonnenschein.
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 1200:500 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 96. Mieter streicht das Treppenhaus
Dateiname: `diy_stairwell.png` · 1536×1024 (Querformat) · Zielgröße 1200×500

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Ein Mieter streicht auf einer Leiter das Treppenhaus in frischer heller Farbe, Farbeimer und Abdeckfolie.
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 1200:500 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 97. Vandalismus am Eingang
Dateiname: `vandalism.png` · 1536×1024 (Querformat) · Zielgröße 1200×500

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Der Hauseingang am Morgen: Graffiti an der Wand, beschädigte Briefkästen, die Haustür steht offen.
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 1200:500 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 98. Gespräch mit der Bank
Dateiname: `bridge_loan.png` · 1536×1024 (Querformat) · Zielgröße 1200×500

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Gespräch in einer Bankfiliale: Beraterin und Kunde am Tisch, Unterlagen, ernste aber konstruktive Atmosphäre.
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 1200:500 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 99. Schornsteinfeger
Dateiname: `chimney_sweep.png` · 1536×1024 (Querformat) · Zielgröße 1200×500

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Ein Schornsteinfeger in schwarzer Kluft mit Zylinder, Kehrbesen und Leine auf dem Dach neben dem Schornstein.
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 1200:500 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 100. Korrodiertes Wasserrohr
Dateiname: `pipe_warning.png` · 1536×1024 (Querformat) · Zielgröße 1200×500

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Ein korrodiertes Wasserrohr im Keller mit Rostflecken und einem kleinen Tropfen, darunter eine kleine Pfütze, Taschenlampenlicht.
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 1200:500 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 101. Versicherungsmakler
Dateiname: `insurance_offer.png` · 1536×1024 (Querformat) · Zielgröße 1200×500

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Ein Versicherungsmakler überreicht eine Mappe mit Schutzschild-Symbol vor dem Haus.
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 1200:500 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 102. Nachbarschaftshilfe
Dateiname: `helpful_neighbor.png` · 1536×1024 (Querformat) · Zielgröße 1200×500

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Eine Nachbarin nimmt ein Paket an und reicht es lächelnd einem anderen Nachbarn im Treppenhaus.
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 1200:500 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 103. Investor besichtigt das Haus
Dateiname: `investor_inquiry.png` · 1536×1024 (Querformat) · Zielgröße 1200×500

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Ein Mann und eine Frau in Business-Kleidung betrachten das Mietshaus von der Straße aus, einer hält ein Tablet.
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 1200:500 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 104. Zeitungsartikel über das Haus
Dateiname: `press_praise.png` · 1536×1024 (Querformat) · Zielgröße 1200×500

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Eine aufgeschlagene Lokalzeitung auf einem Tisch, darauf ein großes Foto des gepflegten Mietshauses (Überschrift nur als unlesbare Linien).
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 1200:500 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 105. Wände streichen
Dateiname: `apt_paint.png` · 1536×1024 (Querformat) · Zielgröße 640×320

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Renovierungsmaßnahme „Wände streichen“: Malerarbeiten in allen Räumen. Frischer Eindruck, schnell und günstig. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 640:320 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 106. Böden erneuern
Dateiname: `apt_floor.png` · 1536×1024 (Querformat) · Zielgröße 640×320

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Renovierungsmaßnahme „Böden erneuern“: Neues Vinyl- oder Parkettboden in Wohn- und Schlafräumen. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 640:320 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 107. Küche erneuern
Dateiname: `apt_kitchen.png` · 1536×1024 (Querformat) · Zielgröße 640×320

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Renovierungsmaßnahme „Küche erneuern“: Neue Einbauküche mit energieeffizienten Geräten. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 640:320 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 108. Bad modernisieren
Dateiname: `apt_bath.png` · 1536×1024 (Querformat) · Zielgröße 640×320

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Renovierungsmaßnahme „Bad modernisieren“: Neue Sanitärobjekte, Fliesen, bodengleiche Dusche. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 640:320 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 109. Komplettsanierung der Wohnung
Dateiname: `apt_full.png` · 1536×1024 (Querformat) · Zielgröße 640×320

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Renovierungsmaßnahme „Komplettsanierung der Wohnung“: Böden, Wände, Küche, Bad und Elektrik – die Wohnung ist danach wie neu. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 640:320 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 110. Smarte Thermostate
Dateiname: `apt_thermostat.png` · 1536×1024 (Querformat) · Zielgröße 640×320

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Renovierungsmaßnahme „Smarte Thermostate“: Programmierbare Heizkörperthermostate senken den Verbrauch der Wohnung. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 640:320 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 111. Treppenhaus aufwerten
Dateiname: `stairwell_upgrade.png` · 1536×1024 (Querformat) · Zielgröße 640×320

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Renovierungsmaßnahme „Treppenhaus aufwerten“: Neuer Anstrich, Bodenbelag, Briefkastenanlage und Beleuchtung. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 640:320 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 112. Außenbereich gestalten
Dateiname: `outdoor_design.png` · 1536×1024 (Querformat) · Zielgröße 640×320

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Renovierungsmaßnahme „Außenbereich gestalten“: Neue Bepflanzung, Sitzbank, eingehauster Müllplatz. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 640:320 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 113. Fahrradstellplätze schaffen
Dateiname: `bike_storage.png` · 1536×1024 (Querformat) · Zielgröße 640×320

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Renovierungsmaßnahme „Fahrradstellplätze schaffen“: Überdachte, abschließbare Fahrradbügel im Hof. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 640:320 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 114. Waschkeller verbessern
Dateiname: `laundry_room.png` · 1536×1024 (Querformat) · Zielgröße 640×320

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Renovierungsmaßnahme „Waschkeller verbessern“: Gemeinschaftswaschküche mit Anschlüssen, Trockenraum und Lüftung. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 640:320 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 115. Gemeinschaftsraum einrichten
Dateiname: `community_room.png` · 1536×1024 (Querformat) · Zielgröße 640×320

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Renovierungsmaßnahme „Gemeinschaftsraum einrichten“: Ehemaliger Trockenboden wird zum Treffpunkt für Hausbewohner. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 640:320 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 116. Brandschutz nachrüsten
Dateiname: `fire_safety.png` · 1536×1024 (Querformat) · Zielgröße 640×320

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Renovierungsmaßnahme „Brandschutz nachrüsten“: Rauchwarnmelder in allen Wohnungen, Feuerlöscher, Fluchtwegbeschilderung. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 640:320 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 117. Haustür & Gegensprechanlage
Dateiname: `security_upgrade.png` · 1536×1024 (Querformat) · Zielgröße 640×320

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Renovierungsmaßnahme „Haustür & Gegensprechanlage“: Neue Haustür mit Sicherheitsschloss und Video-Gegensprechanlage. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 640:320 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 118. Elektrik erneuern
Dateiname: `electrical_renewal.png` · 1536×1024 (Querformat) · Zielgröße 640×320

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Renovierungsmaßnahme „Elektrik erneuern“: Neue Steigleitungen, Zählerschrank und FI-Schutzschalter. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 640:320 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 119. Strangsanierung
Dateiname: `pipe_renewal.png` · 1536×1024 (Querformat) · Zielgröße 640×320

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Renovierungsmaßnahme „Strangsanierung“: Erneuerung aller Wasser- und Abwasserstränge. Laut und aufwendig, aber nachhaltig. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 640:320 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 120. Keller abdichten
Dateiname: `basement_seal.png` · 1536×1024 (Querformat) · Zielgröße 640×320

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Renovierungsmaßnahme „Keller abdichten“: Horizontalsperre und Außenabdichtung gegen aufsteigende Feuchtigkeit. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 640:320 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 121. Dach sanieren & dämmen
Dateiname: `roof_renovation.png` · 1536×1024 (Querformat) · Zielgröße 640×320

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Renovierungsmaßnahme „Dach sanieren & dämmen“: Neueindeckung mit Aufsparrendämmung. Dicht für Jahrzehnte. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 640:320 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 122. Fassade erneuern
Dateiname: `facade_renewal.png` · 1536×1024 (Querformat) · Zielgröße 640×320

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Renovierungsmaßnahme „Fassade erneuern“: Putz ausbessern und neuer Anstrich – ohne Dämmung. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 640:320 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 123. Fassade dämmen (WDVS)
Dateiname: `facade_insulation.png` · 1536×1024 (Querformat) · Zielgröße 640×320

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Renovierungsmaßnahme „Fassade dämmen (WDVS)“: Wärmedämmverbundsystem mit neuem Oberputz. Die größte Einzelmaßnahme gegen Wärmeverlust. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 640:320 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 124. Fenster austauschen
Dateiname: `windows_replace.png` · 1536×1024 (Querformat) · Zielgröße 640×320

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Renovierungsmaßnahme „Fenster austauschen“: Dreifach verglaste Kunststofffenster in allen Wohnungen. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 640:320 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 125. Gas-Brennwertkessel einbauen
Dateiname: `heating_condensing.png` · 1536×1024 (Querformat) · Zielgröße 640×320

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Renovierungsmaßnahme „Gas-Brennwertkessel einbauen“: Moderner Brennwertkessel. Bewährt, vergleichsweise günstig. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 640:320 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 126. Wärmepumpe installieren
Dateiname: `heating_heatpump.png` · 1536×1024 (Querformat) · Zielgröße 640×320

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Renovierungsmaßnahme „Wärmepumpe installieren“: Luft-Wasser-Wärmepumpe. Hohe Investition, sehr effizient – am besten mit gedämmter Hülle. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 640:320 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 127. Fernwärme anschließen
Dateiname: `heating_district.png` · 1536×1024 (Querformat) · Zielgröße 640×320

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Renovierungsmaßnahme „Fernwärme anschließen“: Anschluss an das städtische Fernwärmenetz. Wenig Wartung, stabile Preise. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 640:320 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 128. Hydraulischer Abgleich
Dateiname: `hydraulic_balance.png` · 1536×1024 (Querformat) · Zielgröße 640×320

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Renovierungsmaßnahme „Hydraulischer Abgleich“: Heizkörper werden optimal mit Wärme versorgt, die Pumpe arbeitet effizient. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 640:320 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 129. Hocheffizienzpumpen
Dateiname: `efficient_pumps.png` · 1536×1024 (Querformat) · Zielgröße 640×320

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Renovierungsmaßnahme „Hocheffizienzpumpen“: Tausch der alten Heizungs- und Zirkulationspumpen. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 640:320 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 130. LED-Beleuchtung & Bewegungsmelder
Dateiname: `led_lighting.png` · 1536×1024 (Querformat) · Zielgröße 640×320

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Renovierungsmaßnahme „LED-Beleuchtung & Bewegungsmelder“: Sparsame Beleuchtung in Treppenhaus, Keller und Außenbereich. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 640:320 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 131. Mülltrennung verbessern
Dateiname: `waste_sorting.png` · 1536×1024 (Querformat) · Zielgröße 640×320

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Renovierungsmaßnahme „Mülltrennung verbessern“: Wertstoffinseln, Biotonne und Infotafeln. Weniger Restmüll, geringere Gebühren. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 640:320 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 132. Regenwassernutzung
Dateiname: `rainwater.png` · 1536×1024 (Querformat) · Zielgröße 640×320

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Renovierungsmaßnahme „Regenwassernutzung“: Zisterne für Gartenbewässerung und Toilettenspülung im Erdgeschoss. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 640:320 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 133. Photovoltaikanlage
Dateiname: `solar_pv.png` · 1536×1024 (Querformat) · Zielgröße 640×320

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Renovierungsmaßnahme „Photovoltaikanlage“: Solaranlage mit ca. 24 kWp auf dem Dach. Deckt Allgemeinstrom, Überschuss wird eingespeist. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 640:320 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 134. Begrünung von Hof und Garagendach
Dateiname: `green_roof.png` · 1536×1024 (Querformat) · Zielgröße 640×320

```
Erstelle ein Bild im Format 1536×1024 (Querformat).
Renovierungsmaßnahme „Begrünung von Hof und Garagendach“: Extensive Begrünung, Insektenhotel, Hochbeete für Bewohner. Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).
Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis 640:320 beschnitten.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 135. Dach
Dateiname: `icon_roof.png` · 1024×1024 (quadratisch) · Zielgröße 128×128

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Flaches Symbol-Icon für das Gebäudebauteil „Dach“ (Eindeckung, Dachstuhl, Rinnen. Schützt vor Nässe und Wärmeverlust.). Klare Silhouette, 2–3 Farben, auf 24 Pixel lesbar.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 136. Fassade
Dateiname: `icon_facade.png` · 1024×1024 (quadratisch) · Zielgröße 128×128

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Flaches Symbol-Icon für das Gebäudebauteil „Fassade“ (Putz, Anstrich, ggf. Dämmung. Prägt den ersten Eindruck.). Klare Silhouette, 2–3 Farben, auf 24 Pixel lesbar.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 137. Fenster
Dateiname: `icon_windows.png` · 1024×1024 (quadratisch) · Zielgröße 128×128

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Flaches Symbol-Icon für das Gebäudebauteil „Fenster“ (Dichtheit und Wärmeschutz. Undichte Fenster fördern Zugluft und Schimmel.). Klare Silhouette, 2–3 Farben, auf 24 Pixel lesbar.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 138. Heizungsanlage
Dateiname: `icon_heating.png` · 1024×1024 (quadratisch) · Zielgröße 128×128

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Flaches Symbol-Icon für das Gebäudebauteil „Heizungsanlage“ (Wärmeerzeuger, Pumpen, Verteilung. Bestimmt Heizkosten und Ausfallrisiko.). Klare Silhouette, 2–3 Farben, auf 24 Pixel lesbar.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 139. Wasserleitungen
Dateiname: `icon_pipes.png` · 1024×1024 (quadratisch) · Zielgröße 128×128

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Flaches Symbol-Icon für das Gebäudebauteil „Wasserleitungen“ (Steig- und Fallleitungen. Korrosion führt zu Leckagen und Wasserschäden.). Klare Silhouette, 2–3 Farben, auf 24 Pixel lesbar.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 140. Sanitäranlagen
Dateiname: `icon_sanitary.png` · 1024×1024 (quadratisch) · Zielgröße 128×128

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Flaches Symbol-Icon für das Gebäudebauteil „Sanitäranlagen“ (Abwasser, Fallrohre, Hebeanlage. Verstopfungen führen zu Rückstau.). Klare Silhouette, 2–3 Farben, auf 24 Pixel lesbar.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 141. Elektroinstallation
Dateiname: `icon_electrical.png` · 1024×1024 (quadratisch) · Zielgröße 128×128

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Flaches Symbol-Icon für das Gebäudebauteil „Elektroinstallation“ (Verteiler, Steigleitungen, Absicherung. Mängel sind sicherheitsrelevant.). Klare Silhouette, 2–3 Farben, auf 24 Pixel lesbar.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 142. Treppenhaus
Dateiname: `icon_stairwell.png` · 1024×1024 (quadratisch) · Zielgröße 128×128

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Flaches Symbol-Icon für das Gebäudebauteil „Treppenhaus“ (Gemeinsamer Eingang, Beleuchtung, Briefkästen. Visitenkarte des Hauses.). Klare Silhouette, 2–3 Farben, auf 24 Pixel lesbar.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 143. Keller
Dateiname: `icon_basement.png` · 1024×1024 (quadratisch) · Zielgröße 128×128

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Flaches Symbol-Icon für das Gebäudebauteil „Keller“ (Abstellräume, Hausanschlüsse. Feuchtigkeit führt zu Schimmel und Lagerproblemen.). Klare Silhouette, 2–3 Farben, auf 24 Pixel lesbar.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```

### 144. Außenbereich
Dateiname: `icon_outdoor.png` · 1024×1024 (quadratisch) · Zielgröße 128×128

```
Erstelle ein Bild im Format 1024×1024 (quadratisch).
Flaches Symbol-Icon für das Gebäudebauteil „Außenbereich“ (Hof, Garten, Müllplatz, Zuwege. Ungepflegt zieht er Müll und Ungeziefer an.). Klare Silhouette, 2–3 Farben, auf 24 Pixel lesbar.
Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
```
