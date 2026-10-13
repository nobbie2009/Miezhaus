/**
 * Detaillierte Bildbeschreibungen für die KI-Bilderzeugung (ChatGPT).
 * Ergänzt das Manifest src/content/graphics.ts. Wird von gen-chatgpt-prompts.ts genutzt.
 */
export const STYLE = `Stil für ALLE Bilder (bitte bei jedem Bild exakt einhalten):
- Modernes 2D-Illustrationsspiel, leicht illustrierter Flat-/Semi-Flat-Look, saubere Kanten, dezente Texturen, kein Fotorealismus, kein 3D-Render.
- Reine Frontalansicht (wie eine Fassadenzeichnung), keine Isometrie, keine Schrägperspektive. Licht von oben links, weiche Schatten nach rechts unten.
- Warme, gedeckte Farbpalette: Putz beige/ocker/sand, Ziegel rotbraun, Holz mittelbraun, Grün gedämpft olivgrün, Akzente Senfgelb und Petrolblau. Keine Neonfarben, kein reines Schwarz.
- Freundliche, ruhige Stimmung, mitteleuropäische Stadt (deutsches Mietshaus der 1950er/60er Jahre).
- KEIN Text, keine Buchstaben, keine Logos, keine Wasserzeichen im Bild (außer ausdrücklich verlangt).
- Gleichbleibende Strichstärke und Detailtiefe über alle Bilder, damit alles wie aus einem Guss wirkt. Auch klein (ca. 40 Pixel) noch gut erkennbar.`;

export const DETAILS: Record<string, string> = {
  // Texturen
  'tex.facade_good': 'Glatter, frisch gestrichener mineralischer Fassadenputz in warmem Sandbeige, feine gleichmäßige Körnung, ohne Fenster oder Kanten.',
  'tex.facade_worn': 'Derselbe Fassadenputz wie „gepflegt“, aber verblasst und leicht fleckig, graue Schmutzschlieren, vereinzelte kleine Ausbesserungen, ohne Fenster oder Kanten.',
  'tex.facade_damaged': 'Derselbe Fassadenputz, stark verwittert: Haarrisse, abgeplatzte Stellen mit sichtbarem Mauerwerk darunter, dunkle Feuchteflecken, grünlicher Algenschleier, ohne Fenster oder Kanten.',
  'tex.facade_insulated': 'Moderner, sehr glatter heller Oberputz eines gedämmten Hauses in hellem Cremeweiß mit leichtem Warmton, minimal strukturiert, wirkt neu und hochwertig.',
  'tex.roof_good': 'Rote Tondachziegel (Biberschwanz oder Frankfurter Pfanne) in sauberen Reihen, frontal von vorne gesehen, gleichmäßig, intakt.',
  'tex.roof_worn': 'Dieselben Dachziegel, verwittert und ausgeblichen, Moos in den Fugen, einzelne leicht verschobene Ziegel.',
  'tex.roof_damaged': 'Dieselben Dachziegel, schwer beschädigt: fehlende und zerbrochene Ziegel mit dunklen Lücken, verrutschte Reihen, Moos und Flechten.',
  'tex.basement': 'Sockelmauerwerk aus grauem Naturstein bzw. dunklen Klinkern, robust, leicht unregelmäßig.',
  'tex.basement_damp': 'Dasselbe Sockelmauerwerk, durchfeuchtet: dunkle nasse Bereiche, weiße Salzausblühungen, etwas grüner Bewuchs.',
  'tex.stairwell': 'Schmales senkrechtes Fassadenband eines Treppenhauses: Glasbausteine bzw. senkrechte Putzfaschen in etwas dunklerem Beige, nahtlos nach oben und unten fortsetzbar.',
  'tex.ground_grass': 'Schmaler Bodenstreifen von der Seite: gepflegter kurzer Rasen über einer dünnen Schicht Erde, gleichmäßig.',
  'tex.ground_dry': 'Derselbe Bodenstreifen, ungepflegt: trockenes gelbliches Gras, kahle Erdstellen, etwas Unkraut.',
  'tex.ground_snow': 'Derselbe Bodenstreifen, mit Schnee bedeckt, leicht bläuliche Schatten.',
  // Hintergründe
  'bg.sky_spring': 'Frühlingshimmel, hellblau mit wenigen weißen Wolken, am unteren Rand eine sehr dezente, blasse Silhouette einer Altstadt (Dächer, Kirchturm). Die Bildmitte unten bleibt frei, dort steht später das Haus.',
  'bg.sky_summer': 'Sommerhimmel, kräftiges Blau, Sonne oben rechts, ein, zwei Schönwetterwolken, dezente blasse Stadtsilhouette unten. Bildmitte frei.',
  'bg.sky_autumn': 'Herbsthimmel, warmes Pfirsich-/Orangelicht, ziehende graue Wolken, dezente Stadtsilhouette unten. Bildmitte frei.',
  'bg.sky_winter': 'Winterhimmel, kühles Grau-Blau, leichter Schneefall, verschneite Dächer in der blassen Stadtsilhouette unten. Bildmitte frei.',
  'bg.start': 'Stimmungsvolle Straßenszene einer deutschen Wohnstraße in der Abenddämmerung: Reihe von Mietshäusern der 50er/60er Jahre, erleuchtete Fenster, Bäume, parkende Fahrräder, warmes Laternenlicht. Weitwinkel, ruhig, gut als unscharfer Hintergrund nutzbar.',
  // Sprites
  'spr.window_old': 'Ein einzelnes altes zweiflügeliges Holzfenster in Frontalansicht: braun gestrichener Holzrahmen mit Mittelsprosse und Quersprosse, steinerne Fensterbank unten. Die GLASFLÄCHEN müssen KOMPLETT TRANSPARENT sein (nur Rahmen, Sprossen und Fensterbank sichtbar).',
  'spr.window_new': 'Ein einzelnes modernes Kunststofffenster in Frontalansicht: weißer, schlanker Rahmen, Mittelpfosten, helle Fensterbank. Die GLASFLÄCHEN müssen KOMPLETT TRANSPARENT sein (nur Rahmen und Fensterbank sichtbar).',
  'spr.balcony': 'Ein langes, flaches Balkongeländer in Frontalansicht aus dunkelgrau lackiertem Metall mit senkrechten Stäben und schmalem Handlauf, sehr breites Querformat.',
  'spr.door_entrance': 'Klassische Haustür eines Mietshauses der 60er Jahre in Frontalansicht: dunkelbraunes Holz mit kleinem Glaseinsatz, Türgriff, Stufe davor, kleines Vordach.',
  'spr.door_entrance_new': 'Moderne Haustür in Frontalansicht: anthrazit, mit Glasstreifen, Edelstahlgriff, daneben Klingelanlage mit Kamera, kleines Vordach.',
  'spr.door_broken': 'Dieselbe alte Haustür, beschädigt: Scheibe gesprungen, Tür steht einen Spalt offen, Kratzer, defekter Türschließer.',
  'spr.chimney': 'Ein gemauerter Schornstein aus rotbraunen Ziegeln mit Abdeckplatte, Frontalansicht, schmal und hoch.',
  'spr.smoke': 'Eine weiche, hellgraue Rauchwolke aus mehreren runden Puffs, halbtransparent wirkend.',
  'spr.solar_panels': 'Ein Feld aus 4×2 dunkelblauen Photovoltaikmodulen mit silbernem Rahmen, leicht schräg von vorne gesehen, als läge es auf einem Dach.',
  'spr.heat_pump': 'Ein Außengerät einer Luft-Wärmepumpe in Frontalansicht: hellgraues Gehäuse mit großem runden Lüftergitter, auf kleinen Füßen.',
  'spr.boiler_ok': 'Ein Heizkessel im Keller in Frontalansicht: weißes Gehäuse mit Rohren, Manometer und kleiner Anzeige mit grünem Licht, im Sichtfenster eine blaue Flamme.',
  'spr.boiler_broken': 'Derselbe Heizkessel mit Störung: rotes Warnlicht, ein Warndreieck-Aufkleber, kleine Dampfwolke, eine Pfütze darunter, keine Flamme.',
  'spr.tree_spring': 'Ein freistehender Laubbaum (Linde) im Frühling: hellgrünes junges Laub, ein paar weiße Blüten, Stamm sichtbar.',
  'spr.tree_summer': 'Derselbe Baum im Sommer: dichte, sattgrüne Krone.',
  'spr.tree_autumn': 'Derselbe Baum im Herbst: Krone in Orange-, Rot- und Gelbtönen, einige fallende Blätter.',
  'spr.tree_winter': 'Derselbe Baum im Winter: kahle Äste, etwas Schnee auf den Ästen.',
  'spr.bins': 'Zwei ordentliche Mülltonnen nebeneinander (grau für Restmüll, blau für Papier), Deckel geschlossen, Frontalansicht.',
  'spr.bins_overflow': 'Dieselben Mülltonnen überquellend, Deckel offen, daneben zwei prall gefüllte Müllsäcke und ein Karton.',
  'spr.bikes': 'Ein Fahrradständer aus Metallbügeln mit zwei abgestellten Fahrrädern in Seitenansicht, eines mit Korb.',
  'spr.flowers': 'Ein schmales, langes Blumenbeet mit bunten Blumen (rot, gelb, lila) und etwas Grün, flaches Querformat.',
  'spr.scaffold': 'Ein Ausschnitt eines Baugerüsts aus Stahlrohren mit Holzbohlen und diagonaler Strebe, Frontalansicht, so gestaltet, dass es sich nahtlos nebeneinander und übereinander wiederholen lässt. Zwischenräume transparent.',
  'spr.graffiti': 'Ein schnell gesprühter, unleserlicher bunter Graffiti-Schriftzug (Tag) mit Farbnasen – abstrakt, keine lesbaren Wörter.',
  'spr.mold_spot': 'Ein unregelmäßiger dunkler Feuchte-/Schimmelfleck mit grünlich-schwarzen Rändern.',
  'spr.crack': 'Ein verzweigter Putzriss, dunkle feine Linie mit kleinen Abplatzungen, senkrecht verlaufend.',
  'spr.rat': 'Eine kleine graue Ratte in Seitenansicht, freundlich-comichaft, nicht eklig.',
  'spr.sign_for_rent': 'Ein kleines rechteckiges Schild, wie es innen ans Fenster gehängt wird, weißer Grund mit blauem Rand und einem stilisierten Haus-mit-Schlüssel-Symbol. KEIN Text.',
  // Ereignisse
  'event.storm': 'Ein Mietshaus im Sturm: der Baum biegt sich, Dachziegel fliegen, dunkle Wolken, Regen peitscht von der Seite.',
  'event.heavy_rain': 'Starkregen über dem Hof eines Mietshauses: Wasser staut sich, Pfützen, überlaufender Gully, Wasser drückt in ein Kellerfenster.',
  'event.frost': 'Strenger Frost: Eiszapfen an der Dachrinne, beschlagene Fenster, verschneiter Hof, eine Person mit Schal pustet in die Hände.',
  'event.heatwave': 'Hitzewelle: flirrende Luft über den Dächern, grelle Sonne, geschlossene Rollläden, eine Person fächelt sich auf dem Balkon Luft zu.',
  'event.energy_price_shock': 'Ein Gaszähler bzw. Stromzähler im Keller, daneben eine Rechnung und ein steil nach oben zeigender Pfeil-Graph (ohne Zahlen und ohne Text).',
  'event.material_price_rise': 'Baustoffe auf Paletten (Zement, Ziegel, Dämmplatten) mit Preisschildern, auf denen nur nach oben zeigende Pfeile zu sehen sind (keine Zahlen).',
  'event.new_contractor': 'Ein Handwerkertransporter vor dem Haus, eine freundliche Handwerkerin in Arbeitskleidung mit Werkzeugkoffer winkt.',
  'event.subsidy_program': 'Ein Schreibtisch mit Bescheid (Siegel/Stempel, kein lesbarer Text), Taschenrechner und Skizze eines gedämmten Hauses mit Sonne.',
  'event.energy_audit': 'Ein Energieberater mit Wärmebildkamera vor der Fassade, auf dem Kameradisplay farbige Wärmeverluste (rot/gelb an Fenstern und Dach).',
  'event.neighbor_conflict': 'Zwei Nachbarn diskutieren gestikulierend im Treppenhaus vor ihren Wohnungstüren, angespannte, aber nicht aggressive Stimmung.',
  'event.community_party': 'Fröhliches Hoffest: Lichterketten, Biertischgarnitur, Grill, Nachbarn verschiedenen Alters lachen zusammen, Kinder spielen.',
  'event.tenant_job_loss': 'Eine Person sitzt nachdenklich am Küchentisch mit Papieren und Taschenrechner, abends, warmes Lampenlicht – ernst, aber würdevoll.',
  'event.fire_inspection': 'Eine Prüferin mit Klemmbrett im Treppenhaus zeigt auf einen Rauchwarnmelder an der Decke, daneben ein Feuerlöscher.',
  'event.kitchen_request': 'Eine alte, abgenutzte Küche, daneben schwebend ein Katalogbild einer modernen hellen Einbauküche.',
  'event.garden_volunteer': 'Eine Mieterin pflanzt im Hof Blumen in Hochbeete, Gießkanne, Sonnenschein.',
  'event.diy_stairwell': 'Ein Mieter streicht auf einer Leiter das Treppenhaus in frischer heller Farbe, Farbeimer und Abdeckfolie.',
  'event.vandalism': 'Der Hauseingang am Morgen: Graffiti an der Wand, beschädigte Briefkästen, die Haustür steht offen.',
  'event.bridge_loan': 'Gespräch in einer Bankfiliale: Beraterin und Kunde am Tisch, Unterlagen, ernste aber konstruktive Atmosphäre.',
  'event.chimney_sweep': 'Ein Schornsteinfeger in schwarzer Kluft mit Zylinder, Kehrbesen und Leine auf dem Dach neben dem Schornstein.',
  'event.pipe_warning': 'Ein korrodiertes Wasserrohr im Keller mit Rostflecken und einem kleinen Tropfen, darunter eine kleine Pfütze, Taschenlampenlicht.',
  'event.insurance_offer': 'Ein Versicherungsmakler überreicht eine Mappe mit Schutzschild-Symbol vor dem Haus.',
  'event.helpful_neighbor': 'Eine Nachbarin nimmt ein Paket an und reicht es lächelnd einem anderen Nachbarn im Treppenhaus.',
  'event.investor_inquiry': 'Ein Mann und eine Frau in Business-Kleidung betrachten das Mietshaus von der Straße aus, einer hält ein Tablet.',
  'event.press_praise': 'Eine aufgeschlagene Lokalzeitung auf einem Tisch, darauf ein großes Foto des gepflegten Mietshauses (Überschrift nur als unlesbare Linien).',
  'event.generic': 'Ein Hausflur mit Briefkastenanlage, ein Brief steckt im Schlitz, freundliches Licht.',
  // Logo
  'ui.logo': 'Spiel-App-Icon: ein stilisiertes Mietshaus mit Satteldach und leuchtenden Fenstern auf dunkelblauem, abgerundetem Quadrat, Dach in Senfgelb/Orange. Einfach, klar, wiedererkennbar.',
  'ui.logo_wide': 'Schriftzug „Mietshaus Tycoon“ (genau diese Schreibweise) in kräftiger, freundlicher Display-Schrift, links daneben das kleine Haus-Icon, Farben Dunkelblau und Senfgelb. Hier IST Text ausdrücklich erwünscht.',
};

/** Drei vielfältige Personenbeschreibungen je Mietertyp. Hauttöne bewusst gemischt, unabhängig vom Typ. */
export const PORTRAITS: Record<string, [string, string, string]> = {
  quiet_longterm: ['Mann um 70, graue kurze Haare, Strickjacke, sanftes Lächeln, heller Hautton', 'Frau Mitte 50, kurze dunkle Haare, Brille, Bluse, dunkelbrauner Hautton', 'Mann Anfang 40 mit gepflegtem Bart, Hemd, ruhiger Blick, olivfarbener Hautton'],
  young_family: ['junges Paar Anfang 30 mit Kleinkind auf dem Arm, mittelbrauner Hautton bzw. heller Hautton', 'Mutter Mitte 30 mit zwei Kindern, dunkelbrauner Hautton', 'Vater Ende 20 mit Baby im Tragetuch, heller Hautton mit Sommersprossen'],
  busy_professional: ['Frau Mitte 30 im Blazer mit Smartphone, olivfarbener Hautton', 'Mann Ende 30, Hemd ohne Krawatte, Laptoptasche über der Schulter, dunkelbrauner Hautton', 'Person Anfang 40 mit kurzen Haaren, Rollkragenpullover, Kaffeebecher, heller Hautton'],
  student: ['junge Frau Anfang 20 mit Locken und Hoodie, mittelbrauner Hautton', 'junger Mann Anfang 20 mit Brille und Rucksack, heller Hautton', 'junge Frau Mitte 20 mit Kopfhörern um den Hals und Jeansjacke, ostasiatische Gesichtszüge'],
  handy: ['Frau Mitte 40 in Arbeitslatzhose mit Werkzeuggürtel, heller Hautton', 'Mann um 60 mit Schiebermütze und Akkuschrauber, dunkelbrauner Hautton', 'junger Mann mit kariertem Hemd und Zollstock in der Brusttasche, olivfarbener Hautton'],
  demanding: ['Frau Mitte 50, elegant, Seidenhalstuch, prüfender Blick, heller Hautton', 'Mann Mitte 40 im Anzug, kritisch hochgezogene Augenbraue, mittelbrauner Hautton', 'Person Ende 30 mit Designerbrille, minimalistischer Kleidung, südasiatische Gesichtszüge'],
  helpful_neighbor: ['ältere Frau um 70 mit Paket im Arm und warmem Lächeln, dunkelbrauner Hautton', 'Mann Mitte 50 mit Einkaufstasche, freundlich, heller Hautton', 'junge Frau Ende 20, hält lächelnd eine Tür auf, olivfarbener Hautton'],
  temp_financial: ['Mann Mitte 30 im Pullover, nachdenklich aber zuversichtlich, heller Hautton', 'Frau Anfang 40 mit dem Schulranzen ihres Kindes, müde aber freundlich, mittelbrauner Hautton', 'Person Ende 20 mit Kellnerschürze, optimistisch, ostasiatische Gesichtszüge'],
  gardener: ['Frau um 60 mit Strohhut und Pflanzkelle, heller Hautton', 'Mann Mitte 30 mit Gartenhandschuhen und Tomatenpflanze, dunkelbrauner Hautton', 'Frau Ende 20 mit Kräutertopf, olivfarbener Hautton'],
  high_energy: ['junger Mann mit Gaming-Headset und Kapuzenpulli, mittelbrauner Hautton', 'Frau Mitte 30 in Wolldecke gehüllt mit Teetasse, heller Hautton', 'Person Anfang 30 mit Kamera um den Hals, dunkelbrauner Hautton'],
  frequent_caller: ['Frau Ende 60 mit Telefon am Ohr und Notizblock, heller Hautton', 'Mann Mitte 40 mit Smartphone am Ohr und Brille, olivfarbener Hautton', 'Frau Mitte 30 mit Klemmbrett und Stift, dunkelbrauner Hautton'],
};
