import { conic, formatNumber } from '../core';
import type { ConicKind } from '../core';
import type { Feature } from '../ui/types';
import { NumberField } from '../ui/number-field';
import { formula } from '../ui/formula';
import { button, note, toolPanel } from '../ui/panel';
import { pointBounds } from '../render/viewport2d';

export const conics: Feature = {id:'conics',title:'Konikler · 2D',group:'Konikler',mount(host,ctx) {
  const ui = toolPanel(host,ctx,'Konikler · 2D','Denklemden geometriye: merkez, odaklar ve yardımcı doğrular.');
  let geometry = conic(ctx.state.conic);
  const label = document.createElement('label'); label.textContent = 'Konik türü'; const select = document.createElement('select'); select.setAttribute('aria-label','Konik türü');
  for (const kind of ['Çember','Elips','Parabol','Hiperbol']) { const option = document.createElement('option'); option.textContent = kind; select.append(option); }
  ui.panel.append(label,select);
  select.addEventListener('change',() => ctx.update(s => { s.conic.kind = select.value as ConicKind; if (s.conic.kind !== 'Parabol') s.conic.a = Math.abs(s.conic.a); }));
  const fields = (['a','b','h','k','angle'] as const).map((key,i) => {
    const field = new NumberField({label:['a · yarıçap / parabol p','b · düşey yarı eksen','Merkez / tepe · h','Merkez / tepe · k','Eksen açısı (derece)'][i]!,value:ctx.state.conic[key],range:key === 'angle' ? [-180,180] : key === 'a' || key === 'b' ? [0.1,6] : [-6,6],apply:value => {
      conic({...ctx.state.conic,[key]:value}); ctx.update(s => { s.conic[key] = value; });
    }}); ui.panel.append(field.element); return {key,field};
  });
  note(ui.panel,'Çemberde r = a. Parabolde p = a; negatif p aşağı açılır. Turuncu noktalar odak, kesikli doğrular doğrultman veya asimptottur.');
  const equation = document.createElement('div'); equation.className = 'formula conic-equation'; ui.panel.append(equation);
  const fit = () => ui.viewport.fit(pointBounds([...geometry.paths.flat(),...geometry.foci,[ctx.state.conic.h,ctx.state.conic.k]]));
  ui.toolbar.prepend(button('Görünüme sığdır',fit));
  ui.viewport.setPainter(v => {
    for (const path of [...geometry.directrices,...geometry.asymptotes]) v.path(path,'orange',1.5,true);
    for (const path of geometry.paths) v.path(path);
    geometry.foci.forEach((p,i) => v.dot(p,`F${i+1}`,'orange')); v.dot([ctx.state.conic.h,ctx.state.conic.k],'C / V','purple');
  });
  const refresh = () => {
    geometry = conic(ctx.state.conic); select.value = ctx.state.conic.kind;
    fields.forEach(({key,field}) => { field.sync(ctx.state.conic[key]); if (key === 'b') { const disabled = ctx.state.conic.kind === 'Çember' || ctx.state.conic.kind === 'Parabol'; field.input.disabled = disabled; if (field.slider) field.slider.disabled = disabled; } });
    const parts = geometry.equation.split(',\\quad '); formula(ui.result,parts[0]!);
    const { h, k, angle } = ctx.state.conic;
    const shifted = (axis: string, offset: number) => offset === 0 ? axis : `${axis}${offset < 0 ? '+' : '-'}${formatNumber(Math.abs(offset))}`;
    const x = shifted('x', h), y = shifted('y', k);
    const theta = `${formatNumber(angle)}^\\circ`;
    const rows = angle === 0 ? [`u=${x}`, `v=${y}`] : [
      `u=(${x})\\cos(${theta})`, `\\phantom{u={}}+(${y})\\sin(${theta})`,
      `v=-(${x})\\sin(${theta})`, `\\phantom{v={}}+(${y})\\cos(${theta})`,
    ];
    equation.replaceChildren(); for (const part of rows) { const row = document.createElement('div'); formula(row,part); equation.append(row); }
    ui.viewport.request();
  };
  const off = ctx.subscribe(refresh); refresh(); fit(); return () => { off(); ui.destroy(); };
}};
