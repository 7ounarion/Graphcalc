import { describe, expect, it } from 'vitest';
import katex from 'katex';
import { LESSONS, LESSON_INLINE_FORMULAS } from './lessons';
import { QUESTIONS } from './questions';
import v1Questions from './__fixtures__/v1-questions.json';
import v1Lessons from './__fixtures__/v1-lessons.json';

function normalize(text: string): string {
  return text.replace(/\s+/g, '');
}

// Only these exact formula conversions are allowed. Reverse them before comparing
// the entire lesson, so no prose (even beside a converted formula) is exempted.
const formulaConversions = [
  ['T(x,y) = (x+dx, y+dy).', String.raw`T(x,y) = (x+dx, y+dy).`],
  ['x′ = x cosθ − y sinθ', String.raw`x' = x\cos\theta - y\sin\theta`],
  ['y′ = x sinθ + y cosθ', String.raw`y' = x\sin\theta + y\cos\theta`],
  ['Rθ = [[cosθ, −sinθ], [sinθ, cosθ]]', String.raw`R_\theta = \begin{pmatrix}\cos\theta & -\sin\theta \\ \sin\theta & \cos\theta\end{pmatrix}`],
  ['det Rθ = 1.', String.raw`\det R_\theta = 1.`],
  ['(x−h)²+(y−k)²=r².', String.raw`(x-h)^2+(y-k)^2=r^2.`],
  ['(x−h)²/a²+(y−k)²/b²=1, a,b>0.', String.raw`\frac{(x-h)^2}{a^2}+\frac{(y-k)^2}{b^2}=1, \quad a,b>0.`],
  ['(x−h)²=4p(y−k), p≠0.', String.raw`(x-h)^2=4p(y-k), \quad p\ne 0.`],
  ['(x−h)²/a²−(y−k)²/b²=1.', String.raw`\frac{(x-h)^2}{a^2}-\frac{(y-k)^2}{b^2}=1.`],
] as const;

describe('content', () => {
  it('renders each inline formula and retains its exact source in the lessons', () => {
    const prose = LESSONS.flatMap(lesson => lesson.blocks).filter(block => block.kind !== 'formula').map(block => block.text).join('\n');
    for (const [source, latex] of LESSON_INLINE_FORMULAS) {
      expect(prose).toContain(source);
      expect(() => katex.renderToString(latex, { throwOnError: true, strict: 'error' })).not.toThrow();
    }
    for (const matrix of prose.match(/A\s*=\s*\[\[.*?\]\]/g) ?? []) {
      expect(LESSON_INLINE_FORMULAS.some(([source]) => source === matrix)).toBe(true);
    }
  });

  it('contains eight well-formed approved questions', () => {
    expect(QUESTIONS).toHaveLength(8);
    expect(new Set(QUESTIONS.map((question) => question.id)).size).toBe(8);
    for (const question of QUESTIONS) {
      expect(question.options).toHaveLength(4);
      expect(question.steps).toHaveLength(4);
      expect(question.correct).toBeGreaterThanOrEqual(0);
      expect(question.correct).toBeLessThanOrEqual(3);
      expect(question.sources.length).toBeGreaterThan(0);
      for (const source of question.sources) expect(source.url).toMatch(/^https:\/\//);
    }
  });

  it('preserves all v1 question fields and order', () => {
    expect(QUESTIONS).toEqual(v1Questions);
  });

  it('preserves v1 lesson text, accounting for formula conversion', () => {
    expect(LESSONS.map((lesson) => lesson.title)).toEqual(Object.keys(v1Lessons));
    for (const [title, source] of Object.entries(v1Lessons)) {
      const lesson = LESSONS.find((item) => item.title === title)!;
      const current = lesson.blocks.map((block) => {
        if (block.kind !== 'formula') return block.text;
        const conversion = formulaConversions.find(([, latex]) => latex === block.text);
        expect(conversion, `Unlisted formula in ${title}: ${block.text}`).toBeDefined();
        return conversion![0];
      }).join(' ');
      expect(normalize(current), title).toBe(normalize(source));
    }
  });

  it('uses formula blocks for every listed conversion', () => {
    const formulas = LESSONS.flatMap((lesson) => lesson.blocks)
      .filter((block) => block.kind === 'formula').map((block) => block.text);
    expect(formulas).toEqual(formulaConversions.map(([, latex]) => latex));
  });

  it('keeps prose examples and pitfalls out of math mode', () => {
    const blocks = LESSONS.flatMap((lesson) => lesson.blocks);
    expect(blocks.find((block) => block.text.startsWith('A = [[2, 1]'))?.kind).toBe('text');
    expect(blocks.find((block) => block.text.startsWith('det = 0 demek'))?.kind).toBe('pitfall');
    expect(blocks.find((block) => block.text.startsWith('P=(1,0) için önce'))?.kind).toBe('example');
  });

  it('uses 2D/3D terminology, allowing only the approved algebra in q04', () => {
    for (const question of QUESTIONS) {
      const text = JSON.stringify(question);
      // q04 steps[1]: both occurrences mean two times point B, not dimension.
      const checked = question.id === 'q04'
        ? text.replace('2B−X′=2B−(2A−X)', 'two-times-B algebra') : text;
      expect(checked).not.toMatch(/2B|3B/);
    }
  });

  it('renders every formula with strict KaTeX and lessons have ASCII ids', () => {
    for (const lesson of LESSONS) {
      expect(lesson.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      for (const block of lesson.blocks) {
        expect(block.text).not.toMatch(/2B|3B/);
        if (block.kind === 'formula') {
          expect(block.text).not.toMatch(/[çğışöüÇĞİŞÖÜ]/);
          katex.renderToString(block.text, { throwOnError: true, strict: 'error' });
        }
      }
    }
  });
});
