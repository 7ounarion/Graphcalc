import type { Vec2, Vec3 } from './matrix';
function validate(lo: number, hi: number, n: number): void {
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo >= hi || !Number.isInteger(n) || n < 2 || n > 2000)
    throw new Error('Sonlu ve artan aralık, 2–2000 örnek gerekli.');
}
function safe(fn: () => number): number { try { return fn(); } catch { return NaN; } }
/** n evenly spaced samples including endpoints; invalid samples never join branches. */
export function sampleCurve(fn: (x: number) => number, lo: number, hi: number, n = 721): Vec2[][] {
  validate(lo,hi,n);
  const paths: Vec2[][] = []; let branch: Vec2[] = [];
  const flush = () => { if (branch.length) paths.push(branch); branch = []; };
  for (let i = 0; i < n; i++) {
    const x = lo+(hi-lo)*i/(n-1), y = safe(() => fn(x));
    if (!Number.isFinite(y)) { flush(); continue; }
    const previous = branch.at(-1);
    if (previous) {
      const middle = safe(() => fn((previous[0]+x)/2));
      // Midpoint deviation distinguishes a pole from a steep zero-crossing line.
      // A fixed magnitude floor also catches tan poles over wide x intervals.
      const jump = Math.abs(y-previous[1]);
      const signChangingPole = jump > 2 &&
        Math.sign(y) !== Math.sign(previous[1]) && Math.min(Math.abs(y),Math.abs(previous[1])) > 1 &&
        Math.abs(middle-(y/2+previous[1]/2)) > jump/4;
      // Even-order poles need no sign change: the midpoint rises above both ends.
      const midpointPeak = Math.abs(middle) > 2*Math.max(Math.abs(y),Math.abs(previous[1]));
      if (!Number.isFinite(middle) || signChangingPole || midpointPeak) flush();
    }
    branch.push([x,y]);
  }
  flush(); return paths;
}
export interface SurfaceSamples { grid: Vec3[][]; mask: boolean[][] }
/** mask[row][column] is true iff that vertex is finite; rows follow y, columns x. */
export function sampleSurface(fn: (x: number, y: number) => number, lo: number, hi: number, n = 61): SurfaceSamples {
  validate(lo,hi,n);
  const grid: Vec3[][] = [], mask: boolean[][] = [];
  for (let row = 0; row < n; row++) {
    const points: Vec3[] = [], valid: boolean[] = [], y = lo+(hi-lo)*row/(n-1);
    for (let col = 0; col < n; col++) {
      const x = lo+(hi-lo)*col/(n-1), z = safe(() => fn(x,y));
      points.push([x,y,z]); valid.push(Number.isFinite(z));
    }
    grid.push(points); mask.push(valid);
  }
  return { grid, mask };
}
