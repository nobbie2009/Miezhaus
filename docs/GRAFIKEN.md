# Grafiken & Texturen für Mietshaus Tycoon

Diese Datei wird aus `src/content/graphics.ts` erzeugt (`npx vite-node scripts/gen-graphics-doc.ts`).

Alle Grafiken sind **optional**. Das Spiel sucht beim Start nach `public/gfx/<Pfad>.webp`, dann `.png`, dann `.svg`.
Fehlt eine Datei, wird die eingebaute Vektor-Zeichnung verwendet. Nach dem Ablegen genügt ein Neuladen der Seite;
unter *Einstellungen → Grafiken & Texturen* sieht man, welche Dateien erkannt wurden.

Insgesamt **144 Grafiken** – davon 24 mit Priorität 1, 51 mit Priorität 2.

## Stilvorgaben

- **Perspektive:** reine Frontalansicht (Fassadenansicht, keine Isometrie), Licht von oben links, weiche Schatten nach rechts unten.
- **Stil:** moderner, leicht illustrierter Flat-/Semi-Flat-Look, klare Kanten, wenig Rauschen. Alles muss auch klein (≈ 40 px) noch lesbar sein.
- **Farben:** warme, gedeckte Töne (Putz beige/ocker, Ziegel rotbraun, Holz braun). Keine reinen Schwarztöne – das Spiel hat auch einen Dunkelmodus.
- **Zustände:** Varianten (gut/abgenutzt/beschädigt) zeigen dasselbe Motiv in unterschiedlichem Zustand – gleiche Farbwelt, gleiche Kachelgröße.
- **Texturen** müssen **nahtlos kachelbar** sein (links/rechts und oben/unten), ohne auffällige Wiederholungsmuster.
- **Sprites** mit **transparentem Hintergrund**, Motiv füllt das Format nahezu aus (wenige px Rand).
- **Fenster-Sprites:** nur Rahmen, Sprossen, Fensterbank – die **Glasfläche transparent** lassen; das Spiel färbt das Glas je nach Wohnungsstatus (bewohnt = warmes Licht, leer = hellblau, Renovierung = orange).
- **Porträts:** quadratisch, Kopf/Schulter, neutraler oder leicht farbiger Hintergrund, freundlicher Ausdruck, einheitlicher Stil. Bitte vielfältig (Alter, Geschlecht, Herkunft, Kleidung) und **ohne Klischees** – Archetypen beschreiben Lebenssituationen, nicht Menschengruppen. Drei Varianten je Archetyp, gerne bunt gemischt.
- **Ereignis-Illustrationen:** Querformat 12:5, Motiv mittig (wird ggf. beschnitten), ohne Text.
- **Formate:** WebP (bevorzugt) oder PNG; Logo/Icons auch SVG. Dateinamen exakt wie unten, Kleinbuchstaben.
- **Auflösung:** Angegebene Größen sind Empfehlungen (Retina-tauglich). Texturen werden im Spiel kleiner dargestellt (Fassade 128 px Kachel, Dach 96 px).

## Liste

### Gebäude-Texturen (13)

| Datei (unter public/gfx/) | Inhalt | Größe (px) | Eigenschaften | Priorität | Verwendung |
|---|---|---|---|---|---|
| `textures/facade_good.webp` | Fassadenputz – gepflegt | 256×256 | kachelbar | P1 – wichtig | Fassade bei Zustand ≥ 70 % |
| `textures/facade_worn.webp` | Fassadenputz – abgenutzt | 256×256 | kachelbar | P1 – wichtig | Fassade bei Zustand 45–69 % |
| `textures/facade_damaged.webp` | Fassadenputz – beschädigt (Risse, Abplatzungen, Flecken) | 256×256 | kachelbar | P1 – wichtig | Fassade bei Zustand < 45 % |
| `textures/facade_insulated.webp` | Fassade gedämmt (glatter, heller Oberputz) | 256×256 | kachelbar | P2 – schön | Fassade ab Dämmstufe 2 |
| `textures/roof_good.webp` | Dachziegel – intakt | 256×256 | kachelbar | P1 – wichtig | Dach bei Zustand ≥ 70 % |
| `textures/roof_worn.webp` | Dachziegel – verwittert, Moos | 256×256 | kachelbar | P1 – wichtig | Dach bei Zustand 45–69 % |
| `textures/roof_damaged.webp` | Dachziegel – lückenhaft, verschoben | 256×256 | kachelbar | P1 – wichtig | Dach bei Zustand < 45 % |
| `textures/basement.webp` | Kellermauerwerk / Sockel (Naturstein oder Ziegel) | 256×256 | kachelbar | P1 – wichtig | Sockelzone unter der Erdlinie |
| `textures/basement_damp.webp` | Kellermauerwerk feucht (Ausblühungen) | 256×256 | kachelbar | P2 – schön | Sockel bei Kellerzustand < 50 % oder Feuchteschaden |
| `textures/stairwell.webp` | Treppenhaus-Achse (Glasbausteine/Putzband) | 128×256 | kachelbar | P2 – schön | Senkrechter Streifen Treppenhaus in der Fassade |
| `textures/ground_grass.webp` | Rasen gepflegt | 256×64 | kachelbar | P2 – schön | Boden vor dem Haus, gute Pflege |
| `textures/ground_dry.webp` | Rasen verwildert/trocken | 256×64 | kachelbar | P2 – schön | Boden vor dem Haus, schlechte Pflege |
| `textures/ground_snow.webp` | Boden verschneit | 256×64 | kachelbar | P2 – schön | Boden im Winter |

### Hintergründe (5)

| Datei (unter public/gfx/) | Inhalt | Größe (px) | Eigenschaften | Priorität | Verwendung |
|---|---|---|---|---|---|
| `backgrounds/sky_spring.webp` | Himmel Frühling (ggf. mit Stadtsilhouette) | 1600×900 | – | P2 – schön | Hintergrund der Gebäudeansicht, wird proportional beschnitten |
| `backgrounds/sky_summer.webp` | Himmel Sommer (ggf. mit Stadtsilhouette) | 1600×900 | – | P2 – schön | Hintergrund der Gebäudeansicht, wird proportional beschnitten |
| `backgrounds/sky_autumn.webp` | Himmel Herbst (ggf. mit Stadtsilhouette) | 1600×900 | – | P2 – schön | Hintergrund der Gebäudeansicht, wird proportional beschnitten |
| `backgrounds/sky_winter.webp` | Himmel Winter (ggf. mit Stadtsilhouette) | 1600×900 | – | P2 – schön | Hintergrund der Gebäudeansicht, wird proportional beschnitten |
| `backgrounds/start.webp` | Startbildschirm (Straßenszene) | 1920×1080 | – | P3 – optional | Hintergrund des Hauptmenüs, sehr dezent/unscharf darstellbar |

### Gebäude-Objekte (Sprites) (26)

| Datei (unter public/gfx/) | Inhalt | Größe (px) | Eigenschaften | Priorität | Verwendung |
|---|---|---|---|---|---|
| `sprites/window_old.webp` | Fenster alt (Holzrahmen, Sprossen) – Glasfläche transparent lassen | 160×168 | transparent | P1 – wichtig | Fensterrahmen bei Qualitätsstufe 1–2 (Glasfarbe zeigt Wohnungsstatus) |
| `sprites/window_new.webp` | Fenster neu (weißer Kunststoffrahmen) – Glasfläche transparent | 160×168 | transparent | P1 – wichtig | Fensterrahmen ab Qualitätsstufe 3 |
| `sprites/balcony.webp` | Balkongeländer | 416×48 | transparent | P2 – schön | Unter den Fenstern von Wohnungen mit Balkon |
| `sprites/door_entrance.webp` | Haustür | 112×184 | transparent | P1 – wichtig | Hauseingang |
| `sprites/door_entrance_new.webp` | Haustür modern mit Klingelanlage | 112×184 | transparent | P3 – optional | Hauseingang nach Sicherheitsmodernisierung |
| `sprites/door_broken.webp` | Haustür beschädigt/offen | 112×184 | transparent | P3 – optional | Haustür bei Defekt „Haustür schließt nicht“ |
| `sprites/chimney.webp` | Schornstein | 64×144 | transparent | P2 – schön | Dach (bei Öl/Gas mit Rauch animiert) |
| `sprites/smoke.webp` | Rauchwolke | 96×96 | transparent | P3 – optional | Über dem Schornstein in der Heizperiode |
| `sprites/solar_panels.webp` | Photovoltaik-Feld (Draufsicht schräg) | 320×120 | transparent | P2 – schön | Auf dem Dach nach PV-Installation |
| `sprites/heat_pump.webp` | Wärmepumpen-Außengerät | 136×120 | transparent | P2 – schön | Neben dem Haus bei Wärmepumpe |
| `sprites/boiler_ok.webp` | Heizkessel (läuft) | 144×104 | transparent | P1 – wichtig | Keller, Heizung in Ordnung |
| `sprites/boiler_broken.webp` | Heizkessel (Störung/Ausfall) | 144×104 | transparent | P1 – wichtig | Keller, bei Heizungsausfall |
| `sprites/tree_spring.webp` | Baum Frühling | 160×240 | transparent | P2 – schön | Links neben dem Haus |
| `sprites/tree_summer.webp` | Baum Sommer | 160×240 | transparent | P2 – schön | Links neben dem Haus |
| `sprites/tree_autumn.webp` | Baum Herbst | 160×240 | transparent | P2 – schön | Links neben dem Haus |
| `sprites/tree_winter.webp` | Baum Winter (kahl) | 160×240 | transparent | P2 – schön | Links neben dem Haus |
| `sprites/bins.webp` | Mülltonnen ordentlich | 120×80 | transparent | P2 – schön | Rechts neben dem Haus |
| `sprites/bins_overflow.webp` | Mülltonnen überquellend, Müllsäcke | 140×80 | transparent | P2 – schön | Bei schlechter Außenpflege |
| `sprites/bikes.webp` | Fahrradständer mit Rädern | 140×80 | transparent | P3 – optional | Nach Ausstattung „Fahrradstellplätze“ |
| `sprites/flowers.webp` | Blumenbeet | 140×48 | transparent | P3 – optional | Nach Ausstattung „Garten“ |
| `sprites/scaffold.webp` | Baugerüst (kachelbar, transparent) | 128×128 | transparent | P2 – schön | Bei Arbeiten an Fassade/Dach/Fenstern |
| `sprites/graffiti.webp` | Graffiti-Schmiererei | 160×64 | transparent | P3 – optional | Bei Vandalismus-Schaden |
| `sprites/mold_spot.webp` | Feuchte-/Schimmelfleck | 96×64 | transparent | P3 – optional | Kellersockel bei Feuchte |
| `sprites/crack.webp` | Putzriss | 96×128 | transparent | P3 – optional | Fassade bei schlechtem Zustand |
| `sprites/rat.webp` | Ratte | 48×32 | transparent | P3 – optional | Bei Ungeziefer-Schaden |
| `sprites/sign_for_rent.webp` | Schild „Zu vermieten“ | 120×40 | transparent | P3 – optional | Am Fenster inserierter Wohnungen |

### Mieterporträts (33)

| Datei (unter public/gfx/) | Inhalt | Größe (px) | Eigenschaften | Priorität | Verwendung |
|---|---|---|---|---|---|
| `portraits/quiet_longterm_1.webp` | Ruhiger Langzeitmieter – Variante 1 | 256×256 | – | P1 – wichtig | Mieter- und Bewerberkarten (Archetyp quiet_longterm) |
| `portraits/quiet_longterm_2.webp` | Ruhiger Langzeitmieter – Variante 2 | 256×256 | – | P2 – schön | Mieter- und Bewerberkarten (Archetyp quiet_longterm) |
| `portraits/quiet_longterm_3.webp` | Ruhiger Langzeitmieter – Variante 3 | 256×256 | – | P2 – schön | Mieter- und Bewerberkarten (Archetyp quiet_longterm) |
| `portraits/young_family_1.webp` | Junge Familie – Variante 1 | 256×256 | – | P1 – wichtig | Mieter- und Bewerberkarten (Archetyp young_family) |
| `portraits/young_family_2.webp` | Junge Familie – Variante 2 | 256×256 | – | P2 – schön | Mieter- und Bewerberkarten (Archetyp young_family) |
| `portraits/young_family_3.webp` | Junge Familie – Variante 3 | 256×256 | – | P2 – schön | Mieter- und Bewerberkarten (Archetyp young_family) |
| `portraits/busy_professional_1.webp` | Beruflich stark eingespannt – Variante 1 | 256×256 | – | P1 – wichtig | Mieter- und Bewerberkarten (Archetyp busy_professional) |
| `portraits/busy_professional_2.webp` | Beruflich stark eingespannt – Variante 2 | 256×256 | – | P2 – schön | Mieter- und Bewerberkarten (Archetyp busy_professional) |
| `portraits/busy_professional_3.webp` | Beruflich stark eingespannt – Variante 3 | 256×256 | – | P2 – schön | Mieter- und Bewerberkarten (Archetyp busy_professional) |
| `portraits/student_1.webp` | Preisbewusster Student – Variante 1 | 256×256 | – | P1 – wichtig | Mieter- und Bewerberkarten (Archetyp student) |
| `portraits/student_2.webp` | Preisbewusster Student – Variante 2 | 256×256 | – | P2 – schön | Mieter- und Bewerberkarten (Archetyp student) |
| `portraits/student_3.webp` | Preisbewusster Student – Variante 3 | 256×256 | – | P2 – schön | Mieter- und Bewerberkarten (Archetyp student) |
| `portraits/handy_1.webp` | Handwerklich begabt – Variante 1 | 256×256 | – | P1 – wichtig | Mieter- und Bewerberkarten (Archetyp handy) |
| `portraits/handy_2.webp` | Handwerklich begabt – Variante 2 | 256×256 | – | P2 – schön | Mieter- und Bewerberkarten (Archetyp handy) |
| `portraits/handy_3.webp` | Handwerklich begabt – Variante 3 | 256×256 | – | P2 – schön | Mieter- und Bewerberkarten (Archetyp handy) |
| `portraits/demanding_1.webp` | Anspruchsvoller Mieter – Variante 1 | 256×256 | – | P1 – wichtig | Mieter- und Bewerberkarten (Archetyp demanding) |
| `portraits/demanding_2.webp` | Anspruchsvoller Mieter – Variante 2 | 256×256 | – | P2 – schön | Mieter- und Bewerberkarten (Archetyp demanding) |
| `portraits/demanding_3.webp` | Anspruchsvoller Mieter – Variante 3 | 256×256 | – | P2 – schön | Mieter- und Bewerberkarten (Archetyp demanding) |
| `portraits/helpful_neighbor_1.webp` | Hilfsbereiter Nachbar – Variante 1 | 256×256 | – | P1 – wichtig | Mieter- und Bewerberkarten (Archetyp helpful_neighbor) |
| `portraits/helpful_neighbor_2.webp` | Hilfsbereiter Nachbar – Variante 2 | 256×256 | – | P2 – schön | Mieter- und Bewerberkarten (Archetyp helpful_neighbor) |
| `portraits/helpful_neighbor_3.webp` | Hilfsbereiter Nachbar – Variante 3 | 256×256 | – | P2 – schön | Mieter- und Bewerberkarten (Archetyp helpful_neighbor) |
| `portraits/temp_financial_1.webp` | Vorübergehend finanziell klamm – Variante 1 | 256×256 | – | P1 – wichtig | Mieter- und Bewerberkarten (Archetyp temp_financial) |
| `portraits/temp_financial_2.webp` | Vorübergehend finanziell klamm – Variante 2 | 256×256 | – | P2 – schön | Mieter- und Bewerberkarten (Archetyp temp_financial) |
| `portraits/temp_financial_3.webp` | Vorübergehend finanziell klamm – Variante 3 | 256×256 | – | P2 – schön | Mieter- und Bewerberkarten (Archetyp temp_financial) |
| `portraits/gardener_1.webp` | Begeisterte Hobbygärtnerin – Variante 1 | 256×256 | – | P1 – wichtig | Mieter- und Bewerberkarten (Archetyp gardener) |
| `portraits/gardener_2.webp` | Begeisterte Hobbygärtnerin – Variante 2 | 256×256 | – | P2 – schön | Mieter- und Bewerberkarten (Archetyp gardener) |
| `portraits/gardener_3.webp` | Begeisterte Hobbygärtnerin – Variante 3 | 256×256 | – | P2 – schön | Mieter- und Bewerberkarten (Archetyp gardener) |
| `portraits/high_energy_1.webp` | Hoher Energieverbrauch – Variante 1 | 256×256 | – | P1 – wichtig | Mieter- und Bewerberkarten (Archetyp high_energy) |
| `portraits/high_energy_2.webp` | Hoher Energieverbrauch – Variante 2 | 256×256 | – | P2 – schön | Mieter- und Bewerberkarten (Archetyp high_energy) |
| `portraits/high_energy_3.webp` | Hoher Energieverbrauch – Variante 3 | 256×256 | – | P2 – schön | Mieter- und Bewerberkarten (Archetyp high_energy) |
| `portraits/frequent_caller_1.webp` | Ruft häufig an – Variante 1 | 256×256 | – | P1 – wichtig | Mieter- und Bewerberkarten (Archetyp frequent_caller) |
| `portraits/frequent_caller_2.webp` | Ruft häufig an – Variante 2 | 256×256 | – | P2 – schön | Mieter- und Bewerberkarten (Archetyp frequent_caller) |
| `portraits/frequent_caller_3.webp` | Ruft häufig an – Variante 3 | 256×256 | – | P2 – schön | Mieter- und Bewerberkarten (Archetyp frequent_caller) |

### Ereignis-Illustrationen (25)

| Datei (unter public/gfx/) | Inhalt | Größe (px) | Eigenschaften | Priorität | Verwendung |
|---|---|---|---|---|---|
| `events/storm.webp` | Sturm über dem Haus | 1200×500 | – | P2 – schön | Kopfbild im Entscheidungsdialog und in der Ereignisliste |
| `events/heavy_rain.webp` | Starkregen, Wasser im Hof | 1200×500 | – | P2 – schön | Kopfbild im Entscheidungsdialog und in der Ereignisliste |
| `events/frost.webp` | Strenger Frost, Eiszapfen | 1200×500 | – | P2 – schön | Kopfbild im Entscheidungsdialog und in der Ereignisliste |
| `events/heatwave.webp` | Hitzewelle | 1200×500 | – | P3 – optional | Kopfbild im Entscheidungsdialog und in der Ereignisliste |
| `events/energy_price_shock.webp` | Steigende Energiepreise (Zähler/Rechnung) | 1200×500 | – | P2 – schön | Kopfbild im Entscheidungsdialog und in der Ereignisliste |
| `events/material_price_rise.webp` | Baustoffe werden teurer | 1200×500 | – | P3 – optional | Kopfbild im Entscheidungsdialog und in der Ereignisliste |
| `events/new_contractor.webp` | Neuer Handwerksbetrieb | 1200×500 | – | P3 – optional | Kopfbild im Entscheidungsdialog und in der Ereignisliste |
| `events/subsidy_program.webp` | Förderprogramm (Fördermittelbescheid) | 1200×500 | – | P3 – optional | Kopfbild im Entscheidungsdialog und in der Ereignisliste |
| `events/energy_audit.webp` | Energieberater mit Wärmebildkamera | 1200×500 | – | P3 – optional | Kopfbild im Entscheidungsdialog und in der Ereignisliste |
| `events/neighbor_conflict.webp` | Streit im Treppenhaus | 1200×500 | – | P2 – schön | Kopfbild im Entscheidungsdialog und in der Ereignisliste |
| `events/community_party.webp` | Hoffest | 1200×500 | – | P3 – optional | Kopfbild im Entscheidungsdialog und in der Ereignisliste |
| `events/tenant_job_loss.webp` | Mieter in finanzieller Sorge | 1200×500 | – | P2 – schön | Kopfbild im Entscheidungsdialog und in der Ereignisliste |
| `events/fire_inspection.webp` | Brandschutz-Begehung | 1200×500 | – | P3 – optional | Kopfbild im Entscheidungsdialog und in der Ereignisliste |
| `events/kitchen_request.webp` | Wunsch nach neuer Küche | 1200×500 | – | P3 – optional | Kopfbild im Entscheidungsdialog und in der Ereignisliste |
| `events/garden_volunteer.webp` | Mieterin pflegt den Hof | 1200×500 | – | P3 – optional | Kopfbild im Entscheidungsdialog und in der Ereignisliste |
| `events/diy_stairwell.webp` | Mieter streicht das Treppenhaus | 1200×500 | – | P3 – optional | Kopfbild im Entscheidungsdialog und in der Ereignisliste |
| `events/vandalism.webp` | Vandalismus am Eingang | 1200×500 | – | P3 – optional | Kopfbild im Entscheidungsdialog und in der Ereignisliste |
| `events/bridge_loan.webp` | Gespräch mit der Bank | 1200×500 | – | P3 – optional | Kopfbild im Entscheidungsdialog und in der Ereignisliste |
| `events/chimney_sweep.webp` | Schornsteinfeger | 1200×500 | – | P3 – optional | Kopfbild im Entscheidungsdialog und in der Ereignisliste |
| `events/pipe_warning.webp` | Korrodiertes Wasserrohr | 1200×500 | – | P3 – optional | Kopfbild im Entscheidungsdialog und in der Ereignisliste |
| `events/insurance_offer.webp` | Versicherungsmakler | 1200×500 | – | P3 – optional | Kopfbild im Entscheidungsdialog und in der Ereignisliste |
| `events/helpful_neighbor.webp` | Nachbarschaftshilfe | 1200×500 | – | P3 – optional | Kopfbild im Entscheidungsdialog und in der Ereignisliste |
| `events/investor_inquiry.webp` | Investor besichtigt das Haus | 1200×500 | – | P3 – optional | Kopfbild im Entscheidungsdialog und in der Ereignisliste |
| `events/press_praise.webp` | Zeitungsartikel über das Haus | 1200×500 | – | P3 – optional | Kopfbild im Entscheidungsdialog und in der Ereignisliste |
| `events/generic.webp` | Allgemeines Ereignis (Briefkasten/Hausflur) | 1200×500 | – | P2 – schön | Fallback für Ereignisse ohne eigenes Bild |

### Maßnahmen-Bilder (30)

| Datei (unter public/gfx/) | Inhalt | Größe (px) | Eigenschaften | Priorität | Verwendung |
|---|---|---|---|---|---|
| `measures/apt_paint.webp` | Wände streichen | 640×320 | – | P3 – optional | Karte im Renovierungskatalog (Vorher/Nachher-Gefühl) |
| `measures/apt_floor.webp` | Böden erneuern | 640×320 | – | P3 – optional | Karte im Renovierungskatalog (Vorher/Nachher-Gefühl) |
| `measures/apt_kitchen.webp` | Küche erneuern | 640×320 | – | P3 – optional | Karte im Renovierungskatalog (Vorher/Nachher-Gefühl) |
| `measures/apt_bath.webp` | Bad modernisieren | 640×320 | – | P3 – optional | Karte im Renovierungskatalog (Vorher/Nachher-Gefühl) |
| `measures/apt_full.webp` | Komplettsanierung der Wohnung | 640×320 | – | P3 – optional | Karte im Renovierungskatalog (Vorher/Nachher-Gefühl) |
| `measures/apt_thermostat.webp` | Smarte Thermostate | 640×320 | – | P3 – optional | Karte im Renovierungskatalog (Vorher/Nachher-Gefühl) |
| `measures/stairwell_upgrade.webp` | Treppenhaus aufwerten | 640×320 | – | P3 – optional | Karte im Renovierungskatalog (Vorher/Nachher-Gefühl) |
| `measures/outdoor_design.webp` | Außenbereich gestalten | 640×320 | – | P3 – optional | Karte im Renovierungskatalog (Vorher/Nachher-Gefühl) |
| `measures/bike_storage.webp` | Fahrradstellplätze schaffen | 640×320 | – | P3 – optional | Karte im Renovierungskatalog (Vorher/Nachher-Gefühl) |
| `measures/laundry_room.webp` | Waschkeller verbessern | 640×320 | – | P3 – optional | Karte im Renovierungskatalog (Vorher/Nachher-Gefühl) |
| `measures/community_room.webp` | Gemeinschaftsraum einrichten | 640×320 | – | P3 – optional | Karte im Renovierungskatalog (Vorher/Nachher-Gefühl) |
| `measures/fire_safety.webp` | Brandschutz nachrüsten | 640×320 | – | P3 – optional | Karte im Renovierungskatalog (Vorher/Nachher-Gefühl) |
| `measures/security_upgrade.webp` | Haustür & Gegensprechanlage | 640×320 | – | P3 – optional | Karte im Renovierungskatalog (Vorher/Nachher-Gefühl) |
| `measures/electrical_renewal.webp` | Elektrik erneuern | 640×320 | – | P3 – optional | Karte im Renovierungskatalog (Vorher/Nachher-Gefühl) |
| `measures/pipe_renewal.webp` | Strangsanierung | 640×320 | – | P3 – optional | Karte im Renovierungskatalog (Vorher/Nachher-Gefühl) |
| `measures/basement_seal.webp` | Keller abdichten | 640×320 | – | P3 – optional | Karte im Renovierungskatalog (Vorher/Nachher-Gefühl) |
| `measures/roof_renovation.webp` | Dach sanieren & dämmen | 640×320 | – | P3 – optional | Karte im Renovierungskatalog (Vorher/Nachher-Gefühl) |
| `measures/facade_renewal.webp` | Fassade erneuern | 640×320 | – | P3 – optional | Karte im Renovierungskatalog (Vorher/Nachher-Gefühl) |
| `measures/facade_insulation.webp` | Fassade dämmen (WDVS) | 640×320 | – | P3 – optional | Karte im Renovierungskatalog (Vorher/Nachher-Gefühl) |
| `measures/windows_replace.webp` | Fenster austauschen | 640×320 | – | P3 – optional | Karte im Renovierungskatalog (Vorher/Nachher-Gefühl) |
| `measures/heating_condensing.webp` | Gas-Brennwertkessel einbauen | 640×320 | – | P3 – optional | Karte im Renovierungskatalog (Vorher/Nachher-Gefühl) |
| `measures/heating_heatpump.webp` | Wärmepumpe installieren | 640×320 | – | P3 – optional | Karte im Renovierungskatalog (Vorher/Nachher-Gefühl) |
| `measures/heating_district.webp` | Fernwärme anschließen | 640×320 | – | P3 – optional | Karte im Renovierungskatalog (Vorher/Nachher-Gefühl) |
| `measures/hydraulic_balance.webp` | Hydraulischer Abgleich | 640×320 | – | P3 – optional | Karte im Renovierungskatalog (Vorher/Nachher-Gefühl) |
| `measures/efficient_pumps.webp` | Hocheffizienzpumpen | 640×320 | – | P3 – optional | Karte im Renovierungskatalog (Vorher/Nachher-Gefühl) |
| `measures/led_lighting.webp` | LED-Beleuchtung & Bewegungsmelder | 640×320 | – | P3 – optional | Karte im Renovierungskatalog (Vorher/Nachher-Gefühl) |
| `measures/waste_sorting.webp` | Mülltrennung verbessern | 640×320 | – | P3 – optional | Karte im Renovierungskatalog (Vorher/Nachher-Gefühl) |
| `measures/rainwater.webp` | Regenwassernutzung | 640×320 | – | P3 – optional | Karte im Renovierungskatalog (Vorher/Nachher-Gefühl) |
| `measures/solar_pv.webp` | Photovoltaikanlage | 640×320 | – | P3 – optional | Karte im Renovierungskatalog (Vorher/Nachher-Gefühl) |
| `measures/green_roof.webp` | Begrünung von Hof und Garagendach | 640×320 | – | P3 – optional | Karte im Renovierungskatalog (Vorher/Nachher-Gefühl) |

### Bauteil-Icons (10)

| Datei (unter public/gfx/) | Inhalt | Größe (px) | Eigenschaften | Priorität | Verwendung |
|---|---|---|---|---|---|
| `components/roof.webp` | Dach | 128×128 | transparent | P3 – optional | Bauteilliste in der Gebäudeansicht |
| `components/facade.webp` | Fassade | 128×128 | transparent | P3 – optional | Bauteilliste in der Gebäudeansicht |
| `components/windows.webp` | Fenster | 128×128 | transparent | P3 – optional | Bauteilliste in der Gebäudeansicht |
| `components/heating.webp` | Heizungsanlage | 128×128 | transparent | P3 – optional | Bauteilliste in der Gebäudeansicht |
| `components/pipes.webp` | Wasserleitungen | 128×128 | transparent | P3 – optional | Bauteilliste in der Gebäudeansicht |
| `components/sanitary.webp` | Sanitäranlagen | 128×128 | transparent | P3 – optional | Bauteilliste in der Gebäudeansicht |
| `components/electrical.webp` | Elektroinstallation | 128×128 | transparent | P3 – optional | Bauteilliste in der Gebäudeansicht |
| `components/stairwell.webp` | Treppenhaus | 128×128 | transparent | P3 – optional | Bauteilliste in der Gebäudeansicht |
| `components/basement.webp` | Keller | 128×128 | transparent | P3 – optional | Bauteilliste in der Gebäudeansicht |
| `components/outdoor.webp` | Außenbereich | 128×128 | transparent | P3 – optional | Bauteilliste in der Gebäudeansicht |

### Logo & Oberfläche (2)

| Datei (unter public/gfx/) | Inhalt | Größe (px) | Eigenschaften | Priorität | Verwendung |
|---|---|---|---|---|---|
| `ui/logo.webp` | Spiellogo (quadratisch) | 512×512 | transparent | P1 – wichtig | Startbildschirm, Seitenleiste |
| `ui/logo_wide.webp` | Schriftzug „Mietshaus Tycoon“ | 1200×300 | transparent | P2 – schön | Startbildschirm (ersetzt den Text-Titel) |

## Ablage & Deployment

- Entwicklung: Dateien nach `public/gfx/…` legen.
- Docker: Dateien vor dem Build nach `public/gfx/` legen **oder** zur Laufzeit einbinden, z. B. in `docker-compose.yml`:
  ```yaml
  volumes:
    - ./gfx:/usr/share/nginx/html/gfx:ro
  ```
