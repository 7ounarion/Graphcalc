import type { Vec2 } from '../core/matrix';
export interface Camera2D { x: number; y: number; scale: number }
export interface Bounds2D { minX: number; maxX: number; minY: number; maxY: number }
export function worldToScreen(p: Vec2, camera: Camera2D, width: number, height: number): Vec2 {
  return [width/2+(p[0]-camera.x)*camera.scale,height/2-(p[1]-camera.y)*camera.scale];
}
export function screenToWorld(p: Vec2, camera: Camera2D, width: number, height: number): Vec2 {
  return [camera.x+(p[0]-width/2)/camera.scale,camera.y-(p[1]-height/2)/camera.scale];
}
export function fitCamera(bounds: Bounds2D, width: number, height: number): Camera2D {
  return {x:(bounds.minX+bounds.maxX)/2,y:(bounds.minY+bounds.maxY)/2,
    scale:Math.min(Math.max(1,width)*0.78/Math.max(1,bounds.maxX-bounds.minX),Math.max(1,height)*0.78/Math.max(1,bounds.maxY-bounds.minY))};
}
export function pointBounds(points: Vec2[]): Bounds2D {
  const finite = points.filter(p => p.every(Number.isFinite));
  if (!finite.length) return {minX:-5,maxX:5,minY:-5,maxY:5};
  return finite.reduce((b,p) => ({minX:Math.min(b.minX,p[0]),maxX:Math.max(b.maxX,p[0]),minY:Math.min(b.minY,p[1]),maxY:Math.max(b.maxY,p[1])}),
    {minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity});
}
export class Viewport2D {
  readonly canvas = document.createElement('canvas');
  camera: Camera2D = {x:0,y:0,scale:40};
  private grid = document.createElement('canvas');
  private context: CanvasRenderingContext2D;
  private observer: ResizeObserver;
  private frame = 0;
  private dirty = true;
  private disposed = false;
  private painter: (view: Viewport2D) => void = () => {};
  private times: number[] = [];
  private width = 1;
  private height = 1;
  private dpr = 1;
  private colors: Record<string,string> = {};
  private drag?: {point: Vec2; camera: Camera2D};
  private pendingBounds?: Bounds2D;
  private host: HTMLElement;
  constructor(host: HTMLElement) {
    this.host = host;
    // E2E-only read access; ordinary application URLs expose no test hook.
    if (new URLSearchParams(location.search).has('test')) Object.assign(this.canvas, {__gc: {
      stats: () => this.stats(), pixel: (point: Vec2) => this.pixel(point),
      snapshot: () => ({disposed:this.disposed, pending:!!this.frame, width:this.width, height:this.height, camera:{...this.camera}}),
    }});
    this.canvas.setAttribute('aria-label','Etkileşimli 2D koordinat düzlemi'); this.canvas.setAttribute('role','img');
    this.host.append(this.canvas); this.context = this.canvas.getContext('2d')!;
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(host);
    this.canvas.addEventListener('wheel',this.wheel,{passive:false});
    this.canvas.addEventListener('pointerdown',this.down); this.canvas.addEventListener('pointermove',this.move);
    this.canvas.addEventListener('pointerup',this.up); this.canvas.addEventListener('pointercancel',this.up);
    this.canvas.addEventListener('dblclick',this.reset); this.refreshTheme(); this.resize();
  }
  color(name: string): string { return this.colors[name] || '#168879'; }
  refreshTheme(): void {
    const css = getComputedStyle(this.host);
    for (const key of ['plot-bg','grid','axis','muted','teal','orange','purple','blue','ink']) this.colors[key] = css.getPropertyValue(`--${key}`).trim();
    this.dirty = true; this.request();
  }
  private resize(): void {
    const rect = this.host.getBoundingClientRect(); this.width = Math.max(1,rect.width); this.height = Math.max(1,rect.height);
    this.dpr = Math.max(1,window.devicePixelRatio || 1);
    for (const canvas of [this.canvas,this.grid]) { canvas.width = Math.round(this.width*this.dpr); canvas.height = Math.round(this.height*this.dpr); }
    if (this.pendingBounds) this.camera = fitCamera(this.pendingBounds,this.width,this.height);
    this.dirty = true; this.request();
  }
  setPainter(painter: (view: Viewport2D) => void): void { this.painter = painter; this.request(); }
  request(): void {
    if (this.disposed || this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0; const start = performance.now();
      if (this.dpr !== window.devicePixelRatio) this.resize();
      if (this.dirty) this.drawGrid();
      this.context.setTransform(1,0,0,1,0,0); this.context.clearRect(0,0,this.canvas.width,this.canvas.height);
      this.context.drawImage(this.grid,0,0); this.context.setTransform(this.dpr,0,0,this.dpr,0,0);
      this.context.save(); this.painter(this); this.context.restore();
      this.times.push(performance.now()-start); if (this.times.length > 240) this.times.shift();
    });
  }
  stats(): number[] { return [...this.times]; }
  fit(bounds: Bounds2D): void { this.pendingBounds = bounds; this.camera = fitCamera(bounds,this.width,this.height); this.dirty = true; this.request(); }
  reset = (): void => { this.pendingBounds = undefined; this.camera = {x:0,y:0,scale:Math.min(this.width,this.height)/12}; this.dirty = true; this.request(); };
  pixel(p: Vec2): Vec2 { return worldToScreen(p,this.camera,this.width,this.height); }
  path(points: Vec2[], color = 'teal', width = 2.5, dashed = false, fill = false): void {
    const c = this.context; c.beginPath();
    points.forEach((p,i) => { const [x,y] = this.pixel(p); if (i === 0) c.moveTo(x,y); else c.lineTo(x,y); });
    c.strokeStyle = this.color(color); c.lineWidth = width; c.lineJoin = 'round'; c.setLineDash(dashed ? [5,5] : []);
    if (fill) { c.closePath(); c.save(); c.globalAlpha = 0.13; c.fillStyle = this.color(color); c.fill(); c.restore(); }
    c.stroke(); c.setLineDash([]);
  }
  dot(point: Vec2, label: string, color = 'teal'): void {
    const [x,y] = this.pixel(point), c = this.context;
    c.beginPath(); c.arc(x,y,4,0,2*Math.PI); c.fillStyle = this.color('plot-bg'); c.fill();
    c.strokeStyle = this.color(color); c.lineWidth = 2; c.stroke(); c.fillStyle = this.color(color); c.font = '600 12px system-ui'; c.fillText(label,x+9,y-9);
  }
  arrow(point: Vec2, label: string, color: string): void {
    this.path([[0,0],point],color,3); const [x,y] = this.pixel(point), [ox,oy] = this.pixel([0,0]);
    const angle = Math.atan2(y-oy,x-ox), c = this.context;
    c.beginPath(); c.moveTo(x,y); c.lineTo(x-10*Math.cos(angle-0.4),y-10*Math.sin(angle-0.4));
    c.lineTo(x-10*Math.cos(angle+0.4),y-10*Math.sin(angle+0.4)); c.closePath(); c.fillStyle = this.color(color); c.fill(); this.dot(point,label,color);
  }
  private drawGrid(): void {
    this.dirty = false; const c = this.grid.getContext('2d')!; c.setTransform(this.dpr,0,0,this.dpr,0,0);
    c.fillStyle = this.color('plot-bg'); c.fillRect(0,0,this.width,this.height);
    const raw = 70/this.camera.scale, base = 10**Math.floor(Math.log10(raw));
    const step = base * (raw/base > 5 ? 10 : raw/base > 2 ? 5 : raw/base > 1 ? 2 : 1);
    const lo = screenToWorld([0,this.height],this.camera,this.width,this.height), hi = screenToWorld([this.width,0],this.camera,this.width,this.height);
    const origin = this.pixel([0,0]); c.font = '11px system-ui';
    for (const axis of [0,1] as const) {
      for (let i = Math.ceil(lo[axis]/step); i <= Math.floor(hi[axis]/step); i++) {
        const v = i*step, pos = this.pixel(axis === 0 ? [v,0] : [0,v]);
        c.beginPath(); c.strokeStyle = this.color(i === 0 ? 'axis' : 'grid'); c.lineWidth = i === 0 ? 1.5 : 1;
        if (axis === 0) { c.moveTo(pos[0],0); c.lineTo(pos[0],this.height); } else { c.moveTo(0,pos[1]); c.lineTo(this.width,pos[1]); } c.stroke();
        if (i && !(axis === 1 && pos[1] < 36)) { c.fillStyle = this.color('muted'); c.fillText(Number(v.toPrecision(5)).toString(),axis === 0 ? pos[0]+4 : Math.max(8,Math.min(this.width-42,origin[0]+7)),axis === 0 ? Math.max(16,Math.min(this.height-8,origin[1]+17)) : pos[1]-5); }
      }
    }
    c.fillStyle = this.color('ink'); c.fillText('x',this.width-15,Math.max(16,Math.min(this.height-8,origin[1]-10)));
    c.fillText('y',Math.max(10,Math.min(this.width-15,origin[0]+12)),17);
  }
  private wheel = (e: WheelEvent): void => {
    e.preventDefault(); this.pendingBounds = undefined; const rect = this.canvas.getBoundingClientRect(), p: Vec2 = [e.clientX-rect.left,e.clientY-rect.top];
    const before = screenToWorld(p,this.camera,this.width,this.height);
    this.camera.scale = Math.max(0.0001,Math.min(100000,this.camera.scale*Math.exp(-Math.max(-200,Math.min(200,e.deltaY))*0.002)));
    const after = screenToWorld(p,this.camera,this.width,this.height); this.camera.x += before[0]-after[0]; this.camera.y += before[1]-after[1]; this.dirty = true; this.request();
  };
  private down = (e: PointerEvent): void => { if (e.button !== 0) return; this.pendingBounds = undefined; this.drag = {point:[e.clientX,e.clientY],camera:{...this.camera}}; this.canvas.setPointerCapture(e.pointerId); };
  private move = (e: PointerEvent): void => { if (!this.drag) return; this.camera.x = this.drag.camera.x-(e.clientX-this.drag.point[0])/this.camera.scale; this.camera.y = this.drag.camera.y+(e.clientY-this.drag.point[1])/this.camera.scale; this.dirty = true; this.request(); };
  private up = (): void => { this.drag = undefined; };
  destroy(): void { this.disposed = true; cancelAnimationFrame(this.frame); this.observer.disconnect(); this.canvas.remove(); }
}
