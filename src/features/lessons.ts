import { LESSONS, LESSON_INLINE_FORMULAS } from '../content/lessons';
import type { Feature } from '../ui/types';
import { formula } from '../ui/formula';

function selectedId(): string {
  const id = location.hash.split('/')[2];
  return LESSONS.some(lesson => lesson.id === id) ? id! : LESSONS[0]!.id;
}

function lessonText(host: HTMLElement, text: string): void {
  // Prefer the longest fragment at the next position, so a matrix or full
  // equation is rendered together instead of matching one of its coordinates.
  let remaining = text;
  while (remaining) {
    const match = LESSON_INLINE_FORMULAS.map(([source, latex]) => ({ source, latex, index: remaining.indexOf(source) }))
      .filter(item => item.index >= 0)
      .sort((a, b) => a.index - b.index || b.source.length - a.source.length)[0];
    if (!match) { host.append(document.createTextNode(remaining)); break; }
    host.append(document.createTextNode(remaining.slice(0, match.index)));
    const equation = document.createElement('span');
    formula(equation, match.latex, false);
    host.append(equation);
    remaining = remaining.slice(match.index + match.source.length);
  }
}

export const lessons: Feature = { id: 'lessons', title: 'Konu anlatımı', group: 'Öğren', mount(host) {
  host.innerHTML = '<header class="page-heading"><div class="eyebrow">GEOMETRİ LABORATUVARI</div><h1>Konu anlatımı</h1><p>Temel fikirleri inceleyin, örneklerle pekiştirin.</p></header><div class="lesson-layout"><nav class="lesson-list" aria-label="Dersler"></nav><article class="lesson-content" aria-live="polite"></article></div>';
  const list = host.querySelector<HTMLElement>('.lesson-list')!;
  const content = host.querySelector<HTMLElement>('.lesson-content')!;
  for (const lesson of LESSONS) {
    const link = document.createElement('a'); link.href = `#/lessons/${lesson.id}`; link.textContent = lesson.title; list.append(link);
  }
  function render() {
    const id = selectedId(), lesson = LESSONS.find(item => item.id === id)!;
    list.querySelectorAll('a').forEach(link => {
      if (link.hash === `#/lessons/${id}`) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
    content.replaceChildren();
    const heading = document.createElement('h2'); heading.textContent = lesson.title; content.append(heading);
    let section = '';
    let bullets: HTMLUListElement | undefined;
    for (const block of lesson.blocks) {
      const isHeading = block.kind === 'text' && block.text.length < 80 && /[A-ZÇĞİÖŞÜ]/u.test(block.text) && block.text === block.text.toLocaleUpperCase('tr-TR');
      if (isHeading) {
        section = block.text;
        const subheading = document.createElement('h3'); subheading.textContent = block.text;
        content.append(subheading); bullets = undefined; continue;
      }
      if (block.text.trimStart().startsWith('•')) {
        if (!bullets) { bullets = document.createElement('ul'); bullets.className = 'lesson-bullets'; content.append(bullets); }
        for (const line of block.text.split('\n')) {
          const item = document.createElement('li'); lessonText(item, line.replace(/^\s*•\s*/, '')); bullets.append(item);
        }
        continue;
      }
      bullets = undefined;
      if (block.kind === 'formula') {
        const equation = document.createElement('div'); equation.className = 'lesson-formula'; formula(equation, block.text, true); content.append(equation);
      } else {
        const paragraph = document.createElement('p'); lessonText(paragraph, block.text);
        paragraph.className = block.kind === 'example' || section === 'ÖRNEK' ? 'lesson-example' : block.kind === 'pitfall' ? 'lesson-pitfall' : 'lesson-text';
        content.append(paragraph);
      }
    }
  }
  const onHashChange = () => render();
  window.addEventListener('hashchange', onHashChange); render();
  return () => window.removeEventListener('hashchange', onHashChange);
}};
