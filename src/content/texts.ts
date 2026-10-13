/**
 * Textvorlagen für Mieternachrichten. Platzhalter in {geschweiften Klammern}.
 * Texte werden ausschließlich aus aktuellen Spielzuständen befüllt.
 */
export const TEXTS = {
  defectReport: [
    'Guten Tag, in meiner Wohnung gibt es ein Problem: {defect}. {desc} Können Sie bitte jemanden vorbeischicken?',
    'Hallo, ich wollte Bescheid geben: {defect}. Wäre schön, wenn das bald jemand anschaut.',
    'Entschuldigen Sie die Störung – {defect}. {desc}',
    'Bei uns ist leider {defectLower}. Wir sind tagsüber erreichbar, falls ein Handwerker kommen möchte.',
  ],
  defectReportEarly: [
    'Mir ist aufgefallen: {defect}. Noch nichts Schlimmes, aber ich melde es lieber früh, bevor es teurer wird.',
    'Kleine Sache, aber besser jetzt als später: {defect}.',
  ],
  defectReportUrgent: [
    'Bitte dringend melden! {defect}! {desc}',
    'Notfall: {defect}. Wir brauchen sofort Hilfe!',
  ],
  diyFixed: [
    '{defect} – das habe ich am Wochenende selbst repariert. Kein Problem, ich mache so etwas gern.',
    'Kurze Info: {defectLower} war, ich habe das selbst in Ordnung gebracht.',
  ],
  noticeHidden: [
    'Mir ist im Keller etwas aufgefallen: {defect}. Vielleicht sollte sich das ein Fachmann ansehen.',
    'Im Treppenhaus erzählen alle davon: {defect}. Wissen Sie schon Bescheid?',
  ],
  complaint: {
    Miete: ['Ehrlich gesagt finde ich die Miete für den Zustand der Wohnung zu hoch.', 'Die Miete liegt deutlich über dem, was vergleichbare Wohnungen kosten.'],
    Wohnungszustand: ['Die Wohnung ist inzwischen ziemlich abgewohnt. Ist eine Renovierung geplant?', 'Der Zustand der Wohnung lässt leider zu wünschen übrig.'],
    Ausstattung: ['Küche und Bad sind wirklich in die Jahre gekommen.', 'Die Ausstattung entspricht nicht mehr dem heutigen Standard.'],
    Sauberkeit: ['Das Treppenhaus ist ständig schmutzig. Kann man nicht eine Reinigung beauftragen?', 'Im Hausflur liegt seit Tagen Dreck. Das ist kein schöner Empfang.'],
    Mängel: ['Der gemeldete Mangel ({defect}) ist immer noch nicht behoben.', 'Ich warte noch immer auf die Reparatur: {defect}. So kann das nicht weitergehen.'],
    Baulärm: ['Der Baulärm ({job}) ist kaum auszuhalten.', 'Wie lange dauern die Bauarbeiten ({job}) denn noch? Ich kann kaum arbeiten.'],
    Heizkosten: ['Die Heizkosten sind enorm hoch. Das Haus verliert offenbar viel Wärme.', 'Bei diesen Heizkosten frage ich mich, ob das Haus überhaupt gedämmt ist.'],
    Sicherheit: ['Ich fühle mich im Haus nicht mehr sicher – Licht, Haustür, alles ist ein Problem.', 'Die Sicherheit im Haus sollte dringend verbessert werden.'],
    Bedürfnisse: ['Die Wohnung passt leider nicht mehr richtig zu unseren Bedürfnissen.', 'Uns fehlt hier einiges, was uns wichtig ist.'],
    Service: ['Man erreicht Sie schlecht, und Reaktionen dauern lange.', 'Ich wünsche mir einen Ansprechpartner vor Ort.'],
    Stimmung: ['Die Stimmung im Haus ist zurzeit nicht gut.', 'Die letzten Wochen waren wirklich unerfreulich.'],
    Gemeinschaft: ['Es fehlt ein bisschen das Miteinander im Haus.'],
  } as Record<string, string[]>,
  thanks: [
    'Vielen Dank, dass {job} so schnell erledigt wurde!',
    'Ein großes Dankeschön – {job} ist super geworden.',
    'Danke für die schnelle Hilfe bei {job}. So stellt man sich einen Vermieter vor.',
  ],
  noticeGiven: {
    unhappy: ['Hiermit kündige ich fristgerecht zum {date}. Leider hat sich die Situation in der Wohnung nicht verbessert.', 'Ich kündige zum {date}. Der Hauptgrund: {reason}.'],
    natural: ['Wir haben eine neue Stelle in einer anderen Stadt angenommen und kündigen zum {date}. Danke für die schöne Zeit!', 'Aus privaten Gründen ziehen wir um. Die Kündigung gilt zum {date}.', 'Wir haben Nachwuchs bekommen und brauchen mehr Platz – Auszug zum {date}.', 'Ich ziehe mit meiner Partnerin/meinem Partner zusammen. Kündigung zum {date}.'],
  },
  rentIncreaseAccept: ['Die Mieterhöhung ist angekommen. Nachvollziehbar, wenn auch nicht schön.', 'Ich habe die Mieterhöhung erhalten. Für die Wohnung ist das wohl in Ordnung.'],
  rentIncreaseCritical: ['Die Mieterhöhung trifft mich hart. Ich überlege, ob ich mir die Wohnung noch leisten kann.', 'Schon wieder teurer? Dafür erwarte ich dann aber auch, dass Mängel schneller behoben werden.'],
  referral: ['Eine Bekannte von mir sucht gerade eine Wohnung – ich habe ihr die freie Wohnung empfohlen.', 'Ich kenne jemanden, der gut ins Haus passen würde. Darf ich den Kontakt weitergeben?'],
};
