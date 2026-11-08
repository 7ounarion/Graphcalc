import { test, expect, goToFeature } from './support';

test('yanıt kontrolü, çözüm, kaynaklar ve oturumda koruma', async ({ page }) => {
  await page.goto('/#/questions/q01');
  const content = page.getByRole('main');
  const feedback = content.getByRole('status');
  const solution = content.getByRole('list', { name: 'Dört adımlı çözüm' });
  const check = page.getByRole('button', { name: 'Yanıtı kontrol et', exact: true });
  await check.click();
  await expect(feedback).toHaveText('Önce A, B, C veya D seçeneklerinden birini seçin.');
  await expect(solution.getByRole('listitem')).toHaveCount(0);

  await page.getByRole('radio', { name: 'B) 11', exact: true }).check();
  await check.click();
  await expect(feedback).toHaveText('Yanıtınız doğru değil. Doğru seçenek: A.');
  await page.getByRole('radio', { name: 'A) 5', exact: true }).check();
  await check.click();
  await expect(feedback).toHaveText('Doğru yanıt. Çözüm adımlarını inceleyin.');
  await expect(solution).toBeVisible();
  await expect(solution.getByRole('listitem')).toHaveCount(4);
  for (const step of await solution.getByRole('listitem').all()) await expect(step).toBeVisible();

  // Check every question's source links without opening external sites.
  const questions = page.getByRole('navigation', { name: 'Sorular', exact: true }).getByRole('link');
  const count = await questions.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    await questions.nth(i).click();
    await expect(questions.nth(i)).toHaveAttribute('aria-current', 'page');
    const sources = content.getByRole('heading', { name: 'Kaynaklar', exact: true }).locator('..').getByRole('link');
    expect(await sources.count()).toBeGreaterThan(0);
    for (const source of await sources.all()) {
      await expect(source).toHaveAttribute('target', '_blank');
      await expect(source).toHaveAttribute('rel', /\bnoopener\b/);
    }
  }
  await goToFeature(page, 'det2d');
  await expect(page.getByRole('heading', { level: 1 })).not.toHaveText('Sorular');
  await goToFeature(page, 'questions');
  await questions.first().click();
  await expect(page.getByRole('radio', { name: 'A) 5', exact: true })).toBeChecked();
  await expect(feedback).toHaveText('Doğru yanıt. Çözüm adımlarını inceleyin.');
  await expect(solution.getByRole('listitem')).toHaveCount(4);
});

test('tek soru ve tüm yanıtları sıfırlama', async ({ page }) => {
  await page.goto('/#/questions/q01');
  const questions = page.getByRole('navigation', { name: 'Sorular', exact: true }).getByRole('link');
  const radios = page.getByRole('radio');
  const check = page.getByRole('button', { name: 'Yanıtı kontrol et', exact: true });
  const solution = page.getByRole('list', { name: 'Dört adımlı çözüm' });
  await radios.first().check(); await check.click();
  await questions.nth(1).click();
  await radios.first().check(); await check.click();
  await page.getByRole('button', { name: 'Bu soruyu sıfırla', exact: true }).click();
  await expect(page.getByRole('radio', { checked: true })).toHaveCount(0);
  await expect(solution.getByRole('listitem')).toHaveCount(0);
  await questions.first().click();
  await expect(radios.first()).toBeChecked();
  await expect(solution.getByRole('listitem')).toHaveCount(4);

  await questions.nth(1).click();
  await radios.first().check(); await check.click();
  await page.getByRole('button', { name: 'Tüm yanıtları sıfırla', exact: true }).click();
  for (let i = 0; i < await questions.count(); i++) {
    await questions.nth(i).click();
    await expect(questions.nth(i)).toContainText('Yanıtsız');
    await expect(page.getByRole('radio', { checked: true })).toHaveCount(0);
    await expect(solution.getByRole('listitem')).toHaveCount(0);
  }
});

test('üç ders, doğrudan bağlantı, geri gezinme ve KaTeX', async ({ page }) => {
  await page.goto('/#/lessons');
  const lessons = page.getByRole('navigation', { name: 'Dersler', exact: true }).getByRole('link');
  await expect(lessons).toHaveCount(3);
  const heading = page.getByRole('article').getByRole('heading', { level: 2 });
  for (let i = 0; i < 3; i++) {
    const lesson = lessons.nth(i);
    await lesson.click();
    await expect(lesson).toHaveAttribute('aria-current', 'page');
    await expect(heading).toHaveText((await lesson.textContent())!);
  }
  await expect(page.locator('.katex').first()).toBeVisible();
  const previousTitle = (await lessons.nth(1).textContent())!;
  await page.goBack();
  await expect(lessons.nth(1)).toHaveAttribute('aria-current', 'page');
  await expect(heading).toHaveText(previousTitle);

  const directHref = (await lessons.nth(2).getAttribute('href'))!;
  const directTitle = (await lessons.nth(2).textContent())!;
  await page.goto(`/${directHref}`);
  await expect(lessons.nth(2)).toHaveAttribute('aria-current', 'page');
  await expect(heading).toHaveText(directTitle);
  await expect(page.locator('.katex').first()).toBeVisible();
});
