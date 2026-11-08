import { apply2, det2, det2Exact, Fraction, lerpFromIdentity, parseNumber, formatNumber } from '../core';
import type { ExactMat2, Mat2, Vec2 } from '../core';
import type { Feature } from '../ui/types';
import { MatrixInput } from '../ui/matrix-input';
import { formula } from '../ui/formula';
import { button, note, toolPanel } from '../ui/panel';
import { pointBounds } from '../render/viewport2d';

export const det2d: Feature = {id:'det2d',title:'Determinant · 2D',group:'Determinant',mount(host,ctx) {
  const ui = toolPanel(host,ctx,'Determinant · 2D','Bir matrisin alanı ve yönelimi nasıl değiştirdiğini keşfedin.');
  let t = 1, animation = 0, previous = 0;
  const matrix = () => ctx.state.matrix2.map(row => row.map(text => { const p = parseNumber(text); return p.ok ? p.value : 0; })) as Mat2;
  const input = new MatrixInput(ctx.state.matrix2,(i,j,text) => ctx.update(s => { s.matrix2[i]![j] = text; })); ui.panel.append(input.element);
  const result = document.createElement('div'); result.className = 'det-result'; ui.panel.append(result);
  const intermediate = document.createElement('div'); intermediate.className = 'formula'; ui.panel.append(intermediate);
  const label = document.createElement('label'); label.textContent = 'Dönüşüm · t';
  const slider = document.createElement('input'); slider.type = 'range'; slider.min = '0'; slider.max = '1'; slider.step = '0.001'; slider.value = '1'; slider.setAttribute('aria-label','Dönüşüm t');
  const value = document.createElement('output'); value.textContent = '1,00'; ui.panel.append(label,slider,value);
  const base: Vec2[] = [[0,0],[1,0],[1,1],[0,1],[0,0]];
  const fit = () => ui.viewport.fit(pointBounds([...base,...base.map(p => apply2(matrix(),p))]));
  ui.toolbar.prepend(button('Görünüme sığdır',fit));
  function stop() { cancelAnimationFrame(animation); animation = 0; play.textContent = '▶ Oynat'; }
  function update() {
    slider.value = String(t); value.textContent = t.toFixed(2).replace('.',',');
    formula(intermediate,`\\det B(t)=${formatNumber(det2(lerpFromIdentity(matrix(),t)))}`); ui.viewport.request();
  }
  function tick(now: number) {
    t = Math.min(1,t+(now-previous)/3000); previous = now; update();
    if (t < 1) animation = requestAnimationFrame(tick); else stop();
  }
  const play = button('▶ Oynat',() => { if (animation) { stop(); return; } if (t >= 1) t = 0; previous = performance.now(); play.textContent = 'Ⅱ Duraklat'; animation = requestAnimationFrame(tick); });
  ui.panel.append(play); slider.addEventListener('input',() => { stop(); t = Number(slider.value); update(); });
  const presets = document.createElement('div'); presets.className = 'preset-list';
  for (const [name,a] of [['Ayna örneği',[['-1','0'],['0','1']]],['Uzun matris',[['3','0'],['1','11']]],['Birim matris',[['1','0'],['0','1']]]] as const) {
    presets.append(button(name,() => { stop(); t = 1; ctx.update(s => { s.matrix2 = a.map(row => [...row]) as typeof s.matrix2; }); }));
  }
  ui.panel.append(presets);
  note(ui.panel,'Sütun vektörleri birim bazın görüntüleridir. Kesir (1/3) ve ondalık virgül kullanabilirsiniz.');
  const animationFormula = document.createElement('div'); animationFormula.className = 'formula'; formula(animationFormula,'B(t)=(1-t)I+tA'); ui.panel.append(animationFormula);
  note(ui.panel,'Kesikli kare başlangıcı, renkli paralelkenar sonucu gösterir. F harfi yönelim değişimini görünür kılar.');
  ui.viewport.setPainter(v => {
    const b = lerpFromIdentity(matrix(),t), tr = (p: Vec2) => apply2(b,p);
    for (let i = -4; i <= 4; i++) { v.path([tr([i,-4]),tr([i,4])],'grid',1); v.path([tr([-4,i]),tr([4,i])],'grid',1); }
    v.path(base,'muted',1.5,true); v.path(base.map(tr),'teal',2.5,false,true);
    v.path(([[0.2,0.15],[0.2,0.8],[0.65,0.8],[0.2,0.8],[0.2,0.52],[0.53,0.52]] as Vec2[]).map(tr),'purple',4);
    v.arrow(tr([1,0]),'a₁','teal'); v.arrow(tr([0,1]),'a₂','orange');
  });
  const refresh = () => {
    input.sync(ctx.state.matrix2);
    const exact = ctx.state.matrix2.map(row => row.map(text => Fraction.parse(text))) as ExactMat2;
    const determinant = det2Exact(exact); formula(result,`\\det A=${determinant.toLatex()}`);
    formula(ui.result,`\\text{Alan}=${(determinant.sign() < 0 ? determinant.neg() : determinant).toLatex()}\\quad\\text{${determinant.isZero() ? 'Tekil: boyut kaybı' : determinant.sign() < 0 ? 'Yönelim ters' : 'Yönelim korunur'}}`);
    fit(); update();
  };
  const off = ctx.subscribe(refresh); refresh();
  return () => { stop(); off(); ui.destroy(); };
}};
