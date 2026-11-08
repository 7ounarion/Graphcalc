import { test, expect, open, type HookCanvas } from './support';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

test('en az üç saniye sürekli kaydırıcı sürükleme', async ({ page }, info) => {
  await open(page);
  const slider = page.getByRole('slider', { name: 'Dönüşüm t', exact: true });
  await slider.scrollIntoViewIfNeeded();
  const initial = await page.locator('canvas').evaluate(canvas => (canvas as HookCanvas).__gc.stats().length);
  const box = (await slider.boundingBox())!;
  const start = Date.now();
  await page.mouse.move(box.x + 8, box.y + box.height / 2); await page.mouse.down();
  let inputs = 0;
  while (Date.now() - start < 3100) {
    await page.mouse.move(box.x + 8 + (box.width - 16) * (0.5 + 0.48 * Math.sin(inputs * 0.2)), box.y + box.height / 2);
    inputs++; await page.waitForTimeout(16);
  }
  await page.mouse.up();
  const times = await page.locator('canvas').evaluate(canvas => (canvas as HookCanvas).__gc.stats());
  const samples = times.slice(initial).sort((a, b) => a - b);
  const percentile = (p: number) => samples[Math.ceil(samples.length * p) - 1] ?? 0;
  const result = { project: info.project.name, durationMs: Date.now() - start, inputs, frames: samples.length,
    p50: percentile(0.5), p95: percentile(0.95), max: samples.at(-1) ?? 0, unit: 'ms', budgetMs: 16.7 };
  await mkdir('docs', { recursive: true });
  let results: Record<string, unknown> = {};
  try { results = JSON.parse(await readFile('docs/perf.json', 'utf8')); } catch { /* First project creates the report. */ }
  results[info.project.name] = result;
  await writeFile('docs/perf.json', JSON.stringify(results, null, 2) + '\n');
  await info.attach('perf', { body: JSON.stringify(result), contentType: 'application/json' });
  expect(result.durationMs).toBeGreaterThanOrEqual(3000);
  expect(result.frames, 'Sürükleme boyunca görünür çizim sürmeli').toBeGreaterThan(30);
  expect(result.p95).toBeLessThanOrEqual(16.7);
});

