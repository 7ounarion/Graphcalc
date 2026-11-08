import { transformTriangle, formatNumber } from '../core';
import type { Feature } from '../ui/types';
import { NumberField } from '../ui/number-field';
import { formula } from '../ui/formula';
import { button, note, toolPanel } from '../ui/panel';
import { pointBounds } from '../render/viewport2d';

export const transform2d: Feature = {id:'transform2d',title:'Dönüşümler · 2D',group:'Dönüşümler',mount(host,ctx) {
  const ui = toolPanel(host,ctx,'Dönüşümler · 2D','Bir noktayı ve üçgeni döndürün; ötelemenin sırasını değiştirin.');
  const fields = (['x','y','angle','cx','cy','dx','dy'] as const).map((key,i) => {
    const field = new NumberField({label:['P noktası · x','P noktası · y','Dönme açısı θ (derece)','Dönme merkezi · x','Dönme merkezi · y','Öteleme · dx','Öteleme · dy'][i]!,value:ctx.state.motion[key],range:key === 'angle' ? [-180,180] : [-6,6],apply:value => ctx.update(s => { s.motion[key] = value; })});
    ui.panel.append(field.element); return {key,field};
  });
  const orderLabel = document.createElement('label'); orderLabel.className = 'checkbox-label'; const order = document.createElement('input'); order.type = 'checkbox';
  orderLabel.append(order,document.createTextNode('Önce ötele, sonra döndür')); ui.panel.append(orderLabel);
  order.addEventListener('change',() => ctx.update(s => { s.motion.first = order.checked; }));
  note(ui.panel,'Pozitif açı saat yönünün tersidir. Kesikli üçgen başlangıç, turkuaz üçgen sonuç, C dönme merkezidir.');
  const f = document.createElement('div'); f.className = 'formula'; ui.panel.append(f);
  const fit = () => { const g = transformTriangle(ctx.state.motion), s = ctx.state.motion; ui.viewport.fit(pointBounds([...g.base,...g.result,[s.cx,s.cy],[0,0]])); };
  ui.toolbar.prepend(button('Görünüme sığdır',fit));
  ui.viewport.setPainter(v => {
    const g = transformTriangle(ctx.state.motion), s = ctx.state.motion;
    v.path(g.base,'muted',2,true); v.path(g.result,'teal',2.5,false,true);
    v.path([g.base[0]!,g.result[0]!],'purple',1,true);
    v.dot(g.base[0]!,'P','muted'); v.dot(g.result[0]!,'P′'); v.dot([s.cx,s.cy],'C','orange');
  });
  const refresh = () => {
    fields.forEach(({key,field}) => field.sync(ctx.state.motion[key])); order.checked = ctx.state.motion.first;
    const p = transformTriangle(ctx.state.motion).result[0]!;
    formula(ui.result,`P^\\prime=(${formatNumber(p[0])},\\;${formatNumber(p[1])})\\quad\\theta=${formatNumber(ctx.state.motion.angle)}^\\circ`);
    formula(f,ctx.state.motion.first ? 'P^\\prime=R_\\theta(P+d-C)+C' : 'P^\\prime=R_\\theta(P-C)+C+d'); ui.viewport.request();
  };
  const off = ctx.subscribe(refresh); refresh(); fit(); return () => { off(); ui.destroy(); };
}};
