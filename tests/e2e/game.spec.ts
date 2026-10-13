import { expect, test, type Page } from '@playwright/test';

async function startGame(page: Page) {
  await page.goto('/');
  await page.getByTestId('quick-start').click();
  await expect(page.getByTestId('game-date')).toContainText('Januar 2027');
  // Tutorial überspringen
  await page.getByRole('button', { name: 'Überspringen' }).click();
}

const nav = (page: Page, label: string) => page.locator('nav button', { hasText: label }).first().click();

test('Spielstart, Navigation und Zeitlauf', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await startGame(page);
  for (const p of ['Gebäude', 'Wohnungen', 'Mieter', 'Finanzen', 'Reparaturen', 'Renovierung', 'Verträge', 'Personal', 'Ereignisse', 'Ziele', 'Einstellungen', 'Übersicht']) {
    await nav(page, p);
    await expect(page.locator('main h1')).toBeVisible();
  }
  await page.getByTestId('step-day').click();
  await expect(page.getByTestId('game-date')).toContainText('2. Januar 2027');
  await page.getByTestId('step-month').click();
  // Monat vorspulen – evtl. durch Entscheidung unterbrochen
  const dialog = page.getByRole('dialog').filter({ hasText: 'Standard' });
  if (await dialog.count()) await dialog.locator('button').filter({ hasText: /./ }).nth(1).click();
  await expect(page.getByTestId('game-date')).not.toContainText('2. Januar 2027');
  expect(errors).toEqual([]);
});

test('Wohnung inserieren und Reparatur beauftragen', async ({ page }) => {
  await startGame(page);
  await nav(page, 'Wohnungen');
  await page.getByRole('row', { name: /3\.2/ }).click();
  await page.getByRole('button', { name: /Inserieren/ }).click();
  await expect(page.getByText(/Inseriert seit/)).toBeVisible();

  await nav(page, 'Reparaturen');
  const before = await page.getByTestId('cash').innerText();
  await page.getByRole('button', { name: 'Angebote' }).first().click();
  const beauftragen = page.getByRole('button', { name: /Beauftragen/ });
  await expect(beauftragen).toBeVisible();
  // Doppelklick darf keinen zweiten Auftrag erzeugen
  await beauftragen.dblclick();
  await page.getByRole('tab', { name: /Aktive Aufträge/ }).click();
  await expect(page.locator('main').getByText(/beheben/).first()).toBeVisible();
  const count = await page.locator('main').getByRole('button', { name: /Stornieren/ }).count();
  expect(count).toBe(1);
  expect(before).toBeTruthy();
});

test('Neustart nur nach Bestätigung, Speichern und Laden', async ({ page }) => {
  await startGame(page);
  await page.getByTestId('step-day').click();
  await page.keyboard.press('Control+s');
  await nav(page, 'Einstellungen');
  await page.getByRole('button', { name: 'Neu starten' }).click();
  await expect(page.getByRole('dialog')).toContainText('Spiel neu starten?');
  await page.getByRole('dialog').getByRole('button', { name: 'Abbrechen' }).click();
  await expect(page.getByTestId('game-date')).toContainText('2. Januar 2027');
  // Hauptmenü und Fortsetzen
  await page.getByRole('button', { name: 'Hauptmenü' }).click();
  await expect(page.getByRole('button', { name: /Fortsetzen/ })).toBeVisible();
  await page.getByRole('button', { name: /Fortsetzen/ }).click();
  await expect(page.getByTestId('game-date')).toContainText('2. Januar 2027');
});

test('Import eines beschädigten Spielstands wird abgelehnt', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('import-input').setInputFiles({ name: 'kaputt.json', mimeType: 'application/json', buffer: Buffer.from('{"format":"mietshaus-tycoon-save","formatVersion":1,"game":{"cash":"x"}}') });
  await expect(page.getByText(/Import fehlgeschlagen/)).toBeVisible();
});

test('Mieter-App, Alle beauftragen und Geldanlage', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await startGame(page);
  await nav(page, 'Personal');
  await page.getByRole('button', { name: /Mieter-App/ }).click();
  await expect(page.locator('span', { hasText: 'Mieter-App aktiv' })).toBeVisible();
  await nav(page, 'Reparaturen');
  await page.getByTestId('repair-all').click();
  await expect(page.getByText(/Aufträge für zusammen/)).toBeVisible();
  await nav(page, 'Vermögen');
  await page.getByRole('tab', { name: 'Geldanlagen' }).click();
  await page.getByRole('button', { name: 'Anlegen' }).click();
  await expect(page.getByText(/Tagesgeldkonto überwiesen/)).toBeVisible();
  expect(errors).toEqual([]);
});
