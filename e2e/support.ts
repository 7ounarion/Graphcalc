import { test as base, expect, type Page } from '@playwright/test';

export const tools = ['det2d', 'det3d', 'transform2d', 'conics', 'function2d', 'function3d'];
export const test = base.extend<{ consoleGuard: void }>({
  consoleGuard: [async ({ context }, use) => {
    const errors: string[] = [];
    context.on('page', page => {
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('pageerror', error => errors.push(error.message));
    });
    await use();
    expect(errors, 'Tarayıcı konsolu ve yakalanmamış hatalar').toEqual([]);
  }, { auto: true }],
});
export { expect };
export async function open(page: Page, id = 'det2d') {
  await page.goto(`/?test#/${id}`);
  await goToFeature(page, id);
}
export async function goToFeature(page: Page, id: string) {
  const link = page.locator(`nav a[href="#/${id}"]`);
  const compactNav = page.getByRole('combobox', { name: 'Araç seç', exact: true, includeHidden: true });
  if (await compactNav.isVisible()) await compactNav.selectOption(id);
  else await link.click();
  await expect(page).toHaveURL(new RegExp(`#/${id}$`));
  await expect(page.locator(`nav a[href="#/${id}"]`)).toHaveAttribute('aria-current', 'page');
  await expect(compactNav).toHaveValue(id);
  if (id === 'det3d' || id === 'function3d') {
    await expect(page.getByRole('main').getByRole('status').filter({ hasText: '3D sahne yükleniyor…' })).toHaveCount(0);
  }
  if (tools.includes(id)) await expect(page.locator('main canvas')).toBeVisible();
  else await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible();
  await settle(page);
}
export async function settle(page: Page) {
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}
// Browser hooks are deliberately typed here without extending the application's global API.
export type HookCanvas = HTMLCanvasElement & { __gc: {
  stats(): number[];
  pixel(point: [number, number]): [number, number];
  snapshot(): { disposed: boolean; pending: boolean; width: number; height: number; camera: unknown; contextLost: boolean };
} };
