import type { ConicParams } from '../core/conic';
import type { Motion } from '../core/transform';
export interface AppState {
  matrix2: [[string,string],[string,string]];
  matrix3: [[string,string,string],[string,string,string],[string,string,string]];
  motion: Motion;
  conic: ConicParams;
  functions: { expr2: string; expr3: string; lo: number; hi: number };
}
export function defaultState(): AppState {
  return {
    matrix2: [['2','1'],['0','2']], matrix3: [['2','0','0'],['0','2','0'],['0','0','2']],
    motion: {x:2,y:1,angle:0,cx:0,cy:0,dx:0,dy:0,first:false},
    conic: {kind:'Elips',a:3,b:2,h:0,k:0,angle:0},
    functions: {expr2:'sin(x)',expr3:'(x^2-y^2)/4',lo:-5,hi:5},
  };
}
