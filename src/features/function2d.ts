import { compile, sampleCurve } from '../core';
import type { Feature } from '../ui/types';
import { NumberField } from '../ui/number-field';
import { formula } from '../ui/formula';
import { button, note, toolPanel } from '../ui/panel';
import { pointBounds } from '../render/viewport2d';

export const function2d: Feature = {id:'function2d',title:'Fonksiyonlar · 2D',group:'Fonksiyonlar',mount(host,ctx) {
  const ui = toolPanel(host,ctx,'Fonksiyonlar · 2D','Bir ifade yazın, grafiğini inceleyin. Trigonometrik argümanlar radyandır.');
  let paths: [number,number][][] = [], lastExpression = ctx.state.functions.expr2;
  const label = document.createElement('label'); label.htmlFor = 'function-expression'; label.textContent = 'Fonksiyon ifadesi · f(x)';
  const input = document.createElement('input'); input.id = label.htmlFor; input.type = 'text'; input.value = lastExpression; input.spellcheck = false;
  const error = document.createElement('small'); error.id = 'expression-error'; error.className = 'field-error'; error.setAttribute('aria-live','polite'); input.setAttribute('aria-describedby',error.id);
  const apply = () => {
    const result = compile(input.value,['x']);
    if (!result.ok) { error.textContent = result.error; input.setAttribute('aria-invalid','true'); return; }
    error.textContent = ''; input.removeAttribute('aria-invalid'); ctx.update(s => { s.functions.expr2 = input.value; });
  };
  input.addEventListener('keydown',e => { if (e.key === 'Enter') apply(); }); input.addEventListener('blur',apply);
  ui.panel.append(label,input,error,button('İfadeyi uygula',apply));
  const fields = (['lo','hi'] as const).map((key,i) => {
    const field = new NumberField({label:i === 0 ? 'Aralık başlangıcı' : 'Aralık bitişi',value:ctx.state.functions[key],apply:value => {
      const s = {...ctx.state.functions,[key]:value}; if (s.lo >= s.hi) throw new Error('Başlangıç, bitişten küçük olmalı.'); ctx.update(draft => { draft.functions[key] = value; });
    }}); ui.panel.append(field.element); return {key,field};
  });
  const examples = document.createElement('div'); examples.className = 'preset-list';
  for (const expression of ['sin(x)','sqrt(9-x^2)','1/x']) examples.append(button(expression,() => { input.value = expression; apply(); })); ui.panel.append(examples);
  note(ui.panel,'Çarpma: * · üs: ^ veya **. sin, cos, tan, asin, acos, atan, sqrt, abs, exp, log, log10, sinh, cosh, tanh; pi ve e desteklenir. log doğal logaritmadır.');
  note(ui.panel,'Tanımsız noktalar ayrı dallarda çizilir. Sonlu örnekleme çok dar özellikleri veya örnekler arasındaki süreksizlikleri kaçırabilir.');
  const fit = () => {
    const points = paths.flat(), sorted = points.map(p => p[1]).sort((a,b) => a-b);
    const lo = sorted[Math.floor(sorted.length*0.02)] ?? -5, hi = sorted[Math.floor(sorted.length*0.98)] ?? 5;
    ui.viewport.fit(pointBounds([[ctx.state.functions.lo,Math.min(0,lo)],[ctx.state.functions.hi,Math.max(0,hi)]]));
  };
  ui.toolbar.prepend(button('Görünüme sığdır',fit)); ui.viewport.setPainter(v => paths.forEach(path => v.path(path,'blue')));
  const refresh = () => {
    const s = ctx.state.functions, compiled = compile(s.expr2,['x']); if (!compiled.ok) return;
    if (s.expr2 !== lastExpression) { input.value = s.expr2; lastExpression = s.expr2; error.textContent = ''; input.removeAttribute('aria-invalid'); }
    fields.forEach(({key,field}) => field.sync(s[key])); paths = sampleCurve(compiled.fn,s.lo,s.hi,1201);
    formula(ui.result,'y=f(x)'); const expression = document.createElement('code'); expression.textContent = s.expr2; ui.result.append(expression); ui.viewport.request();
  };
  const off = ctx.subscribe(refresh); refresh(); fit(); return () => { off(); ui.destroy(); };
}};
