import { test, expect, open, settle } from './support';
import { readFile } from 'node:fs/promises';

test('kaydetme, eski dosyaları açma, bozuk dosya ve paylaşım', async ({ page, context }) => {
  await open(page);
  await page.getByRole('textbox', { name: 'a11', exact: true }).fill('1/3');
  await page.getByRole('textbox', { name: 'a11', exact: true }).press('Enter'); await settle(page);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Kaydet', exact: true }).click();
  const download = await downloadPromise;
  const saved = await readFile((await download.path())!, 'utf8');
  expect(JSON.parse(saved).matrix2[0][0]).toBe('1/3');
  await page.getByRole('button', { name: 'Birim matris', exact: true }).click(); await settle(page);
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Aç', exact: true }).click();
  await (await chooserPromise).setFiles({ name: 'roundtrip.graphcalc', mimeType: 'application/json', buffer: Buffer.from(saved) });
  await expect(page.getByRole('textbox', { name: 'a11', exact: true })).toHaveValue('1/3');
  const input = page.locator('input[type=file]');
  await input.setInputFiles('e2e/fixtures/v1.graphcalc');
  await expect(page.getByRole('textbox', { name: 'a11', exact: true })).toHaveValue('3');
  await expect(page.getByRole('textbox', { name: 'a22', exact: true })).toHaveValue('11');
  const before = await page.locator('.graph-result').textContent();
  await input.setInputFiles({ name: 'broken.graphcalc', mimeType: 'application/json', buffer: Buffer.from('{broken') });
  await expect(page.locator('.toast[role=status]')).toHaveText('Geçersiz JSON dosyası.');
  expect(await page.locator('.graph-result').textContent()).toBe(before);
  await expect(page.getByRole('textbox', { name: 'a11', exact: true })).toHaveValue('3');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'Paylaş', exact: true }).click();
  await expect(page.locator('.toast[role=status]')).toHaveText('Paylaşım bağlantısı kopyalandı.');
  const url = await page.evaluate(() => navigator.clipboard.readText());
  expect(url).toContain('#s=');
  const shared = await context.newPage(); await shared.goto(url);
  await expect(shared.getByRole('textbox', { name: 'a11', exact: true })).toHaveValue('3');
  await expect(shared.getByRole('textbox', { name: 'a22', exact: true })).toHaveValue('11');
  await shared.close();
});

