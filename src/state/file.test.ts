import { it, expect } from 'vitest';
import { defaultState } from './state';
import type { AppState } from './state';
import { serialize, parseFile } from './file';
it('round trips v2 with exact matrix text and preserves the original', () => {
  const s = defaultState(); s.matrix2[0][0] = '1/3'; s.motion.angle = 90;
  const before = structuredClone(s), result = parseFile(serialize(s));
  expect(result).toEqual({ok:true,state:s}); expect(s).toEqual(before);
  expect(parseFile(serialize(defaultState()))).toEqual({ok:true,state:defaultState()});
});
it('imports a v1 payload including numeric matrix cells and omitted first', () => {
  const s = defaultState(); s.motion.angle = 90;
  const { first: omitted, ...motion } = s.motion; expect(omitted).toBe(false);
  expect(parseFile({version:1,...s,matrix2:[[2,1],[0,2]],motion})).toEqual({ok:true,state:s});
});
it.each(['{','null','[]','{}','{"version":3}',undefined,42])('returns Turkish errors without throwing for %s', input => {
  const result = parseFile(input); expect(result.ok).toBe(false); if (!result.ok) expect(result.error).toMatch(/[çğıöşüİ]|GraphCalc/);
});
it.each([
  (s: AppState) => { s.conic.a = 0; },
  (s: AppState) => { s.conic.b = -1; },
  (s: AppState) => { s.functions.lo = s.functions.hi; },
  (s: AppState) => { s.functions.expr2 = 'alert(1)'; },
  (s: AppState) => { s.functions.expr3 = 'x.y'; },
  (s: AppState) => { s.motion.x = Infinity; },
  (s: AppState) => { s.motion.angle = 10001; },
  (s: AppState) => { s.matrix2[0][0] = '1/0'; },
])('validates all persistent inputs without modifying current state', mutate => {
  const current = defaultState(), incoming = structuredClone(current); mutate(incoming);
  expect(parseFile({format:'graphcalc',version:2,...incoming}).ok).toBe(false);
  expect(current).toEqual(defaultState());
});
it('rejects wrong types, missing fields, dimensions, unknown kinds and format', () => {
  const payload = {format:'graphcalc',version:2,...defaultState()};
  for (const patch of [
    {format:'other'}, {matrix2:[[1,2],[3,4]]}, {matrix3:[]}, {motion:{...payload.motion,first:'false'}},
    {motion:{...payload.motion,x:true}}, {conic:{...payload.conic,kind:'other'}},
    {functions:{...payload.functions,expr2:null}}, {functions:null}, {matrix2:null},
  ]) expect(parseFile({...payload,...patch}).ok).toBe(false);
  expect(parseFile({version:1}).ok).toBe(false);
});
it('allows signed parabolas and scientific JSON numbers', () => {
  const s = defaultState(); s.conic.kind = 'Parabol'; s.conic.a = -2; s.motion.x = 1e-7;
  expect(parseFile(serialize(s))).toEqual({ok:true,state:s});
});
it('imports v1 scientific numeric matrix cells and round trips them as v2 text', () => {
  const result = parseFile(JSON.stringify({version:1,...defaultState(),matrix2:[[2,1e-7],[0,2]]}));
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.state.matrix2).toEqual([['2','1e-7'],['0','2']]);
    expect(parseFile(serialize(result.state))).toEqual(result);
  }
});
