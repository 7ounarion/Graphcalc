import { parseNumber } from '../core/number';
import { compile } from '../core/expression';
import { conic } from '../core/conic';
import type { ConicKind } from '../core/conic';
import { defaultState } from './state';
import type { AppState } from './state';
export type FileResult = { ok: true; state: AppState } | { ok: false; error: string };
function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('Eksik veya geçersiz GraphCalc dosyası.');
  return value as Record<string, unknown>;
}
function numeric(value: unknown): number {
  if (typeof value !== 'string' && typeof value !== 'number') throw new Error('Geçerli bir sayı gerekli.');
  // JSON numbers may use scientific notation; convert those directly, while text uses the input grammar.
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || Math.abs(value)>10000) throw new Error('Sayı -10000 ile 10000 arasında olmalı.');
    return value;
  }
  const result = parseNumber(value);
  if (!result.ok) throw new Error(result.error);
  return result.value;
}
function matrix(value: unknown, n: number, legacy: boolean): string[][] {
  if (!Array.isArray(value) || value.length !== n) throw new Error('Matris boyutu geçersiz.');
  return value.map((row: unknown) => {
    if (!Array.isArray(row) || row.length !== n) throw new Error('Matris boyutu geçersiz.');
    return row.map((cell: unknown) => {
      if (typeof cell !== 'string' && !(legacy && typeof cell === 'number')) throw new Error('Matris hücreleri metin olmalı.');
      const text = String(cell), result = parseNumber(text);
      if (!result.ok) throw new Error(result.error);
      return text;
    });
  });
}
export function serialize(state: AppState): string {
  // Copy the persistent fields explicitly; camera, animation and extra UI fields are excluded.
  return JSON.stringify({format:'graphcalc',version:2,matrix2:state.matrix2,matrix3:state.matrix3,motion:state.motion,conic:state.conic,functions:state.functions});
}
/** Accepts JSON text or a parsed payload. Never mutates a caller's state or throws. */
export function parseFile(input: unknown): FileResult {
  try {
    const data = record(typeof input === 'string' ? JSON.parse(input) as unknown : input);
    if (!(data.version === 1 || data.version === 2 && data.format === 'graphcalc')) throw new Error('Desteklenmeyen GraphCalc dosyası.');
    const state = defaultState();
    state.matrix2 = matrix(data.matrix2,2,data.version === 1) as AppState['matrix2'];
    state.matrix3 = matrix(data.matrix3,3,data.version === 1) as AppState['matrix3'];
    const motion = record(data.motion), shape = record(data.conic), functions = record(data.functions);
    for (const key of ['x','y','angle','cx','cy','dx','dy'] as const) state.motion[key] = numeric(motion[key]);
    const first = data.version === 1 && motion.first === undefined ? false : motion.first;
    if (typeof first !== 'boolean') throw new Error('İşlem sırası true/false olmalı.');
    state.motion.first = first;
    if (!['Çember','Elips','Parabol','Hiperbol'].includes(String(shape.kind))) throw new Error('Bilinmeyen konik.');
    state.conic.kind = shape.kind as ConicKind;
    for (const key of ['a','b','h','k','angle'] as const) state.conic[key] = numeric(shape[key]);
    conic(state.conic);
    for (const key of ['expr2','expr3'] as const) {
      const text = functions[key];
      if (typeof text !== 'string') throw new Error('Fonksiyon ifadesi metin olmalı.');
      const result = compile(text,key === 'expr2' ? ['x'] : ['x','y']);
      if (!result.ok) throw new Error(result.error);
      state.functions[key] = text;
    }
    state.functions.lo = numeric(functions.lo); state.functions.hi = numeric(functions.hi);
    if (state.functions.lo >= state.functions.hi) throw new Error('Aralık başlangıcı bitişten küçük olmalı.');
    return {ok:true,state};
  } catch (error) {
    return {ok:false,error: error instanceof SyntaxError ? 'Geçersiz JSON dosyası.' : error instanceof Error ? error.message : 'Geçersiz GraphCalc dosyası.'};
  }
}
