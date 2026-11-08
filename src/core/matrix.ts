import { Fraction } from './fraction';
export type Vec2 = [number, number];
export type Vec3 = [number, number, number];
export type Mat2 = [Vec2, Vec2];
export type Mat3 = [Vec3, Vec3, Vec3];
export type ExactMat2 = [[Fraction, Fraction], [Fraction, Fraction]];
export type ExactMat3 = [[Fraction, Fraction, Fraction], [Fraction, Fraction, Fraction], [Fraction, Fraction, Fraction]];
export function det2(a: Mat2): number { return a[0][0]*a[1][1]-a[0][1]*a[1][0]; }
export function det3(a: Mat3): number {
  return a[0][0]*(a[1][1]*a[2][2]-a[1][2]*a[2][1])-a[0][1]*(a[1][0]*a[2][2]-a[1][2]*a[2][0])+a[0][2]*(a[1][0]*a[2][1]-a[1][1]*a[2][0]);
}
export function det2Exact(a: ExactMat2): Fraction { return a[0][0].mul(a[1][1]).sub(a[0][1].mul(a[1][0])); }
export function det3Exact(a: ExactMat3): Fraction {
  return a[0][0].mul(det2Exact([[a[1][1],a[1][2]],[a[2][1],a[2][2]]]))
    .sub(a[0][1].mul(det2Exact([[a[1][0],a[1][2]],[a[2][0],a[2][2]]])))
    .add(a[0][2].mul(det2Exact([[a[1][0],a[1][1]],[a[2][0],a[2][1]]])));
}
export function apply2(a: Mat2, p: Vec2): Vec2 { return [a[0][0]*p[0]+a[0][1]*p[1],a[1][0]*p[0]+a[1][1]*p[1]]; }
export function apply3(a: Mat3, p: Vec3): Vec3 { return a.map(r => r[0]*p[0]+r[1]*p[1]+r[2]*p[2]) as Vec3; }
export function lerpFromIdentity(a: Mat2, t: number): Mat2;
export function lerpFromIdentity(a: Mat3, t: number): Mat3;
export function lerpFromIdentity(a: Mat2 | Mat3, t: number): Mat2 | Mat3 {
  return a.map((r,i) => r.map((v,j) => (1-t)*Number(i===j)+t*v)) as Mat2 | Mat3;
}
