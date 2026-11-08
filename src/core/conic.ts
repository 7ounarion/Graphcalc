import type { Vec2 } from './matrix';
import { move } from './transform';
import { formatNumber } from './format';
export type ConicKind = 'Çember' | 'Elips' | 'Parabol' | 'Hiperbol';
export interface ConicParams { kind: ConicKind; a: number; b: number; h: number; k: number; angle: number }
/** Two points describing a complete auxiliary line. */
export type Line2 = [Vec2, Vec2];
export interface ConicResult { paths: Vec2[][]; foci: Vec2[]; directrices: Line2[]; asymptotes: Line2[]; equation: string }
export function conic(s: ConicParams): ConicResult {
  const { kind, a, b, h, k, angle } = s;
  if (![a,b,h,k,angle].every(Number.isFinite) || a === 0 || b <= 0) throw new Error('Parametreler sonlu, a/p sıfırdan farklı ve b pozitif olmalı.');
  if (kind !== 'Parabol' && a < 0) throw new Error('a pozitif olmalı.');
  const tr = (p: Vec2): Vec2 => move(p,angle,h,k);
  const paths: Vec2[][] = [], foci: Vec2[] = [], directrices: Line2[] = [], asymptotes: Line2[] = [];
  let equation: string;
  if (kind === 'Çember' || kind === 'Elips') {
    paths.push(Array.from({length:721},(_,i) => tr([a*Math.cos(i*2*Math.PI/720),(kind === 'Çember' ? a : b)*Math.sin(i*2*Math.PI/720)])));
    if (kind === 'Çember') { foci.push(tr([0,0])); equation = `u^2+v^2=${formatNumber(a*a)}`; }
    else {
      const c = Math.sqrt(Math.abs(a*a-b*b));
      foci.push(...(a >= b ? [[-c,0],[c,0]] : [[0,-c],[0,c]]).map(p => tr(p as Vec2)));
      equation = `\\frac{u^2}{${formatNumber(a*a)}}+\\frac{v^2}{${formatNumber(b*b)}}=1`;
    }
  } else if (kind === 'Parabol') {
    paths.push(Array.from({length:721},(_,i) => { const x = -8+16*i/720; return tr([x,x*x/(4*a)]); }));
    foci.push(tr([0,a])); directrices.push([tr([-12,-a]),tr([12,-a])]); equation = `u^2=${formatNumber(4*a)}v`;
  } else if (kind === 'Hiperbol') {
    for (const sign of [-1,1]) {
      paths.push(Array.from({length:481},(_,i) => { const t = -2.3+4.6*i/480; return tr([sign*a*Math.cosh(t),b*Math.sinh(t)]); }));
      asymptotes.push([tr([-15,-sign*15*b/a]),tr([15,sign*15*b/a])]);
    }
    const c = Math.hypot(a,b); foci.push(tr([-c,0]),tr([c,0])); equation = `\\frac{u^2}{${formatNumber(a*a)}}-\\frac{v^2}{${formatNumber(b*b)}}=1`;
  } else throw new Error('Bilinmeyen konik.');
  // Local axes are explicit so the equation also describes translated/rotated curves.
  const theta = `(${formatNumber(angle)}\\pi/180)`, fh = formatNumber(h), fk = formatNumber(k);
  equation += `,\\quad u=(x-(${fh}))\\cos${theta}+(y-(${fk}))\\sin${theta},\\quad v=-(x-(${fh}))\\sin${theta}+(y-(${fk}))\\cos${theta}`;
  return { paths, foci, directrices, asymptotes, equation };
}
export function curve(kind: ConicKind, a = 3, b = 2, h = 0, k = 0, angle = 0): Vec2[][] { return conic({kind,a,b,h,k,angle}).paths; }
