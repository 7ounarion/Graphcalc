import { test, expect, tools, goToFeature, type HookCanvas } from './support';

test('derlenmiş çıktı yalnız yerel kaynaklarla çalışır', async ({ page }) => {
  const external: string[] = [];
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.protocol.startsWith('http') && url.origin !== 'http://localhost:4317') external.push(url.href);
  });
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    return url.protocol.startsWith('http') && url.origin !== 'http://localhost:4317' ? route.abort() : route.continue();
  });
  await page.goto('/');
  for (const id of tools) {
    await goToFeature(page, id);
    await expect(page.locator('main canvas')).toBeVisible();
    expect(await page.locator('main canvas').evaluate(canvas => '__gc' in (canvas as HookCanvas))).toBe(false);
  }
  expect(external).toEqual([]);
});
