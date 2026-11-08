import * as THREE from 'three';
import { apply3, det2Exact, det3Exact, parseNumber } from '../core';
import type { ExactMat3, Mat3, Vec3 } from '../core';
import { disposeObject, label3D, Scene3D } from '../render/scene3d';
import type { Feature } from '../ui/types';
import { mountDet3DPanel } from './det3d-panel';
import { formula } from '../ui/formula';

export function cubeVertices(matrix: Mat3): Vec3[] {
  return Array.from({ length: 8 }, (_, index) => apply3(matrix, [index & 1, (index >> 1) & 1, (index >> 2) & 1]));
}

export function matrixRank(matrix: ExactMat3): number {
  if (!det3Exact(matrix).isZero()) return 3;
  for (let row = 0; row < 3; row++) {
    for (let nextRow = row + 1; nextRow < 3; nextRow++) {
      for (let col = 0; col < 3; col++) {
        for (let nextCol = col + 1; nextCol < 3; nextCol++) {
          if (!det2Exact([[matrix[row]![col]!, matrix[row]![nextCol]!],
            [matrix[nextRow]![col]!, matrix[nextRow]![nextCol]!]]).isZero()) return 2;
        }
      }
    }
  }
  return matrix.some(row => row.some(value => !value.isZero())) ? 1 : 0;
}

function addCube(group: THREE.Group, vertices: Vec3[], color: number, solid: boolean): void {
  const edgePoints: THREE.Vector3[] = [];
  vertices.forEach((point, index) => {
    for (const bit of [1, 2, 4]) {
      if (!(index & bit)) edgePoints.push(new THREE.Vector3(...point), new THREE.Vector3(...vertices[index | bit]!));
    }
  });
  const edges = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(edgePoints),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: solid ? 1 : 0.35 }));
  edges.renderOrder = 2;
  group.add(edges);
  if (!solid) return;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices.flat(), 3));
  geometry.setIndex([
    0, 2, 3, 0, 3, 1, 4, 5, 7, 4, 7, 6,
    0, 1, 5, 0, 5, 4, 2, 6, 7, 2, 7, 3,
    0, 4, 6, 0, 6, 2, 1, 3, 7, 1, 7, 5,
  ]);
  geometry.computeVertexNormals();
  group.add(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
    color, transparent: true, opacity: 0.38, side: THREE.DoubleSide,
    roughness: 0.65, flatShading: true, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
  })));
}

export const det3d: Feature = {
  id: 'det3d', title: 'Determinant · 3D', group: 'Determinant',
  mount(host, ctx) {
    const root = document.createElement('section');
    root.className = 'det3d-page';
    root.innerHTML = `<style>
      .det3d-page { display:grid; grid-template-columns:minmax(0,1fr) 290px; gap:16px; min-height:480px; height:100%; color:var(--det3d-ink); }
      .det3d-page[data-theme=light] { --det3d-ink:#203447; --det3d-bg:#fff; --det3d-border:#afbfcb; --det3d-error:#aa2525; --det3d-a0:#007a70; --det3d-a1:#7750b5; --det3d-a2:#985a00; }
      .det3d-page[data-theme=dark] { --det3d-ink:#e7eef6; --det3d-bg:#172637; --det3d-border:#62768c; --det3d-error:#ffaaaa; --det3d-a0:#65d9ce; --det3d-a1:#c5a0ff; --det3d-a2:#ffca74; }
      .det3d-view { min-width:0; min-height:380px; border-radius:12px; }
      .det3d-panel { overflow:auto; padding:16px; background:var(--det3d-bg); border-radius:12px; }
      .det3d-panel h2 { font-size:20px; margin:0 0 16px; }
      .det3d-panel p { line-height:1.5; }
      .det3d-matrix { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; }
      .det3d-matrix label { min-width:0; font-size:13px; }
      .det3d-matrix input { box-sizing:border-box; width:100%; margin-top:4px; padding:8px; color:inherit; background:var(--det3d-bg); border:1px solid var(--det3d-border); border-radius:5px; }
      .det3d-matrix small, .det3d-error { display:block; color:var(--det3d-error); }
      .det3d-panel button { padding:9px 12px; color:inherit; background:var(--det3d-bg); border:1px solid var(--det3d-border); border-radius:6px; cursor:pointer; }
      @media(max-width:700px) { .det3d-page { grid-template-columns:1fr; height:auto; } .det3d-view { height:420px; } }
    </style>
    <div class="det3d-view"></div><aside class="det3d-panel"><h2>3 × 3 matris</h2>
    <div class="det3d-inputs"></div><p>Kesir veya ondalık gir. Enter ya da odak çıkışı uygular.</p>
    <div class="det3d-result det-result" aria-live="polite"></div><p class="det3d-error" role="alert"></p>
    <button type="button">Görünüme sığdır</button>
    <p>Sütun okları a₁, a₂, a₃ birim bazın görüntüleridir. Silik küp birim hacmi gösterir.</p>
    <p>Sürükle ile döndür · Tekerlek ile yakınlaştır · Sağ tuşla taşı</p></aside>`;
    host.append(root);
    const scene = new Scene3D(root.querySelector<HTMLElement>('.det3d-view')!, ctx.theme);
    const stopPanel = mountDet3DPanel(root.querySelector<HTMLElement>('.det3d-inputs')!, ctx);
    const result = root.querySelector<HTMLElement>('.det3d-result')!;
    const error = root.querySelector<HTMLElement>('.det3d-error')!;
    let bounds = new THREE.Box3();
    let previous = '';
    const draw = () => {
      const key = JSON.stringify(ctx.state.matrix3);
      if (previous === key) return;
      const parsed = ctx.state.matrix3.map(row => row.map(parseNumber));
      const invalid = parsed.flat().find(value => !value.ok);
      if (invalid && !invalid.ok) {
        result.textContent = 'Hesaplanamadı';
        error.textContent = invalid.error;
        previous = '';
        return;
      }
      const exact = parsed.map(row => row.map(value => {
        if (!value.ok || !value.exact) throw new Error('Kesin matris değeri gerekli.');
        return value.exact;
      })) as ExactMat3;
      const matrix = exact.map(row => row.map(value => value.toNumber())) as Mat3;
      const determinant = det3Exact(exact);
      const rank = matrixRank(exact);
      const descriptions = ['Görüntü bir noktaya çöker.', 'Görüntü bir doğruya çöker.', 'Görüntü bir düzleme çöker.'];
      const orientation = determinant.isZero() ? `Tekil matris. ${descriptions[rank]} Yönelim tanımlı değildir.`
        : determinant.sign() > 0 ? 'Yönelim korunur.' : 'Yönelim tersine döner.';
      result.replaceChildren();
      const equation = document.createElement('div'), volume = document.createElement('div'), direction = document.createElement('p');
      formula(equation, `\\det A=${determinant.toLatex()}`);
      formula(volume, `V=|\\det A|=${(determinant.sign() < 0 ? determinant.neg() : determinant).toLatex()}`);
      volume.className = 'formula'; direction.className = 'det3d-orientation'; direction.textContent = orientation;
      result.append(equation, volume, direction);
      error.textContent = '';
      for (const child of [...scene.content.children]) disposeObject(child);
      const group = new THREE.Group();
      const vertices = cubeVertices(matrix);
      const unit = cubeVertices([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
      addCube(group, unit, 0x7f95aa, false);
      addCube(group, vertices, 0x28b8ae, true);
      const colors = ['#16a99d', '#a478e3', '#e6a038'];
      for (let column = 0; column < 3; column++) {
        const vector = new THREE.Vector3(matrix[0][column], matrix[1][column], matrix[2][column]);
        const length = vector.length();
        if (!length) continue;
        group.add(new THREE.ArrowHelper(vector.clone().normalize(), new THREE.Vector3(), length, colors[column], length * 0.12, length * 0.055));
        const label = label3D(['a₁', 'a₂', 'a₃'][column]!, vector.clone().multiplyScalar(1.06), `var(--det3d-a${column})`);
        group.add(label);
      }
      if (rank === 0) {
        const marker = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), new THREE.MeshStandardMaterial({ color: 0x28b8ae }));
        group.add(marker);
      }
      scene.content.add(group);
      bounds = new THREE.Box3().setFromPoints([...vertices, ...unit].map(point => new THREE.Vector3(...point)));
      scene.fit(bounds);
      previous = key;
    };
    const theme = () => { root.dataset.theme = ctx.theme; scene.setTheme(ctx.theme); };
    theme();
    draw();
    const unsubscribe = ctx.subscribe(draw);
    const stopTheme = ctx.onThemeChange(value => { root.dataset.theme = value; scene.setTheme(value); });
    const fit = () => scene.fit(bounds);
    root.querySelector('button')!.addEventListener('click', fit);
    return () => {
      unsubscribe(); stopTheme(); stopPanel();
      root.querySelector('button')!.removeEventListener('click', fit);
      scene.dispose(); root.remove();
    };
  },
};
