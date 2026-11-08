type Evaluator = (args: number[]) => number;
export type CompileResult = { ok: true; fn: (...args: number[]) => number } | { ok: false; error: string; position?: number };
const functions = new Map<string, (x: number) => number>([
  ['sin',Math.sin],['cos',Math.cos],['tan',Math.tan],['asin',Math.asin],['acos',Math.acos],['atan',Math.atan],
  ['sqrt',Math.sqrt],['exp',Math.exp],['log',Math.log],['log10',Math.log10],['sinh',Math.sinh],['cosh',Math.cosh],['tanh',Math.tanh],['abs',Math.abs],
]);
function checked(value: number): number {
  if (!Number.isFinite(value) || Math.abs(value) > 1e100) throw new Error('Sonuç gerçek ve sonlu olmalı.');
  return value;
}
/** Recursive descent: unary -> power -> primary; the power RHS is unary. */
export function compile(text: string, variables: readonly string[] = ['x']): CompileResult {
  let position = 0;
  try {
    if (text.length > 240) throw new Error('İfade en fazla 240 karakter olabilir.');
    if (new Set(variables).size !== variables.length || variables.some(v => !/^[a-zA-Z][a-zA-Z0-9]*$/.test(v) || functions.has(v) || ['pi','e','constructor','prototype'].includes(v)))
      throw new Error('Geçersiz değişken adı.');
    const source = text.replace(/π/g,'pi');
    let token = '', nodes = 0;
    const next = () => {
      while (/\s/.test(source[position] ?? '') && position < source.length) position++;
      const tail = source.slice(position);
      const found = /^(?:(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|[a-zA-Z_][a-zA-Z_0-9]*|\*\*|[+\-*/^()])/.exec(tail);
      if (!tail) { token = ''; return; }
      if (!found) throw new Error('Yalnız sayılar, değişkenler ve matematik fonksiyonları kullanılabilir.');
      token = found[0]; position += token.length;
    };
    const node = (fn: Evaluator): Evaluator => {
      if (++nodes > 100) throw new Error('İfade çok karmaşık; daha kısa bir ifade dene.');
      return fn;
    };
    const primary = (): Evaluator => {
      const current = token;
      if (/^(?:\d|\.)/.test(current)) {
        const value = Number(current);
        if (!Number.isFinite(value) || value > 1e6) throw new Error('Sabit sayı çok büyük veya geçersiz.');
        next(); return node(() => value);
      }
      if (current === '(') {
        next(); const result = sum();
        if (String(token) !== ')') throw new Error('Kapanış parantezi gerekli.');
        next(); return result;
      }
      if (/^[a-zA-Z_]/.test(current)) {
        next();
        const fn = functions.get(current);
        if (fn) {
          if (String(token) !== '(') throw new Error('Fonksiyonu parantezle kullan: sin(x).');
          next(); const arg = sum();
          if (String(token) !== ')') throw new Error('Fonksiyonlar tek argüman almalı.');
          next(); return node(args => checked(fn(arg(args))));
        }
        const index = variables.indexOf(current);
        if (index >= 0) return node(args => checked(args[index]!));
        if (current === 'pi' || current === 'e') return node(() => current === 'pi' ? Math.PI : Math.E);
        throw new Error(`Bilinmeyen isim: ${current}. Çarpma için * kullan.`);
      }
      throw new Error('İfadeyi kontrol et. Örnek: sin(x) veya x^2.');
    };
    const power = (): Evaluator => {
      const left = primary();
      if (token !== '^' && token !== '**') return left;
      next(); const right = unary();
      return node(args => {
        const a = left(args), b = right(args);
        if (Math.abs(b) > 100 || Math.abs(a) > 1e100) throw new Error('Üs sınırı aşıldı.');
        return checked(a ** b);
      });
    };
    const unary = (): Evaluator => {
      if (token !== '+' && token !== '-') return power();
      const negative = token === '-'; next(); const operand = unary();
      return node(args => negative ? -operand(args) : operand(args));
    };
    const product = (): Evaluator => {
      let left = unary();
      while (token === '*' || token === '/') {
        const op = token, a = left; next(); const b = unary();
        left = node(args => checked(op === '*' ? a(args)*b(args) : a(args)/b(args)));
      }
      return left;
    };
    const sum = (): Evaluator => {
      let left = product();
      while (token === '+' || token === '-') {
        const op = token, a = left; next(); const b = product();
        left = node(args => checked(op === '+' ? a(args)+b(args) : a(args)-b(args)));
      }
      return left;
    };
    next(); const root = sum();
    if (token) throw new Error('İfadeyi kontrol et; çarpma için * kullan.');
    return { ok: true, fn: (...args) => checked(root(args)) };
  } catch (error) { return { ok: false, error: error instanceof Error ? error.message : 'Geçersiz ifade.', position }; }
}
