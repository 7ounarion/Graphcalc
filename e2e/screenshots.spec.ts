import { test, expect, open, tools, settle } from './support';
import { mkdir } from 'node:fs/promises';

for (const id of tools) test(`${id} ekran görüntüsü`, async ({ page }, info) => {
  await open(page, id);
  const pause = page.getByRole('button', { name: 'Ⅱ Duraklat', exact: true });
  if (await pause.count()) await pause.click();
  await page.evaluate(() => document.fonts.ready); await settle(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', info.project.use.colorScheme!);
  await mkdir('e2e/screenshots', { recursive: true });
  const path = `e2e/screenshots/${info.project.name}-${id}.png`;
  await page.screenshot({ path, fullPage: true, animations: 'disabled' });
  await info.attach('ekran', { path, contentType: 'image/png' });
});
