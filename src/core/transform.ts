import type { Vec2 } from './matrix';
export interface Motion { x: number; y: number; angle: number; cx: number; cy: number; dx: number; dy: number; first: boolean }
export function rotate(p: Vec2, degrees: number, center: Vec2 = [0,0]): Vec2 {
  const c = Math.cos(degrees*Math.PI/180), s = Math.sin(degrees*Math.PI/180);
  const x = p[0]-center[0], y = p[1]-center[1];
  return [center[0]+c*x-s*y, center[1]+s*x+c*y];
}
/** first=true means translate, then rotate about the fixed center. */
export function move(p: Vec2, degrees: number, dx: number, dy: number, center: Vec2 = [0,0], first = false): Vec2 {
  if (first) return rotate([p[0]+dx,p[1]+dy], degrees, center);
  const q = rotate(p,degrees,center); return [q[0]+dx,q[1]+dy];
}
export function transformPoint(p: Vec2, s: Motion): Vec2 { return move(p,s.angle,s.dx,s.dy,[s.cx,s.cy],s.first); }
export function transformTriangle(s: Motion): { base: Vec2[]; result: Vec2[] } {
  const base: Vec2[] = [[s.x,s.y],[s.x+2,s.y],[s.x,s.y+1.5],[s.x,s.y]];
  return { base, result: base.map(p => transformPoint(p,s)) };
}
