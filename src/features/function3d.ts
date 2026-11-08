import * as THREE from 'three';
import { compile, parseNumber, sampleSurface } from '../core';
import type { SurfaceSamples } from '../core';
import { disposeObject, Scene3D } from '../render/scene3d';
import type { Feature } from '../ui/types';

/** A triangle is emitted only when all three of its sampled vertices are valid. */
export function surfaceGeometry(samples: SurfaceSamples): THREE.BufferGeometry {
  const rows = samples.grid.length;
  const columns = samples.grid[0]?.length ?? 0;
  const positions: number[] = [];
  const valid: boolean[] = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const point = samples.grid[row]![column];
      const finite = !!samples.mask[row]?.[column] && !!point && point.every(value => Number.isFinite(Math.fround(value)));
      valid.push(finite);
      positions.push(...(finite ? point! : [0, 0, 0]));
    }
  }
  const indices: number[] = [];
  for (let row = 0; row < rows - 1; row++) {
    for (let column = 0; column < columns - 1; column++) {
      const a = row * columns + column;
      const b = a + 1;
      const c = a + columns;
      const d = c + 1;
      if (valid[a] && valid[b] && valid[c]) indices.push(a, b, c);
      if (valid[b] && valid[d] && valid[c]) indices.push(b, d, c);
    }
  }
  // Compact to referenced vertices so masked placeholders cannot distort the bounds.
  const remap = new Map<number, number>();
  const compact: number[] = [];
  const compactIndices = indices.map(index => {
    let mapped = remap.get(index);
    if (mapped === undefined) {
      mapped = remap.size;
      remap.set(index, mapped);
      compact.push(positions[index * 3]!, positions[index * 3 + 1]!, positions[index * 3 + 2]!);
    }
    return mapped;
  });
  const geometry = new THREE.BufferGeometry();
  // Quantiles use only vertices belonging to drawable triangles. Clamp the actual
  // mesh too, so outliers cannot escape the fitted box or flatten its color range.
  const heights = compact.filter((_, index) => index % 3 === 2).sort((a, b) => a - b);
  let clipped = false;
  if (heights.length) {
    const quantile = (fraction: number): number => {
      const index = (heights.length - 1) * fraction;
      const lower = Math.floor(index);
      return heights[lower]! + (heights[Math.ceil(index)]! - heights[lower]!) * (index - lower);
    };
    const min = quantile(0.02);
    const max = quantile(0.98);
    for (let index = 2; index < compact.length; index += 3) {
      const z = compact[index]!;
      compact[index] = Math.max(min, Math.min(max, z));
      clipped ||= compact[index] !== z;
    }
  }
  geometry.userData.clipped = clipped;
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(compact, 3));
  geometry.setIndex(compactIndices);
  geometry.computeBoundingBox();
  geometry.computeVertexNormals();
  const colors: number[] = [];
  const low = geometry.boundingBox!.min.z;
  const span = geometry.boundingBox!.max.z - low;
  for (let index = 2; index < compact.length; index += 3) {
    const t = span > 0 ? (compact[index]! - low) / span : 0.5;
    const color = new THREE.Color().setHSL(0.64 - t * 0.52, 0.66, 0.52);
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  return geometry;
}

export const function3d: Feature = {
  id: 'function3d', title: 'Fonksiyonlar · 3D', group: 'Fonksiyonlar',
  mount(host, ctx) {
    const root = document.createElement('section');
    root.className = 'function3d-page';
    root.innerHTML = `<style>
      .function3d-page { display:grid; grid-template-columns:minmax(0,1fr) 290px; gap:16px; min-height:480px; height:100%; color:var(--function3d-ink); }
      .function3d-page[data-theme=light] { --function3d-ink:#203447; --function3d-bg:#fff; --function3d-border:#afbfcb; --function3d-error:#aa2525; }
      .function3d-page[data-theme=dark] { --function3d-ink:#e7eef6; --function3d-bg:#172637; --function3d-border:#62768c; --function3d-error:#ffaaaa; }
      .function3d-view { min-width:0; min-height:380px; border-radius:12px; }
      .function3d-panel { overflow:auto; padding:16px; background:var(--function3d-bg); border-radius:12px; }
      .function3d-panel h2 { font-size:20px; margin:0 0 16px; }
      .function3d-panel p { line-height:1.5; }
      .function3d-panel label { display:block; margin:12px 0; }
      .function3d-panel input { box-sizing:border-box; width:100%; margin-top:4px; padding:9px; color:inherit; background:var(--function3d-bg); border:1px solid var(--function3d-border); border-radius:5px; }
      .function3d-panel button { margin:4px 0; padding:9px 12px; color:inherit; background:var(--function3d-bg); border:1px solid var(--function3d-border); border-radius:6px; cursor:pointer; }
      .function3d-error { color:var(--function3d-error); }
      @media(max-width:700px) { .function3d-page { grid-template-columns:1fr; height:auto; } .function3d-view { height:420px; } }
    </style><div class="function3d-view"></div><aside class="function3d-panel">
    <h2>z = f(x, y)</h2><form><label>Fonksiyon ifadesi<input name="expression" type="text" spellcheck="false"></label>
    <label>Aralık başlangıcı (x ve y)<input name="lo" type="text"></label>
    <label>Aralık bitişi (x ve y)<input name="hi" type="text"></label><button type="submit">Yüzeyi çiz</button></form>
    <p class="function3d-error" role="alert"></p><p class="function3d-status" aria-live="polite"></p>
    <button class="function3d-wire" type="button" aria-pressed="false">Tel örgü</button>
    <button class="function3d-fit" type="button">Görünüme sığdır</button>
    <p>Yükseklik arttıkça renk maviden sarıya döner. Trigonometrik açılar radyandır.</p>
    <p>Örnekler · (x^2-y^2)/4, sin(x)*cos(y), sqrt(9-x^2-y^2)</p>
    <p>Tanımsız örnekler yüzeyden çıkarılır. Sonlu örnekleme çok dar özellikleri ve örnekler arasındaki süreksizlikleri kaçırabilir.</p>
    <p>Sürükle ile döndür · Tekerlek ile yakınlaştır · Sağ tuşla taşı</p></aside>`;
    host.append(root);
    const scene = new Scene3D(root.querySelector<HTMLElement>('.function3d-view')!, ctx.theme);
    const form = root.querySelector('form')!;
    const expression = form.elements.namedItem('expression') as HTMLInputElement;
    const lo = form.elements.namedItem('lo') as HTMLInputElement;
    const hi = form.elements.namedItem('hi') as HTMLInputElement;
    const error = root.querySelector<HTMLElement>('.function3d-error')!;
    const status = root.querySelector<HTMLElement>('.function3d-status')!;
    const wireButton = root.querySelector<HTMLButtonElement>('.function3d-wire')!;
    const events = new AbortController();
    let wire: THREE.Mesh | undefined;
    let showWire = false;
    let bounds = new THREE.Box3();
    let previous = '';
    const draw = (text: string, start: number, end: number): boolean => {
      const compiled = compile(text, ['x', 'y']);
      if (!compiled.ok) { error.textContent = compiled.error; return false; }
      if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
        error.textContent = 'Başlangıç, bitişten küçük ve sonlu olmalı.'; return false;
      }
      const samples = sampleSurface(compiled.fn, start, end, 81);
      if (samples.grid.some((row, i) => row.some((point, j) => samples.mask[i]![j] &&
        point.some(value => !Number.isFinite(Math.fround(value)))))) {
        error.textContent = 'Yüzey değerleri grafik donanımının sayı aralığını aşıyor. İfadeyi veya aralığı küçült.';
        return false;
      }
      const geometry = surfaceGeometry(samples);
      const triangles = geometry.index!.count / 3;
      for (const child of [...scene.content.children]) disposeObject(child);
      const group = new THREE.Group();
      const surface = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
        vertexColors: true, side: THREE.DoubleSide, roughness: 0.72,
        polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
      }));
      wire = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0x23394b, wireframe: true, transparent: true, opacity: 0.28 }));
      wire.visible = showWire;
      group.add(surface, wire);
      scene.content.add(group);
      bounds = geometry.boundingBox!.clone();
      if (bounds.isEmpty()) bounds.set(new THREE.Vector3(start, start, 0), new THREE.Vector3(end, end, 0));
      scene.fit(bounds);
      error.textContent = '';
      status.textContent = triangles ? `${triangles.toLocaleString('tr-TR')} üçgen · 81 × 81 örnek` : 'Bu aralıkta çizilebilir yüzey yok.';
      if (triangles) {
        const format = (value: number) => value.toLocaleString('tr-TR', { maximumSignificantDigits: 5 });
        status.textContent += ` · z aralığı [${format(bounds.min.z)}, ${format(bounds.max.z)}]`;
        if (geometry.userData.clipped) status.textContent += ' · görünüm kırpıldı';
      }
      return true;
    };
    const sync = () => {
      const state = ctx.state.functions;
      const key = JSON.stringify([state.expr3, state.lo, state.hi]);
      if (key === previous) return;
      expression.value = state.expr3;
      lo.value = String(state.lo);
      hi.value = String(state.hi);
      draw(state.expr3, state.lo, state.hi);
      previous = key;
    };
    const apply = () => {
      const start = parseNumber(lo.value);
      const end = parseNumber(hi.value);
      if (!start.ok) { error.textContent = `Aralık başlangıcı · ${start.error}`; return; }
      if (!end.ok) { error.textContent = `Aralık bitişi · ${end.error}`; return; }
      const key = JSON.stringify([expression.value, start.value, end.value]);
      if (key === previous && !error.textContent) return;
      if (!draw(expression.value, start.value, end.value)) return;
      previous = key;
      ctx.update(draft => {
        draft.functions.expr3 = expression.value;
        draft.functions.lo = start.value;
        draft.functions.hi = end.value;
      });
    };
    form.addEventListener('submit', event => { event.preventDefault(); apply(); }, { signal: events.signal });
    for (const input of [expression, lo, hi]) input.addEventListener('blur', apply, { signal: events.signal });
    wireButton.addEventListener('click', () => {
      showWire = !showWire;
      wireButton.setAttribute('aria-pressed', String(showWire));
      if (wire) wire.visible = showWire;
      scene.invalidate();
    }, { signal: events.signal });
    root.querySelector('.function3d-fit')!.addEventListener('click', () => scene.fit(bounds), { signal: events.signal });
    root.dataset.theme = ctx.theme;
    sync();
    const unsubscribe = ctx.subscribe(sync);
    const stopTheme = ctx.onThemeChange(theme => { root.dataset.theme = theme; scene.setTheme(theme); });
    return () => { events.abort(); unsubscribe(); stopTheme(); scene.dispose(); root.remove(); };
  },
};
