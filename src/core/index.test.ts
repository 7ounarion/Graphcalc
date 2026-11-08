import { it, expect } from 'vitest';
import * as core from './index';
it('exports the UI-independent public contracts', () => {
  for (const name of ['Fraction','parseNumber','det2','det3','det2Exact','det3Exact','apply2','apply3','lerpFromIdentity','rotate','move','transformTriangle','conic','curve','compile','sampleCurve','sampleSurface'] as const) expect(typeof core[name]).toBe('function');
});
