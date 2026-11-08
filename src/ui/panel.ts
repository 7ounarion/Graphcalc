import { Viewport2D } from '../render/viewport2d';
import type { AppContext } from './types';
export function button(text: string, action: () => void): HTMLButtonElement {
  const b = document.createElement('button'); b.type = 'button'; b.textContent = text; b.addEventListener('click',action); return b;
}
export function note(host: HTMLElement, text: string): HTMLElement {
  const p = document.createElement('p'); p.className = 'note'; p.textContent = text; host.append(p); return p;
}
export function toolPanel(host: HTMLElement, ctx: AppContext, title: string, subtitle: string) {
  host.innerHTML = '<header class="page-heading"><div class="eyebrow">GEOMETRİ LABORATUVARI</div><h1></h1><p></p></header><div class="tool-layout"><section class="graph-card"><div class="graph-toolbar"></div><div class="canvas-wrap"></div><div class="graph-result" aria-live="polite"></div></section><aside class="parameters"><h2>Parametreler</h2></aside></div>';
  host.querySelector('h1')!.textContent = title; host.querySelector('.page-heading p')!.textContent = subtitle;
  const panel = host.querySelector<HTMLElement>('.parameters')!;
  const result = host.querySelector<HTMLElement>('.graph-result')!;
  const viewport = new Viewport2D(host.querySelector<HTMLElement>('.canvas-wrap')!);
  const toolbar = host.querySelector('.graph-toolbar')!;
  toolbar.append(button('Görünümü sıfırla',() => viewport.reset()));
  const hint = document.createElement('span'); hint.textContent = 'Tekerlek: yakınlaştır · Sürükle: taşı'; toolbar.append(hint);
  const offTheme = ctx.onThemeChange(() => viewport.refreshTheme());
  return {panel,result,viewport,toolbar,destroy:() => { offTheme(); viewport.destroy(); }};
}
