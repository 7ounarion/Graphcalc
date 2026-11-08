import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { layoutLabels } from './label-layout';
import type { ScreenPoint, ScreenSegment } from './label-layout';

/** Releases resources owned by a detached scene subtree, including label nodes. */
export function disposeObject(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse(object => {
    if (object instanceof CSS2DObject) object.element.remove();
    if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points) {
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        materials.add(material);
        for (const value of Object.values(material)) {
          if (value instanceof THREE.Texture) textures.add(value);
        }
      }
    }
  });
  textures.forEach(texture => texture.dispose());
  materials.forEach(material => material.dispose());
  geometries.forEach(geometry => geometry.dispose());
  root.removeFromParent();
  root.clear();
}

export function label3D(text: string, position: THREE.Vector3, color: string): CSS2DObject {
  const element = document.createElement('span');
  element.textContent = text;
  Object.assign(element.style, {
    color, font: '600 14px system-ui', padding: '2px 5px', borderRadius: '4px',
    background: 'var(--scene3d-label-background)', pointerEvents: 'none', whiteSpace: 'nowrap',
  });
  const label = new CSS2DObject(element);
  label.position.copy(position);
  return label;
}

export class Scene3D {
  readonly scene = new THREE.Scene();
  readonly content = new THREE.Group();
  readonly camera = new THREE.PerspectiveCamera(42, 1, 0.01, 1000);
  readonly renderer: THREE.WebGLRenderer;
  readonly controls: OrbitControls;
  private readonly labels = new CSS2DRenderer();
  private readonly reference = new THREE.Group();
  private readonly observer: ResizeObserver;
  private readonly host: HTMLElement;
  private frame = 0;
  private disposed = false;
  private dark = false;
  private extent = 3;

  constructor(host: HTMLElement, theme: 'light' | 'dark' = 'light') {
    this.host = host;
    host.style.position = 'relative';
    host.style.overflow = 'hidden';
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    // E2E-only read access, including the detached canvas after disposal.
    if (new URLSearchParams(location.search).has('test')) Object.assign(this.renderer.domElement, {__gc: {
      snapshot: () => ({disposed:this.disposed, pending:!!this.frame, contextLost:this.renderer.getContext().isContextLost(), camera:this.camera.position.toArray()}),
    }});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.setAttribute('aria-label', '3D sahne. Sürükleyerek döndür, tekerlek ile yakınlaştır.');
    this.renderer.domElement.tabIndex = 0;
    Object.assign(this.labels.domElement.style, { position: 'absolute', inset: '0', pointerEvents: 'none' });
    host.append(this.renderer.domElement, this.labels.domElement);
    this.camera.up.set(0, 0, 1);
    this.camera.position.set(7, -10, 7);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.12;
    this.controls.addEventListener('change', this.invalidate);
    this.scene.add(this.content, this.reference, new THREE.HemisphereLight(0xffffff, 0x65758a, 2));
    const light = new THREE.DirectionalLight(0xffffff, 2.5);
    light.position.set(4, -6, 10);
    this.scene.add(light);
    this.setTheme(theme);
    this.observer = new ResizeObserver(this.resize);
    this.observer.observe(host);
    this.resize();
  }

  readonly invalidate = (): void => {
    if (!this.disposed && !this.frame) this.frame = requestAnimationFrame(this.render);
  };

  private readonly render = (): void => {
    this.frame = 0;
    if (this.disposed) return;
    // OrbitControls emits change while damping settles, scheduling only necessary frames.
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.labels.render(this.scene, this.camera);
    this.layoutLabels();
  };

  private layoutLabels(): void {
    const width = this.host.clientWidth;
    const height = this.host.clientHeight;
    const project = (point: THREE.Vector3): THREE.Vector3 => {
      point.project(this.camera);
      return point.set((point.x + 1) * width / 2, (1 - point.y) * height / 2, point.z);
    };
    const origin = project(new THREE.Vector3());
    const labels: CSS2DObject[] = [];
    const arrows: ScreenSegment[] = [];
    this.scene.traverseVisible(object => {
      if (object instanceof CSS2DObject) labels.push(object);
      if (object instanceof THREE.ArrowHelper) {
        const start = project(object.getWorldPosition(new THREE.Vector3()));
        const end = project(object.cone.getWorldPosition(new THREE.Vector3()));
        // Do not project segments crossing the camera plane into huge obstacles.
        if (start.z >= -1 && start.z <= 1 && end.z >= -1 && end.z <= 1) arrows.push({ start, end });
      }
    });
    const anchors = labels.map(label => {
      const point = project(label.getWorldPosition(new THREE.Vector3()));
      return {
        x: point.z >= -1 && point.z <= 1 ? point.x : -Infinity, y: point.y,
        width: label.element.offsetWidth, height: label.element.offsetHeight,
        direction: { x: point.x - origin.x, y: point.y - origin.y },
      };
    });
    const placements = layoutLabels(anchors, arrows, width, height);
    labels.forEach((label, index) => {
      const placement: ScreenPoint | null = placements[index]!;
      label.element.style.visibility = placement ? 'visible' : 'hidden';
      label.element.style.translate = placement
        ? `${placement.x - anchors[index]!.x}px ${placement.y - anchors[index]!.y}px` : '';
    });
  }

  readonly resize = (): void => {
    if (this.disposed) return;
    const width = Math.max(1, this.host.clientWidth);
    const height = Math.max(1, this.host.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height);
    this.labels.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.invalidate();
  };

  setTheme(theme: 'light' | 'dark'): void {
    this.dark = theme === 'dark';
    this.scene.background = new THREE.Color(this.dark ? 0x101c29 : 0xf4f8fb);
    this.host.style.setProperty('--scene3d-label-background', this.dark ? '#101c29' : '#f4f8fb');
    this.updateReference();
    this.invalidate();
  }

  private updateReference(): void {
    for (const child of [...this.reference.children]) disposeObject(child);
    const length = this.extent;
    const colors = this.dark ? ['#65d9ce', '#c5a0ff', '#ffca74'] : ['#007a70', '#7750b5', '#985a00'];
    for (let axis = 0; axis < 3; axis++) {
      const direction = new THREE.Vector3().setComponent(axis, 1);
      const arrow = new THREE.ArrowHelper(direction, direction.clone().multiplyScalar(-length), 2 * length,
        colors[axis], length * 0.055, length * 0.025);
      this.reference.add(arrow, label3D(['x', 'y', 'z'][axis]!, direction.multiplyScalar(length * 1.07), colors[axis]!));
    }
    const grid = new THREE.GridHelper(length * 2, 20, this.dark ? 0x3e5268 : 0xa8bbc9, this.dark ? 0x29394b : 0xd9e2e9);
    grid.rotation.x = Math.PI / 2;
    this.reference.add(grid);
  }

  fit(box: THREE.Box3): void {
    if (box.isEmpty() || ![...box.min.toArray(), ...box.max.toArray()].every(Number.isFinite)) return;
    const center = box.getCenter(new THREE.Vector3());
    const radius = Math.max(0.5, box.getSize(new THREE.Vector3()).length() / 2);
    const halfFov = THREE.MathUtils.degToRad(this.camera.fov / 2);
    const limitingFov = Math.min(halfFov, Math.atan(Math.tan(halfFov) * this.camera.aspect));
    const distance = 1.4 * radius / Math.sin(limitingFov);
    const direction = this.camera.position.clone().sub(this.controls.target).normalize();
    this.controls.target.copy(center);
    this.camera.position.copy(center).addScaledVector(direction, distance);
    this.camera.near = Math.max(0.0001, distance / 10000);
    this.camera.far = Math.max(100, distance * 100);
    this.controls.maxDistance = distance * 20;
    this.camera.updateProjectionMatrix();
    this.extent = Math.max(1.5, ...box.min.toArray().map(Math.abs), ...box.max.toArray().map(Math.abs)) * 1.15;
    this.updateReference();
    this.controls.update();
    this.invalidate();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    this.controls.removeEventListener('change', this.invalidate);
    this.controls.dispose();
    disposeObject(this.scene);
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
    this.labels.domElement.remove();
  }
}
