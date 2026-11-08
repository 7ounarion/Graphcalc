import type { Feature } from '../ui/types';
import { det2d } from './det2d';
import { transform2d } from './transform2d';
import { conics } from './conics';
import { function2d } from './function2d';
import { lessons } from './lessons';
import { questions } from './questions';

// Gezinme, grup sırasını araçların ilk görünüşüne göre kurar.
const det3d = lazy3D('det3d', 'Determinant · 3D', 'Determinant', () => import('./det3d').then(module => module.det3d));
const function3d = lazy3D('function3d', 'Fonksiyonlar · 3D', 'Fonksiyonlar', () => import('./function3d').then(module => module.function3d));
export const FEATURES: Feature[] = [det2d, det3d, transform2d, conics, function2d, function3d, lessons, questions];

function lazy3D(id: string, title: string, group: Feature['group'], load: () => Promise<Feature>): Feature {
  return { id, title, group, mount(host, ctx) {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    const status = document.createElement('p');
    status.className = 'note'; status.setAttribute('role', 'status');
    status.textContent = '3D sahne yükleniyor…'; host.append(status);
    void load().then(feature => {
      if (disposed) return;
      status.remove(); cleanup = feature.mount(host, ctx);
    }).catch(() => {
      if (!disposed) { status.textContent = '3D sahne yüklenemedi. Sayfayı yeniden açmayı deneyin.'; host.append(status); }
    });
    return () => { disposed = true; cleanup?.(); status.remove(); };
  }};
}
