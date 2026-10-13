# Mietshaus Tycoon

**Mietshaus Tycoon** ist eine Wirtschaftssimulation im Browser: Sie übernehmen ein renovierungsbedürftiges Mietshaus, vermieten Wohnungen, wählen Mieter aus, organisieren Reparaturen, finanzieren Modernisierungen, verwalten Mietverträge, Nebenkosten und Mahnwesen – und versuchen, aus dem Haus ein rentables, nachhaltiges und zufriedenes Zuhause zu machen.

Das Spiel läuft vollständig lokal im Browser: ohne Registrierung, ohne Backend, ohne Cloud- oder KI-Dienste.

> Spielsimulation – alle rechtlichen und steuerlichen Regeln sind stark vereinfacht und stellen **keine** Rechts-, Steuer- oder Finanzberatung dar.

---

## Inhalt

- [Voraussetzungen](#voraussetzungen)
- [Installation & Entwicklung](#installation--entwicklung)
- [Build](#build)
- [Tests](#tests)
- [Spielmechanik](#spielmechanik)
- [Architektur](#architektur)
- [Speicherverhalten](#speicherverhalten)
- [Konfiguration & Balancing](#konfiguration--balancing)
- [Deployment (Docker / Unraid)](#deployment-docker--unraid)
- [Backup & Wiederherstellung](#backup--wiederherstellung)
- [Eigene Grafiken & Texturen](#eigene-grafiken--texturen)
- [Optionale lokale KI](#optionale-lokale-ki)
- [Stand & Erweiterungen](#stand--erweiterungen)

## Voraussetzungen

- Node.js ≥ 20 (getestet mit 22) und npm ≥ 10
- Für E2E-Tests: Chromium für Playwright (`npx playwright install chromium`)
- Für Self-Hosting: Docker mit Docker Compose

## Installation & Entwicklung

```bash
npm install
npm run dev          # Entwicklungsserver auf http://localhost:5173
```

## Build

```bash
npm run build        # Typprüfung + Produktionsbuild nach dist/
npm run preview      # Produktionsbuild lokal ansehen (http://localhost:4173)
```

`dist/` ist eine rein statische Webanwendung und kann von jedem Webserver ausgeliefert werden.

## Tests

```bash
npm test             # Unit-, Integrations- und Balancing-Tests (Vitest)
npm run test:e2e     # Ende-zu-Ende-Tests (Playwright, startet Build + Preview selbst)
npm run typecheck    # TypeScript-Prüfung
```

Abgedeckt sind u. a.:

| Bereich | Tests |
|---|---|
| Mieten | korrekte Buchung, keine Doppelforderungen/-zahlungen, Teilzahlungen, Rückstände nach Alter, Mahnungen erzeugen kein Geld, Ratenzahlung, Nebenkostenabrechnung |
| Aufträge | Reparatur verändert Gebäudestatus und Journal, Renovierung belastet Liquidität (Abschlag + Schlussrechnung), Doppelklick erzeugt keinen zweiten Auftrag, Folgeschäden nur bei gültigen Voraussetzungen |
| Simulation | reproduzierbare Monatsabschlüsse (Seed), Zeitsprung = Einzelschritte, jeder Monat genau einmal abgeschlossen, Kontostand = Journal über Jahre in allen Szenarien, Insolvenz nur durch echte Unterdeckung |
| Verträge | Vergleichsmiete, Kappungsgrenze, Sperrfrist, Neuvermietung |
| Persistenz | Export/Import verlustfrei, Validierung beschädigter Dateien, Referenzprüfungen, Journal-Korrektur, Migration, IndexedDB (speichern, laden, duplizieren, löschen) |
| Balancing | vernünftige Strategie 5 Jahre stabil, Vernachlässigung deutlich schlechter, Nichtstun führt zur Schieflage, Start nicht sofort verloren, alle Szenarien spielbar |
| E2E | Start, Navigation aller Bereiche, Zeitlauf, Inserieren, Auftrag (inkl. Doppelklick), Neustart nur mit Bestätigung, Speichern/Fortsetzen, Import-Ablehnung |

## Spielmechanik

### Zeit
Die Spielzeit ist von der realen Uhr entkoppelt. Ein **Tag** simuliert Verschleiß, Schadensentstehung und -eskalation, Handwerkerfortschritt, Mieterverhalten (Meldungen, Beschwerden, Kündigungen), Zahlungseingänge, Bewerber, Energieverbrauch und Ereignisse. Am **Monatsende** werden Energie, Betriebs- und Fixkosten sowie Kreditraten gebucht und ein Monatsabschluss erstellt. Im **März** folgt die Betriebskostenabrechnung des Vorjahres, Ende **April** die (vereinfachte) Steuer.

Steuerung: Pause, Normal, Schnell, Sehr schnell, +1 Tag, bis Monatsende, +1 Jahr. Jeder Tag eines Vorlaufs wird vollständig berechnet; Vorläufe stoppen bei Entscheidungen und kritischen Ereignissen. Ist der Browser-Tab im Hintergrund, pausiert das Spiel automatisch.

### Gebäude
Zehn Bauteile (Dach, Fassade, Fenster, Heizung, Leitungen, Sanitär, Elektrik, Treppenhaus, Keller, Außenbereich) altern unabhängig – abhängig von Qualitätsstufe, Jahreszeit, Wartung und Nutzung. Die Schadenswahrscheinlichkeit steigt mit dem Verschleiß (kubisch), viele Schäden sind zunächst unentdeckt (Warnzeichen). Unbehandelte Schäden eskalieren nach einer Frist zu Folgeschäden (z. B. lose Ziegel → undichtes Dach → Wasserschaden im Dachgeschoss; korrodierte Leitung → Rohrbruch → Wasserschaden). Ein erteilter Auftrag stoppt die Eskalation.

### Wohnungen & Mieter
Jede Wohnung hat Fläche, Zimmer, Ausstattung (Küche/Bad/Böden), Zustand und eine **Vergleichsmiete** (vereinfachter Mietspiegel aus Basismiete × Qualitätsfaktor aus Zustand, Ausstattung, Balkon, Effizienzklasse, Attraktivität des Hauses). Mieter haben einen Archetyp (Lebenssituation), zehn Persönlichkeitswerte, Bedürfnisse, individuelle Zahlungszuverlässigkeit und finanzielle Belastung. Die **Zufriedenheit** folgt träge einem Zielwert aus zwölf nachvollziehbaren Faktoren (Miete, Zustand, Ausstattung, Sauberkeit, Mängel, Baulärm, Heizkosten, Sicherheit, Bedürfnisse, Gemeinschaft, Service, Stimmung) – jeweils sichtbar in der Mieteransicht. Bewerber werden über Einkommen, Bonität, Haushaltsgröße, Wünsche und Passung verglichen. Zuverlässigkeit hängt **nicht** an Namen oder Herkunft.

### Finanzen
Alle Beträge sind ganzzahlige **Cent**. Jede Geldbewegung läuft über das **Buchungsjournal** (Datum, Kategorie, Betrag, Wohnung/Bauteil, Verwendungszweck, Status, Referenz); Kontostand, Monatsabrechnung und Statistiken werden daraus abgeleitet. Kautionen liegen treuhänderisch und sind kein verfügbares Geld. Der Immobilienwert ist ebenfalls kein verfügbares Geld: Ein Haus kann wertvoll und trotzdem zahlungsunfähig sein. Insolvenz tritt ein, wenn das Konto 45 Tage lang den Dispositionsrahmen überschreitet.

### Mietverträge (vereinfachtes Regelwerk)
Mietforderungen entstehen am 1., fällig am 3. Mieter zahlen pünktlich, verspätet, teilweise oder gar nicht. Mahnwesen in drei Stufen (Erinnerung, Mahnung, Anwalt). Mietminderung bei offenen Mängeln. Mieterhöhung höchstens bis zur Vergleichsmiete, max. +20 % in 3 Jahren, frühestens 12 Monate nach der letzten Anpassung, wirksam nach 3 Monaten; Modernisierungsumlage 8 %/Jahr (max. 3 €/m²). Neuvermietung max. Vergleichsmiete + 10 %. Ratenzahlung, fristlose Kündigung ab zwei Monatsmieten Rückstand, Aufhebungsvertrag gegen Abfindung.

### Energie
Heizbedarf aus Heizgradtagen (deterministisches Wetter), Dämmstufe, Fenster, Bauteilzuständen, hydraulischem Abgleich, Thermostaten, Belegung und Mieterverhalten; Wirkungsgrad/JAZ je Anlage (Öl, Gas alt, Brennwert, Wärmepumpe, Fernwärme). Photovoltaik deckt Allgemeinstrom und speist ein. Effizienzklasse A+ bis H aus wetterunabhängigem Endenergiebedarf.

### Fortschritt
Fünf Phasen (Überleben → Stabilisierung → Optimierung → Professionalisierung → Meisterschaft) mit konkreten Anforderungen; sie schalten neue Bereiche, Dienstleistungen und Maßnahmen frei. Dazu kurz-, mittel- und langfristige Ziele, 15 Erfolge und eine **Gesamtbewertung (0–1000)** aus Liquidität, Zustand, Instandhaltungsrückstand, Zufriedenheit, Energie, Vermietung, Verschuldung, Nachhaltigkeit und Widerstandsfähigkeit.

### Mieter-App & Automatik
Die **Mieter-App** (Personal & Dienstleister → Weitere Verträge, 29 € + 2 €/Wohnung im Monat) lässt Mieter Schäden per Foto melden – auch zurückhaltende Mieter melden dann früher – und verbessert den Service-Faktor der Zufriedenheit. Mit aktiver App oder externer Hausverwaltung werden Aufträge **automatisch vergeben** nach Ihren Regeln: Höchstbetrag je Auftrag, Monatsbudget über alle Objekte, Mindestreserve auf dem Konto, Strategie (Preis-Leistung, günstigster, beste Qualität, schnellster Termin), bevorzugte Betriebe je Gewerk; kritische Schäden optional immer. Zusätzlich: vorbeugende Wartung, Renovierung leerer Wohnungen und ein **Vermietungsservice** (Inserat, Bewerberauswahl, Provision 2 Kaltmieten ohne Hausverwaltung). **Rahmenverträge** mit Handwerkern (25 €/Monat) bringen 7 % Rabatt und bevorzugte Termine. Unter „Reparaturen“ vergibt **„Alle beauftragen“** sämtliche offenen Schäden auf einmal.

### Vermögen & Immobilien
- **Geldanlagen:** Tagesgeld (variabler Zins nach Marktzins, monatliche Gutschrift), Festgeld 1/2/3/5 Jahre (fester Zins, gebunden), ETF-Depot (monatliche Kursschwankungen, Ordergebühr, Teilfreistellung 30 %). Erträge unterliegen der Abgeltungsteuer inkl. Soli (26,375 %) nach Sparer-Pauschbetrag (1.000 €/Jahr). Anlagen nur aus Guthaben, nicht über den Dispo.
- **Immobilienmarkt (ab Phase 3):** Alle paar Wochen erscheinen Kaufangebote (Gründerzeit-Altbau, Nachkriegsbau, 70er-Block, 90er-Stadthaus, Neubau, Sanierungsfall) mit eigenen Mietern, Lagefaktor, Zustand und verdeckten Mängeln. Das Exposé beschönigt – ein **Gutachten** deckt Mängel und den echten Zustand auf. Kauf mit Grunderwerbsteuer (6 %), Notar/Grundbuch (2 %), ggf. Makler (3,57 %), Finanzierung per Hypothek (Beleihungsgrenze 80 % des Portfolios, Nebenkosten aus Eigenkapital), Preisverhandlung mit einem Gebot. Verkauf zum Marktwert; innerhalb der 10-jährigen **Spekulationsfrist** ist der Gewinn steuerpflichtig.
- **Portfolio:** Oben in der Kopfzeile wechseln Sie zwischen Ihren Häusern. Gebäude, Wohnungen, Mieter, Verträge, Schäden, Aufträge und Dienstleistungen gehören zum jeweiligen Objekt; Konto, Journal (mit Objektzuordnung), Kredite, Handwerker, Nachrichten und Markt sind gemeinsam. Alle Objekte werden jeden Tag vollständig simuliert.

### Spielmodi
- **Endlos:** Lindenstraße 14 – das Startgebäude (10 Wohnungen: eine modernisiert, eine leer, eine renovierungsbedürftig, ein Mieter im Rückstand, ein Langzeitmieter, gemeldeter Schimmel, alte Heizung, Dachcheck fällig).
- **Kampagne:** Das geerbte Altbauhaus · Die fast insolvente Hausverwaltung · Der unsanierte Nachkriegsbau · Die steigenden Energiekosten · Das Haus mit hoher Mieterfluktuation · Die umfassende Kernsanierung (je mit Frist und Siegbedingungen).
- **Herausforderung:** Knappe Kasse · Reparaturstau · Winterkrise.
- **Sandbox:** Startkapital, Kredit, Gebäudezustand, Vermietungsquote, Ereignishäufigkeit, Schwierigkeit, alles freischalten.

### Bedienung
Tastenkürzel: `Leertaste` Pause/Start · `1/2/3` Geschwindigkeit · `N`/`→` ein Tag · `Strg+K` Suche · `Strg+S` Speichern · `Strg+Z` Rückgängig (Verwaltungsaktionen am selben Spieltag) · `?` Hilfe. Favoriten (Stern in der Navigation), sortier- und filterbare Tabellen, Angebotsvergleich und Kosten-/Nutzenprognose vor jeder Beauftragung, Tutorial, Hilfe, Expertenmodus, helles/dunkles Design.

## Architektur

```
src/
  domain/schema.ts     Fachliche Datenmodelle als Zod-Schemas (Typen + Validierung)
  game/                Game Engine – reine, deterministische Spielregeln
    simulation.ts      Tages-/Monatsablauf, advanceDays
    actions.ts         Alle Spieleraktionen als validierte Befehle
    ledger.ts          Buchungsjournal
    payments.ts        Forderungen, Zahlungen, Mahnwesen, NK-Abrechnung
    contracts.ts       Mieterhöhung, Ratenzahlung, Kündigung
    tenants.ts         Mietergenerierung, Zufriedenheit, Verhalten
    applicants.ts      Inserate, Bewerber, Vertragsabschluss
    components.ts      Verschleiß und Schadensentstehung
    defects.ts         Schäden, Eskalation, Mietminderung
    jobs.ts            Angebote, Aufträge, Hausmeister
    energy.ts finance.ts market.ts insurance.ts events.ts goals.ts progression.ts score.ts
    derived.ts         Abgeleitete Kennzahlen (Vergleichsmiete, Marktwert, Rückstand …)
    forecast.ts        Kosten-/Nutzenprognose durch Vorher-nachher-Simulation
    warnings.ts        Zahlenbasierte Warnungen mit Handlungsoptionen
    config.ts          Zentrale Balance-Parameter
  content/             Datengetriebene Inhalte: Bauteile, Schäden, Maßnahmen, Mieter,
                       Dienstleister, Ereignisse, Ziele, Szenarien, Texte
  store/               Zustand-Stores (Spielzustand + UI-Zustand)
  persistence/         IndexedDB, Export/Import, Validierung, Migration
  components/ui/       Wiederverwendbare UI-Bausteine (shadcn-Stil, Radix)
  features/            Fachliche UI-Bausteine (Gebäudeansicht, Auftragsdialog, Layout …)
  pages/               14 Hauptansichten + Startbildschirm
  hooks/ ai/ utils/
tests/unit tests/balance tests/e2e
```

Wesentliche Entscheidungen:

- **Regeln nie in der UI.** Komponenten lesen abgeleitete Werte und senden `GameAction`s; `applyAction` validiert und verändert eine Kopie des Zustands.
- **Determinismus.** Der Zufallsgenerator (mulberry32) liegt im Spielstand; Wetter ist ein deterministischer Hash von Seed und Tag. Gleicher Seed + gleiche Aktionen = identisches Ergebnis.
- **Idempotenz.** Mietforderungen je Vertrag/Monat, Monatskosten je Periode, NK-Abrechnung und Steuer je Jahr werden über Schlüssel genau einmal erzeugt. Kontostand ≙ Startkapital + Σ Journal (geprüft in Tests und beim Laden).
- **Prognosen über Simulation.** Die Kosten-/Nutzenprognose wendet eine Maßnahme auf eine Kopie an und vergleicht Kennzahlen vorher/nachher – sie kann daher nie von den echten Regeln abweichen.
- **Erweiterbarkeit.** Gebäude ist ein eigenes Objekt mit ID; Inhalte sind datengetrieben; Spielstände sind versioniert mit Migrationskette.

## Speicherverhalten

- Primärer Speicher: **IndexedDB** im Browser (Datenbank `mietshaus-tycoon`).
- **Autosave** nach wichtigen Aktionen (Aufträge, Verträge, Kredite, Entscheidungen …), nach jedem Monatsabschluss, alle 60 Sekunden bei Änderungen, beim Verlassen/Wechseln des Tabs.
- **Manuell** speichern (`Strg+S`), mehrere Spielstände, laden, duplizieren, löschen (mit Bestätigung), exportieren und importieren als versionierte JSON-Datei (`format: mietshaus-tycoon-save`).
- Beim Laden/Import: Migration älterer Versionen, vollständige Schema-Validierung, Prüfung referenzieller Integrität; ein vom Journal abweichender Kontostand wird korrigiert und gemeldet. Beschädigte Spielstände werden abgelehnt, ohne das laufende Spiel zu beeinträchtigen.

## Konfiguration & Balancing

Alle wirtschaftlichen Parameter liegen in `src/game/config.ts` (Mietrecht-Grenzen, Mahnfristen, Verschleißraten, Schadensraten, Energiepreise und Wirkungsgrade, Dienstleistungskosten, Dispo-/Insolvenzregeln, Bewertungsfaktoren, Schwierigkeitsgrade, Spielgeschwindigkeiten). Inhalte (Schäden, Maßnahmen, Ereignisse, Szenarien) liegen in `src/content/`. Änderungen erfordern keine Anpassung von UI-Komponenten. Nach Änderungen `npm test` ausführen – die Balancing-Tests (`tests/balance`) prüfen mit Bot-Strategien über mehrere Jahre, ob das Spiel fair bleibt.

## Deployment (Docker / Unraid)

Das Image baut die App in einer Node-Stufe und liefert sie über einen **unprivilegierten Nginx** (User 101) aus. Healthcheck unter `/healthz`, Sicherheits-Header (CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy …), keine Geheimnisse, keine externen Abhängigkeiten zur Laufzeit.

```bash
docker compose up -d --build          # http://localhost:8080
HOST_PORT=8099 docker compose up -d   # anderer Host-Port
```

Der Container-Port ist über die Umgebungsvariable `PORT` (Standard 8080) konfigurierbar. Compose startet den Container schreibgeschützt, ohne Capabilities und mit `no-new-privileges`.

**Unraid:** Repository auf den Server kopieren, im Terminal `docker compose up -d --build` ausführen (oder Image bauen und als Docker-Container mit Port-Mapping `8080` → gewünschter Port anlegen). Alternativ `dist/` von einem beliebigen Webserver ausliefern. Ein Reverse Proxy (z. B. Nginx Proxy Manager) kann vorgeschaltet werden.

Hinweis: Benötigt der Build-Host einen Proxy für npm, diesen als Build-Argument (`HTTPS_PROXY`) bzw. in der npm-Konfiguration bereitstellen.

## Backup & Wiederherstellung

Spielstände liegen im Browser, nicht im Container. Ein Docker-Neustart oder Update beeinflusst sie **nicht**. Verloren gehen können sie durch Löschen der Browserdaten, einen anderen Browser oder eine **geänderte Adresse** (Domain, Protokoll oder Port – IndexedDB ist an den Origin gebunden).

- Backup: *Einstellungen → Spielstände → Exportieren* (bzw. Download-Symbol je Spielstand) – erzeugt eine JSON-Datei.
- Wiederherstellen: *Spielstand importieren* auf dem Startbildschirm oder in den Einstellungen.
- Exportieren Sie Spielstände vor einem Wechsel der Domain/des Ports.

## Eigene Grafiken & Texturen

Alle 144 Grafiken sind optional und werden automatisch erkannt (`public/gfx/<Pfad>.webp|png|svg`); fehlende werden durch die eingebauten Vektorzeichnungen ersetzt. Status: *Einstellungen → Grafiken & Texturen*. Liste mit Maßen und Stilvorgaben: [`docs/GRAFIKEN.md`](docs/GRAFIKEN.md).

Mitgeliefert sind 144 selbst gezeichnete Vektorgrafiken (SVG) im einheitlichen Flat-Stil, erzeugt per Code mit `npm run gfx:art` (Generator in `scripts/art/`). Eigene WebP-/PNG-Dateien mit demselben Namen haben Vorrang und ersetzen sie automatisch.

Drei Wege, eigene Grafiken zu erzeugen – alle speichern automatisch unter dem richtigen Namen:

| Weg | Aufwand | Befehl / Datei |
|---|---|---|
| **Vollautomatisch** über die OpenAI-Bild-API | 1 Befehl, API-Schlüssel nötig (kostenpflichtig) | `OPENAI_API_KEY=sk-… npm run gfx:generate` (Optionen: `-- --prio=1`, `--quality=low/medium/high`, `--only=tex.,spr.`, `--force`, `--dry-run`) |
| **ChatGPT-Sammelblätter** (mehrere Grafiken pro Bild) | 26 Prompts, Dateien nur `sheet_01.png` … benennen | [`docs/CHATGPT_SAMMELBLAETTER.md`](docs/CHATGPT_SAMMELBLAETTER.md), danach `npm run gfx:import` |
| **Einzelbilder** in ChatGPT (höchste Kontrolle) | 144 Prompts | [`docs/CHATGPT_PROMPTS.md`](docs/CHATGPT_PROMPTS.md), danach `npm run gfx:import` |

`npm run gfx:import` liest `gfx-incoming/`, zerschneidet Sammelblätter, ordnet Einzeldateien über den Namen zu, skaliert auf die Zielgröße, schneidet transparente Ränder ab und speichert WebP nach `public/gfx/`. Bereits erzeugte Grafiken überspringt `gfx:generate`, ein abgebrochener Lauf kann einfach neu gestartet werden. Die Prompt-Dateien werden mit `npm run gfx:docs` aus dem Manifest (`src/content/graphics.ts`) neu erzeugt. Im Docker-Betrieb lassen sich Grafiken auch per Volume nach `/usr/share/nginx/html/gfx` einbinden.

## Optionale lokale KI

Unter *Einstellungen → Optionale lokale KI* kann ein lokales Modell (Ollama, z. B. `http://localhost:11434`) Mieternachrichten sprachlich umformulieren. Das Modell erhält nur Text und liefert nur Text, das Ergebnis wird ausschließlich angezeigt und nie im Spielstand gespeichert; Antworten mit veränderten Zahlen werden verworfen. Ohne Modell oder Netzwerk funktioniert das Spiel unverändert (Textvorlagen).

## Stand & Erweiterungen

Fertig: alle 14 Bereiche, Gebäude-, Wohnungs-, Mieter-, Vertrags-, Zahlungs-, Reparatur-, Renovierungs-, Energie-, Dienstleister-, Versicherungs-, Kredit-, Steuer-, Ereignis- (22 zustandsabhängige Ereignisse), Ziel-, Phasen-, Erfolgs- und Bewertungssystem, 4 Spielmodi mit 10 Szenarien, Statistiken (12 Diagramme, Monat/Quartal/Jahr/Gesamt), Speicherung, Tests, Docker.

Vorbereitet, aber noch nicht umgesetzt (siehe Architektur): mehrere Gebäude, Kauf/Verkauf, Stadtviertel und regionale Märkte, Konkurrenz, Ranglisten, Modding über externe Content-Dateien, Mehrsprachigkeit.
