import { test, expect, open, goToFeature, settle, tools, type HookCanvas } from './support';

test('tüm araçlar ve eski çizim/animasyon temizliği', async ({ page }) => {
  await page.addInitScript(() => {
    const original = window.requestAnimationFrame.bind(window);
    const counts: Record<string, number> = {};
    Object.assign(window, { __rafCounts: counts });
    window.requestAnimationFrame = callback => {
      const route = location.hash;
      return original(time => { counts[route] = (counts[route] ?? 0) + 1; callback(time); });
    };
  });
  await open(page);
  for (let i = 0; i < tools.length; i++) {
    const id = tools[i]!;
    await goToFeature(page, id);
    if (id === 'det2d') await page.getByRole('button', { name: '▶ Oynat', exact: true }).click();
    const old = await page.locator('main canvas').evaluateHandle(canvas => canvas as HookCanvas);
    const next = tools[(i + 1) % tools.length]!;
    await goToFeature(page, next);
    expect(await old.evaluate(canvas => canvas.__gc.snapshot().disposed)).toBe(true);
    const count = await page.evaluate(id => (window as unknown as { __rafCounts: Record<string, number> }).__rafCounts[`#/${id}`] ?? 0, id);
    await page.waitForTimeout(150);
    expect(await page.evaluate(id => (window as unknown as { __rafCounts: Record<string, number> }).__rafCounts[`#/${id}`] ?? 0, id)).toBe(count);
    await old.dispose();
  }
});

test('kesin açı, genişleyen aralık ve geçersiz giriş', async ({ page }) => {
  await open(page, 'transform2d');
  const angle = page.getByRole('textbox', { name: 'Dönme açısı θ (derece)', exact: true });
  for (const value of ['90', '360']) {
    await angle.fill(value); await angle.press('Enter'); await settle(page);
    await expect(angle).toHaveValue(value);
    await expect(page.locator('.graph-result')).toContainText(`θ=${value}`);
  }
  const slider = page.getByRole('slider', { name: 'Dönme açısı θ (derece) — kaydırıcı', exact: true });
  expect(Number(await slider.getAttribute('max'))).toBeGreaterThanOrEqual(360);
  const before = await page.locator('main canvas').evaluate(canvas => (canvas as HTMLCanvasElement).toDataURL());
  const result = await page.locator('.graph-result').textContent();
  await angle.fill('abc'); await angle.press('Enter'); await settle(page);
  await expect(angle).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator(`#${await angle.getAttribute('aria-describedby')}`)).toContainText(/.+/);
  expect(await page.locator('.graph-result').textContent()).toBe(result);
  expect(await page.locator('main canvas').evaluate(canvas => (canvas as HTMLCanvasElement).toDataURL())).toBe(before);
});

test('uzun matrisin sınır kutusu ve eş ölçek', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Uzun matris', exact: true }).click(); await settle(page);
  const bounds = await page.locator('canvas').evaluate(canvas => {
    const hook = (canvas as HookCanvas).__gc;
    return { points: [[0,0],[3,1],[3,12],[0,11]].map(p => hook.pixel(p as [number, number])), view: hook.snapshot(), origin: hook.pixel([0,0]), x: hook.pixel([1,0]), y: hook.pixel([0,1]) };
  });
  for (const [x, y] of bounds.points) {
    expect(x).toBeGreaterThan(0); expect(x).toBeLessThan(bounds.view.width);
    expect(y).toBeGreaterThan(0); expect(y).toBeLessThan(bounds.view.height);
  }
  expect(bounds.x[0] - bounds.origin[0]).toBeCloseTo(bounds.origin[1] - bounds.y[1], 8);
});

for (const id of tools) test(`${id}: taşma ve panel kaydırma`, async ({ page }) => {
  await open(page, id);
  const layout = await page.evaluate(() => {
    const panel = document.querySelector<HTMLElement>('.parameters, .det3d-panel, .function3d-panel')!;
    const workspace = document.querySelector<HTMLElement>('main')!;
    const rect = panel.getBoundingClientRect();
    const old = panel.scrollTop; panel.scrollTop = panel.scrollHeight;
    const scrolled = panel.scrollTop; panel.scrollTop = old;
    return { document: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      workspace: workspace.scrollWidth <= workspace.clientWidth,
      panel: panel.scrollWidth <= panel.clientWidth,
      overflow: getComputedStyle(panel).overflowY, needsScroll: panel.scrollHeight > panel.clientHeight,
      scrolled, right: rect.right, width: innerWidth };
  });
  expect(layout.document).toBe(true); expect(layout.workspace).toBe(true); expect(layout.panel).toBe(true);
  expect(layout.right).toBeLessThanOrEqual(layout.width);
  expect(['auto', 'scroll']).toContain(layout.overflow);
  if (layout.needsScroll) expect(layout.scrolled).toBeGreaterThan(0);
});

for (const id of ['det3d', 'function3d']) test(`${id}: WebGL, yörünge ve kaynak temizliği`, async ({ page }) => {
  await open(page, id);
  const canvas = page.locator('main canvas');
  const old = await canvas.evaluateHandle(canvas => canvas as HookCanvas);
  expect(await old.evaluate(canvas => canvas.__gc.snapshot().contextLost)).toBe(false);
  const before = await old.evaluate(canvas => canvas.__gc.snapshot().camera);
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 65, box.y + box.height / 2 + 35, { steps: 12 }); await page.mouse.up();
  await settle(page);
  expect(await old.evaluate(canvas => canvas.__gc.snapshot().camera)).not.toEqual(before);
  await goToFeature(page, 'det2d');
  await expect.poll(() => old.evaluate(canvas => canvas.__gc.snapshot().contextLost)).toBe(true);
  expect(await old.evaluate(canvas => canvas.__gc.snapshot().disposed)).toBe(true);
  await old.dispose();
});

test('dar araç seçicisi, odak ve geniş ekran bağlantıları', async ({ page }) => {
  await open(page);
  const compactNav = page.getByRole('combobox', { name: 'Araç seç', exact: true });
  const links = page.getByRole('navigation', { name: 'Araçlar', exact: true }).getByRole('link');
  if (page.viewportSize()!.width <= 1000) {
    await expect(compactNav).toBeVisible();
    for (const link of await links.all()) await expect(link).toBeHidden();
    await compactNav.focus();
    for (const id of ['det3d', 'function3d', 'det2d']) {
      await goToFeature(page, id);
      await expect(compactNav).toBeFocused();
    }
  } else {
    await expect(compactNav).toBeHidden();
    for (const link of await links.all()) await expect(link).toBeVisible();
    await goToFeature(page, 'det3d');
  }
});
